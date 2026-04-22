const logger = require('@abtnode/logger')('@abtnode/disk-monitor');
const { joinURL } = require('ufo');
const info = require('../util/sysinfo');
const states = require('../states');

/**
 * @param {object} teamManager
 */
const check = async (teamManager) => {
  const { disks } = await info.getSysInfo();
  const nodeInfo = await states.node.read();
  const threshold = nodeInfo.diskAlertThreshold; // Threshold for disk alerts, percentage
  for (const disk of disks) {
    const usageRatio = (disk.used / disk.total) * 100;
    if (Number.isNaN(usageRatio)) {
      continue;
    }

    const usageRatioPercent = `${usageRatio.toFixed(2)}%`;
    logger.info('check disk usage', { usage: usageRatioPercent, threshold });

    if (usageRatio < threshold) {
      continue;
    }

    const actionPath = '/analytics/runtime';
    const action = process.env.NODE_ENV === 'production' ? joinURL(nodeInfo.routing.adminPath, actionPath) : actionPath;
    // eslint-disable-next-line no-await-in-loop
    await teamManager.createNotification({
      title: 'Disk Usage Alert',
      description: `More than ${usageRatioPercent} space has been used for disk ${disk.device}, the blocklet server may not function properly.`,
      entityType: 'node',
      severity: 'warning',
      sticky: true,
      action,
    });
  }
};

const getCron = (teamManager) => ({
  name: 'monitor-disk-usage',
  time: '0 5 * * * *', // check every hour
  fn: async () => {
    await check(teamManager);
  },
  options: { runOnInit: true },
});

module.exports = { check, getCron };
