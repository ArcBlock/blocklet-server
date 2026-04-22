const os = require('os');
const locateNpmGlobalByBinary = require('./locate-npm-global-by-binary');
const { canReadAndWriteDir } = require('./fs');

module.exports = (cmdName, packageName) => {
  const installDir = locateNpmGlobalByBinary(cmdName, packageName);
  if (!installDir) {
    throw new Error(`${packageName} is not installed as a global package`);
  }

  if (canReadAndWriteDir(installDir)) {
    return true;
  }

  throw new Error(`${packageName} can not be updated by ${os.userInfo().username}`);
};
