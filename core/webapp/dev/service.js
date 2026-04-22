/* eslint-disable no-console */
require('dotenv-flow').config();
const getAppWallet = require('@abtnode/util/lib/get-app-wallet');

if (!process.env.ABT_NODE_UPDATER_PORT) {
  process.env.ABT_NODE_UPDATER_PORT = 40405;
}
if (!process.env.ABT_NODE_SERVICE_PORT) {
  process.env.ABT_NODE_SERVICE_PORT = 40406;
}

process.env.ABT_NODE_DID = getAppWallet(process.env.ABT_NODE_SK).address;

const pm2 = require('@abtnode/util/lib/pm2/async-pm2');
const os = require('os');
const chalk = require('chalk');
// eslint-disable-next-line import/no-extraneous-dependencies
const exitHook = require('async-exit-hook');

process.env.ABT_NODE_MAX_CLUSTER_SIZE = 1;
process.env.ABT_NODE_DAEMON_CLUSTER_SIZE = 1;

const { PROCESS_NAME_SERVICE } = require('@abtnode/constant');

const killPm2Process = async name => {
  const [info] = await pm2.describeAsync(name);
  if (!info) {
    return;
  }

  await pm2.deleteAsync(name);
  console.log(`\n[pm2] Process ${name} was successfully deleted`);
};

const run = async () => {
  await killPm2Process(PROCESS_NAME_SERVICE);

  const options = {
    namespace: 'daemon',
    name: PROCESS_NAME_SERVICE,
    time: true,
    mergeLogs: true,
    ...(process.env.SKIP_DEV_CLUSTER
      ? {
          execMode: 'fork',
        }
      : {
          execMode: 'cluster',
          instances: Math.min(os.cpus().length, 2),
        }),

    script: 'dev/service-process.js',
    env: {
      ...process.env,
    },
    pmx: false,
  };
  await pm2.startAsync(options);

  const cmd = chalk.cyan(`PM2_HOME=${process.env.PM2_HOME} pm2 logs ${PROCESS_NAME_SERVICE}`);
  console.log(`\n[pm2] Process ${PROCESS_NAME_SERVICE} was successfully started.`);
  console.log(`\n[pm2] To view logs, run ${cmd} in another terminal.`);

  exitHook(async cb => {
    try {
      await killPm2Process(PROCESS_NAME_SERVICE);
      console.log('service processes are successfully killed');
      cb();
    } catch (err) {
      console.error(err);
      cb();
    }
  });
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
