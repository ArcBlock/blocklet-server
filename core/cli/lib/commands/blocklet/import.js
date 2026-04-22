const path = require('path');
const chalk = require('chalk');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const { BlockletEvents } = require('@blocklet/constant');

const { printError, printInfo, printSuccess, printWarning, getCLIBinaryName } = require('../../util');
const { getNode } = require('../../node');
const { checkRunning } = require('../../manager');
const { wrapSpinner } = require('../../ui');

const checkNodeRunning = async () => {
  const isRunning = await checkRunning();
  if (!isRunning) {
    const startCommand = chalk.cyan(`${getCLIBinaryName()} server start`);
    printError('Blocklet Server is not running!');
    printInfo(`To start Blocklet Server, use ${startCommand}`);
    process.exit(1);
  }
};

const run = async (inputDir) => {
  try {
    await checkNodeRunning();

    if (!inputDir) {
      printError('Please provide <input-dir>');
      process.exit(1);
    }

    const resolvedDir = path.resolve(inputDir);
    if (!fs.existsSync(resolvedDir)) {
      printError(`Input directory does not exist: ${resolvedDir}`);
      process.exit(1);
    }

    const metaPath = path.join(resolvedDir, 'export-meta.json');
    if (!fs.existsSync(metaPath)) {
      printError(`No export-meta.json found in: ${resolvedDir}`);
      process.exit(1);
    }

    const meta = fs.readJSONSync(metaPath);
    printInfo(`Importing blocklet: ${chalk.cyan(meta.blockletTitle || meta.blockletName)} v${meta.blockletVersion}`);
    printInfo(`  Source server: ${chalk.cyan(meta.sourceServerDid)}`);
    printInfo(`  AppDid: ${chalk.cyan(meta.appDid)}`);
    printInfo(`  Exported at: ${chalk.cyan(meta.exportedAt)}`);

    const { node, publishEvent } = await getNode({ dir: process.cwd() });

    node.onReady(async () => {
      try {
        let overwrite = false;
        const existing = await node.hasBlocklet({ did: meta.blockletDid });
        if (existing) {
          printWarning(
            `Blocklet ${chalk.cyan(meta.blockletTitle || meta.blockletName)} already exists on this server.`
          );
          const { confirmOverwrite } = await inquirer.prompt({
            type: 'confirm',
            name: 'confirmOverwrite',
            message: 'Delete existing blocklet and import? All existing data will be lost.',
            default: false,
          });
          if (!confirmOverwrite) {
            printInfo('Import cancelled.');
            process.exit(0);
          }
          overwrite = true;
        }

        const result = await wrapSpinner('Importing blocklet...', () =>
          node.importBlocklet({
            inputDir: resolvedDir,
            overwrite,
            blockletDid: meta.blockletDid,
            progressCallback: (msg) => printInfo(msg),
          })
        );

        // Notify daemon to set up routing for the imported blocklet via WebSocket.
        // The daemon's WS handler calls handleBlockletEvent which triggers ensureBlockletRouting
        // and nginx config generation. The eventHub doesn't work for CLI→daemon because
        // ABT_NODE_SK is not set in CLI mode (isCLI() depends on its absence).
        try {
          await publishEvent(BlockletEvents.installed, { blocklet: result.blocklet, context: {} });
          printInfo('  Routing: daemon notified');
        } catch (err) {
          printWarning(`  Could not notify daemon for routing setup: ${err.message}`);
          printWarning('  You may need to restart the server for routing to take effect.');
        }

        printSuccess('Import completed successfully!');
        printInfo(`  Blocklet: ${chalk.cyan(result.meta.blockletTitle || result.meta.blockletName)}`);
        printInfo(`  AppDid: ${chalk.cyan(result.meta.appDid)}`);
        process.exit(0);
      } catch (err) {
        printError(`Import failed: ${err.message}`);
        process.exit(1);
      }
    });
  } catch (err) {
    printError(err.message);
    process.exit(1);
  }
};

exports.run = run;
