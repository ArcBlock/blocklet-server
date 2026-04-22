/* eslint-disable no-console */
process.env.NODE_ENV = 'development';
require('dotenv-flow').config();
const { runMigrationScripts, runSchemaMigrations } = require('@abtnode/core/lib/migrations');

const { getNode } = require('../dev/util');

const getParam = key => {
  const index = process.argv.findIndex(x => x === key);
  if (index > 0) {
    return process.argv[index + 1];
  }
  return '';
};

const fromVersion = getParam('--from-version');

const dataDir = process.env.ABT_NODE_DATA_DIR;
runSchemaMigrations({ dataDir, blocklets: [] }).then(() => {
  const { node, config } = getNode(true);

  if (fromVersion) {
    config.version = fromVersion;
  }

  node.onReady(async () => {
    try {
      const migrationSucceeded = await runMigrationScripts({
        node,
        config: { node: config },
        dataDir,
        printInfo: console.log,
        printError: console.log,
        printSuccess: console.log,
      });
      console.log('Run Migration Scripts', migrationSucceeded ? 'success' : 'failed');
      process.exit(0);
    } catch (err) {
      console.log(err.message);
      process.exit(1);
    }
  });
});
