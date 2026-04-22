const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

module.exports = (binaryName, packageName) => {
  if (!binaryName) {
    throw new Error('binaryName is required');
  }

  let result = shell.which(binaryName);
  if (!result || !result.stdout) {
    return '';
  }

  const binPath = result.stdout.trim();

  // Check if the package is installed via pnpm: only if we have packageName set
  let binDir = path.dirname(fs.realpathSync(binPath));
  if (packageName) {
    const { stdout: pnpmPath } = shell.which('pnpm') || {};
    if (pnpmPath) {
      result = shell.exec('pnpm bin -g', { silent: true });
      const pnpmBinDir = result.stdout.trim();
      if (binDir === pnpmBinDir) {
        result = shell.exec(`pnpm root -g ${packageName}`, { silent: true });
        return path.join(result.stdout.trim(), packageName);
      }
    }
  }

  while (binDir && binDir !== path.sep && path.basename(binDir) !== 'node_modules') {
    const packageJsonPath = path.join(binDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      return binDir;
    }

    binDir = path.dirname(binDir);
  }

  return '';
};
