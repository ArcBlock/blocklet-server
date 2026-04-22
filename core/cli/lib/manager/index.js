const processManager = require('./process');
const configManager = require('./config');
const deployManager = require('./deploy');

const getConfigFile = async (configPathArg = process.cwd()) => {
  const runningConfigFile = await processManager.getRunningConfigFile();
  if (runningConfigFile) {
    return runningConfigFile;
  }

  return configManager.getConfigFileFromAncestors(configPathArg);
};

const getConfigDir = async (configPathArg = process.cwd()) => {
  const runningConfigDir = await processManager.getRunningConfigDataDir();
  if (runningConfigDir) {
    return runningConfigDir;
  }

  return configManager.getConfigDirFromAncestors(configPathArg);
};

module.exports = { ...processManager, ...configManager, deployManager, getConfigFile, getConfigDir };
