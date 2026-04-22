const fs = require('fs');
const path = require('path');
const expandTilde = require('expand-tilde');

const {
  CONFIG_FILENAME,
  CONFIG_FOLDER_NAME,
  CONFIG_FILENAME_OLD,
  CONFIG_FOLDER_NAME_OLD,
} = require('@abtnode/constant');

const _join = (prefix, file) => {
  return path.join(expandTilde(prefix), file);
};

const joinConfigDir = (dir) => _join(dir, CONFIG_FOLDER_NAME);

const joinConfigFile = (dir) => _join(dir, CONFIG_FILENAME);

const joinKFile = (dir) => _join(dir, '.sock');

const getDataDirectoryByConfigFile = (configFile) => {
  if (!configFile) {
    throw new Error('configFile can not be empty');
  }

  return path.dirname(configFile);
};

const getConfigDirFromCurrentDir = (currentDir) => {
  const configDir = _join(currentDir, CONFIG_FOLDER_NAME);
  const configDirOld = _join(currentDir, CONFIG_FOLDER_NAME_OLD);

  if (fs.existsSync(configDir)) {
    return configDir;
  }

  if (fs.existsSync(configDirOld)) {
    return configDirOld;
  }

  return '';
};

const getConfigDirFromAncestors = (currentDir) => {
  let dir = fs.statSync(currentDir).isDirectory() ? currentDir : path.dirname(currentDir);

  do {
    const configDir = getConfigDirFromCurrentDir(dir);
    if (configDir) {
      return configDir;
    }

    dir = path.dirname(dir);
  } while (path.basename(dir) !== '');

  return '';
};

const getConfigFileFromAncestors = (dir) => {
  const configDir = getConfigDirFromAncestors(dir);
  if (!configDir) {
    return '';
  }

  if (configDir.endsWith(CONFIG_FOLDER_NAME_OLD)) {
    return _join(configDir, CONFIG_FILENAME_OLD);
  }

  return _join(configDir, CONFIG_FILENAME);
};

/**
 * get base configuration data directory
 * @param {string} dir directory to check
 */
const getBaseConfigDataDirectory = (dir) => {
  if (!dir || !fs.existsSync(dir)) {
    throw new Error(`directory ${dir} does not exist`);
  }

  if (dir.includes(CONFIG_FOLDER_NAME) || dir.includes(CONFIG_FOLDER_NAME_OLD)) {
    return dir;
  }

  return '';
};

/**
 * validate the `dir` directory has valid data directory, if not, throw error
 * @param {string} dir the directory to validate
 */
const verifyDataDirectory = (dir) => {
  if (!dir) {
    throw new Error('dir should not be empty');
  }

  if (!fs.existsSync(dir)) {
    throw new Error(`directory ${dir} does not exist`);
  }

  const configFile = path.join(dir, CONFIG_FILENAME);
  const configFileOld = path.join(dir, CONFIG_FILENAME_OLD);
  if (!fs.existsSync(configFile) && !fs.existsSync(configFileOld)) {
    throw new Error(`the config file does not exist in ${dir}`);
  }
};

const getDaemonLogDir = (baseDir) => path.join(baseDir, 'logs', '_abtnode');

module.exports = {
  joinConfigDir,
  joinConfigFile,
  joinKFile,
  getBaseConfigDataDirectory,
  getConfigDirFromAncestors,
  getConfigDirFromCurrentDir,
  getConfigFileFromAncestors,
  getDaemonLogDir,
  getDataDirectoryByConfigFile,
  verifyDataDirectory,
};
