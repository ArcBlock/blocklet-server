const fs = require('fs-extra');
const figlet = require('figlet');
const terminalLink = require('terminal-link');
const gradient = require('gradient-string');
const chalk = require('chalk');
const { print } = require('./util/print');
const { INSTALL_FILE_PATH } = require('./constant');

const { green } = chalk;

function echoBrand({ version = '' } = {}) {
  const data = figlet.textSync('ArcBlock', { width: 44 });
  const symbolLen = 44;
  const indent = (symbolLen - 10) / 2;
  const msgList = [`\n${' '.repeat(indent)}Powered By`, data];
  if (version) {
    msgList.push(`${' '.repeat((symbolLen - 20) / 2)}Blocklet CLI v${version}\n`);
  }
  const msg = gradient(['cyan', 'rgb(0, 111, 150)', 'rgb(0, 246,136)']).multiline(msgList.join('\n'));
  print(msg);
}

function echoDocument() {
  const url = 'https://developer.blocklet.io/docs';
  let msg;
  if (terminalLink.isSupported) {
    msg = green(terminalLink(`Documentation: ${url}`, url));
  } else {
    msg = green(`Check documentation in here: ${url}`);
  }
  print('\n', msg, '\n');
  return msg;
}

function isNewInstalled() {
  return fs.existsSync(INSTALL_FILE_PATH);
}

function removeNewInstalled() {
  return fs.removeSync(INSTALL_FILE_PATH);
}

function ensureNewInstalled() {
  return fs.ensureFileSync(INSTALL_FILE_PATH);
}

module.exports = {
  echoBrand,
  echoDocument,
  isNewInstalled,
  removeNewInstalled,
  ensureNewInstalled,
};
