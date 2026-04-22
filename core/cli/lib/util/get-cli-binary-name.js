const path = require('path');

const getCLIBinaryName = () => {
  const [, binaryPath] = process.argv;
  return path.basename(binaryPath, path.extname(binaryPath));
};

module.exports = getCLIBinaryName;
