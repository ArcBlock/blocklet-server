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

if (!process.env.ABT_NODE_CACHE_SQLITE_PATH) {
  process.env.ABT_NODE_CACHE_SQLITE_PATH = path.join(process.env.ABT_NODE_DATA_DIR, 'core', 'db-cache.db');
}

process.env.PM2_HOME = path.join(os.homedir(), '.arcblock/abtnode-dev');

const chalk = require('chalk'); // eslint-disable-line import/no-extraneous-dependencies
const nodemon = require('nodemon'); // eslint-disable-line import/no-extraneous-dependencies
const cleanup = require('node-cleanup'); // eslint-disable-line import/no-extraneous-dependencies
const tryWithTimeout = require('@abtnode/util/lib/try-with-timeout');
const { clearRouterByConfigKeyword } = require('@abtnode/router-provider'); // eslint-disable-line import/no-extraneous-dependencies
const ensureListening = require('@abtnode/util/lib/ensure-listening');
const { ensureSchemaMigrations } = require('../util');

tryWithTimeout(() => ensureListening(process.env.ABT_NODE_EVENT_PORT), 5000)
  .then(async () => {
    await ensureSchemaMigrations();
    const dependencies = [
      './api',
      '../util',
      '../ws',
      '../timemachine',
      '../state',
      '../queue',
      '../router-provider',
      '../gql',
      '../schema',
      '../models',
      '../analytics',
      '../../blocklet/meta',
      '../../blocklet/sdk',
      '../rbac',
      '../auth',
      '../certificate-manager',
      '../router-templates',
      // FIXME: e2e test will crash
      // '../../blocklet/constant',
      // '../constant',
    ];
    nodemon({
      script: 'dev/daemon.js',
      ext: 'js json',
      stdout: true,
      verbose: false,
      colours: true,
      legacyWatch: true,
      env: {
        ...process.env,
      },
      watch: process.env.TRAVIS ? ['./hub.js'] : dependencies,
    }).on('log', log => console.log(log.colour));

    // eslint-disable-next-line consistent-return
    cleanup((exitCode, signal) => {
      if (signal) {
        clearRouterByConfigKeyword(process.env.ABT_NODE_DATA_DIR).then(result => {
          if (result) {
            // eslint-disable-next-line no-console
            console.log('Routing engine is successfully stopped:', result, '\n');
          }

          console.log(
            `If there are running blocklets in the server, remember to run ${chalk.cyan(
              'npm run deep-clean'
            )} to kill the blocklets`
          );

          process.kill(process.pid, signal);
        });

        cleanup.uninstall();
        return false;
      }
    });
  })
  .catch(err => {
    console.error(chalk.red(`Can not connect to event-hub: ${err.message}`));
    console.error(
      chalk.red(
        `To fix this, you need to start event-hub with ${chalk.cyan('npm run start:hub')} in a separate terminal`
      )
    );
    process.exit(0);
  });
