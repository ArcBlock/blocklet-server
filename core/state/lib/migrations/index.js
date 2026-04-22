/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
const fs = require('fs');
const path = require('path');
const semver = require('semver');
const logger = require('@abtnode/logger')('@abtnode/core:migration');
const { doSchemaMigration, createSequelize } = require('@abtnode/models');
const { getDbFilePath } = require('../util');
const getMigrationScripts = require('../util/get-migration-scripts');
const { ensureDockerPostgres } = require('../util/docker/ensure-docker-postgres');
const { migrationSqliteToPostgres } = require('../util/migration-sqlite-to-postgres');

const BACKUP_FILE_DB = 'server.db';
const BACKUP_FILE_CONFIG = 'config.yml';

const MODULES = ['certificate-manager'];

const doBackup = ({ dataDir, configFile, printInfo, printSuccess }) => {
  printInfo('Backing up state db and config before migration...');

  const backupDir = path.join(dataDir, 'migration', Date.now().toString());
  fs.mkdirSync(backupDir, { recursive: true });

  const dbFile = path.join(dataDir, 'core/server.db');
  if (fs.existsSync(dbFile)) {
    fs.copyFileSync(dbFile, path.join(backupDir, BACKUP_FILE_DB));
  }
  if (fs.existsSync(configFile)) {
    fs.copyFileSync(configFile, path.join(backupDir, BACKUP_FILE_CONFIG));
  }

  printSuccess('State db and config was successfully backup!');
  return backupDir;
};

const doRestore = ({ dataDir, configFile, backupPath, printInfo, printSuccess }) => {
  printInfo('Restoring when migration failed...');

  const dbBackup = path.join(backupPath, BACKUP_FILE_DB);
  const configBackup = path.join(backupPath, BACKUP_FILE_CONFIG);

  // Validate backup
  if (fs.existsSync(backupPath) === false) {
    throw new Error(`Backup folder does not exist: ${backupPath}`);
  }
  if (fs.existsSync(dbBackup) === false) {
    throw new Error(`Backup file for state does not exist: ${dbBackup}`);
  }
  if (configFile && fs.existsSync(configBackup) === false) {
    throw new Error(`Backup file for config does not exist: ${configBackup}`);
  }

  // Restore state db
  fs.copyFileSync(dbBackup, path.join(dataDir, 'core/server.db'));

  // Restore config
  fs.copyFileSync(configBackup, configFile);

  printSuccess('State db and config was successfully restored!');
};

const runMigrationScripts = async ({
  node,
  config,
  configFile,
  dataDir,
  printInfo = console.info, // eslint-disable-line
  printSuccess = console.info, // eslint-disable-line
  printError = console.error,
  scriptsDir = __dirname,
}) => {
  const states = node.states || {};

  // 1. Find migration scripts sorted
  let scripts = [];
  try {
    scripts = getMigrationScripts(scriptsDir);
    logger.info('raw scripts', scripts);
  } catch (err) {
    printError(`Failed to list migration scripts due to: ${err.message}`);
    return false;
  }

  // 2. Find scripts not executed
  const pending = [];
  for (let i = 0; i < scripts.length; i++) {
    const { script, version } = scripts[i];
    try {
      if (process.env.NODE_ENV === 'development') {
        pending.push(scripts[i]);
      } else {
        const executed = await node.isMigrationExecuted({ script, version });
        if (executed === false) {
          pending.push(scripts[i]);
        }
      }
    } catch (err) {
      printError(`Failed to detect migration script execution status: ${script}, error: ${err.message}`);
    }
  }

  // 3. Drop the scripts that has version small than latest execution script version
  const finalPending = pending.filter((x) => semver.gt(x.version, config.node.version));

  if (!finalPending.length) {
    return true;
  }

  let backupPath = null;
  try {
    backupPath = await doBackup({ dataDir, configFile, printInfo, printSuccess });
  } catch (err) {
    printError(`Failed to backup state db due to ${err.message}, abort!`);
    return false;
  }

  // 4. Run migration scripts that are not executed
  logger.info('final scripts', finalPending);
  for (let i = 0; i < finalPending.length; i++) {
    const { script, version } = finalPending[i];
    try {
      // eslint-disable-next-line
      const scriptFn = require(path.join(scriptsDir, script));
      await scriptFn({ node, states, config, configFile, dataDir, printInfo, printSuccess, printError });
      // eslint-disable-next-line no-underscore-dangle
      if (scriptFn.__test__ === undefined) {
        await node.markMigrationExecuted({ script, version });
      }
      printSuccess(`Migration script executed: ${script}`);
    } catch (err) {
      printError(`Failed to execute migration script: ${script}, error: ${err.message}`);

      try {
        await doRestore({ configFile, dataDir, printInfo, printSuccess, backupPath });
      } catch (err2) {
        printError(`Failed to restore state db due to: ${err2.message}`);
      }

      return false;
    }
  }

  return true;
};

