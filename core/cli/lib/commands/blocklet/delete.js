const chalk = require('chalk');
const inquirer = require('inquirer');
const { isValid: isValidDid, toAddress } = require('@arcblock/did');
const { BlockletEvents } = require('@blocklet/constant');

const { printError, printInfo, printSuccess, getCLIBinaryName } = require('../../util');
const { getNode } = require('../../node');
const { checkRunning } = require('../../manager');

const checkNodeRunning = async () => {
  const isRunning = await checkRunning();
  if (!isRunning) {
    const startCommand = chalk.cyan(`${getCLIBinaryName()} server start`);
    printError('Blocklet Server is not running!');
    printInfo(`To start Blocklet Server, use ${startCommand}`);
    process.exit(1);
  }
};

const run = async ({ appDid: inputAppDid, yes, keepData }) => {
  try {
    await checkNodeRunning();

    if (!inputAppDid) {
      printError('Please provide --app-did');
      process.exit(1);
    }
    if (!isValidDid(inputAppDid)) {
      printError(`appDid is not valid: ${inputAppDid}`);
      process.exit(1);
    }

    const appDid = toAddress(inputAppDid);

    const { node, publishEvent } = await getNode({ dir: process.cwd() });

    node.onReady(async () => {
      try {
        const blocklet = await node.getBlocklet({ did: appDid });
        if (!blocklet) {
          printError(`Blocklet ${appDid} not found`);
          process.exit(1);
        }

        const title = blocklet.meta.title || blocklet.meta.name;
        printInfo(`Blocklet: ${chalk.cyan(title)} v${blocklet.meta.version}`);
        printInfo(`  DID: ${chalk.cyan(appDid)}`);

        if (!yes) {
          const { confirmDelete } = await inquirer.prompt({
            type: 'confirm',
            name: 'confirmDelete',
            message: keepData
              ? `Delete blocklet "${title}"? (data will be preserved)`
              : `Delete blocklet "${title}" and all its data? This cannot be undone.`,
            default: false,
          });
          if (!confirmDelete) {
            printInfo('Delete cancelled.');
            process.exit(0);
          }
        }

        const keepConfigs = !!keepData;
        const deleted = await node.deleteBlocklet({
          did: appDid,
          keepData: !!keepData,
          keepLogsDir: false,
          keepConfigs,
        });

        try {
          await publishEvent(BlockletEvents.removed, { blocklet: deleted, context: { keepRouting: false } });
        } catch (err) {
          printInfo(`  Could not notify daemon for routing cleanup: ${err.message}`);
          printInfo('  You may need to restart the server for routing to take effect.');
        }

        printSuccess(`Blocklet "${title}" has been deleted.`);
        process.exit(0);
      } catch (err) {
        printError(`Delete failed: ${err.message}`);
        process.exit(1);
      }
    });
  } catch (err) {
    printError(err.message);
    process.exit(1);
  }
};

exports.run = run;
