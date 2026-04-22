const path = require('path');
const defaultFindUp = require('find-up');

const detectWorkspace = (cwd, findUp = defaultFindUp) => {
  const bunLockPath = findUp.sync('bun.lock', { cwd });
  if (bunLockPath) {
    return { type: 'bun', dir: path.dirname(bunLockPath) };
  }

  const yarnLockPath = findUp.sync('yarn.lock', { cwd });
  if (yarnLockPath) {
    return { type: 'yarn', dir: path.dirname(yarnLockPath) };
  }

  const pnpmLockPath = findUp.sync('pnpm-workspace.yaml', { cwd });
  if (pnpmLockPath) {
    return { type: 'pnpm', dir: path.dirname(pnpmLockPath) };
  }

  const rushJsonPath = findUp.sync('rush.json', { cwd });
  if (rushJsonPath) {
    return { type: 'rush', dir: path.dirname(rushJsonPath) };
  }

  const lernaJsonPath = findUp.sync('lerna.json', { cwd });
  if (lernaJsonPath) {
    return { type: 'lerna', dir: path.dirname(lernaJsonPath) };
  }

  const npmLockPath = findUp.sync('package-lock.json', { cwd });
  if (npmLockPath) {
    return { type: 'npm', dir: path.dirname(npmLockPath) };
  }

  return null;
};

module.exports = detectWorkspace;
