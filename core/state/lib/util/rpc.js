/* eslint-disable no-console */
const axon = require('axon');
const kill = require('kill-port');
const path = require('path');
const spawn = require('cross-spawn');

const logger = require('@abtnode/logger')('@abtnode/core:rpc');

const host = '127.0.0.1';
const port = Number(process.env.ABT_NODE_UPDATER_PORT || 40405);

const doRpcCall = (message) =>
  new Promise((resolve) => {
    logger.info('try send rpc request', message);
    const sock = axon.socket('req');
    sock.connect(port, host);
    sock.on('connect', () => {
      sock.send(JSON.stringify(message), (result) => {
        logger.info('receive rpc response', result);
        sock.close();
        resolve(result);
      });
    });
  });

const startRpcServer = async () => {
  try {
    await kill(port, 'tcp');
    console.info('Killed existing rpc server');
  } catch (err) {
    console.error('Failed to kill existing rpc server', err);
  }

  console.info(`Rpc Server started on ${new Date().toISOString()}`);
  const child = spawn('node', [path.join(__dirname, '../processes/updater.js')], {
    detached: true,
    windowsHide: true, // required for Windows
    cwd: process.cwd(),
    timeout: 60 * 60 * 1000, // 60 minutes
    shell: process.env.SHELL || false,
    stdio: ['ignore', process.stdout, process.stderr],
    env: {
      PATH: process.env.PATH,
      PM2_HOME: process.env.PM2_HOME,
      NODE_ENV: 'production',
      ABT_NODE_UPDATER_PORT: process.env.ABT_NODE_UPDATER_PORT,
      ABT_NODE_PACKAGE_NAME: process.env.ABT_NODE_PACKAGE_NAME,
      ABT_NODE_BINARY_NAME: process.env.ABT_NODE_BINARY_NAME,
      ABT_NODE_COMMAND_NAME: process.env.ABT_NODE_COMMAND_NAME,
    },
  });

  child.on('error', (err) => {
    console.error('Rpc Server errored', err);
  });

  child.on('close', (code) => {
    console.info(`Rpc Server exited with code ${code} on ${new Date().toISOString()}`);
  });

  child.unref();
};

module.exports = { doRpcCall, startRpcServer };

// Following script used to test the upgrade process
// process.env.SHELL = '/opt/homebrew/bin/zsh';
// process.env.PM2_HOME = '/Users/wangshijun/.arcblock/abtnode';
// process.env.ABT_NODE_UPDATER_PORT = '40405';
// process.env.ABT_NODE_PACKAGE_NAME = '@blocklet/cli';
// process.env.ABT_NODE_BINARY_NAME = 'blocklet';
// process.env.ABT_NODE_COMMAND_NAME = 'blocklet server';
// startRpcServer().then(async () => {
//   let result = await doRpcCall({ command: 'verify', version: '1.16.5' });
//   console.log(result);
//   result = await doRpcCall({ command: 'shutdown', version: '1.16.5' });
//   console.log(result);
// });
