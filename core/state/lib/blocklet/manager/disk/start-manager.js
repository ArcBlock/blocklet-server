/* eslint-disable no-await-in-loop */
const uniq = require('lodash/uniq');
const logger = require('@abtnode/logger')('@abtnode/core:blocklet:manager:start');
const pAll = require('p-all');
const { BlockletEvents, BlockletInternalEvents, BlockletStatus, BlockletGroup } = require('@blocklet/constant');
const {
  forEachBlocklet,
  hasStartEngine,
  hasRunnableComponent,
  getDisplayName,
  isExternalBlocklet,
  getComponentMissingConfigs,
} = require('@blocklet/meta/lib/util');
const { getRequiredComponentsLayers } = require('@blocklet/meta/lib/get-required-components-layers');
const { getBlockletEngine } = require('@blocklet/meta/lib/engine');
const { getComponentsInternalInfo } = require('@blocklet/meta/lib/blocklet');

const states = require('../../../states');
const launcher = require('../../../util/launcher');
const hooks = require('../../hooks');
const { startLock } = require('../lock');
const blockletUtils = require('../../../util/blocklet');
const checkNeedRunDocker = require('../../../util/docker/check-need-run-docker');
const { dockerExec } = require('../../../util/docker/docker-exec');
const { dockerExecChown } = require('../../../util/docker/docker-exec-chown');
const checkDockerRunHistory = require('../../../util/docker/check-docker-run-history');

const {
  getRuntimeEnvironments,
  validateBlocklet,
  validateBlockletChainInfo,
  ensureAppPortsNotOccupied,
  getHealthyCheckTimeout,
  shouldSkipComponent,
  getComponentNamesWithVersion,
  getHookArgs,
} = blockletUtils;

/**
 * Start required components by dependency order
 */
async function startRequiredComponents(
  manager,
  {
    componentDids,
    inputComponentDids,
    blocklet,
    throwOnError,
    checkHealthImmediately,
    e2eMode,
    context,
    atomic,
    onStarted,
    onError,
  }
) {
  if (!blocklet.children) {
    return componentDids;
  }
  const targetDid = !inputComponentDids?.length ? componentDids?.[0] : inputComponentDids[0];

  const canStartStatus = {
    [BlockletStatus.installed]: true,
    [BlockletStatus.error]: true,
    [BlockletStatus.stopped]: true,
  };

  const requiredDidsLayers = getRequiredComponentsLayers({
    targetDid,
    children: blocklet.children,
    filter: (child) => atomic || canStartStatus[child.status],
  });

  logger.info('start required components', {
    did: blocklet.meta.did,
    targetDid,
    componentDids,
    inputComponentDids,
    checkHealthImmediately,
    requiredDidsLayers,
  });

  if (requiredDidsLayers.length) {
    // start by dependency
    for (const dids of requiredDidsLayers) {
      if (atomic) {
        await _start(
          manager,
          { blocklet, throwOnError, checkHealthImmediately, e2eMode, componentDids: dids, onStarted, onError },
          context
        );
      } else {
        const tasks = dids.map(
          (x) => () =>
            _start(
              manager,
              { blocklet, throwOnError, checkHealthImmediately, e2eMode, componentDids: [x], onStarted, onError },
              context
            )
        );
        await pAll(tasks, { concurrency: 4 }).catch((err) => {
          throw new Error(err.errors ? err.errors.join(', ') : err);
        });
      }
    }
  }

  // remove the components that have just been started
  const startedDids = new Set(requiredDidsLayers.flat());
  return componentDids.filter((x) => !startedDids.has(x));
}

/**
 * Start blocklet
 */
