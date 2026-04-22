const path = require('path');
const logger = require('@abtnode/logger')('@abtnode/core:blocklet:manager:cleanup');
const { INSTALL_ACTIONS } = require('@abtnode/constant');
const { BlockletEvents } = require('@blocklet/constant');

const states = require('../../../states');
const checkDockerRunHistory = require('../../../util/docker/check-docker-run-history');
const { dockerExecChown } = require('../../../util/docker/docker-exec-chown');

/**
 * Rollback blocklet installation/upgrade
 * @param {Object} manager - BlockletManager instance
 * @param {string} action - install, upgrade, installComponent, upgradeComponent
 * @param {string} did - Blocklet DID
 * @param {Object} oldBlocklet - Previous blocklet state
 * @returns {Promise<Object>}
 */
async function _rollback(manager, action, did, oldBlocklet) {
  if (action === INSTALL_ACTIONS.INSTALL) {
    const extraState = oldBlocklet?.extraState;

    // rollback blocklet extra state
    if (extraState) {
      await states.blockletExtras.update({ did }, extraState);
    } else {
      await states.blockletExtras.remove({ did });
    }

    // remove blocklet state
    return _deleteBlocklet(manager, { did, keepData: true });
  }

  if (
    [
      INSTALL_ACTIONS.INSTALL_COMPONENT,
      INSTALL_ACTIONS.UPGRADE_COMPONENT,
      'upgrade', // for backward compatibility
    ].includes(action)
  ) {
    const { extraState, ...blocklet } = oldBlocklet;
    // rollback blocklet state
    const result = await states.blocklet.updateBlocklet(did, blocklet);

    // rollback blocklet extra state
    await states.blockletExtras.update({ did: blocklet.meta.did }, extraState);

    logger.info('blocklet rollback successfully', { did, action });
    manager.emit(BlockletEvents.updated, result);
    return result;
  }

  logger.error('rollback action is invalid', { action });
  throw new Error(`rollback action is invalid: ${action}`);
}

/**
 * Delete blocklet
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function _deleteBlocklet(manager, { did, keepData, keepLogsDir, keepConfigs }, context) {
  const blocklet = await states.blocklet.getBlocklet(did);
  const { name } = blocklet.meta;
  const cacheDir = path.join(manager.dataDirs.cache, name);

  // Cleanup db
  await manager.teamManager.deleteTeam(blocklet.meta.did);

  // Cleanup disk storage
  await _cleanBlockletData(manager, { blocklet, keepData, keepLogsDir, keepConfigs, appCacheDir: cacheDir });

  const result = await states.blocklet.deleteBlocklet(did);
  logger.info('blocklet removed successfully', { did });

  let keepRouting = true;
  if (keepData === false || keepConfigs === false) {
    keepRouting = false;
  }

  manager.runtimeMonitor.delete(blocklet.meta.did);

  manager.emit(BlockletEvents.removed, {
    blocklet: result,
    context: {
      ...context,
      keepRouting,
    },
  });
  return blocklet;
}

/**
 * Clean blocklet data
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @returns {Promise<void>}
 */
async function _cleanBlockletData(manager, { blocklet, keepData, keepLogsDir, keepConfigs, appCacheDir }) {
  const { name } = blocklet.meta;

  const dataDir = path.join(manager.dataDirs.data, name);
  const logsDir = path.join(manager.dataDirs.logs, name);
  const cacheDir = path.join(manager.dataDirs.cache, name);
  const nodeInfo = await states.node.read();
  if (checkDockerRunHistory(nodeInfo)) {
    await dockerExecChown({
      name: `${blocklet.meta.did}-clean-data`,
      dirs: [dataDir, logsDir, cacheDir],
      force: true,
    });
  }

  logger.info(`clean blocklet ${blocklet.meta.did} data`, { keepData, keepLogsDir, keepConfigs });

  if (keepData === false) {
    await manager._safeRemoveDir(blocklet.meta.did, name, [appCacheDir, dataDir, logsDir, cacheDir]);
    await states.blockletExtras.remove({ did: blocklet.meta.did });
    logger.info(`removed blocklet ${blocklet.meta.did} extra data`);
  } else {
    if (keepLogsDir === false) {
      await manager._safeRemoveDir(blocklet.meta.did, name, [appCacheDir, logsDir]);
    } else {
      await manager._safeRemoveDir(blocklet.meta.did, name, [appCacheDir]);
    }

    if (keepConfigs === false) {
      await states.blockletExtras.remove({ did: blocklet.meta.did });
      logger.info(`removed blocklet ${blocklet.meta.did} extra data`);
    }
  }
}

/**
 * Get blocklet for installation with extra state
 * @param {string} did - Blocklet DID
 * @returns {Promise<Object|null>}
 */
async function _getBlockletForInstallation(did) {
  const blocklet = await states.blocklet.getBlocklet(did, { decryptSk: false });
  if (!blocklet) {
    return null;
  }

  const extraState = await states.blockletExtras.findOne({ did: blocklet.meta.did });
  blocklet.extraState = extraState;

  return blocklet;
}

module.exports = {
  _rollback,
  _deleteBlocklet,
  _cleanBlockletData,
  _getBlockletForInstallation,
};
