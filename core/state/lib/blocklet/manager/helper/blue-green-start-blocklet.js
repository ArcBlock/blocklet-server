/* eslint-disable no-await-in-loop */
/* eslint-disable consistent-return */
const logger = require('@abtnode/logger')('@abtnode/core:blocklet-manager:blue-green');
const { BlockletStatus, BlockletGroup, BlockletEvents, BlockletInternalEvents } = require('@blocklet/constant');
const {
  hasRunnableComponent,
  getDisplayName,
  isExternalBlocklet,
  forEachBlockletSync,
  getComponentMissingConfigs,
} = require('@blocklet/meta/lib/util');
const { getBlockletEngine, hasStartEngine } = require('@blocklet/meta/lib/engine');
const { getComponentsInternalInfo } = require('@blocklet/meta/lib/blocklet');
const pAll = require('p-all');
const blockletUtils = require('../../../util/blocklet');
const hooks = require('../../hooks');
const checkNeedRunDocker = require('../../../util/docker/check-need-run-docker');
const { blueGreenGetComponentIds } = require('./blue-green-get-componentids');
const { dockerExec } = require('../../../util/docker/docker-exec');
const { isDockerOnlySingleInstance } = require('../../../util/docker/is-docker-only-single-instances');

const {
  forEachBlocklet,
  validateBlocklet,
  validateBlockletChainInfo,
  ensureAppPortsNotOccupied,
  getHealthyCheckTimeout,
  getHookArgs,
  shouldSkipComponent,
  getComponentNamesWithVersion,
} = blockletUtils;

/**
 * 绿（Green）环境：指一个并行的、与蓝环境几乎一模一样的环境，用来部署新的版本。新代码、新配置都会先部署到绿环境中。
 *
 * @param {Object} params - 启动参数
 * @param {string} params.did - blocklet DID
 * @param {Array<string>} params.componentDids - 组件 DID 列表
 * @param {string} params.operator - 操作者
 * @param {Object} context - 上下文信息
 * @param {Object} manager - blocklet 管理器实例
 * @param {Object} states - 状态管理器
 * @returns {Promise<Object>} 返回启动后的 blocklet 对象
 */
