const path = require('path');
const pm2 = require('@abtnode/util/lib/pm2/async-pm2');

const { PROCESS_NAME_DAEMON } = require('@abtnode/constant');

const getPm2ProcessInfo = (name) =>
  new Promise((resolve, reject) => {
    pm2.describe(name, (err, [info]) => {
      if (err) {
        return reject(err);
      }

      return resolve(info);
    });
  });

const isRunning = async (name) => {
  const info = await getPm2ProcessInfo(name);
  return !!info;
};

const checkRunning = async () => {
  const isDaemonRunning = await isRunning(PROCESS_NAME_DAEMON);
  return isDaemonRunning === true;
};

const getRunningConfigFile = async () => {
  if (!(await isRunning(PROCESS_NAME_DAEMON))) {
    return '';
  }

  const instanceInfo = await getPm2ProcessInfo(PROCESS_NAME_DAEMON);
  const { ABT_NODE_CONFIG_FILE: runningInstanceConfigFile = '' } = instanceInfo.pm2_env.env;

  return runningInstanceConfigFile;
};

const getRunningConfigDataDir = async () => {
  const configFile = await getRunningConfigFile();
  if (configFile) {
    return path.dirname(configFile);
  }

  return '';
};

module.exports = { checkRunning, getPm2ProcessInfo, getRunningConfigFile, getRunningConfigDataDir };
