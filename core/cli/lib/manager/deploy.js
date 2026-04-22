const chalk = require('chalk');
const { fileFilter, checkMatch } = require('@abtnode/util/lib/check-file');

const { print, printInfo } = require('../util');

const printDeployFileInfo = (adds, changes, deletes) => {
  const padLeft = '  - ';
  printInfo(`Added Files: ${chalk.cyan(adds.length)}`);
  adds.forEach((f) => print(padLeft, f));
  if (typeof changes !== 'undefined') {
    printInfo(`Changed Files: ${chalk.cyan(changes.length)}`);
    changes.forEach((f) => print(padLeft, f));
  }
  if (typeof deletes !== 'undefined') {
    printInfo(`Deleted Files: ${chalk.cyan(deletes.length)}`);
    deletes.forEach((f) => print(padLeft, f));
  }
};

module.exports = {
  fileFilter,
  printDeployFileInfo,
  checkMatch,
};
