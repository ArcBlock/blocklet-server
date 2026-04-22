const fs = require('fs-extra');
const path = require('path');
const merge = require('lodash/merge');
const isEmpty = require('lodash/isEmpty');
const { joinURL } = require('ufo');
const logger = require('@abtnode/logger')('@abtnode/core:blocklet:manager:backup');
const sleep = require('@abtnode/util/lib/sleep');
const { encode } = require('@abtnode/util/lib/base32');
const { BACKUPS, DEFAULT_DID_DOMAIN } = require('@abtnode/constant');
const { BlockletStatus, BlockletEvents, RESTORE_PROGRESS_STATUS } = require('@blocklet/constant');

const states = require('../../../states');
const { SpacesBackup } = require('../../storage/backup/spaces');
const { SpacesRestore } = require('../../storage/restore/spaces');
const {
  getBackupJobId,
  getBackupEndpoint,
  getBackupFilesUrlFromEndpoint,
  getSpaceNameByEndpoint,
} = require('../../../util/spaces');
const { shouldJobBackoff } = require('../../../util/env');
const { installApplicationFromBackup } = require('../helper/install-application-from-backup');

/**
 * Handle backup to spaces
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {string} params.did - Blocklet DID
 * @param {Object} params.context - Context
 * @param {Object} params.backupState - Backup state
 * @returns {Promise<void>}
 */
async function _onBackupToSpaces(
  manager,
  {
    did,
    context,
    backupState = {
      strategy: BACKUPS.STRATEGY.AUTO,
    },
  }
) {
  const blocklet = await states.blocklet.getBlocklet(did);
  const {
    appDid,
    meta: { did: appPid },
  } = blocklet;

  if (shouldJobBackoff()) {
    const backup = await states.backup.findOne({ appPid }, {}, { createdAt: -1 });
    const message = 'Backup to spaces is not available when blocklet server is starting.';

    if (backup.status === BACKUPS.STATUS.PROGRESS) {
      await states.backup.fail(backup.id, {
        message,
      });
    }

    manager.emit(BlockletEvents.backupProgress, {
      appDid,
      meta: { did: appPid },
      completed: true,
      progress: -1,
      message,
      backup,
      context,
      blocklet,
    });

    logger.warn(message);
    return;
  }

  const spaceGateways = await manager.getBlockletSpaceGateways({ did });
  const backupEndpoint = getBackupEndpoint(blocklet.environments);
  if (isEmpty(spaceGateways) || isEmpty(backupEndpoint)) {
    logger.warn('Canceled automatic backups because there is no space gateway.', { appPid });

    const jobId = getBackupJobId(did);
    await manager.backupQueue.delete(jobId);
    await manager.updateAutoBackup({ did, autoBackup: { enabled: false } }, context);

    return;
  }

  const {
    user: { did: userDid, locale },
  } = context;

  let { referrer } = context;
  if (isEmpty(referrer)) {
    // fixes: https://github.com/ArcBlock/did-spaces/issues/908, referrer 在某些情况下会不存在
    /**
     * @type {import('@blocklet/server-js').NodeState}
     */
    const node = await states.node.read();
    referrer = joinURL(
      `https://${encode(node.did)}.${DEFAULT_DID_DOMAIN}`,
      node.routing.adminPath,
      `/blocklets/${did}/didSpaces`
    );
  }

  const verifyBackup = () => {
    // @note: 自动备份时,应用停止运行就跳过本次备份
    if (backupState?.strategy === BACKUPS.STRATEGY.AUTO && blocklet.status === BlockletStatus.stopped) {
      const message =
        'Automatic backup is only available to running blocklets, please start your blocklet before enable automatic backup.';
      logger.error(message, { appPid });

      return message;
    }

    if (backupState?.strategy === BACKUPS.STRATEGY.AUTO && shouldJobBackoff()) {
      const message = 'Automatic backup is not available when blocklet server is starting.';
      logger.error(message, { appPid });

      return message;
    }

    return null;
  };

  let backup = await states.backup.findOne({ appPid }, {}, { createdAt: -1 });
  if (backup?.status !== BACKUPS.STATUS.PROGRESS) {
    const message = verifyBackup();
    if (message) {
      return;
    }

    // 创建备份记录
    backup = await states.backup.start({
      appPid,
      userDid,
      strategy: backupState?.strategy,
      sourceUrl: path.join(manager.dataDirs.tmp, 'backup', appDid),
      targetName: await getSpaceNameByEndpoint(backupEndpoint, 'DID Space'),
    });
  }

  const spacesBackup = new SpacesBackup({ appDid, appPid, event: manager, userDid, referrer, locale, backup });
  try {
    const message = verifyBackup();
    if (message) {
      throw new Error(message);
    }

    manager.emit(BlockletEvents.backupProgress, {
      appDid,
      meta: { did: appPid },
      message: 'Start backup...',
      progress: 10,
      completed: false,
    });
    await states.backup.progress(backup.id, {
      message: 'Start backup...',
      progress: 10,
    });
    await spacesBackup.backup();

    await states.backup.success(backup.id, {
      targetUrl: getBackupFilesUrlFromEndpoint(getBackupEndpoint(blocklet?.environments)),
      metadata: {
        count: spacesBackup.backupOutput.data?.count,
        size: spacesBackup.backupOutput.data?.size,
      },
    });

    // 备份成功了
    manager.emit(BlockletEvents.backupProgress, {
      appDid,
      meta: { did: appPid },
      completed: true,
      progress: 100,
      backup,
      context,
      blocklet,
    });
  } catch (error) {
    // @note: 主动抛出错误表明正在备份中，不做处理
    if (error.cause?.status === BlockletEvents.backupProgress) {
      logger.warn(error.message);
      return;
    }

    await states.backup.fail(backup.id, {
      message: error?.message,
    });

    manager.emit(BlockletEvents.backupProgress, {
      appDid,
      meta: { did: appPid },
      completed: true,
      progress: -1,
      message: error?.message,
      backup,
      context,
      blocklet,
    });
    throw error;
  }
}

