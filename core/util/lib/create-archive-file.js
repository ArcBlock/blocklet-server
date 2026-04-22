/* eslint-disable no-console */
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { BLOCKLET_RELEASE_FOLDER_NAME, BLOCKLET_RELEASE_FILE } = require('@blocklet/constant');
const createArchive = require('archiver');

const defaultLogger = {
  info: console.log,
  error: console.error,
};

const createArchiveFile = (dir, { printError = defaultLogger.error, printInfo = defaultLogger.info } = {}) => {
  const destDir = path.join(dir, BLOCKLET_RELEASE_FOLDER_NAME);
  const meta = JSON.parse(fs.readFileSync(path.join(destDir, BLOCKLET_RELEASE_FILE), 'utf8'));
  const releaseFile = path.join(dir, `${meta.title || meta.name}-${meta.version}.zip`);
  const archive = createArchive('zip', { zlib: { level: 9 } });
  const output = fs.createWriteStream(releaseFile);

  return new Promise((res, rej) => {
    archive.on('error', (err) => {
      printError(`Failed to create archive file: ${err.message}`);
      rej(err);
    });
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        printInfo(`Failed to create archive file: ${err.message}`);
      } else {
        rej(err);
      }
    });
    output.on('close', () => {
      const releaseFileSize = fs.statSync(releaseFile).size || 0;
      printInfo(`Created archive file: ${chalk.cyan(releaseFile)} ${(releaseFileSize / 1024).toFixed(2)} KB`);
      res();
    });
    archive.pipe(output);
    archive.directory(destDir, false);
    archive.finalize();
  });
};

module.exports = { createArchiveFile };
