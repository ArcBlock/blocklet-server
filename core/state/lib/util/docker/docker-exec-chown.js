const path = require('path');
const fs = require('fs');
const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');
const promiseSpawn = require('@abtnode/util/lib/promise-spawn');
const logger = require('@abtnode/logger')('@abtnode/docker-exec-chown');
const sleep = require('@abtnode/util/lib/sleep');
const debianChmodDockerfile = require('./debian-chmod-dockerfile');
const parseDockerName = require('./parse-docker-name');
const { checkDockerHasImage } = require('./check-docker-has-image');
const { checkDockerInstalled } = require('./check-docker-installed');
const filterParentDirs = require('./filter-parent-dirs');
const { createDockerImage } = require('./create-docker-image');

const lockFile = new DBCache(() => ({
  prefix: 'docker-exec-chown-locks',
  ttl: 1000 * 60 * 3,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

async function dockerExecChown({ name, dirs, code = 777, force = false }) {
  if (process.env.ABT_NODE_SKIP_DOCKER_CHOWN === '1' && !force) {
    return;
  }

  if (process.getuid && process.getuid() === 0) {
    return;
  }

  const { image, baseDir } = debianChmodDockerfile;

  if (!(await checkDockerInstalled())) {
    return;
  }

  if (!(await checkDockerHasImage(image))) {
    await createDockerImage({
      appDir: path.join(process.env.ABT_NODE_DATA_DIR, 'tmp', 'docker'),
      dataDir: path.join(process.env.ABT_NODE_DATA_DIR, 'tmp', 'docker'),
      meta: {},
      ports: [],
      env: {},
      doChown: true,
    });
  }

  const filterDirs = filterParentDirs(dirs, process.env.ABT_NODE_DATA_DIR);
  const needChangeDir = filterDirs.filter((dir) => fs.existsSync(dir));

  const volumes = needChangeDir
    .map((dir) => `-v ${dir}:${path.join(baseDir, dir.replace(process.env.ABT_NODE_DATA_DIR, ''))}:rw`)
    .join(' ');
  const command = needChangeDir
    .map((dir) => {
      return `chmod ${code === 750 ? '' : '-R'} ${code} ${path.join(baseDir, dir.replace(process.env.ABT_NODE_DATA_DIR, ''))}`;
    })
    .join(' && ');

  const startTime = Date.now();
  const realName = parseDockerName(name, 'docker-exec-chown');
  if (!(await lockFile.hasExpired(realName))) {
    return;
  }
  await lockFile.acquire(realName);

  try {
    await promiseSpawn(
      `docker rm -fv ${realName} > /dev/null 2>&1 || true && docker run --rm --name ${realName} ${volumes} ${image} sh -c '${command}'`,
      {},
      { timeout: 1000 * 120, retry: 0 }
    );
  } finally {
    await promiseSpawn(`docker rm -fv ${realName} > /dev/null 2>&1 || true`, {}, { timeout: 1000 * 10, retry: 3 });
    await sleep(500);
    await lockFile.releaseLock(realName);
  }

  logger.info(`dockerExecChown ${name} cost time: ${Date.now() - startTime}ms`);
}

module.exports = { dockerExecChown };
