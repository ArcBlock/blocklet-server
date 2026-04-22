const path = require('path');
const fs = require('fs/promises');
const { dbPathToDbName } = require('@abtnode/models');
const promiseSpawn = require('@abtnode/util/lib/promise-spawn');
const logger = require('@abtnode/logger')('backup-pg-blocklet-db');

const { POSTGRES_CONTAINER_NAME } = require('./ensure-docker-postgres');
const { hasMigratedToPostgres } = require('../migration-sqlite-to-postgres');

// 最长 1 小时, 因为特别大的表, pg_dump 会很久
const baseSpawnOptions = { timeout: 3600_000, retry: 0 };

function getBlockletDataRoot(dbPath) {
  return path.dirname(path.dirname(path.dirname(dbPath)));
}
const getBackupPath = (dbPath) => {
  return `${dbPath.replace('.db', '')}_pg_backup.gz`;
};

const checkDbExists = async (pgUrl, dbName) => {
  const output = await promiseSpawn(
    `docker exec ${POSTGRES_CONTAINER_NAME} psql "${pgUrl}" -tAc "SELECT 1 FROM pg_database WHERE datname = '${dbName}';"`,
    undefined,
    { timeout: 3_000, retry: 2 }
  );
  return output.trim() === '1';
};

const getPgTempDir = (dbName) => {
  return `/tmp/${dbName}.sql.gz`;
};

function buildPgUrl(originalUrl, dbName) {
  const url = new URL(originalUrl);
  url.pathname = `/${dbName}`; // 替换路径
  return url.toString();
}

function getPgUrl() {
  const pgUrl = process.env.ABT_NODE_POSTGRES_URL;

  // 如果是当前容器, 使用容器内部 port
  if (pgUrl.includes('127.0.0.1') || pgUrl.includes('localhost')) {
    return pgUrl.replace('40408', '5432');
  }

  return '';
}

const dockerBackupPgBlockletDb = async (dbPath) => {
  const dataDir = getBlockletDataRoot(dbPath);
  if (!hasMigratedToPostgres(dataDir)) {
    logger.info('no using postgres, skip backup the pg blocklet db:', dbPath);
    return {};
  }

  const pgUrl = getPgUrl();
  if (!pgUrl) {
    logger.info('no postgres url, skip backup the pg blocklet db:', dbPath);
    return {};
  }

  const dbName = dbPathToDbName(dbPath);
  const backupPath = getBackupPath(dbPath);

  const isDbExists = await checkDbExists(pgUrl, dbName);
  if (!isDbExists) {
    logger.info('no need to backup the pg blocklet db:', dbName);
    return {};
  }

  // 替换 pgUrl 的 db 为 dbName
  const pgUrlForDump = buildPgUrl(pgUrl, dbName);

  logger.info('backup the pg blocklet db start:', dbName);
  await promiseSpawn(
    `docker exec ${POSTGRES_CONTAINER_NAME} sh -c 'pg_dump ${pgUrlForDump} | gzip' > ${backupPath}`,
    {},
    baseSpawnOptions
  );
  logger.info('backup the pg blocklet db cp backup file done:', backupPath);
  return {
    backupPath,
    dbName,
  };
};

const dockerRestorePgBlockletDb = async (dbPath) => {
  const dataDir = getBlockletDataRoot(dbPath);
  if (!hasMigratedToPostgres(dataDir)) {
    logger.info('no using postgres, skip restore the pg blocklet db:', dbPath);
    return {};
  }

  const pgUrl = getPgUrl();
  if (!pgUrl) {
    logger.info('no postgres url, skip restore the pg blocklet db:', dbPath);
    return {};
  }

  const dbName = dbPathToDbName(dbPath);
  const backupPath = getBackupPath(dbPath);

  try {
    await fs.access(backupPath);
  } catch (_) {
    logger.info('no need to restore the pg blocklet db path at:', backupPath);
    return {};
  }

  const containerTmpPath = getPgTempDir(dbName);

  // 替换 pgUrl 的 db 为 dbName
  const pgUrlForRestore = buildPgUrl(pgUrl, dbName);

  logger.info('restore the pg blocklet db start:', dbName);

  const isDbExists = await checkDbExists(pgUrl, dbName);
  if (!isDbExists) {
    // 如果数据库不存在, 创建数据库, 否则一会数据库直连会失败
    logger.info('creating missing database before restore:', dbName);
    await promiseSpawn(
      `docker exec ${POSTGRES_CONTAINER_NAME} psql "${pgUrl}" -c "CREATE DATABASE \\"${dbName}\\";"`,
      {},
      baseSpawnOptions
    );
  } else {
    // 如果数据库存在, 清空数据库
    logger.info('clearing existing schema in db:', dbName);
    await promiseSpawn(
      `docker exec ${POSTGRES_CONTAINER_NAME} psql "${pgUrlForRestore}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`,
      {},
      baseSpawnOptions
    );
  }

  logger.info('restore the pg blocklet db drop schema done:', dbName);

  await promiseSpawn(`docker cp ${backupPath} ${POSTGRES_CONTAINER_NAME}:${containerTmpPath}`, {}, baseSpawnOptions);
  logger.info('restore the pg blocklet db cp backup file done:', backupPath);
  await promiseSpawn(
    `docker exec ${POSTGRES_CONTAINER_NAME} sh -c 'gunzip -c ${containerTmpPath} | psql "${pgUrlForRestore}"'`,
    {},
    baseSpawnOptions
  );
  logger.info('restore the pg blocklet db done:', dbName);

  return {
    backupPath,
    dbName,
  };
};

module.exports = {
  dockerBackupPgBlockletDb,
  dockerRestorePgBlockletDb,
};
