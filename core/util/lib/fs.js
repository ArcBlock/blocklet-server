const fs = require('fs');
const path = require('path');

const canReadAndWriteDir = (dir) => {
  const root = '/';

  // walk up to the nearest ancestor directory that exists and has read/write permission; if none found, return false
  const tmpArray = dir.split(path.sep).filter(Boolean);
  do {
    const tmpDir = path.join(root, tmpArray.join(path.sep));
    if (fs.existsSync(tmpDir)) {
      try {
        fs.accessSync(tmpDir, fs.constants.R_OK | fs.constants.W_OK); // eslint-disable-line no-bitwise
        return true;
      } catch (error) {
        return false;
      }
    }

    tmpArray.pop();
  } while (tmpArray.length > 0);

  return false;
};

const isEmptyDir = (dir) => fs.statSync(dir).isDirectory() && fs.readdirSync(dir).length === 0;

module.exports = {
  canReadAndWriteDir,
  isEmptyDir,
};
