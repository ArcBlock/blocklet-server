#!/usr/bin/env node

/* eslint-disable import/order */
/* eslint-disable global-require */

const { PM2_HOME, ABT_NODE_HOME, ABT_NODE_MAX_CLUSTER_SIZE } = require('../lib/constant');

process.env.PM2_HOME = PM2_HOME;
process.env.ABT_NODE_HOME = ABT_NODE_HOME;
process.env.ABT_NODE_MAX_CLUSTER_SIZE = String(ABT_NODE_MAX_CLUSTER_SIZE);
process.env.ABT_NODE_PACKAGE_NAME = '@blocklet/cli';

const spawn = require('cross-spawn');
const getCLIBinaryName = require('../lib/util/get-cli-binary-name');
const exitWhenServerStopped = require('../lib/util/exit-when-server-stopped');
const printError = require('../lib/util/print-error');

const keepAliveParams = ['--keep-alive', '-k'];

const parseArgv = () => {
  const binaryName = getCLIBinaryName();
  const isServer = process.argv[2] === 'server';
  const isStart = process.argv[3] === 'start';
  const keepAlive = keepAliveParams.some((x) => process.argv.includes(x));

  return { binaryName, isServer, isStart, keepAlive };
};

const { binaryName, isServer, isStart, keepAlive } = parseArgv();

if (isServer && isStart && keepAlive && process.argv.includes('--pass-through') === false) {
  const argv = process.argv.slice(4).filter((x) => !keepAliveParams.includes(x));

  const { error, status } = spawn.sync(binaryName, ['server', 'start', ...argv, '--pass-through'], {
    timeout: 3 * 60 * 1000,
    detached: false,
    windowsHide: true, // required for Windows
    shell: false,
    stdio: 'inherit',
  });

  if (error) {
    printError(error.message);
    process.exit(error.errno || -1);
  }

  if (status !== 0) {
    process.exit(status);
  }

  exitWhenServerStopped();
} else {
  require('../lib/commands/index.js');
}
