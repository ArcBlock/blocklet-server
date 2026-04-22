/* eslint-disable no-await-in-loop */
const fs = require('fs-extra');
const path = require('path');
const pick = require('lodash/pick');
const logger = require('@abtnode/logger')('@abtnode/core:blocklet:manager:delete-reset');
const { BlockletEvents, BlockletInternalEvents, BlockletStatus } = require('@blocklet/constant');
const {
  forEachBlockletSync,
  isInProgress,
  getDisplayName,
  isExternalBlocklet,
  isDeletableBlocklet,
} = require('@blocklet/meta/lib/util');

const { APP_CONFIG_DIR, COMPONENT_ENV_FILE_NAME } = require('@blocklet/constant');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const states = require('../../../states');
const hooks = require('../../hooks');
const {
  deleteBlockletProcess,
  getRuntimeEnvironments,
  getHookArgs,
  removeAppConfigsFromComponent,
} = require('../../../util/blocklet');
const checkNeedRunDocker = require('../../../util/docker/check-need-run-docker');
const { dockerExec } = require('../../../util/docker/docker-exec');
const { dockerExecChown } = require('../../../util/docker/docker-exec-chown');
const checkDockerRunHistory = require('../../../util/docker/check-docker-run-history');
const parseDockerName = require('../../../util/docker/parse-docker-name');
const { removeDockerNetwork } = require('../../../util/docker/docker-network');

/**
 * Safely remove directories
 */
async function _safeRemoveDir(manager, did, childDid, inputDirs) {
  const dirs = inputDirs.filter(Boolean);
  try {
    for (const dir of dirs) {
      fs.removeSync(dir);
      logger.info(`removed blocklet ${did} ${childDid}: ${dir}`);
    }
  } catch (error) {
    const nodeInfo = await states.node.read();
    // 如果删除因为权限问题失败，尝试用 docker 用户去调整用户组为宿主机当前用户
    if (checkDockerRunHistory(nodeInfo) && error?.message?.includes('EACCES')) {
      await dockerExecChown({ name: `${did}-${childDid}-remove-catch`, dirs, force: true });
      for (const dir of dirs) {
        fs.removeSync(dir);
        logger.info(`removed blocklet ${did} ${childDid}: ${dir}`);
      }
    } else {
      throw error;
    }
  }
}

/**
 * Delete blocklet
 */
async function deleteBlocklet(manager, { did, keepData, keepLogsDir, keepConfigs, sessionId }, context) {
  logger.info('delete blocklet', { did, keepData, sessionId });

  const blocklet = await manager.getBlocklet(did);

  try {
    if (isDeletableBlocklet(blocklet) === false) {
      throw new Error('Blocklet is protected from accidental deletion');
    }

    const nodeInfo = await states.node.read();
    const nodeEnvironments = await states.node.getEnvironments(nodeInfo);
    await deleteBlockletProcess(blocklet, {
      preDelete: async (b, { ancestors }) => {
        const needRunDocker = await checkNeedRunDocker(
          b.meta,
          getRuntimeEnvironments(b, nodeEnvironments, ancestors),
          nodeInfo,
          isExternalBlocklet(blocklet)
        );
        const hookArgs = getHookArgs(b);
        const nextEnv = getRuntimeEnvironments(b, nodeEnvironments, ancestors);
        if (needRunDocker) {
          if (b.meta.scripts?.preUninstall) {
            await dockerExec({
              blocklet,
              meta: b.meta,
              env: nextEnv,
              script: b.meta.scripts.preUninstall,
              hookName: 'preUninstall',
              nodeInfo,
              retry: 0,
              ...hookArgs,
            });
          }
          return null;
        }
        return hooks.preUninstall(b.meta.title, {
          appDir: b.env.appDir,
          hooks: Object.assign(b.meta.hooks || {}, b.meta.scripts || {}),
          env: nextEnv,
          did, // root blocklet did
          notification: states.notification,
          context,
          exitOnError: false,
          ...hookArgs,
        });
      },
    });

    const doc = await manager._deleteBlocklet({ did, keepData, keepLogsDir, keepConfigs }, context);
    manager._createNotification(
      doc.meta.did,
      {
        title: 'Blocklet Deleted',
        description: `Blocklet ${getDisplayName(blocklet)} is deleted.`,
        entityType: 'blocklet',
        entityId: doc.meta.did,
        severity: 'success',
      },
      {
        skipGetBlocklet: true,
      }
    );
    await removeDockerNetwork(parseDockerName(did, 'docker-network'));
    return doc;
  } catch (error) {
    // If we installed a corrupted blocklet accidentally, just cleanup the disk and state db
    logger.error('blocklet delete failed, will delete again', { did, error });
    const doc = await manager._deleteBlocklet({ did, keepData, keepLogsDir, keepConfigs }, context);
    await removeDockerNetwork(parseDockerName(did, 'docker-network'));

    manager._createNotification(
      doc.meta.did,
      {
        title: 'Blocklet Deleted',
        description: `Blocklet ${getDisplayName(blocklet)} is deleted.`,
        entityType: 'blocklet',
        entityId: doc.meta.did,
        severity: 'success',
      },
      {
        skipGetBlocklet: true,
      }
    );

    return doc;
  }
}

