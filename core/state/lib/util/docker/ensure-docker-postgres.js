/* eslint-disable no-await-in-loop */
const promiseSpawn = require('@abtnode/util/lib/promise-spawn');
const logger = require('@abtnode/logger')('@abtnode/ensure-docker-postgres');
const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

const { checkDockerInstalled } = require('./check-docker-installed');
const { hasMigratedToPostgres } = require('../migration-sqlite-to-postgres');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForPostgresReady(url, timeoutMs = 30_000) {
  const start = Date.now();
  let lastError = null;

  while (Date.now() - start < timeoutMs) {
    const sequelize = new Sequelize(url, { logging: false });
    try {
      await sequelize.authenticate();
      await sequelize.close();
      return true;
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  throw new Error(`Postgres did not become ready in time:\n${lastError?.message ?? 'Unknown error'}`);
}
async function _ensureDockerPostgres(dataDir, name = 'abtnode-postgres', port = 40408, force = false) {
  if (!dataDir) {
    return '';
  }

  if (process.env.ABT_NODE_IGNORE_USE_POSTGRES === 'true') {
    return '';
  }

  if (!(await checkDockerInstalled())) {
    return '';
  }

  if (!hasMigratedToPostgres(dataDir) && !force) {
    return '';
  }

  // 本地开发环境, 可以把这个参数设置成 true, 这样切换 .blocklet-server 路径的时候, 会自动重启 postgres, 应用对应的 postgres 配置
  if (process.env.ABT_NODE_RESTART_POSTGRES === 'true') {
    await stopDockerPostgres(name);
    await sleep(1000);
  }

  // 1. 检查是否有正在运行的同名容器
  const checkRunningCmd = `docker ps --filter "name=${name}" --format "{{.Names}}"`;
  // 2. 如果没有运行，再检查是否存在已停止的同名容器
  const checkAllCmd = `docker ps -a --filter "name=${name}" --format "{{.Names}}"`;
  // 3. 如果既没运行也不存在，则创建新的容器，设置内存限制和基本配置
  const dbPath = path.join(dataDir, 'core', 'postgres');
  if (!fs.existsSync(path.join(dataDir, 'core'))) {
    fs.mkdirSync(path.join(dataDir, 'core'), { recursive: true });
  }

  const postgresVersion = process.env.ABT_NODE_POSTGRES_VERSION || '17.5';
  const postgresMaxConnections = process.env.ABT_NODE_POSTGRES_MAX_CONNECTIONS || '500';

  const runCmd = [
    'docker run -d',
    `--name ${name}`,
    `-p 127.0.0.1:${port}:5432`,
    `-v ${dbPath}:/var/lib/postgresql/data`,
    '--memory 2g',
    '--memory-swap 2g',
    '-e POSTGRES_PASSWORD=postgres',
    '-e POSTGRES_USER=postgres',
    '-e POSTGRES_DB=postgres',
    `postgres:${postgresVersion}`,
    `-c max_connections=${postgresMaxConnections}`,
  ].join(' ');

  const url = `postgresql://postgres:postgres@localhost:${port}/postgres`;

  const running = (await promiseSpawn(checkRunningCmd)).trim();
  if (running === name) {
    // 已经在运行，直接返回
    logger.info('postgres is already running', name);
    return url;
  }

  // 查看是否有已停止的同名容器
  const all = (await promiseSpawn(checkAllCmd)).trim();
  if (all === name) {
    // 容器存在，但可能是 stopped，直接启动它
    await promiseSpawn(`docker start ${name}`);
    await waitForPostgresReady(url);
    logger.info('postgres is started', name);
    return url;
  }

  await promiseSpawn(runCmd);
  await waitForPostgresReady(url);
  logger.info('postgres is started', name);
  return url;
}

let lastUrl = '';

const POSTGRES_CONTAINER_NAME = 'abtnode-postgres';

async function ensureDockerPostgres(dataDir, name = POSTGRES_CONTAINER_NAME, port = 40408, force = false) {
  if (lastUrl) {
    return lastUrl;
  }
  lastUrl = await _ensureDockerPostgres(dataDir, name, port, force);
  return lastUrl;
}

// 停止, 并且返回是否 docker 中存在 postgres 容器
async function stopDockerPostgres(name = POSTGRES_CONTAINER_NAME) {
  if (!(await checkDockerInstalled())) {
    return false;
  }
  const checkRunningCmd = `docker ps --filter "name=${name}" --format "{{.Names}}"`;
  const running = (await promiseSpawn(checkRunningCmd)).trim();
  if (running === name) {
    // 已经在运行，直接返回
    logger.info('postgres is already running', name);
    try {
      await promiseSpawn(`docker rm -f ${name}`, { mute: true });
    } catch (_) {
      // 不需要打印日志, 因为 postgres 可能本来就没有运行
    }
    return true;
  }

  return false;
}

module.exports = {
  ensureDockerPostgres,
  stopDockerPostgres,
  POSTGRES_CONTAINER_NAME,
};
