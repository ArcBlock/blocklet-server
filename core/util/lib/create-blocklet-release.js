/* eslint-disable no-console */
const fs = require('fs-extra');
const path = require('path');
const ssri = require('ssri');
const tar = require('tar');
const chalk = require('chalk');
const slugify = require('slugify');
const packList = require('npm-packlist');
const { parse: getBlockletMeta } = require('@blocklet/meta/lib/parse');
const {
  BLOCKLET_RELEASE_FOLDER_NAME,
  BLOCKLET_RELEASE_FILE,
  BLOCKLET_BUNDLE_FOLDER_NAME,
} = require('@blocklet/constant');
const { createArchiveFile } = require('./create-archive-file');

const defaultLogger = {
  info: console.log,
  error: console.error,
};

// TODO add dependencies
// TODO remove code in @abtnode/cli

const createRelease = (
  dir,
  { printError = defaultLogger.error, printInfo = defaultLogger.info, tarball = '', createArchive = false } = {}
) =>
  // eslint-disable-next-line no-async-promise-executor
  new Promise(async (resolve, reject) => {
    const destDir = path.join(dir, BLOCKLET_RELEASE_FOLDER_NAME);
    const srcDir = path.join(dir, BLOCKLET_BUNDLE_FOLDER_NAME);

    let meta;
    try {
      meta = getBlockletMeta(srcDir, {});
    } catch (err) {
      reject(err);
      return;
    }

    meta.dist = {};
    meta.dist.tarball = tarball || `${slugify(meta.name)}-${meta.version}.tgz`;

    const destFile = path.join(destDir, meta.dist.tarball);
    const metaFile = path.join(destDir, BLOCKLET_RELEASE_FILE);

    fs.removeSync(destDir);
    fs.mkdirpSync(destDir);

    printInfo(`Creating release for blocklet ${meta.name}@${meta.version}...`);

    let stream;
    try {
      // https://github.com/npm/npm-packlist
      const files = await packList({ package: {} }, { path: srcDir });

      // https://github.com/npm/node-tar/blob/master/lib/create.js
      await tar.create(
        {
          cwd: srcDir,
          prefix: 'package/',
          portable: true,
          gzip: true,
          file: destFile,
          sync: true,
        },
        files
      );

      printInfo(`Release tarball created: ${chalk.cyan(destFile)}`);

      stream = fs.createReadStream(destFile);
      await ssri
        .fromStream(stream, { algorithms: ['sha512'] })
        .then(async (result) => {
          meta.dist.integrity = result.toString();
          meta.dist.size = fs.statSync(destFile).size;

          fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));

          printInfo(`Release meta created: ${chalk.cyan(metaFile)}`);

          if (createArchive) {
            await createArchiveFile(dir, { printError, printInfo });
          }

          return resolve({ tarball: destFile, meta });
        })
        .catch((err) => {
          stream?.destroy();
          printError(`Failed to create blocklet integrity: ${err.message}`);
          reject(err);
        });
    } catch (err) {
      stream?.destroy();
      printError(`Failed to create blocklet release: ${err.message}`);
      reject(err);
    }
  });

module.exports = { createRelease };