/**
 * Reset blocklet
 */
async function reset(manager, { did, childDid }, context = {}) {
  logger.info('reset blocklet', { did, childDid });

  const blocklet = await manager.getBlocklet(did);

  if (!childDid) {
    if (isInProgress(blocklet.status || blocklet.status === BlockletStatus.running)) {
      throw new Error('Cannot reset when blocklet is in progress');
    }

    try {
      await manager.deleteProcess({ did }, context);
    } catch {
      // do nothing
    }

    // Cleanup disk storage
    const { cacheDir, logsDir, dataDir } = blocklet.env;
    await _safeRemoveDir(manager, did, blocklet.meta.did, [cacheDir, dataDir, logsDir]);

    // Reset config in db
    await manager._resetExtras(blocklet.meta.did);
    await manager._updateBlockletEnvironment(did);
    await manager.resetSiteByDid(did, context);
  } else {
    const child = blocklet.children.find((x) => x.meta.did === childDid);

    if (!child) {
      throw new Error('Child does not exist');
    }

    if (isInProgress(child.status || child.status === BlockletStatus.running)) {
      throw new Error('Cannot reset when component is in progress');
    }

    try {
      await manager.deleteProcess({ did, componentDids: [child.meta.did] }, context);
    } catch {
      // do nothing
    }

    // Cleanup disk storage
    const { cacheDir, logsDir, dataDir } = child.env;
    await _safeRemoveDir(manager, did, child.meta.did, [cacheDir, dataDir, logsDir]);

    // Reset config in db
    await states.blockletExtras.delConfigs([blocklet.meta.did, child.meta.did]);
    await manager._setConfigsFromMeta(blocklet.meta.did, child.meta.did);
    await manager._updateBlockletEnvironment(did);
  }

  logger.info('blocklet reset', { did, childDid });
  return blocklet;
}

/**
 * Delete component
 */
