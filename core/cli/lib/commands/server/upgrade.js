const path = require('path');
const shell = require('shelljs');
const semver = require('semver');
const chalk = require('chalk');
const fs = require('fs');

const { canReadAndWriteDir } = require('@abtnode/util/lib/fs');
const { getInstaller, getInstallCommands } = require('@abtnode/util/lib/get-installer');
const {
  print,
  printError,
  printInfo,
  printSuccess,
  printWarning,
  getCLIBinaryName,
  getCLICommandName,
} = require('../../util');
const { version, name } = require('../../../package.json');
const { checkRunning, getRunningConfigDataDir } = require('../../manager');
const debug = require('../../debug')('upgrade');

// auto throw error when sync run shell.xxx
// must run sync
const wrap =
  (shellFn) =>
  (...args) => {
    const { code, stdout, stderr } = shellFn.apply(shell, args);
    if (code !== 0) {
      throw new Error(stderr);
    }
    return stdout;
  };

const getLatestVersion = () => {
  const stdout = wrap(shell.exec)(`npm show ${name} version`, {
    silent: true,
  });
  return stdout.trim();
};

const checkUpdate = (current, latest) => semver.gt(latest, current);

const stopNode = () => {
  printInfo('Stopping Blocklet Server ...');
  wrap(shell.exec)(`${getCLICommandName()} stop`, {
    silent: true,
  });
};

const installNode = () => {
  const commandName = getCLICommandName();
  const packageName = commandName === 'abtnode' ? '@abtnode/cli' : '@blocklet/cli';
  const binaryName = getCLIBinaryName();
  const installer = getInstaller(binaryName);
  const commands = getInstallCommands({ packageName });
  const command = commands[installer];

  printInfo(`Installing Blocklet Server by ${chalk.cyan(command)} ...`);

  wrap(shell.exec)(command, {
    silent: false,
  });
};

const restartNode = (originalRunningDataDir) => {
  const currentWorkingDataDir = process.cwd();
  debug('original running data directory', originalRunningDataDir);
  debug('current working data directory', currentWorkingDataDir);

  printInfo('Restarting Blocklet Server ...');

  if (!fs.existsSync(originalRunningDataDir)) {
    printWarning('Original running data directory does not exists, abort restart!');
    return;
  }

  wrap(shell.exec)(`${getCLICommandName()} start`, {
    silent: false,
    cwd: originalRunningDataDir,
  });
};

exports.run = async () => {
  // save current bin path
  const binaryName = getCLIBinaryName();
  const commandName = getCLICommandName();
  const curBinPath = wrap(shell.which)(binaryName, { silent: true });
  printInfo('Using blocklet server from', chalk.cyan(curBinPath));

  // Check permissions
  printInfo('Checking permissions...');
  if (canReadAndWriteDir(path.dirname(curBinPath)) === false) {
    printError('Seems you do not have permission to upgrade Blocklet Server version');
    printInfo(`Maybe you can try run ${chalk.cyan(`sudo ${commandName} upgrade`)}`);
    process.exit(1);
  }

  const latestVersion = await getLatestVersion();
  const needUpdate = await checkUpdate(version, latestVersion);
  if (!needUpdate) {
    print(`The current version ${version} is the latest version, no need to upgrade`);
    process.exit(0);
  }
  print(`Current version is ${version}, found latest version ${latestVersion}`);
  print('Begin upgrade');

  // Do not start/stop the node when run as root
  const isRunning = await checkRunning();
  const runningDataDir = await getRunningConfigDataDir();

  const needRestart = isRunning;
  if (isRunning) {
    await stopNode();
  }
  await installNode();

  if (needRestart) {
    await restartNode(runningDataDir);
  }

  printSuccess(`Blocklet Server upgrade success, current version is ${latestVersion}`);
  process.exit(0);
};
