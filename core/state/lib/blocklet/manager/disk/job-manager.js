/* eslint-disable no-await-in-loop */
const fs = require('fs-extra');
const path = require('path');
const merge = require('lodash/merge');
const logger = require('@abtnode/logger')('@abtnode/core:blocklet:manager:job');
const sleep = require('@abtnode/util/lib/sleep');
const { isInServerlessMode } = require('@abtnode/util/lib/serverless');
const { BACKUPS, MONITOR_RECORD_INTERVAL_SEC } = require('@abtnode/constant');
const { BlockletStatus, BLOCKLET_CONTROLLER_STATUS, SUSPENDED_REASON } = require('@blocklet/constant');

const formatContext = require('@abtnode/util/lib/format-context');
const states = require('../../../states');
const launcher = require('../../../util/launcher');
const checkDockerRunHistory = require('../../../util/docker/check-docker-run-history');
const { dockerExecChown } = require('../../../util/docker/docker-exec-chown');
const { SpacesBackup } = require('../../storage/backup/spaces');
const { DiskBackup } = require('../../storage/backup/disk');
const { DiskRestore } = require('../../storage/restore/disk');
const { getBackupJobId } = require('../../../util/spaces');
const { installApplicationFromBackup } = require('../helper/install-application-from-backup');
const { refresh: refreshAccessibleExternalNodeIp } = require('../../../util/get-accessible-external-node-ip');
const { isRuntimeMonitorDisabled } = require('../../../monitor/blocklet-runtime-monitor');

/**
 * Backup blocklet to spaces
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function _backupToSpaces(manager, { blocklet, context }) {
  try {
    const { did } = blocklet.meta;
    const jobId = getBackupJobId(did);
    const { job, willRunAt } = (await manager.backupQueue.get(jobId, { full: true })) ?? {};

    // 任务正在运行或者将要在 1s 内运行，或者任务可能已过期，都是表示任务可用
    const waitBackupDone = (job && willRunAt - Date.now() <= 1_000) || SpacesBackup.isRunning(did);

    if (waitBackupDone) {
      logger.warn(`This app(${did})'s manual or auto backup is already running, skip manual backup`, {
        job,
        willRunAt,
        now: Date.now(),
        isRunning: SpacesBackup.isRunning(did),
      });
      await manager.backupQueue.restoreCancelled(jobId);
    } else {
      await manager.backupQueue.delete(jobId);
      manager.backupQueue.push(
        {
          entity: 'blocklet',
          action: 'backupToSpaces',
          did,
          context,
          backupState: {
            strategy: BACKUPS.STRATEGY.MANUAL,
          },
        },
        jobId
      );
    }

    return blocklet;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

/**
 * Backup blocklet to disk
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @returns {Promise<Object>}
 */
async function _backupToDisk(manager, { blocklet }) {
  const { appDid } = blocklet;
  const nodeInfo = await states.node.read();
  if (checkDockerRunHistory(nodeInfo)) {
    await dockerExecChown({
      name: `${appDid}-backup-to-disk`,
      dirs: [path.join(process.env.ABT_NODE_DATA_DIR, 'data', appDid)],
    });
  }
  const diskBackup = new DiskBackup({ appDid, event: manager });
  await diskBackup.backup();

  return blocklet;
}

/**
 * Restore blocklet from spaces
 * @param {Object} manager - BlockletManager instance
 * @param {Object} input
 * @param {Object} context
 * @returns {Promise<void>}
 */
async function _restoreFromSpaces(manager, input, context) {
  if (input.delay) {
    await sleep(input.delay);
  }

  const appPid = input.appDid;

  manager.restoreQueue.push(
    {
      entity: 'blocklet',
      action: 'restoreFromSpaces',
      id: appPid,
      input,
      context,
    },
    appPid
  );
}

/**
 * Restore blocklet from disk
 * @param {Object} manager - BlockletManager instance
 * @param {Object} input
 * @param {Object} context
 * @returns {Promise<void>}
 */
async function _restoreFromDisk(manager, input, context) {
  if (input.delay) {
    await sleep(input.delay);
  }

  const diskRestore = new DiskRestore({ ...input, event: manager });
  const params = await diskRestore.restore();

  const removeRestoreDir = () => {
    if (fs.existsSync(diskRestore.restoreDir)) {
      fs.remove(diskRestore.restoreDir).catch((err) => {
        logger.error('failed to remove restore dir', { error: err, dir: diskRestore.restoreDir });
      });
    }
  };

  try {
    await installApplicationFromBackup({
      url: `file://${diskRestore.restoreDir}`,
      ...merge(...params),
      manager,
      states,
      move: true,
      sync: false, // use queue to download and install application
      context,
    });
    removeRestoreDir();
  } catch (error) {
    removeRestoreDir();
    throw error;
  }
}