async function start(
  manager,
  {
    did,
    throwOnError,
    checkHealthImmediately = false,
    e2eMode = false,
    componentDids: inputComponentDids,
    atomic,
    operator,
  },
  context
) {
  const lockName = `${did}-start`;
  const shouldLock = inputComponentDids?.length === 0;

  if (shouldLock) {
    await startLock.acquire(lockName);
  }

  try {
    const blocklet = await manager.ensureBlocklet(did, { e2eMode });
    const baseComponentDids = uniq(
      inputComponentDids?.length ? inputComponentDids : blocklet.children.map((x) => x.meta.did)
    );

    try {
      await manager.deleteProcess({ did, componentDids: baseComponentDids, isGreen: true });
    } catch (error) {
      logger.warn('Failed to delete process; this warning can be safely ignored.', { error });
    }

    await manager.checkControllerStatus(blocklet, 'start');

    // 优先启动资源型组件
    const componentDids = [];
    const nonEntryComponentIds = [];
    for (const b of blocklet.children) {
      if (!b?.meta?.did) {
        continue;
      }
      if (!baseComponentDids.includes(b.meta.did)) {
        continue;
      }
      if (!hasStartEngine(b.meta)) {
        nonEntryComponentIds.push(b.meta.did);
        continue;
      }
      const engine = getBlockletEngine(b.meta);
      if (engine.interpreter === 'blocklet') {
        nonEntryComponentIds.push(b.meta.did);
        continue;
      }
      componentDids.push(b.meta.did);
    }

    await manager.checkControllerStatus(blocklet, 'start');

    if (nonEntryComponentIds.length) {
      await states.blocklet.setBlockletStatus(did, BlockletStatus.running, {
        componentDids: nonEntryComponentIds,
        operator,
      });
    }
    // sync component config before at first to ensure resource component config is ready
    const serverSk = (await states.node.read()).sk;
    await Promise.all(
      componentDids.map((componentDid) =>
        manager.configSynchronizer.syncComponentConfig(componentDid, blocklet.meta.did, { serverSk })
      )
    );

    // 如果只有 nonEntryComponent，没有 entry component，直接触发 started 事件并返回
    if (componentDids.length === 0) {
      const finalBlocklet = await manager.getBlocklet(did);
      await manager.configSynchronizer.throttledSyncAppConfig(finalBlocklet);
      const componentsInfo = getComponentsInternalInfo(finalBlocklet);
      manager.emit(BlockletInternalEvents.componentUpdated, {
        appDid: blocklet.appDid,
        components: componentsInfo,
      });
      manager.emit(BlockletInternalEvents.componentStarted, {
        appDid: blocklet.appDid,
        components: nonEntryComponentIds.map((x) => ({ did: x })),
      });
      manager.emit(BlockletEvents.statusChange, finalBlocklet);
      manager.emit(BlockletEvents.started, { ...finalBlocklet, componentDids: nonEntryComponentIds });
      launcher.notifyBlockletStarted(finalBlocklet);

      // 根据情况更新 route table
      if (!['true', '1'].includes(process.env.ABT_NODE_DISABLE_BLUE_GREEN)) {
        manager.emit(BlockletEvents.blueOrGreenStarted, {
          blocklet: finalBlocklet,
          componentDids: inputComponentDids,
          context,
        });
      }

      return finalBlocklet;
    }

    const doc1 = await states.blocklet.setBlockletStatus(did, BlockletStatus.starting, {
      componentDids,
      operator,
    });

    manager.emit(BlockletEvents.statusChange, doc1);
    const startedBlockletDids = [];
    const errorBlockletDids = [];
    const parentBlockletId = blocklet.id;

    // Helper function to update child status immediately and emit events
    const updateChildStatusImmediately = async (componentDid, status) => {
      if (!states.blockletChild || !parentBlockletId) {
        return;
      }

      try {
        await states.blockletChild.updateChildStatus(parentBlockletId, componentDid, {
          status,
          operator,
        });

        // Get updated blocklet to emit events
        const updatedBlocklet = await manager.getBlocklet(did);
        const componentsInfo = getComponentsInternalInfo(updatedBlocklet);

        manager.emit(BlockletInternalEvents.componentUpdated, {
          appDid: blocklet.appDid,
          components: componentsInfo.filter((c) => c.did === componentDid),
        });

        if (status === BlockletStatus.running) {
          manager.emit(BlockletInternalEvents.componentStarted, {
            appDid: blocklet.appDid,
            components: [{ did: componentDid }],
          });
        }

        manager.emit(BlockletEvents.statusChange, updatedBlocklet);
      } catch (err) {
        logger.error('Failed to update child status immediately', {
          componentDid,
          status,
          error: err.message,
        });
      }
    };

    const notStartedComponentDids = await startRequiredComponents(manager, {
      componentDids,
      inputComponentDids,
      blocklet,
      throwOnError,
      checkHealthImmediately,
      e2eMode,
      context,
      atomic,
      onStarted: async (subDid) => {
        startedBlockletDids.push({ did: subDid });
        await updateChildStatusImmediately(subDid, BlockletStatus.running);
      },
      onError: async (subDid, error) => {
        errorBlockletDids.push({ did: subDid, error });
        await updateChildStatusImmediately(subDid, BlockletStatus.error);
      },
    });

    const tasks = notStartedComponentDids.map(
      (componentDid) => () =>
        _start(
          manager,
          {
            blocklet,
            throwOnError,
            checkHealthImmediately,
            e2eMode,
            componentDids: [componentDid],
            operator,
            onStarted: async (subDid) => {
              startedBlockletDids.push({ did: subDid });
              await updateChildStatusImmediately(subDid, BlockletStatus.running);
            },
            onError: async (subDid, error) => {
              errorBlockletDids.push({ did: subDid, error });
              await updateChildStatusImmediately(subDid, BlockletStatus.error);
            },
          },
          context
        )
    );

    await pAll(tasks, { concurrency: 6 });

    // Sync parent blocklet uptime status once after all components are processed
    await states.blocklet.syncUptimeStatus(parentBlockletId);

    const nextBlocklet = await manager.ensureBlocklet(did, { e2eMode });
    let errorDescription = '';
    let resultBlocklet = nextBlocklet;

    // Status updates are now done immediately in callbacks, so we only need to handle final events and cleanup
    if (startedBlockletDids.length) {
      const finalBlocklet = await manager.getBlocklet(did);
      resultBlocklet = finalBlocklet;

      // Sync app config after all components started
      await manager.configSynchronizer.throttledSyncAppConfig(finalBlocklet, { wait: 200 });
      const componentsInfo = getComponentsInternalInfo(finalBlocklet);
      manager.emit(BlockletInternalEvents.componentUpdated, {
        appDid: blocklet.appDid,
        components: componentsInfo,
      });

      const allStartedComponentDids = uniq([
        ...(componentDids || []),
        ...nonEntryComponentIds,
        ...startedBlockletDids.map((x) => x.did),
      ]);
      manager.emit(BlockletInternalEvents.componentStarted, {
        appDid: blocklet.appDid,
        components: allStartedComponentDids.map((x) => ({ did: x })),
      });

      manager.emit(BlockletEvents.statusChange, finalBlocklet);
      manager.emit(BlockletEvents.started, { ...finalBlocklet, componentDids: allStartedComponentDids });

      launcher.notifyBlockletStarted(finalBlocklet);
    }

    if (errorBlockletDids.length) {
      const error = errorBlockletDids[0];
      for (const item of errorBlockletDids) {
        logger.error('Failed to start blocklet', {
          error: item.error,
          title: nextBlocklet.meta.title,
          name: getComponentNamesWithVersion(nextBlocklet, [item.did]),
        });
      }

      errorDescription = `${getComponentNamesWithVersion(
        nextBlocklet,
        errorBlockletDids.map((x) => x.did)
      )} start failed for ${getDisplayName(nextBlocklet)}: ${errorBlockletDids.map((x) => x.error.message).join('. ')}`;
      manager._createNotification(did, {
        title: `${errorBlockletDids.length > 1 ? `${errorBlockletDids.length} components` : 'Component'} failed to start for ${getDisplayName(nextBlocklet)}`,
        description: errorDescription,
        entityType: 'blocklet',
        entityId: did,
        severity: 'error',
      });

      await manager.deleteProcess({
        did,
        componentDids: errorBlockletDids.map((x) => x.did),
        shouldUpdateBlockletStatus: false,
      });

      const finalBlocklet = await manager.getBlocklet(did);
      resultBlocklet = finalBlocklet;
      manager.emit(BlockletEvents.startFailed, {
        ...finalBlocklet,
        componentDids: errorBlockletDids.map((x) => x.did),
        error: { message: error.message },
      });
      manager.emit(BlockletEvents.statusChange, { ...finalBlocklet, error: { message: error.message } });
    }

    // 根据情况更新 route table， 会判断只有包含多 interfaces 的 DID 才会更新 route table
    if (!['true', '1'].includes(process.env.ABT_NODE_DISABLE_BLUE_GREEN)) {
      manager.emit(BlockletEvents.blueOrGreenStarted, {
        blocklet: resultBlocklet,
        componentDids: inputComponentDids,
        context,
      });
    }

    if (throwOnError && errorDescription) {
      throw new Error(errorDescription);
    }

    return resultBlocklet;
  } finally {
    if (shouldLock) {
      await startLock.releaseLock(lockName);
    }
  }
}

