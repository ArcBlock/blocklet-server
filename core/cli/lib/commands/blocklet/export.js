const path = require('path');
const chalk = require('chalk');
const { isValid: isValidDid, toAddress } = require('@arcblock/did');

const { BlockletExporter } = require('@abtnode/core/lib/blocklet/storage/export/exporter');
const { printError, printInfo, printSuccess, getCLIBinaryName } = require('../../util');
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

const run = async ({ appDid: inputAppDid, outDir, includeLogs }) => {
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
    if (!outDir) {
      printError('Please provide --out-dir');
      process.exit(1);
    }

    const appDid = toAddress(inputAppDid);
    const resolvedOutDir = path.resolve(outDir);

    printInfo(`Exporting blocklet ${chalk.cyan(appDid)} to ${chalk.cyan(resolvedOutDir)}`);

    const { node, dataDir } = await getNode({ dir: process.cwd() });

    node.onReady(async () => {
      try {
        const blocklet = await node.getBlocklet({ did: appDid });
        if (!blocklet) {
          printError(`Blocklet ${appDid} not found`);
          process.exit(1);
        }

        printInfo(`Blocklet: ${chalk.cyan(blocklet.meta.title || blocklet.meta.name)} v${blocklet.meta.version}`);

        const exporter = new BlockletExporter({
          appDid,
          outDir: resolvedOutDir,
          serverDir: dataDir,
          options: { includeLogs },
          progressCallback: (msg) => printInfo(msg),
        });

        const meta = await wrapSpinner('Exporting blocklet...', () => exporter.export());

        printSuccess('Export completed successfully!');
        printInfo(`  Output: ${chalk.cyan(resolvedOutDir)}`);
        printInfo(`  AppDid: ${chalk.cyan(meta.appDid)}`);
        printInfo(`  Version: ${chalk.cyan(meta.blockletVersion)}`);
        process.exit(0);
      } catch (err) {
        printError(`Export failed: ${err.message}`);
        process.exit(1);
      }
    });
  } catch (err) {
    printError(err.message);
    process.exit(1);
  }
};

exports.run = run;