/**
 * Check renewed blocklet
 * @param {Object} manager - BlockletManager instance
 * @returns {Promise<void>}
 */
async function checkRenewedBlocklet(manager) {
  try {
    logger.info('start check renewed blocklet');

    // 只检查因为过期而被 suspended 的 blocklet
    const blockletExtras = await states.blockletExtras.find(
      {
        'controller.status.value': BLOCKLET_CONTROLLER_STATUS.suspended,
        'controller.status.reason': SUSPENDED_REASON.expired,
      },
      { did: 1, meta: 1, controller: 1 }
    );

    for (const data of blockletExtras) {
      const blocklet = await states.blocklet.getBlocklet(data.did);
      if (!blocklet) {
        logger.error('blocklet not found', { did: data.did });
        // eslint-disable-next-line no-continue
        continue;
      }

      const isExpired = await launcher.isBlockletExpired(data.did, data.controller);

      if (isExpired === false) {
        logger.info('blocklet is renewed', { did: data.did });
        await states.blockletExtras.updateByDid(data.did, {
          ...data.controller,
          status: { value: BLOCKLET_CONTROLLER_STATUS.normal, reason: '' },
        });

        logger.info('start to start blocklet', { did: data.did });

        if (![BlockletStatus.starting, BlockletStatus.running].includes(blocklet.status)) {
          await manager.start({ did: data.did });
          logger.info('start blocklet success', { did: data.did });
        }
      }
    }
  } catch (error) {
    logger.error('start check renewed blocklet failed', { error });
  }
}

/**
 * Clean expired blocklets that exceed redemption period
 * @param {Object} manager - BlockletManager instance
 * @returns {Promise<void>}
 */
async function cleanExpiredBlocklets(manager) {
  try {
    logger.info('start checking exceeding the redemption period blocklet');
    const blockletExtras = await states.blockletExtras.find(
      {
        'controller.status.value': BLOCKLET_CONTROLLER_STATUS.suspended,
      },
      { did: 1, meta: 1, controller: 1 }
    );

    if (blockletExtras.length === 0) {
      logger.info('no exceeding the redemption blocklet need to be cleaned');
      return;
    }

    logger.info('exceeding the redemption blocklet count', { count: blockletExtras.length });

    for (const data of blockletExtras) {
      try {
        const { did } = data;
        const { launcherSession } = await launcher.getLauncherSession({
          launcherUrl: data.controller.launcherUrl,
          launcherSessionId: data.controller.launcherSessionId,
        });

        const isTerminated = launcher.isLaunchSessionTerminated(launcherSession);

        if (!isTerminated) {
          logger.info('skip cleaning the non-terminated blocklet', {
            blockletDid: did,
            controller: data.controller,
            launcherSession,
          });
          continue;
        }

        if (!launcherSession.terminatedAt) {
          logger.error('the blocklet launch session does not have terminatedAt, skip', {
            blockletDid: did,
            controller: data.controller,
            launcherSession,
          });
          continue;
        }

        // 订阅终止后需要再保留一段时间数据
        if (!launcher.isDataRetentionExceeded(launcherSession)) {
          logger.info('skip cleaning the non-exceed redemption blocklet', {
            blockletDid: did,
            controller: data.controller,
            launcherSession,
          });
          continue;
        }

        logger.info('the blocklet already exceed redemption and will be deleted', {
          blockletDid: did,
          nftId: data.controller.nftId,
        });

        await manager.delete({ did, keepData: false, keepConfigs: false, keepLogsDir: false });
        logger.info('the exceed redemption blocklet already deleted', {
          blockletDid: did,
          nftId: data.controller.nftId,
        });

        // 删除 blocklet 后会 reload nginx, 所以这里每次删除一个
        if (process.env.NODE_ENV !== 'test') {
          await sleep(10 * 1000);
        }
      } catch (error) {
        logger.error('delete exceed redemption blocklet failed', {
          blockletDid: data.did,
          nftId: data.controller?.nftId,
          error,
        });
      }
    }

    logger.info('check exceeding the redemption period blocklet end');
  } catch (error) {
    logger.error('checking exceeding the redemption period blocklet failed', { error });
  }
}

