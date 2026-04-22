/* eslint-disable no-console */
require('dotenv-flow').config();

if (!process.env.ABT_NODE_UPDATER_PORT) {
  process.env.ABT_NODE_UPDATER_PORT = 40405;
}
if (!process.env.ABT_NODE_SERVICE_PORT) {
  process.env.ABT_NODE_SERVICE_PORT = 40406;
}

const os = require('os');
const path = require('path');

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}
if (!process.env.ABT_NODE_CACHE_SQLITE_PATH) {
  process.env.ABT_NODE_CACHE_SQLITE_PATH = path.join(process.env.ABT_NODE_DATA_DIR, 'core', 'db-cache.db');
}

process.env.PM2_HOME = path.join(os.homedir(), '.arcblock/abtnode-dev');

const chalk = require('chalk'); // eslint-disable-line import/no-extraneous-dependencies
const nodemon = require('nodemon'); // eslint-disable-line import/no-extraneous-dependencies
const tryWithTimeout = require('@abtnode/util/lib/try-with-timeout');
const ensureListening = require('@abtnode/util/lib/ensure-listening');
const { ensureSchemaMigrations } = require('../util');

tryWithTimeout(() => ensureListening(process.env.ABT_NODE_EVENT_PORT), 5000)
  .then(async () => {
    await ensureSchemaMigrations();

    const dependencies = [
      '../blocklet-services/api',
      '../blocklet-services/configs',
      '../auth',
      '../state',
      '../analytics',
      '../router-templates',
      '../certificate-manager',
      '../util',
      '../../blocklet',
      // FIXME: e2e test will crash if watch ../constant
      // '../constant',
    ];
    nodemon({
      script: 'dev/service.js',
      ext: 'js json',
      stdout: true,
      verbose: false,
      colours: true,
      legacyWatch: true,
      env: {
        ...process.env,
      },
      watch: dependencies,
    }).on('log', log => console.log(log.colour));
  })
  .catch(err => {
    console.error(chalk.red(`Can not connect to event hub: ${err.message}`), err);
    console.error(
      chalk.red(
        `To fix this, you need to start event hub with ${chalk.cyan('npm run start:hub')} in a separate terminal`
      )
    );
    process.exit(0);
  });
