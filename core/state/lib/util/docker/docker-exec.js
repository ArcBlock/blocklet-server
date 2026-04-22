const fs = require('fs').promises;
const fse = require('fs-extra');
const path = require('path');
const promiseSpawn = require('@abtnode/util/lib/promise-spawn');
const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');
const logger = require('@abtnode/logger')('@abtnode/docker-exec');

const sleep = require('@abtnode/util/lib/sleep');
const parseDockerOptionsFromPm2 = require('./parse-docker-options-from-pm2');
const { checkDockerInstalled } = require('./check-docker-installed');

const lock = new DBCache(() => {
  return {
    ...getAbtNodeRedisAndSQLiteUrl(),
    prefix: 'docker-exec',
    ttl: 1000 * 60 * 3,
  };
});

async function dockerExec({
  blocklet,
  meta,
  env,
  script,
  hookName,
  runScriptDir,
  runScriptParams,
  nodeInfo,
  timeout = 120_000,
  retry = 0,
  output,
  error,
}) {
  if (meta.group === 'static') {
    return;
  }

  if (!(await checkDockerInstalled())) {
    return;
  }

  const blockletDid = blocklet.meta.did;
  logger.info('run docker exec hook:', hookName);
  if (runScriptDir) {
    const scriptDir = path.join(env.BLOCKLET_APP_DIR, 'docker-exec');
    if (!fse.existsSync(scriptDir)) {
      fse.mkdirpSync(scriptDir);
    }
    const paramsFilePath = path.join(scriptDir, `params-${hookName}.json`);
    await fse.copy(runScriptDir, scriptDir, { recursive: true });
    await fs.writeFile(paramsFilePath, JSON.stringify(runScriptParams));
  }

  const lockKey = `${blockletDid}-${meta.name}-${hookName}`;
  if (!(await lock.hasExpired(lockKey))) {
    return;
  }
  await lock.acquire(lockKey);

  const command = `sh -c 'cd $BLOCKLET_APP_DIR && ${script}'`;
  const options = await parseDockerOptionsFromPm2({
    options: {
      name: `${blockletDid}-${meta.name}-${hookName}`,
      env,
    },
    nodeInfo,
    meta,
    ports: [],
    overrideScript: command,
    dockerNamePrefix: 'docker-exec',
    eventName: hookName,
  });

  const startTime = Date.now();
  try {
    await promiseSpawn(
      options.script,
      {
        outputLogPath: output || '',
        errorLogPath: error || '',
      },
      { timeout, retry }
    );
  } finally {
    if (nodeInfo.isDockerInstalled) {
      await promiseSpawn(`docker rm -f ${options.env.dockerName} > /dev/null 2>&1 || true`, {}, { timeout: 1000 * 10 });
    }
    await sleep(500);
    await lock.releaseLock(lockKey);
  }
  logger.info(`dockerExec ${options.env.dockerName} cost time: ${Date.now() - startTime}ms`);
}

module.exports = { dockerExec };
