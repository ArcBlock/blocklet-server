/* eslint-disable no-shadow */
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

const { print, printError, printWarning, printInfo } = require('../../util');
const { getNode } = require('../../node');
const { getDaemonLogDir, checkRunning } = require('../../manager');

const LOG_DATE_FORMAT = 'YYYY-MM-DD';
const DEFAULT_PAGE_SIZE = 20;

const getLatestBusinessLog = (logDir) => {
  if (!fs.existsSync(logDir)) {
    throw new Error(`logs directory: ${logDir} does not exist`);
  }

  const files = fs.readdirSync(logDir);

  if (files.length === 0) {
    return '';
  }

  const businessLogFiles = files.filter((f) => f.startsWith('daemon-') && !f.startsWith('daemon-error'));
  if (businessLogFiles.length === 0) {
    return '';
  }

  let resultFile = businessLogFiles[0];
  const prefixLength = 'daemon-'.length;

  const extractDateFromFilename = (filename) =>
    path.basename(filename, path.extname(filename)).substr(prefixLength, LOG_DATE_FORMAT.length);

  businessLogFiles.forEach((filename) => {
    if (new Date(extractDateFromFilename(filename)) > new Date(extractDateFromFilename(resultFile))) {
      resultFile = filename;
    }
  });

  return path.join(logDir, resultFile);
};

exports.run = async ({ all = false }) => {
  const { node, dataDir } = await getNode({ dir: process.cwd() });

  try {
    const daemonLogDir = getDaemonLogDir(dataDir);
    const businessLogFile = getLatestBusinessLog(daemonLogDir);

    print();
    print(chalk.cyan(chalk.bold('Blocklet Server Logs')));

    if (fs.existsSync(businessLogFile)) {
      print(`- Latest logs: ${businessLogFile}`);
    } else {
      print('- No logs');
    }
    print(`- Daemon Logs Directory: ${daemonLogDir}`);

    print(`\n  ${chalk.cyan('Daemon Logs')}`);
    print('  - access-<date>.log: access logs rotated by day');
    print('  - daemon-<date>.log: business logs rotated by day');
    print('  - daemon-error-<date>.log: error logs rotated by day');
    print('  - service.log: abtnode service logs');
    print('  - stderr.log: stderr logs');
    print('  - stdout.log: stdout logs');

    const isRunning = await checkRunning();
    if (!isRunning) {
      print('');
      printWarning('Unable to get blocklet logs because Blocklet Server is not running');
      process.exit(0);
    }
    const nodeInfo = await node.getNodeInfo();
    if (nodeInfo.initialized) {
      const options = { includeRuntimeInfo: false };
      if (!all) {
        options.paging = { page: 1, pageSize: DEFAULT_PAGE_SIZE };
      }
      const result = await node.getBlocklets(options);
      const blocklets = result.blocklets || [];
      const paging = result.paging || {};

      if (blocklets.length) {
        const total = paging.total || blocklets.length;
        const showing = blocklets.length;

        if (total > showing) {
          print(`\n  ${chalk.cyan(`Blocklet Logs (showing ${showing} of ${total})`)}`);
        } else {
          print(`\n  ${chalk.cyan('Blocklet Logs')}`);
        }

        blocklets.forEach(({ meta }) => {
          print();
          const logsDir = path.join(dataDir, 'logs', meta.name);
          const output = path.join(logsDir, 'output.log');
          const error = path.join(logsDir, 'error.log');
          print(chalk.cyan(chalk.bold(`${meta.name}@${meta.version}`)));
          print(`- Output: ${output}`);
          print(`- Error: ${error}`);
        });

        if (!all && total > showing) {
          print();
          printInfo(`Run ${chalk.cyan('blocklet server logs --all')} to see all blocklet logs`);
        }
      } else {
        printWarning('No blocklets installed yet.');
      }
    }
    process.exit(0);
  } catch (err) {
    printError(`Failed to list log files: ${err.message}`);
    process.exit(1);
  }
};

// eslint-disable-next-line no-underscore-dangle
exports._getLatestBusinessLog = getLatestBusinessLog;
