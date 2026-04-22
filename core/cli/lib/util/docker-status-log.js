const chalk = require('chalk');

function getDockerStatusLog(printInfo, nodeInfo) {
  const { enableDocker, isDockerInstalled } = nodeInfo;
  const unsupportedDockerMsg =
    process.platform === 'darwin'
      ? 'On MacOS, you need to install https://orbstack.dev/ and ensure you have sufficient permissions to run Docker.'
      : 'You need to install Docker and ensure you have sufficient permissions to run it.';

  printInfo('Docker enabled for running blocklets:', enableDocker ? chalk.green('on') : chalk.gray('off'));
  printInfo('Docker installed:', isDockerInstalled ? chalk.green('on') : chalk.gray('off'));
  if (!isDockerInstalled) {
    printInfo('Docker installation:', chalk.yellow(unsupportedDockerMsg));
  }
}

module.exports = getDockerStatusLog;