const runSchemaMigrations = async ({
  dataDir,
  blocklets = [],
  printInfo = console.info, // eslint-disable-line
  printSuccess = console.info, // eslint-disable-line
  migrationPostgres = false,
}) => {
  if (!process.env.ABT_NODE_CACHE_SQLITE_PATH) {
    process.env.ABT_NODE_CACHE_SQLITE_PATH = path.join(dataDir, 'core', 'db-cache.db');
  }
  if (!process.env.ABT_NODE_POSTGRES_URL) {
    const postgresUrl = await ensureDockerPostgres(dataDir, 'abtnode-postgres', 40408, migrationPostgres);
    process.env.ABT_NODE_POSTGRES_URL = postgresUrl;
  }
  if (migrationPostgres && !process.env.ABT_NODE_POSTGRES_URL) {
    throw new Error('Postgres URL is not set, please set env ABT_NODE_POSTGRES_URL or ensure docker is running');
  }
  const dbPaths = {
    server: getDbFilePath(path.join(dataDir, 'core/server.db')),
    service: getDbFilePath(path.join(dataDir, 'services/service.db')),
    certificateManagers: [],
    blocklets: [],
  };

  // migrate server schema
  dbPaths.server = getDbFilePath(path.join(dataDir, 'core/server.db'));
  await doSchemaMigration(dbPaths.server, 'server', true);
  printSuccess(`Server schema successfully migrated: ${dbPaths.server}`);
  // migrate service schema
  dbPaths.service = getDbFilePath(path.join(dataDir, 'services/service.db'));
  await doSchemaMigration(dbPaths.service, 'service', true);
  printSuccess(`Service schema successfully migrated: ${dbPaths.service}`);

  // migrate blocklet schema
  for (let i = 0; i < blocklets.length; i++) {
    const blocklet = blocklets[i];
    const env = blocklet.environments.find((x) => x.key === 'BLOCKLET_DATA_DIR');
    if (env) {
      const filePath = getDbFilePath(path.join(env.value, 'blocklet.db'));
      dbPaths.blocklets.push(filePath);
      await doSchemaMigration(filePath, 'blocklet', true);
      printSuccess(`Blocklet schema successfully migrated: ${blocklet.appPid}: ${filePath}`);
    } else {
      printInfo(`Skip migrate schema for blocklet: ${blocklet.appPid}`);
    }
  }

  // migrate certificate manager schema
  for (let i = 0; i < MODULES.length; i++) {
    const filePath = getDbFilePath(path.join(dataDir, `modules/${MODULES[i]}/module.db`));
    await doSchemaMigration(filePath, MODULES[i], true);
    dbPaths.certificateManagers.push(filePath);
    printSuccess(`${MODULES[i]} schema successfully migrated: ${filePath}`);
  }

  if (migrationPostgres) {
    await migrationSqliteToPostgres(dataDir, dbPaths);
  }
};

const closeDatabaseConnections = async ({
  dataDir,
  blocklets = [],
  printInfo = console.info, // eslint-disable-line
}) => {
  if (!process.env.ABT_NODE_POSTGRES_URL) {
    const postgresUrl = await ensureDockerPostgres(dataDir);
    process.env.ABT_NODE_POSTGRES_URL = postgresUrl;
  }
  const dataFiles = [
    getDbFilePath(path.join(dataDir, 'core/server.db')),
    getDbFilePath(path.join(dataDir, 'services/service.db')),
  ];
  for (let i = 0; i < blocklets.length; i++) {
    const blocklet = blocklets[i];
    const env = blocklet.environments.find((x) => x.key === 'BLOCKLET_DATA_DIR');
    if (env) {
      dataFiles.push(getDbFilePath(path.join(env.value, 'blocklet.db')));
    }
  }
  for (let i = 0; i < MODULES.length; i++) {
    dataFiles.push(getDbFilePath(path.join(dataDir, `modules/${MODULES[i]}/module.db`)));
  }

  const connections = dataFiles.map((x) => createSequelize(x));
  connections.forEach((x) => {
    try {
      x.close();
    } catch (err) {
      if (err.message.includes('was closed!')) {
        return;
      }
      throw new Error(`Failed to close database connection: ${x}, error: ${err.message}`);
    }
  });
};

module.exports = {
  getMigrationScripts,
  runMigrationScripts,
  runSchemaMigrations,
  closeDatabaseConnections,
  doBackup,
  doRestore,
};
