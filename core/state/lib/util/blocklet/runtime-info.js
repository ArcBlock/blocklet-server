/**
 * Runtime Information Module
 *
 * Functions for getting blocklet runtime and disk information
 * Extracted from blocklet.js for better modularity
 */

const logger = require('@abtnode/logger')('@abtnode/core:util:blocklet:runtime-info');
const getFolderSize = require('@abtnode/util/lib/get-folder-size');
const { getDisplayName } = require('@blocklet/meta/lib/util');

const { getProcessInfo } = require('./process-manager');
const getDockerRuntimeInfo = require('../docker/get-docker-runtime-info');

/**
 * Cache for disk info tasks to avoid duplicate calculations
 */
const _diskInfoTasks = {};

/**
 * Internal function to get disk info for a blocklet
 * @param {object} blocklet - Blocklet object with env
 * @returns {Promise<{ app: number, cache: number, log: number, data: number }>}
 */
const _getDiskInfo = async (blocklet) => {
  try {
    const { env } = blocklet;
    const [app, cache, log, data] = await Promise.all([
      getFolderSize(env.appDir),
      getFolderSize(env.cacheDir),
      getFolderSize(env.logsDir),
      getFolderSize(env.dataDir),
    ]);
    return { app, cache, log, data };
  } catch (error) {
    logger.error('Get disk info failed', { name: getDisplayName(blocklet), error });
    return { app: 0, cache: 0, log: 0, data: 0 };
  }
};

/**
 * Get disk info for a blocklet with caching
 * @param {object} blocklet - Blocklet object
 * @param {object} options - Options
 * @param {boolean} options.useFakeDiskInfo - Return zeros instead of actual values
 * @returns {Promise<{ app: number, cache: number, log: number, data: number }>}
 */
const getDiskInfo = (blocklet, { useFakeDiskInfo } = {}) => {
  if (useFakeDiskInfo) {
    return { app: 0, cache: 0, log: 0, data: 0 };
  }

  const { appDid } = blocklet;

  // Cache disk info results for 5 minutes
  _diskInfoTasks[appDid] ??= _getDiskInfo(blocklet).finally(() => {
    setTimeout(
      () => {
        delete _diskInfoTasks[appDid];
      },
      5 * 60 * 1000
    );
  });

  return new Promise((resolve) => {
    _diskInfoTasks[appDid].then(resolve).catch(() => {
      resolve({ app: 0, cache: 0, log: 0, data: 0 });
    });
  });
};

/**
 * Get runtime info for a process
 * @param {string} processId - PM2 process ID
 * @returns {Promise<object>} Runtime info including pid, uptime, memory, cpu, status, port
 */
const getRuntimeInfo = async (processId) => {
  const proc = await getProcessInfo(processId);
  const dockerName = proc.pm2_env?.env?.dockerName;
  if (dockerName) {
    const dockerInfo = await getDockerRuntimeInfo(dockerName);
    return {
      ...dockerInfo,
      pid: proc.pid,
      uptime: proc.pm2_env ? Date.now() - Number(proc.pm2_env.pm_uptime) : 0,
      port: proc.pm2_env ? proc.pm2_env.BLOCKLET_PORT : null,
      status: proc.pm2_env ? proc.pm2_env.status : null,
      runningDocker: !!dockerName,
    };
  }
  return {
    pid: proc.pid,
    uptime: proc.pm2_env ? Date.now() - Number(proc.pm2_env.pm_uptime) : 0,
    memoryUsage: proc.monit.memory,
    cpuUsage: proc.monit.cpu,
    status: proc.pm2_env ? proc.pm2_env.status : null,
    port: proc.pm2_env ? proc.pm2_env.BLOCKLET_PORT : null,
    runningDocker: false,
  };
};

module.exports = {
  getDiskInfo,
  getRuntimeInfo,
};
