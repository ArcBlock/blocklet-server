const debounce = require('lodash/debounce');
const logger = require('@abtnode/logger')('@abtnode/core:event:auto-backup-handler');
const { BACKUPS } = require('@abtnode/constant');
const { getBackupJobId } = require('../util/spaces');
const { SpacesBackup } = require('../blocklet/storage/backup/spaces');

/**
 * @description
 * @param {string} _eventName
 * @param {import('@blocklet/server-js').BlockletState & {context: {}} } payload
 * @param {import('../blocklet/manager/disk')} blockletManager
 */
async function autoBackupHandler(_eventName, payload, blockletManager) {
  const { did } = payload.meta;
  const autoBackup = await blockletManager.getAutoBackup({ did });

  if (autoBackup.enabled && payload.context) {
    const jobId = getBackupJobId(did);
    const { job, willRunAt } = (await blockletManager.backupQueue.get(jobId, { full: true })) ?? {};

    // 任务正在运行或者将要在 3s 内运行，或者任务可能已过期，都是表示任务可用
    const waitBackupDone = (job && willRunAt - Date.now() <= 3_000) || SpacesBackup.isRunning(did);

    if (waitBackupDone) {
      logger.warn(`This app(${did})'s manual or auto backup is already running, skip auto backup`, {
        job,
        willRunAt,
        now: Date.now(),
        isRunning: SpacesBackup.isRunning(did),
      });
      await blockletManager.backupQueue.restoreCancelled(jobId);
      return;
    }

    await blockletManager.backupQueue.delete(jobId);
    blockletManager.backupQueue.push(
      {
        entity: 'blocklet',
        action: 'backupToSpaces',
        did,
        context: payload.context,
        backupState: {
          strategy: BACKUPS.STRATEGY.AUTO,
        },
      },
      jobId
    );
  }
}

const debouncedFuncs = {};
/**
 * @description
 * @param {string} id
 * @param {Function} fn
 * @return {Function}
 */
function autoBackupHandlerFactory(id, fn) {
  if (!debouncedFuncs[id]) {
    // 自动备份立即执行的间隔时间暂定为 1 min
    debouncedFuncs[id] = debounce(fn, 1000 * 60);
  }
  return debouncedFuncs[id];
}

module.exports = {
  autoBackupHandler,
  autoBackupHandlerFactory,
};
