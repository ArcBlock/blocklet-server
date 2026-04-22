/* eslint-disable no-await-in-loop */

const path = require('path');
const { spawn } = require('child_process');
const fsp = require('fs/promises');
const os = require('os');
const logger = require('@abtnode/logger')('@abtnode/core:util:ensure-bun');
const shelljs = require('shelljs');
const semver = require('semver');

const IS_WINDOWS = process.platform === 'win32';
const BUN_VERSION = IS_WINDOWS ? '1.2.4' : '1.2.18';

const getRootDir = () => {
  if (process.env.ABT_NODE_DATA_DIR) {
    return process.env.ABT_NODE_DATA_DIR;
  }
  const homeDir = os.homedir();
  if (homeDir) {
    return path.join(homeDir, '.blocklet-bun');
  }
  return path.join(os.tmpdir(), '.blocklet-bun');
};

async function _ensureBun() {
  const bunDir = path.join(getRootDir(), 'core', 'bun-install');
  await fsp.mkdir(bunDir, { recursive: true }).catch(() => {});
  const installDir = path.join(bunDir, BUN_VERSION);
  const binDir = path.join(installDir, 'bin');
  const bunExec = path.join(binDir, IS_WINDOWS ? 'bun.exe' : 'bun');

  const ignoreWhichBun = process.env.ABT_NODE_IGNORE_WHICH_BUN === 'true';

  if (!ignoreWhichBun) {
    const whichBun = shelljs.which('bun');
    // 如果有 bun 且版本大于等于 BUN_VERSION, 则直接使用现有的 bun
    if (whichBun) {
      // 检查 bun 版本
      const bunVersion = shelljs.exec(`${whichBun} --version`, { silent: true }).stdout.trim();
      // 判断 bun 版本是否大于等于 BUN_VERSION, 应该用版本对比库
      if (semver.gte(bunVersion, BUN_VERSION)) {
        return whichBun.toString();
      }
    }
  }

  // If already installed, return immediately
  try {
    await fsp.access(bunExec);
    return bunExec;
  } catch (_) {
    //
  }

  logger.info(`Bun not found; installing to: ${installDir}`);
  await fsp.mkdir(installDir, { recursive: true });

  // Run official Bun installer script
  await new Promise((resolve, reject) => {
    const cmd = IS_WINDOWS
      ? ['-c', 'powershell -c "irm bun.sh/install.ps1 | iex"']
      : ['-c', 'curl -fsSL https://bun.sh/install | bash'];
    const installer = spawn('bash', cmd, {
      env: { ...process.env, BUN_INSTALL: installDir, BUN_VERSION, SHELL: '/dev/null', HOME: installDir },
      stdio: 'inherit',
    });
    installer.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`Installer exited with code ${code}`))));
    installer.on('error', reject);
  });

  return bunExec;
}

let bunPathPromise = null;

// eslint-disable-next-line require-await
const ensureBun = async () => {
  if (bunPathPromise) {
    return bunPathPromise;
  }
  bunPathPromise = (async () => {
    const maxAttempts = 5;
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const bunExecPath = await _ensureBun();
        // Verify executable exists
        await fsp.access(bunExecPath);
        logger.info(`Bun installation succeeded: ${bunExecPath}`);
        return bunExecPath;
      } catch (err) {
        lastError = err;
        logger.error(`Installation attempt ${attempt} failed: ${err.message}`);
        if (attempt < maxAttempts) {
          logger.info(`Retrying installation (${attempt + 1}/${maxAttempts})...`);
        }
      }
    }
    throw new Error(`All ${maxAttempts} installation attempts failed: ${lastError.message}`);
  })();
  return bunPathPromise;
};

const bunOptions = {
  baseDockerOs: 'Linux',
};

const getBunCacheDir = async (isDocker = false) => {
  const bunDir = getRootDir();
  let cacheDir = isDocker ? 'bun-cache-docker' : 'bun-cache';
  if (os.type() === bunOptions.baseDockerOs) {
    cacheDir = 'bun-cache';
  }
  const bunCacheDir = path.join(bunDir, 'tmp', cacheDir);
  await fsp.mkdir(bunCacheDir, { recursive: true }).catch(() => {});
  return bunCacheDir;
};

module.exports = { ensureBun, getBunCacheDir, BUN_VERSION, bunOptions };
