/**
 * remove all blocklets in Blocklet Server of development environment
 */

/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
if (!process.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

require('dotenv-flow').config();
const path = require('path');
const os = require('os');
const chalk = require('chalk'); // eslint-disable-line import/no-extraneous-dependencies
const tryWithTimeout = require('@abtnode/util/lib/try-with-timeout');
const ensureListening = require('@abtnode/util/lib/ensure-listening');
const { runSchemaMigrations } = require('@abtnode/core/lib/migrations');

if (!process.env.ABT_NODE_DATA_DIR) {
  process.env.ABT_NODE_DATA_DIR = path.join(__dirname, '../../../.abtnode');
}

process.env.PM2_HOME = path.join(os.homedir(), '.arcblock/abtnode-dev');

const { getNode } = require('../dev/util');

tryWithTimeout(() => ensureListening(process.env.ABT_NODE_EVENT_PORT), 1000)
  .then(async () => {
    await runSchemaMigrations({ dataDir: process.env.ABT_NODE_DATA_DIR, blocklets: [] });

    const node = getNode(true);
    node.onReady(async () => {
      const result = await node.getBlocklets();
      const blocklets = result.blocklets || [];
      // eslint-disable-next-line no-restricted-syntax
      for (const blocklet of blocklets) {
        console.log('remove blocklet', blocklet.meta.name);
        await node.deleteBlocklet({ did: blocklet.meta.did });
        await new Promise(r => setTimeout(r, 500));
      }

      console.log(`done. remove ${chalk.cyan(blocklets.length)} blocklets.`);

      process.exit(0);
    });
  })
  .catch(err => {
    console.error(chalk.red(`Can not connect to event hub: ${err.message}`, err));
    process.exit(0);
  });