async function deleteComponent(manager, { did, rootDid, keepData, keepState, sessionId }, context) {
  logger.info('delete blocklet component', { did, rootDid, keepData, keepState, sessionId });

  const nodeInfo = await states.node.read();
  if (checkDockerRunHistory(nodeInfo)) {
    await dockerExecChown({
      name: `${did}-${rootDid}-deleteComponent`,
      dirs: [path.join(process.env.ABT_NODE_DATA_DIR, 'data', rootDid)],
      force: true,
    });
  }
  const app = await manager.getBlocklet(rootDid);

  const child = app.children.find((x) => x.meta.did === did);
  if (!child) {
    throw new Error('Component does not exist');
  }

  // delete state
  const doc = await states.blocklet.getBlocklet(rootDid);
  doc.children = doc.children.filter((x) => x.meta.did !== did);
  const deletedChildren = await states.blockletExtras.getSettings(did, 'children', []);
  if (keepData !== false && keepState !== false) {
    deletedChildren.push({
      meta: pick(child.meta, ['did', 'name', 'bundleDid', 'bundleName', 'version', 'title', 'description']),
      mountPoint: child.mountPoint,
      status: BlockletStatus.deleted,
      deletedAt: new Date(),
    });
  }

  await states.blocklet.updateBlocklet(rootDid, doc);
  states.blockletExtras.setSettings(doc.meta.did, { children: deletedChildren });

  // delete process
  try {
    const skippedProcessIds = [];
    forEachBlockletSync(app, (b) => {
      if (!b.env.id.startsWith(child.env.id)) {
        skippedProcessIds.push(b.env.processId);
      }
    });
    await deleteBlockletProcess(app, { skippedProcessIds });
    logger.info('delete blocklet process for deleting component', { did, rootDid });
  } catch (err) {
    logger.error('delete blocklet process for deleting component', { did, rootDid, error: err });
  }

  // delete storage
  const { cacheDir, logsDir, dataDir } = child.env;
  await _safeRemoveDir(
    manager,
    rootDid,
    child.meta.did,
    [
      cacheDir,
      logsDir,
      path.join(app.env.dataDir, APP_CONFIG_DIR, child.meta.did, COMPONENT_ENV_FILE_NAME),
      keepData === false ? dataDir : null,
    ].filter(Boolean)
  );
  if (keepData === false) {
    const componentEnvs = await states.blockletExtras.getConfigs([app.meta.did, child.meta.did]);
    await states.blockletExtras.delConfigs([app.meta.did, child.meta.did]);

    // remove app configs if no component use it
    const tmpApp = await manager.getBlocklet(rootDid);
    await removeAppConfigsFromComponent(componentEnvs, tmpApp, states.blockletExtras);
  }
  const newBlocklet = await manager.getBlocklet(rootDid);

  if (newBlocklet.controller) {
    const componentDids = [did];
    const eventType = 'uninstall';

    manager.reportComponentUsageQueue.push({
      entity: 'blocklet',
      action: 'reportComponentUsage',
      did: newBlocklet.meta.did,
      time: new Date().toISOString(),
      componentDids,
      eventType,
      context,
    });

    logger.info('pushed reporting uninstall components event job to queue', {
      did: newBlocklet.meta.did,
      componentDids,
      eventType,
    });
  }

  await manager._updateDependents(rootDid);

  // support edge case
  if (newBlocklet.children.length === 0) {
    await states.blocklet.setBlockletStatus(newBlocklet.meta.did, BlockletStatus.stopped);
    await removeDockerNetwork(parseDockerName(app.meta.did, 'docker-network'));
  }

  manager.emit(BlockletEvents.upgraded, { blocklet: newBlocklet, context: { ...context, createAuditLog: false } }); // trigger router refresh

  manager._createNotification(newBlocklet.meta.did, {
    title: 'Component delete succeed',
    description: `${child.meta.title} is successfully deleted for ${getDisplayName(newBlocklet)}.`,
    entityType: 'blocklet',
    entityId: newBlocklet.meta.did,
    severity: 'success',
    action: `/blocklets/${newBlocklet.meta.did}/components`,
    blockletDashboardAction: `${WELLKNOWN_SERVICE_PATH_PREFIX}/admin/components`,
  });

  manager.emit(BlockletEvents.componentRemoved, {
    ...app,
    componentDids: [child.meta.did],
    context,
  });

  manager.emit(BlockletInternalEvents.componentRemoved, {
    appDid: app.appDid,
    components: [{ did: child.meta.did }],
  });
  manager.configSynchronizer.throttledSyncAppConfig(app.meta.did);

  return { ...newBlocklet, deletedComponent: child };
}

module.exports = {
  _safeRemoveDir,
  delete: deleteBlocklet,
  reset,
  deleteComponent,
};