/**
 * Internal start implementation
 */
async function _start(
  manager,
  {
    blocklet: inputBlocklet,
    did,
    throwOnError,
    checkHealthImmediately = false,
    e2eMode = false,
    componentDids,
    operator: _operator,
    onStarted,
    onError,
  },
  context
) {
  const operator = _operator || context?.user?.did;

  logger.info('start blocklet', {
    did: did || inputBlocklet.meta.did,
    componentDids,
    throwOnError,
    checkHealthImmediately,
    e2eMode,
    operator,
  });
  // should check blocklet integrity
  const blocklet1 = inputBlocklet || (await manager.ensureBlocklet(did, { e2eMode }));

  did = blocklet1.meta.did; // eslint-disable-line no-param-reassign

  // validate requirement and engine
  await validateBlocklet(blocklet1);
  await validateBlockletChainInfo(blocklet1);

  if (!hasRunnableComponent(blocklet1)) {
    throw new Error('No runnable component found');
  }

  const entryComponentIds = [];
  const nonEntryComponentIds = [];
  const componentDidsSet = new Set(componentDids);
  try {
    await forEachBlocklet(
      blocklet1,
      (b) => {
        if (!componentDidsSet.has(b.meta.did)) {
          return;
        }

        if (b.meta.group === BlockletGroup.gateway) {
          nonEntryComponentIds.push(b.meta.did);
          return;
        }

        const engine = getBlockletEngine(b.meta);
        if (engine.interpreter === 'blocklet') {
          nonEntryComponentIds.push(b.meta.did);
          return;
        }

        if (!hasStartEngine(b.meta)) {
          nonEntryComponentIds.push(b.meta.did);
          return;
        }
        entryComponentIds.push(b.meta.did);
      },
      { parallel: true, concurrencyLimit: 4 }
    );
    if (nonEntryComponentIds.length) {
      for (const subDid of nonEntryComponentIds) {
        onStarted?.(subDid);
      }
    }
  } catch (err) {
    logger.error('Failed to categorize components into entry and non-entry types', { error: err.message });
    throw err;
  }

  if (!entryComponentIds.length) {
    return;
  }

  try {
    // check required config
    for (const component of blocklet1.children) {
      if (!entryComponentIds.includes(component.meta.did)) {
        continue;
      }
      if (!shouldSkipComponent(component.meta.did, entryComponentIds)) {
        const missingProps = getComponentMissingConfigs(component, blocklet1);
        if (missingProps.length) {
          throw new Error(
            `Missing required configuration to start ${component.meta.title}: ${missingProps
              .map((x) => x.key)
              .join(',')}`
          );
        }
      }
    }

    blocklet1.status = BlockletStatus.starting;
    const blocklet = await ensureAppPortsNotOccupied({
      blocklet: blocklet1,
      componentDids: entryComponentIds,
      states,
      manager,
    });

    const nodeInfo = await states.node.read();

    const nodeEnvironments = await states.node.getEnvironments(nodeInfo);

    if (checkDockerRunHistory(nodeInfo)) {
      const needChownDirs = [];
      await forEachBlocklet(blocklet, (b, { ancestors }) => {
        if (!b.meta?.docker?.image || b.meta?.docker?.runBaseScript) {
          return;
        }
        const env = getRuntimeEnvironments(b, nodeEnvironments, ancestors);
        needChownDirs.push(env.BLOCKLET_APP_DIR);
        needChownDirs.push(env.BLOCKLET_DATA_DIR);
        needChownDirs.push(env.BLOCKLET_LOG_DIR);
      });
      await dockerExecChown({ name: `${blocklet?.meta?.did}-before-start`, dirs: needChownDirs });
    }

    const getHookFn =
      (hookName) =>
      async (b, { env }) => {
        const hookArgs = getHookArgs(b);
        const needRunDocker = await checkNeedRunDocker(b.meta, env, nodeInfo, isExternalBlocklet(blocklet));
        if (!b.meta.scripts?.[hookName]) {
          return null;
        }
        if (needRunDocker) {
          return dockerExec({
            blocklet,
            meta: b.meta,
            script: b.meta.scripts?.[hookName],
            hookName,
            nodeInfo,
            env,
            ...hookArgs,
          });
        }
        return hooks[hookName](b, {
          appDir: b.env.appDir,
          hooks: Object.assign(b.meta.hooks || {}, b.meta.scripts || {}),
          env,
          did, // root blocklet did,
          teamManager: manager.teamManager,
          ...hookArgs,
        });
      };

    await blockletUtils.startBlockletProcess(blocklet, {
      ...context,
      preFlight: getHookFn('preFlight'),
      preStart: getHookFn('preStart'),
      postStart: getHookFn('postStart'),
      nodeEnvironments,
      nodeInfo: await states.node.read(),
      e2eMode,
      componentDids: entryComponentIds,
      configSynchronizer: manager.configSynchronizer,
    });

    // check blocklet healthy
    const { startTimeout, minConsecutiveTime } = getHealthyCheckTimeout(blocklet, {
      checkHealthImmediately,
      componentDids,
    });

    const params = {
      did,
      context,
      minConsecutiveTime,
      timeout: startTimeout,
      componentDids: entryComponentIds,
    };

    await manager._onCheckIfStarted(params, { throwOnError });

    for (const subDid of entryComponentIds) {
      onStarted?.(subDid);
    }
  } catch (err) {
    const status = await states.blocklet.getBlockletStatus(did);
    if ([BlockletStatus.stopping, BlockletStatus.stopped].includes(status)) {
      logger.info('Failed to start blocklet maybe due to manually stopped');
    }
    for (const subDid of entryComponentIds) {
      onError?.(subDid, err);
    }
    if (throwOnError) {
      throw err;
    }
  }
}

module.exports = {
  startRequiredComponents,
  start,
  _start,
};
