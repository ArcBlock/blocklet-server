const path = require('path');
const fs = require('fs/promises');
const os = require('os');
const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');
const promiseSpawn = require('@abtnode/util/lib/promise-spawn');
const logger = require('@abtnode/logger')('@abtnode/docker-exec-chown');
const parseDockerName = require('./parse-docker-name');
const { checkDockerHasImage } = require('./check-docker-has-image');
const { createDockerImage } = require('./create-docker-image');
const debianDockerfile = require('./debian-dockerfile');
const { getBunCacheDir } = require('../ensure-bun');

const lockFile = new DBCache(() => ({
  prefix: 'docker-exec-chown-locks',
  ttl: 1000 * 60 * 2,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

const LAST_INSTALL_NODE_MODULES_OS = 'node_modules_os_lock';

const saveLastInstallOs = async (installDir, isDocker = false) => {
  const lastInstallOsLockPath = path.join(installDir, LAST_INSTALL_NODE_MODULES_OS);
  await fs.writeFile(lastInstallOsLockPath, isDocker ? 'Linux' : os.type());
};

const loadLastInstallOs = async (installDir) => {
  const lastInstallOsLockPath = path.join(installDir, LAST_INSTALL_NODE_MODULES_OS);
  try {
    await fs.access(lastInstallOsLockPath);
    const lastInstallOs = await fs.readFile(lastInstallOsLockPath, 'utf-8');
    return lastInstallOs.trim();
  } catch (_) {
    return '';
  }
};

const isSameOs = async (installDir, isDocker = false) => {
  const lastInstallOs = await loadLastInstallOs(installDir);
  if (!lastInstallOs) {
    return false;
  }
  return lastInstallOs === (isDocker ? 'Linux' : os.type());
};

async function dockerInstallDependencies({ name, installDir }) {
  const { image, baseDir } = debianDockerfile;

  if (!(await checkDockerHasImage(image))) {
    await createDockerImage({
      appDir: path.join(process.env.ABT_NODE_DATA_DIR, 'tmp', 'docker'),
      dataDir: path.join(process.env.ABT_NODE_DATA_DIR, 'tmp', 'docker'),
      meta: {},
      ports: [],
      env: {},
      doChown: false,
    });
  }

  const bunCacheDir = await getBunCacheDir(true);

  const needChangeDir = [
    { source: installDir, target: `${baseDir}/blocklet` },
    { source: bunCacheDir, target: `${baseDir}/bun-cache` },
  ];

  const volumes = needChangeDir.map((dir) => `-v ${dir.source}:${dir.target}:rw`).join(' ');

  const realName = parseDockerName(name, 'docker-install-dependencies');
  const startTime = Date.now();

  await lockFile.acquire(realName);
  try {
    await promiseSpawn(
      `docker rm -fv ${realName} > /dev/null 2>&1 || true && docker run --rm --name ${realName} ${volumes} --env BUN_INSTALL_CACHE_DIR=${needChangeDir[1].target} ${image} sh -c 'cd ${needChangeDir[0].target} && bun install'`,
      {},
      { timeout: 1000 * 120, retry: 3 }
    );
  } finally {
    await lockFile.releaseLock(realName);
  }

  logger.info(`docker-install-dependencies ${name} cost time: ${Date.now() - startTime}ms`);
}

module.exports = { dockerInstallDependencies, isSameOs, saveLastInstallOs, loadLastInstallOs };
