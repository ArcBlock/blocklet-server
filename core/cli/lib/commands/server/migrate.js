const path = require('path');
const chalk = require('chalk');
const { sequelizeInstances } = require('@abtnode/models');
const { runSchemaMigrations } = require('@abtnode/core/lib/migrations');
const { removePostgresLock } = require('@abtnode/core/lib/util/migration-sqlite-to-postgres');

const { printInfo, printSuccess, printError } = require('../../util');
const { getNode } = require('../../node');

exports.run = async ({ dialect }) => {
  const allowDialects = {
    postgres: true,
    sqlite: true,
  };
  if (!allowDialects[dialect]) {
    printError(`Invalid dialect: ${dialect}, allowed dialects: ${Object.keys(allowDialects).join(', ')}`);
    process.exit(1);
  }

  const { node } = await getNode({ dir: process.cwd() });
  const dataDir = path.join(node.dataDirs.core, '..');
  removePostgresLock(dataDir);
  sequelizeInstances.clear();

  const LAST_ABT_NODE_POSTGRES_URL = process.env.ABT_NODE_POSTGRES_URL;
  process.env.ABT_NODE_POSTGRES_URL = '';

  printInfo('Getting blocklets...');
  let blocklets = [];
  try {
    const result = await node.getBlocklets();
    blocklets = result.blocklets || [];
  } catch (err) {
    if (err.message.includes('dose not exist') || err.message.includes('SQLITE_ERROR: no such table')) {
      printError(`Failed to get blocklets: ${err.message}, you need ensure blocklet server start once.`);
      process.exit(1);
    }
    printError(`Failed to get blocklets: ${err.message}`);
    process.exit(1);
  }

  try {
    process.env.ABT_NODE_POSTGRES_URL = LAST_ABT_NODE_POSTGRES_URL;
    await runSchemaMigrations({ dataDir, printInfo, printSuccess, migrationPostgres: true, blocklets });
  } catch (err) {
    if (err.message.includes('dose not exist') || err.message.includes('SQLITE_ERROR: no such table')) {
      printError(`Failed to run migrations: ${err.message}, you need ensure blocklet server start once.`);
      process.exit(1);
    }
    printError(`Failed to run migrations: ${err.message}`);
    process.exit(1);
  }

  printSuccess(`Migration ${dialect} completed`);
  printInfo(`Please start server, will use Postgres database: ${chalk.cyan('blocklet server start')}`);
  process.exit(0);
};