/**
 * Get cron jobs
 * @param {Object} manager - BlockletManager instance
 * @returns {Promise<Array>}
 */
async function getCrons(manager) {
  const info = await states.node.read();

  const crons = [
    {
      name: 'sync-blocklet-list',
      time: '*/60 * * * * *', // 60s
      fn: manager.refreshListCache.bind(manager),
    },
    {
      // 刷新 nodeIp 的定时任务
      name: 'refresh-accessible-ip',
      time: '0 */10 * * * *', // 10min
      options: { runOnInit: true, runInService: true },
      fn: async () => {
        const nodeInfo = await states.node.read();
        refreshAccessibleExternalNodeIp(nodeInfo);
      },
    },
    {
      name: 'update-blocklet-certificate',
      time: '*/10 * * * *',
      options: { runOnInit: false },
      fn: () => {
        const fn = manager.updateAllBlockletCertificate.bind(manager);
        fn();
      },
    },
  ];

  if (!isRuntimeMonitorDisabled()) {
    crons.push({
      name: 'record-blocklet-runtime-history',
      time: `*/${MONITOR_RECORD_INTERVAL_SEC} * * * * *`, // 10s
      fn: () => manager.runtimeMonitor.monitAll(),
    });
  }

  if (isInServerlessMode(info)) {
    const serverlessJobs = [
      {
        name: 'check-renewed-blocklet',
        time: '0 */10 * * * *', // 10min
        options: { runOnInit: false },
        fn: () => manager.checkRenewedBlocklet(),
      },
      {
        name: 'stop-expired-external-blocklet',
        time: '0 */10 * * * *', // 每10分钟
        options: { runOnInit: false },
        fn: () => manager.stopExpiredBlocklets(),
      },
      {
        name: 'clean-expired-blocklet-data',
        time: '0 10 * * * *', // 每小时
        options: { runOnInit: false },
        fn: () => manager.cleanExpiredBlocklets(),
      },
      {
        name: 'send-serverless-heartbeat',
        time: process.env.ABT_NODE_SERVERLESS_HEARTBEAT_INTERVAL || '*/5 * * * *', // default every 5 minutes
        options: { runOnInit: true },
        fn: () => launcher.sendServerlessHeartbeat(),
      },
    ];

    logger.info('enable serverless jobs', serverlessJobs.map((x) => x.name).join(','));

    crons.push(...serverlessJobs);
  }

  return crons;
}

/**
 * Ensure jobs
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @returns {Promise<void>}
 */
async function ensureJobs(manager, { queue, getJobId, find, entity, action, interval, restoreCancelled }) {
  const blocklets = await states.blockletExtras.find(find);

  const info = await states.node.read();

  await Promise.all(
    blocklets.map(async (x) => {
      const { did } = x;
      const jobId = getJobId(did);
      const job = await queue.get(jobId);
      if (restoreCancelled) {
        queue.restoreCancelled(jobId);
      }

      if (job) {
        return;
      }

      queue.push(
        {
          entity,
          action,
          did,
          context: formatContext({
            user: { did: info.did },
          }),
        },
        jobId,
        true,
        interval
      );
    })
  );
}

/**
 * Handle job
 * @param {Object} manager - BlockletManager instance
 * @param {Object} job - Job data
 * @returns {Promise<void>}
 */
async function onJob(manager, job) {
  if (job.entity === 'blocklet') {
    if (job.action === 'download') {
      await manager._downloadAndInstall(job);
    }
    if (job.action === 'restart') {
      await manager._onRestart(job);
    }

    if (job.action === 'check_if_started') {
      await manager._onCheckIfStarted(job);
    }

    if (job.action === 'backupToSpaces') {
      await manager._onBackupToSpaces(job);
    }

    if (job.action === 'restoreFromSpaces') {
      await manager._onRestoreFromSpaces(job);
    }

    if (job.action === 'autoCheckUpdate') {
      await manager._onCheckForComponentUpdate(job);
    }

    if (job.action === 'reportComponentUsage') {
      await manager._reportComponentUsage(job);
    }

    if (job.action === 'resend_notification') {
      await manager._onResendNotification(job);
    }
  }
}

module.exports = {
  _backupToSpaces,
  _backupToDisk,
  _restoreFromSpaces,
  _restoreFromDisk,
  checkRenewedBlocklet,
  cleanExpiredBlocklets,
  getCrons,
  ensureJobs,
  onJob,
};
