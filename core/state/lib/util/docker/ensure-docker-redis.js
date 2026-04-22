const promiseSpawn = require('@abtnode/util/lib/promise-spawn');
const logger = require('@abtnode/logger')('@abtnode/ensure-docker-redis');
const { checkDockerInstalled } = require('./check-docker-installed');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function ensureDockerRedis(name = 'db-cache-redis', port = 40409) {
  if (!(await checkDockerInstalled())) {
    return '';
  }
  // 1. 检查是否有正在运行的同名容器
  const checkRunningCmd = `docker ps --filter "name=${name}" --format "{{.Names}}"`;
  // 2. 如果没有运行，再检查是否存在已停止的同名容器
  const checkAllCmd = `docker ps -a --filter "name=${name}" --format "{{.Names}}"`;
  // 3. 如果既没运行也不存在，则创建新的容器，禁用持久化、限制内存、设置淘汰策略
  const runCmd = [
    'docker run -d',
    `--name ${name}`,
    `-p 127.0.0.1:${port}:6379`,
    '--memory 700m',
    '--memory-swap 700m',
    'redis:8.0.2',
    'redis-server',
    '--save ""',
    '--appendonly no',
    '--maxmemory 512mb',
    '--maxmemory-policy allkeys-lru',
  ].join(' ');

  const url = `redis://localhost:${port}`;

  const running = (await promiseSpawn(checkRunningCmd)).trim();
  if (running === name) {
    // 已经在运行，直接返回
    logger.info('redis is already running', name);
    return url;
  }

  // 查看是否有已停止的同名容器
  const all = (await promiseSpawn(checkAllCmd)).trim();
  if (all === name) {
    // 容器存在，但可能是 stopped，直接启动它
    await promiseSpawn(`docker start ${name}`);
    await sleep(3000);
    logger.info('redis is started', name);
    return url;
  }

  await promiseSpawn(runCmd);
  await sleep(3000);
  logger.info('redis is started', name);
  return url;
}

// 停止, 并且返回是否 docker 中存在 redis 容器
async function stopDockerRedis(name = 'db-cache-redis') {
  if (!(await checkDockerInstalled())) {
    return false;
  }
  const checkRunningCmd = `docker ps --filter "name=${name}" --format "{{.Names}}"`;
  const running = (await promiseSpawn(checkRunningCmd)).trim();
  if (running === name) {
    // 已经在运行，直接返回
    logger.info('redis is already running', name);
    try {
      await promiseSpawn(`docker rm -f ${name}`, { mute: true });
    } catch (_) {
      // 不需要打印日志, 因为 redis 可能本来就没有运行
    }
    return true;
  }

  return false;
}

module.exports = {
  ensureDockerRedis,
  stopDockerRedis,
};
