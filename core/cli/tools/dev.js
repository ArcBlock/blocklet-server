#!/usr/bin/env node

const path = require('path');
const os = require('os');
const { Command } = require('commander');
const last = require('lodash/last');

// env
process.env.NODE_ENV = 'development';
process.env.ABT_NODE_DEV_MODE = 'true';
require('dotenv-flow').config({ path: path.join(__dirname, '../../webapp') });
require('dotenv-flow').config({ silent: true, node_env: 'development' });

if (!process.env.ABT_NODE_DATA_DIR) {
  process.env.ABT_NODE_DATA_DIR = path.join(__dirname, '../../../.abtnode');
}
if (!process.env.ABT_NODE_CACHE_SQLITE_PATH) {
  process.env.ABT_NODE_CACHE_SQLITE_PATH = path.join(process.env.ABT_NODE_DATA_DIR, 'core', 'db-cache.db');
}

process.env.ABT_NODE_LOG_DIR = path.join(process.env.ABT_NODE_DATA_DIR, 'logs', '_abtnode'); // enable log
process.env.CLI_MODE = 'blocklet';
process.env.ABT_NODE_HOME = path.join(os.homedir(), '.arcblock');
process.env.PM2_HOME = path.join(process.env.ABT_NODE_HOME, 'abtnode-dev');
process.env.DISABLE_SQLITE_LOG = '1';

// eslint-disable-next-line
const { getNode } = require('../../webapp/dev/util');
const dev = require('../lib/commands/blocklet/dev');
const { publishEvent, getWsClient } = require('../lib/node');
const { print } = require('../lib/util');
const { version } = require('../package.json');
// eslint-disable-next-line import/order
const { ensureDockerPostgres } = require('@abtnode/core/lib/util/docker/ensure-docker-postgres');

// eslint-disable-next-line require-await
(async () => {
  const { node } = getNode();
  if (!process.env.ABT_NODE_POSTGRES_URL) {
    const postgresUrl = await ensureDockerPostgres(process.env.ABT_NODE_DATA_DIR);
    process.env.ABT_NODE_POSTGRES_URL = postgresUrl;
  }

  // fake nodeInfo.routing.adminPath
  const getNodeInfo = node.getNodeInfo.bind(node);
  node.getNodeInfo = async () => {
    const info = await getNodeInfo();
    info.routing.adminPath = '/';
    return info;
  };

  // let devCommand use devNode
  const devNode = {
    node,
    getBaseUrls: (ips) => ips.map((ip) => ({ url: `http://${ip}:${process.env.PORT || 3000}` })),
    publishEvent: (event, data) => publishEvent(node, event, data),
    getWsClient: () => getWsClient(node),
  };

  const program = new Command();

  program.version(version);
  program.option('-y --yes', 'Automatic yes to prompts', false);

  const handleUnexpectedError = (error) => {
    print();
    console.error(error);
    process.exit(1);
  };

  process.on('uncaughtException', handleUnexpectedError).on('unhandledRejection', handleUnexpectedError);

  const parseOptions =
    (handler) =>
    async (...args) => {
      const commonOptions = program.opts();
      const options = last(args);
      const allOptions = { ...commonOptions, ...options, devNode };
      await handler(allOptions);
    };

  program.description('Develop blocklet from current directory');
  program.option('--open', 'Open the browser after blocklet had been started', false);
  program.option('--component', 'Develop the blocklet as a component');
  program.option('--app-did <did>', 'Develop the blocklet as a component and mount it to which app');
  program.option('--app-id <did>', 'Develop the blocklet as a component and mount it to which app');
  program.option('--mount-point <mountPoint>', 'Mount point to the app');
  program.option('--store-url <storeUrl>', 'Default store url used when component source store is not declared');
  program.option('--start-all-components', 'Auto start all components in the blocklet', false);
  program.command('install').description('Install the development mode blocklet').action(parseOptions(dev.install));
  program
    .command('start')
    .description('Start developing blocklet after installed')
    .option('--e2e', 'Start blocklet in e2e mode, must have e2eDev script', false)
    .action(parseOptions(dev.start));
  program.command('remove').description('Remove the development mode blocklet').action(parseOptions(dev.remove));
  program.command('studio').description('Start the blocklet studio').action(parseOptions(dev.studio));
  program.command('reset').alias('clear').description('Reset blocklet data').action(parseOptions(dev.reset));
  program
    .command('faucet')
    .option('--host <host>', 'The host of the faucet', 'https://faucet.abtnetwork.io')
    .option('--token <token>', 'The token symbol')
    .description('Fund your app with test token from faucet')
    .action(parseOptions(dev.faucet));
  program.action(parseOptions(dev.run));

  program.on('command:*', () => {
    program.help();
  });

  program.parse(process.argv);
})();