/**
 * Handle restore from spaces
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {Object} params.input - Restore input
 * @param {Object} params.context - Context
 * @returns {Promise<void>}
 */
async function _onRestoreFromSpaces(manager, { input, context }) {
  try {
    if (input.delay) {
      await sleep(input.delay);
    }

    manager.emit(BlockletEvents.restoreProgress, {
      appDid: input.appDid,
      meta: { did: input.appPid },
      status: RESTORE_PROGRESS_STATUS.start,
    });

    const userDid = context.user.did;
    const spacesRestore = new SpacesRestore({
      ...input,
      appPid: input.appPid,
      event: manager,
      userDid,
      referrer: context.referrer,
    });
    const params = await spacesRestore.restore();

    const removeRestoreDir = () => {
      if (fs.existsSync(spacesRestore.restoreDir)) {
        fs.remove(spacesRestore.restoreDir).catch((err) => {
          logger.error('failed to remove restore dir', { error: err, dir: spacesRestore.restoreDir });
        });
      }
    };

    manager.emit(BlockletEvents.restoreProgress, {
      appDid: input.appDid,
      meta: { did: input.appPid },
      status: RESTORE_PROGRESS_STATUS.installing,
    });

    try {
      await installApplicationFromBackup({
        url: `file://${spacesRestore.restoreDir}`,
        moveDir: true,
        ...merge(...params),
        manager,
        states,
        controller: input.controller,
        context: { ...context, startImmediately: true },
      });

      removeRestoreDir();
    } catch (error) {
      console.error(error);
      removeRestoreDir();
      throw error;
    }

    manager.emit(BlockletEvents.restoreProgress, {
      appDid: input.appDid,
      meta: { did: input.appPid },
      status: RESTORE_PROGRESS_STATUS.completed,
    });
  } catch (error) {
    console.error(error);

    manager.emit(BlockletEvents.restoreProgress, {
      appDid: input.appDid,
      meta: { did: input.appPid },
      status: RESTORE_PROGRESS_STATUS.error,
      message: error.message,
    });

    throw error;
  }
}

module.exports = {
  _onBackupToSpaces,
  _onRestoreFromSpaces,
};