const blueGreenStartBlocklet = async (
  { did, componentDids, operator: _operator, ignoreErrorNotification, onError, ignoreBlockletStartedEvent },
  context,
  manager,
  states
) => {
  const operator = _operator || context?.user?.did;
  const throwOnError = true;
  const checkHealthImmediately = true;
  const e2eMode = false;

  logger.info('start green blocklet (blue-green deployment)', {
    did,
    componentDids,
    throwOnError,
    checkHealthImmediately,
    e2eMode,
    operator,
  });

  // 检查 blocklet 是否存在，如果不存在则跳过
  // 这可以防止在 blocklet 被删除后，队列中待处理的重启任务执行时出错
  if (!(await manager.hasBlocklet({ did }))) {
    logger.warn('skip blue-green start: blocklet not found', { did });
    return;
  }

  // 获取并验证 blocklet
  const blocklet1 = await manager.ensureBlocklet(did, { e2eMode });

  did = blocklet1.meta.did; // eslint-disable-line no-param-reassign

  // 验证组件需求和引擎
  await validateBlocklet(blocklet1);
  await validateBlockletChainInfo(blocklet1);

  if (!hasRunnableComponent(blocklet1)) {
    throw new Error('No runnable component found');
  }

  blocklet1.children = await states.blocklet.loadChildren(blocklet1.id);

  const customerDockerUseVolumeComponentIds = [];
  const otherComponentIds = [];
  await forEachBlockletSync(blocklet1, (b) => {
    if (!componentDids.includes(b.meta.did)) {
      return;
    }
    if (isDockerOnlySingleInstance(b.meta)) {
      customerDockerUseVolumeComponentIds.push(b.meta.did);
    } else {
      otherComponentIds.push(b.meta.did);
    }
  });

  // 分类组件 ID
  const entryComponentIds = [];
  const nonEntryComponentIds = [];
  const componentDidsSet = new Set(otherComponentIds);

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
    await states.blocklet.setBlockletStatus(did, BlockletStatus.running, {
      componentDids: nonEntryComponentIds,
      operator,
      isGreenAndBlue: true,
    });
  }

  if (!entryComponentIds.length) {
    await manager.emit(BlockletEvents.started, {
      ...blocklet1,
      componentDids: nonEntryComponentIds,
    });
    return;
  }

  // check required config
  try {
    for (const component of blocklet1.children) {
      if (!entryComponentIds.includes(component.meta.did)) {
        continue;
      }
      if (!shouldSkipComponent(component.meta.did, entryComponentIds)) {
        const missingProps = getComponentMissingConfigs(component, blocklet1);
        if (missingProps.length) {
          throw new Error(
            `Missing required configuration to start ${component.meta.title}: ${missingProps.map((x) => x.key).join(',')}`
          );
        }
      }
    }
  } catch (error) {
    const description = `Green environment start failed for ${getDisplayName(blocklet1)}: ${error.message}`;
    if (!ignoreErrorNotification) {
      manager._createNotification(did, {
        title: 'Blue-Green Deployment: Green Start Failed',
        description,
        entityType: 'blocklet',
        entityId: did,
        severity: 'error',
      });
    }
    return;
  }

  const blueGreenComponentIds = blueGreenGetComponentIds(blocklet1, entryComponentIds);

  const startedBlockletDids = [];
  const errorBlockletDids = [];
  const appId = blocklet1.id;

  const notificationChange = async () => {
    // Get latest children from blocklet_children table instead of reloading entire blocklet
    const latestChildren = await states.blocklet.loadChildren(appId);

    // Merge latest children into blocklet1 for event emission
    const finalBlocklet = {
      ...blocklet1,
      children: latestChildren,
    };

    await manager.configSynchronizer.throttledSyncAppConfig(finalBlocklet);
    const componentsInfo = getComponentsInternalInfo(finalBlocklet);
    manager.emit(BlockletInternalEvents.componentUpdated, {
      appDid: blocklet1.appDid,
      components: componentsInfo,
    });

    manager.emit(BlockletInternalEvents.componentStarted, {
      appDid: blocklet1.appDid,
      components: startedBlockletDids.map((x) => ({ did: x.did })),
    });

    // Emit statusChange event so UI can see the status change
    manager.emit(BlockletEvents.statusChange, finalBlocklet);

    manager.emit(BlockletEvents.started, { ...finalBlocklet, componentDids: startedBlockletDids.map((x) => x.did) });
  };

  // Helper function to update child status immediately and emit events
  const updateChildStatusImmediately = async (componentDid, status, isGreen = false) => {
    if (!states.blockletChild || !appId) {
      return;
    }

    try {
      const updates = {
        operator,
        inProgressStart: Date.now(),
      };

      if (status === BlockletStatus.running) {
        await states.blockletChild.updateChildStatusRunning(appId, componentDid, isGreen, updates);
      } else {
        await states.blockletChild.updateChildStatusError(appId, componentDid, isGreen, updates);
      }

      // Get latest children from blocklet_children table and emit events immediately
      const latestChildren = await states.blocklet.loadChildren(appId);
      const updatedBlocklet = {
        ...blocklet1,
        children: latestChildren,
      };
      const componentsInfo = getComponentsInternalInfo(updatedBlocklet);

      manager.emit(BlockletInternalEvents.componentUpdated, {
        appDid: blocklet1.appDid,
        components: componentsInfo.filter((c) => c.did === componentDid),
      });

      if (status === BlockletStatus.running) {
        manager.emit(BlockletInternalEvents.componentStarted, {
          appDid: blocklet1.appDid,
          components: [{ did: componentDid }],
        });
      }

      manager.emit(BlockletEvents.statusChange, updatedBlocklet);

      // Emit statusChange event immediately so UI can see each component's status change
      manager.emit(BlockletEvents.started, {
        ...updatedBlocklet,
        componentDids: startedBlockletDids.map((x) => x.did),
      });
    } catch (err) {
      logger.error('Failed to update child status immediately', {
        componentDid,
        status,
        isGreen,
        error: err.message,
      });
    }
  };

  for (const item of blueGreenComponentIds) {
    if (!item.componentDids.length) {
      continue;
    }

    await states.blocklet.setBlockletStatus(did, BlockletStatus.starting, {
      componentDids: item.componentDids,
      operator,
      isGreen: item.changeToGreen,
    });

    await ensureAppPortsNotOccupied({
      blocklet: blocklet1,
      componentDids: item.componentDids,
      states,
      manager,
      isGreen: item.changeToGreen,
    });
  }

  if (customerDockerUseVolumeComponentIds.length) {
    await manager.stop(
      { did, componentDids: customerDockerUseVolumeComponentIds, updateStatus: false, operator },
      context
    );
    await manager.start({ did, componentDids: customerDockerUseVolumeComponentIds, operator }, context);
  }

  const nextBlocklet = await manager.ensureBlocklet(did, { e2eMode });

  manager.emit(BlockletEvents.statusChange, nextBlocklet);

  // 收集所有任务
  const tasks = [];
  for (const item of blueGreenComponentIds) {
    if (!item.componentDids.length) {
      continue;
    }

    for (const subDid of item.componentDids) {
      tasks.push(async () => {
        try {
          const nodeInfo = await states.node.read();
          const nodeEnvironments = await states.node.getEnvironments(nodeInfo);

          // 钩子函数设置
          const getHookFn =
            (hookName) =>
            async (b, { env }) => {
              const hookArgs = getHookArgs(b);
              const needRunDocker = await checkNeedRunDocker(b.meta, env, nodeInfo, isExternalBlocklet(nextBlocklet));
              if (!b.meta.scripts?.[hookName]) {
                return null;
              }
              if (needRunDocker) {
                return dockerExec({
                  blocklet: nextBlocklet,
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

          await blockletUtils.startBlockletProcess(nextBlocklet, {
            ...context,
            preFlight: getHookFn('preFlight'),
            preStart: getHookFn('preStart'),
            postStart: getHookFn('postStart'),
            nodeEnvironments,
            nodeInfo,
            e2eMode,
            componentDids: [subDid],
            configSynchronizer: manager.configSynchronizer,
            isGreen: item.changeToGreen,
          });

          // 健康检查绿色环境
          const { startTimeout, minConsecutiveTime } = getHealthyCheckTimeout(nextBlocklet, {
            checkHealthImmediately,
            componentDids: [subDid],
          });

          await manager._onCheckIfStarted(
            {
              did,
              context,
              minConsecutiveTime,
              timeout: startTimeout,
              componentDids: [subDid],
            },
            { throwOnError: true, isGreen: item.changeToGreen }
          );

          // 收集成功的组件（排除已经在 errorBlockletDids 中的组件）
          startedBlockletDids.push({ did: subDid, isGreen: item.changeToGreen });

          // Update status immediately
          await updateChildStatusImmediately(subDid, BlockletStatus.running, item.changeToGreen);

          await manager.deleteProcess({
            did,
            componentDids: [subDid],
            isGreen: !item.changeToGreen,
            shouldUpdateBlockletStatus: false,
          });

          logger.info('Green environment started successfully', {
            did,
            componentDids: [subDid],
          });
        } catch (err) {
          const error = Array.isArray(err) ? err[0] : err;
          logger.error('Failed to start green environment', { error, did, title: blocklet1.meta.title });

          // 收集失败的组件
          errorBlockletDids.push({ did: subDid, error, isGreen: item.changeToGreen });

          // Update status immediately
          await updateChildStatusImmediately(subDid, BlockletStatus.error, item.changeToGreen);

          try {
            await manager.deleteProcess({
              did,
              componentDids: [subDid],
              isGreen: item.changeToGreen,
              shouldUpdateBlockletStatus: false,
            });
          } catch (cleanupError) {
            logger.error('Failed to cleanup green environment', { cleanupError });
          }
        }
      });
    }
  }

  await pAll(tasks, { concurrency: 6 });

  // Sync parent blocklet uptime status once after all components are processed
  await states.blocklet.syncUptimeStatus(appId);

  const lastBlocklet = await manager.getBlocklet(did, { e2eMode });
  let errorDescription = '';

  // 处理启动失败的组件
  if (errorBlockletDids.length) {
    const { error } = errorBlockletDids[0];
    for (const item of errorBlockletDids) {
      logger.error('Failed to start blocklet', {
        error: item.error,
        title: lastBlocklet.meta.title,
        name: getComponentNamesWithVersion(lastBlocklet, [item.did]),
      });
    }

    errorDescription = `${getComponentNamesWithVersion(
      lastBlocklet,
      errorBlockletDids.map((x) => x.did)
    )} start failed for ${getDisplayName(lastBlocklet)}: ${errorBlockletDids.map((x) => x.error.message).join('. ')}`;

    if (!ignoreErrorNotification) {
      manager._createNotification(did, {
        title: 'Blue-Green Deployment: Green Start Failed',
        description: errorDescription,
        entityType: 'blocklet',
        entityId: did,
        severity: 'error',
      });
    }

    const finalBlocklet = await manager.getBlocklet(did);
    manager.emit(BlockletEvents.startFailed, {
      ...finalBlocklet,
      componentDids: errorBlockletDids.map((x) => x.did),
      error: { message: error.message },
    });
    manager.emit(BlockletEvents.statusChange, { ...finalBlocklet, error: { message: error.message } });
  }

  // 处理成功启动的组件
  if (startedBlockletDids.length) {
    await notificationChange();
  }

  // 根据情况更新 route table， 会判断只有包含多 interfaces 的 DID 才会更新 route table
  // 如果是蓝绿更新发起的，则不更新 route table，因为蓝绿更新会自动更新 route table
  if (!['true', '1'].includes(process.env.ABT_NODE_DISABLE_BLUE_GREEN) && !ignoreBlockletStartedEvent) {
    // 检查 blocklet 是否仍然存在（可能在异步执行期间被删除）
    if (!(await manager.hasBlocklet({ did }))) {
      logger.warn('skip blueOrGreenStarted event: blocklet no longer exists', { did });
      return;
    }
    const latestBlocklet = await manager.getBlocklet(did, { e2eMode });
    manager.emit(BlockletEvents.blueOrGreenStarted, {
      blocklet: latestBlocklet,
      componentDids,
      context,
    });
  }

  if (errorBlockletDids.length && onError) {
    onError(errorBlockletDids);
  }

  if (throwOnError && errorDescription) {
    throw new Error(errorDescription);
  }
};

module.exports = {
  blueGreenStartBlocklet,
};
