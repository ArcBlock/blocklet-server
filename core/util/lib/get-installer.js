const fs = require('fs-extra');
const path = require('path');
const shell = require('shelljs');

const BINARY_NAME = process.env.ABT_NODE_BINARY_NAME;

const getInstaller = (binaryName) => {
  // eslint-disable-next-line no-param-reassign
  binaryName = binaryName || BINARY_NAME;

  const { stdout: pnpmPath } = shell.which('pnpm') || {};
  if (pnpmPath) {
    const { stdout: expectedDir } = shell.exec('pnpm bin -g', { silent: true });
    const { stdout: binPath } = shell.which(binaryName);
    if (expectedDir && binPath && expectedDir.trim() === path.dirname(binPath)) {
      return 'pnpm';
    }
  }

  const { stdout: yarnPath } = shell.which('yarn') || {};
  if (yarnPath) {
    const { stdout: binaryDir } = shell.exec(`yarn global bin ${binaryName}`, { silent: true });
    const binaryPath = path.join(binaryDir, binaryName);
    if (fs.existsSync(binaryPath)) {
      return 'yarn';
    }
  }

  return 'npm';
};

const getInstallCommands = ({ packageName = '@blocklet/cli', version = 'latest', params = '' }) => {
  return {
    pnpm: `pnpm add -g ${packageName}@${version} ${params}`,
    npm: `npm install -g ${packageName}@${version} ${params}`,
    yarn: `yarn global add ${packageName}@${version} ${params}`,
  };
};

module.exports = { getInstaller, getInstallCommands };
