const fs = require('fs-extra');
const path = require('path');
const semver = require('semver');

const repoPrefixes = [
  'http:',
  'https:',
  'github:',
  'git+',
  'file:',
  'ssh:',
  'git@',
  'bitbucket:',
  'gitlab:',
  'hg+',
  'svn+',
  'bzr+',
];

function isValidVersion(version) {
  return semver.validRange(version) !== null;
}

// eslint-disable-next-line consistent-return
function parseExternalDependencies({
  externals = [],
  distDir,
  externalManager = 'bun',
  persist = true,
  dependenciesDepth = 9,
}) {
  if (typeof dependenciesDepth === 'string') {
    // eslint-disable-next-line no-param-reassign
    dependenciesDepth = Number(dependenciesDepth);
  }
  if (['npm', 'pnpm', 'yarn', 'bun'].includes(externalManager) === false) {
    throw new Error(`Unsupported external manager: ${externalManager}`);
  }

  if (externals.length === 0) {
    return { dependencies: {}, externalManager, blockletExternalDependencies: [] };
  }

  const packageJsonPath = 'package.json';
  if (fs.existsSync(packageJsonPath) === false) {
    return { dependencies: {}, externalManager, blockletExternalDependencies: [] };
  }

  const dependencies = {};

  const manifest = fs.readJSONSync(packageJsonPath);
  if (externals.find((x) => x === '*')) {
    const dependenciesKeys = Object.keys(manifest.dependencies);
    return {
      dependencies: manifest.dependencies,
      externalManager,
      blockletExternalDependencies: dependenciesKeys,
      trustedDependencies: dependenciesKeys,
    };
  }

  externals.forEach((external) => {
    const version =
      manifest.dependencies?.[external] ||
      manifest.devDependencies?.[external] ||
      manifest.peerDependencies?.[external] ||
      manifest.optionalDependencies?.[external];
    if ((version && repoPrefixes.some((prefix) => version.startsWith(prefix))) || isValidVersion(version)) {
      dependencies[external] = version;
      return;
    }
    for (let i = 0; i < dependenciesDepth; i++) {
      const upDir = Array(i).fill('..');
      const tmp = path.resolve(...upDir, 'node_modules', external, 'package.json');
      if (fs.existsSync(tmp)) {
        const packageJson = fs.readJSONSync(tmp);
        if (packageJson.version) {
          dependencies[external] = packageJson.version;
        }

        break;
      }
    }
  });

  if (Object.keys(dependencies).length === 0) {
    return { dependencies: {}, externalManager, blockletExternalDependencies: [] };
  }

  const dependenciesKeys = Object.keys(dependencies);
  if (persist === false) {
    return {
      dependencies,
      externalManager,
      blockletExternalDependencies: dependenciesKeys,
      trustedDependencies: dependenciesKeys,
    };
  }

  let packageJson = {};
  if (fs.existsSync(packageJsonPath)) {
    packageJson = fs.readJSONSync(packageJsonPath);
    delete packageJson.devDependencies;
    delete packageJson.peerDependencies;
    delete packageJson.optionalDependencies;
    delete packageJson.bundledDependencies;
    delete packageJson.scripts;
  }

  fs.writeFileSync(
    path.resolve(distDir, 'package.json'),
    JSON.stringify(
      {
        ...packageJson,
        dependencies,
        externalManager,
        blockletExternalDependencies: dependenciesKeys,
        trustedDependencies: dependenciesKeys,
      },
      null,
      2
    )
  );
}

module.exports = {
  parseExternalDependencies,
};
