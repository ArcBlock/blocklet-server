/* eslint-disable no-await-in-loop */
const path = require('path');
const logger = require('@abtnode/logger')('@abtnode/core:blocklet:manager:install-upgrade');
const { INSTALL_ACTIONS, WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { BlockletStatus, BlockletEvents, BlockletInternalEvents } = require('@blocklet/constant');
const {
  forEachComponentV2,
  forEachComponentV2Sync,
  hasStartEngine,
  isExternalBlocklet,
} = require('@blocklet/meta/lib/util');
const { getComponentsInternalInfo } = require('@blocklet/meta/lib/blocklet');

const states = require('../../../states');
const {
  getRuntimeEnvironments,
  getDisplayName,
  getComponentNamesWithVersion,
  getHookArgs,
  updateBlockletFallbackLogo,
} = require('../../../util/blocklet');
const checkNeedRunDocker = require('../../../util/docker/check-need-run-docker');
const { dockerExec } = require('../../../util/docker/docker-exec');
const runBlockletMigrationScripts = require('../../migration');
const getMigrationScripts = require('../../../util/get-migration-scripts');
const { removeUploadFile } = require('../../downloader/bundle-downloader');
const { blueGreenStartBlocklet } = require('../helper/blue-green-start-blocklet.js');

/**
 * On restart callback
 */
async function _onRestart(manager, { did, componentDids, context, operator }) {
  // 检查 blocklet 是否存在，如果不存在则跳过重启任务
  // 这可以防止在 blocklet 被删除后，队列中待处理的重启任务执行时出错
  if (!(await manager.hasBlocklet({ did }))) {
    logger.warn('skip restart job: blocklet not found', { did });
    return;
  }

  if (process.env.ABT_NODE_DISABLE_BLUE_GREEN) {
    await manager.stop({ did, componentDids, context, operator });
    await manager.start({ did, componentDids, checkHealthImmediately: true });
    return;
  }
  await blueGreenStartBlocklet({ did, componentDids, operator }, context, manager, states);
}

/**
 * Run migration scripts
 */
async function _runMigration(manager, { parallel, did, blocklet, oldBlocklet, componentDids }) {
  logger.info('start migration on upgrading', { did, componentDids });
  const oldVersions = {};
  forEachComponentV2Sync(oldBlocklet, (b) => {
    if (componentDids.includes(b.meta.did)) {
      oldVersions[b.meta.did] = b.meta.version;
    }
  });
  const nodeInfo = await states.node.read();
  // 等待磁盘映射完成

  const nodeEnvironments = await states.node.getEnvironments(nodeInfo);

  const runMigration = async (b) => {
    if (!componentDids.includes(b.meta.did)) {
      return;
    }
    const nextEnv = getRuntimeEnvironments(b, nodeEnvironments, [blocklet]);
    const subNeedRunDocker = await checkNeedRunDocker(b.meta, nextEnv, nodeInfo, isExternalBlocklet(blocklet));
    const hookArgs = getHookArgs(b);

    const scriptsDir = path.join(b.env.appDir, 'migration');
    const scripts = await getMigrationScripts(scriptsDir, oldVersions[b.meta.did]);
    if (!scripts.length) {
      return;
    }
    try {
      if (subNeedRunDocker) {
        if (scripts.length) {
          await dockerExec({
            blocklet,
            meta: b.meta,
            env: nextEnv,
            script: ['node docker-exec/run-script.cjs'].filter(Boolean).join(' && '),
            hookName: 'migration',
            nodeInfo,
            runScriptDir: path.join(__dirname, '../../migration-dist'),
            runScriptParams: {
              blocklet: b,
              appDir: b.env.appDir,
              env: nextEnv,
              oldVersion: oldVersions[b.meta.did],
              newVersion: b.meta.version,
              ...getHookArgs(b),
            },
            ...hookArgs,
            timeout: 1000 * 120,
            retry: 0,
          });
        }
      } else {
        await runBlockletMigrationScripts({
          blocklet: b,
          appDir: b.env.appDir,
          env: nextEnv,
          oldVersion: oldVersions[b.meta.did],
          newVersion: b.meta.version,
          ...hookArgs,
        });
      }
    } catch (error) {
      logger.error('Failed to run migration scripts', { appDid: did, title: b.meta.title, error });
      // dev 模式下，migration 失败不抛出错误，只打印日志
      if (process.env.ABT_NODE_DEV_MODE !== 'true') {
        error.message = `Failed to run migration scripts for ${b.meta.title}: ${error.message}`;
        throw error;
      }
    }
  };
  await forEachComponentV2(blocklet, runMigration, {
    parallel,
    concurrencyLimit: parallel ? 4 : 1,
  });
  logger.info('done migration on upgrading', { did, componentDids });
}

/**
 * Clean upload file
 */
function _cleanUploadFile(url) {
  setTimeout(() => {
    removeUploadFile(url);
  }, 10000); // 10s 后删除上传的文件
}

/**
 * Ensure deleted children in settings
 */
async function _ensureDeletedChildrenInSettings(manager, blocklet) {
  const { did } = blocklet.meta;

  // TODO 不从 settings 中取值, 直接存在 extra 中
  let deletedChildren = await states.blockletExtras.getSettings(did, 'children', []);
  deletedChildren = deletedChildren.filter(
    (x) => x.status === BlockletStatus.deleted && !blocklet.children.some((y) => y.meta.did === x.meta.did)
  );

  await states.blockletExtras.setSettings(did, { children: deletedChildren });
}

/**
 * Upgrade blocklet
 */
async function _upgradeBlocklet(
  manager,
  { newBlocklet, oldBlocklet, componentDids, action, context = {}, shouldCleanUploadFile, url }
) {
  const { meta, source, deployedFrom, children } = newBlocklet;
  const { did, version, name } = meta;
  const title = getDisplayName(newBlocklet);

  try {
    // delete old process
    try {
      await manager.deleteProcess({ did, componentDids }, context);
      logger.info('delete blocklet process for upgrading', { did, componentDids });
    } catch (err) {
      logger.error('delete blocklet process for upgrading', { did, componentDids, error: err });
    }

    // update state
    await states.blocklet.upgradeBlocklet({ meta, source, deployedFrom, children });
    logger.info('updated blocklet for upgrading', { did, componentDids, source, name });
    // ensure component status is upgrading
    await states.blocklet.setBlockletStatus(did, BlockletStatus.upgrading, { componentDids });
    await manager._setConfigsFromMeta(did);

    // should ensure blocklet integrity
    let blocklet = await manager.ensureBlocklet(did);

    // Add environments
    await manager._updateBlockletEnvironment(did);
    blocklet = await manager.getBlocklet(did);

    const nodeInfo = await states.node.read();
    const nodeEnvironments = await states.node.getEnvironments(nodeInfo);
    const env = getRuntimeEnvironments(blocklet, nodeEnvironments, {});
    const needRunDocker = await checkNeedRunDocker(blocklet.meta, env, nodeInfo, isExternalBlocklet(blocklet));

    await manager._runUserHook('preInstall', blocklet, context);
    // post install
    await manager._runUserHook('postInstall', blocklet, context);

    await manager._runUserHook('preFlight', blocklet, context);

    await _runMigration(manager, { parallel: !needRunDocker, did, blocklet, oldBlocklet, componentDids });

    // handle component status
    const runningDids = [];
    const stoppedDids = [];
    if (action === INSTALL_ACTIONS.INSTALL_COMPONENT) {
      for (const componentDid of componentDids) {
        const component = blocklet.children.find((x) => x.meta.did === componentDid);
        if (hasStartEngine(component.meta)) {
          // NOT start immediately for runnable component
          stoppedDids.push(componentDid);
        } else {
          // Start immediately for resource component
          runningDids.push(componentDid);
        }
      }
    } else {
      for (const componentDid of componentDids) {
        const old = oldBlocklet.children.find((x) => x.meta.did === componentDid);
        if (old?.status === BlockletStatus.running) {
          runningDids.push(componentDid);
        } else {
          stoppedDids.push(componentDid);
        }
      }
    }
    if (runningDids.length) {
      const initialized = !!blocklet.settings?.initialized;
      if (initialized) {
        try {
          await manager.start({ did, componentDids: runningDids }, context);
          logger.info('started blocklet for upgrading', { did, version, runningDids });
        } catch (error) {
          logger.error('failed to start blocklet for upgrading', { did, version, runningDids, error });
        }
      } else {
        await states.blocklet.setBlockletStatus(did, BlockletStatus.stopped, { componentDids: runningDids });
        logger.info('set blocklet as stopped since not initialized', { did, version, runningDids });
      }
    }
    if (stoppedDids.length) {
      const status = action === INSTALL_ACTIONS.INSTALL_COMPONENT ? BlockletStatus.installed : BlockletStatus.stopped;
      await states.blocklet.setBlockletStatus(did, status, { componentDids: stoppedDids });
    }

    blocklet = await manager.getBlocklet(did, context);

    await updateBlockletFallbackLogo(blocklet);

    await manager._updateDependents(did);

    manager.refreshListCache();

    try {
      manager.emit(BlockletEvents.upgraded, { blocklet, context }); // trigger router refresh

      const isInstallAction = action === INSTALL_ACTIONS.INSTALL_COMPONENT;
      const notificationEvent = isInstallAction ? BlockletEvents.componentInstalled : BlockletEvents.componentUpgraded;
      const actionName = isInstallAction ? 'installed' : 'upgraded';

      manager.emit(notificationEvent, { ...blocklet, componentDids, oldBlocklet, context });

      const upgradeLength = componentDids?.length || 0;

      manager._createNotification(did, {
        title: `${upgradeLength > 1 ? `${upgradeLength} components` : 'Component'} ${actionName} successfully for ${title}`,
        description: `${getComponentNamesWithVersion(
          newBlocklet,
          componentDids
        )} is ${actionName} successfully for ${title}`,
        action: `/blocklets/${did}/overview`,
        blockletDashboardAction: `${WELLKNOWN_SERVICE_PATH_PREFIX}/admin/blocklets`,
        entityType: 'blocklet',
        entityId: did,
        severity: 'success',
      });

      if (shouldCleanUploadFile && url) {
        _cleanUploadFile(url);
      }

      if (isInstallAction && process.env.NODE_ENV !== 'test') {
        manager.start({ did, componentDids });
      }
    } catch (error) {
      logger.error('emit upgrade notification failed', { name, version, error });
    }

    // Update dynamic component meta in blocklet settings
    await _ensureDeletedChildrenInSettings(manager, blocklet);

    await manager._rollbackCache.remove({ did: blocklet.meta.did });

    if (oldBlocklet.status === BlockletStatus.running) {
      manager.emit(
        action === INSTALL_ACTIONS.INSTALL_COMPONENT
          ? BlockletInternalEvents.componentInstalled
          : BlockletInternalEvents.componentUpgraded,
        {
          appDid: blocklet.appDid,
          components: getComponentsInternalInfo(blocklet).filter((c) => componentDids.includes(c.did)),
        }
      );
    }
    manager.configSynchronizer.throttledSyncAppConfig(blocklet);

    return blocklet;
  } catch (err) {
    const b = await manager._rollback(action, did, oldBlocklet);
    logger.error('failed to upgrade blocklet', { did, version, name, error: err });

    manager.emit(BlockletEvents.updated, { ...b, context });

    const actionName = action === INSTALL_ACTIONS.INSTALL_COMPONENT ? 'install' : 'upgrade';
    const notificationEvent =
      action === INSTALL_ACTIONS.INSTALL_COMPONENT
        ? BlockletEvents.componentInstallFailed
        : BlockletEvents.componentUpgradeFailed;

    manager.emit(notificationEvent, {
      blocklet: { ...newBlocklet, componentDids, error: { message: err.message } },
      context,
    });

    const upgradeLength = componentDids?.length || 0;
    manager._createNotification(did, {
      title: `${upgradeLength > 1 ? `${upgradeLength} components` : 'Component'} failed to ${actionName} for ${title}`,
      description: `${getComponentNamesWithVersion(newBlocklet, componentDids)} ${actionName} failed for ${title}: ${
        err.message
      }.`,
      entityType: 'blocklet',
      entityId: did,
      severity: 'error',
    });
    throw err;
  }
}

module.exports = {
  _onRestart,
  _runMigration,
  _cleanUploadFile,
  _ensureDeletedChildrenInSettings,
  _upgradeBlocklet,
};
