const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { ensureBun, getBunCacheDir } = require('./ensure-bun');
const { dockerInstallDependencies, saveLastInstallOs, isSameOs } = require('./docker/docker-install-dependenices');

function isDependencyInstalled(appDir, dependency) {
  return fs.existsSync(path.resolve(appDir, 'node_modules', dependency));
}

async function installExternalDependencies({ appDir, forceInstall = false, nodeInfo = {} } = {}) {
  if (!appDir) {
    throw new Error('appDir is required');
  }
  if (!fs.existsSync(appDir)) {
    throw new Error(`not a correct appDir directory: ${appDir}`);
  }

  const isUseDocker = nodeInfo.isDockerInstalled && nodeInfo.enableDocker;

  // 读取 BLOCKLET_APP_DIR 的 package.json
  const packageJsonPath = path.resolve(appDir, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return;
  }

  const packageJson = fs.readJsonSync(packageJsonPath);

  const { blockletExternalDependencies: externals = [] } = packageJson;
  if (!Array.isArray(externals) || !externals.length) {
    return;
  }

  if (!(await isSameOs(appDir, isUseDocker))) {
    await fs.remove(path.join(appDir, 'node_modules'));
  }

  const isNeedInstall = forceInstall || externals.some((dependency) => !isDependencyInstalled(appDir, dependency));
  if (!isNeedInstall) {
    return;
  }

  const bunPath = await ensureBun();
  const bunCacheDir = await getBunCacheDir();

  if (isUseDocker) {
    await dockerInstallDependencies({
      // 用 appDir 后两个路径作为 docker name
      name: appDir.split(path.sep).slice(-2).join(path.sep),
      installDir: appDir,
    });
  } else {
    await new Promise((resolve, reject) => {
      const child = spawn(bunPath, ['install'], {
        cwd: appDir,
        stdio: 'inherit',
        shell: true,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          BUN_INSTALL_CACHE_DIR: bunCacheDir,
        },
      });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`exit code ${code}`));
        } else {
          resolve();
        }
      });

      child.on('error', (err) => {
        reject(err);
      });
    });
  }

  await saveLastInstallOs(appDir, isUseDocker);
}

module.exports = { installExternalDependencies };
