const chalk = require('chalk');
const { isValid: isValidDid } = require('@arcblock/did');
const isUrl = require('is-url');

const { printError, printInfo, printSuccess, getCLIBinaryName } = require('../../util');
const { getNode } = require('../../node');
const { checkRunning } = require('../../manager');

const checkNodeRunning = async () => {
  const isRunning = await checkRunning();
  if (!isRunning) {
    const startCommand = chalk.cyan(`${getCLIBinaryName()} server start`);
    printError('Blocklet Server is not running, can not execute anything!');
    printInfo(`To start Blocklet Server, use ${startCommand}`);
    process.exit(1);
  }
};

const run = async (value, { appId = '' } = {}) => {
  try {
    await checkNodeRunning();
    const { node } = await getNode();

    printInfo(`Try to set debug config for blocklet ${chalk.cyan(appId)}`);

    if (isValidDid(appId) === false) {
      printError(`appId is not valid: ${appId}`);
      process.exit(1);
    }

    node.onReady(async () => {
      const blocklet = await node.getBlocklet({ did: appId });
      if (!blocklet) {
        printError(`Blocklet ${appId} not found, you should install the blocklet first.`);
        process.exit(1);
      }

      if (isUrl(value)) {
        await node.addBlockletStore({ teamDid: appId, url: value });
      } else if (value === '$stopBlocklet') {
        await node.stopBlocklet({ did: appId, updateStatus: true, silent: true });
      } else {
        await node.configBlocklet({
          did: [appId],
          configs: [{ key: 'DEBUG', value, custom: true, shared: true, secure: false, description: 'Debug mode' }],
          skipHook: true,
        });
      }

      printSuccess('Done!');
      process.exit(0);
    });
  } catch (err) {
    printError(err.message);
    process.exit(1);
  }
};

exports.run = run;
