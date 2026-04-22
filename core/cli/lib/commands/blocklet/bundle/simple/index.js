/* eslint-disable no-await-in-loop */
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { BLOCKLET_BUNDLE_FOLDER, BLOCKLET_ENTRY_FILE } = require('@blocklet/constant');
const { parse: parseBlockletMeta } = require('@blocklet/meta/lib/parse');

const { print, printSuccess } = require('../../../../util');
const { wrapSpinner } = require('../../../../ui');
const pack = require('../pack');
const { createBlockletBundle, createBlockletEntry } = require('../bundle');
const { logTar, getContents } = require('../../../../util/blocklet/tar');

exports.run = async ({
  meta,
  blockletDir,
  createRelease = false,
  createArchive = false,
  inMonoRepo = false,
  withChangeLog = true,
  externals = [],
  externalManager = 'npm',
}) => {
  // eslint-disable-next-line no-param-reassign
  meta = meta || parseBlockletMeta(blockletDir);

  const distDir = path.join(blockletDir, BLOCKLET_BUNDLE_FOLDER);

  if (fs.existsSync(distDir)) {
    fs.removeSync(distDir);
  } else {
    fs.mkdirSync(distDir, { recursive: true });
  }

  await wrapSpinner(`Creating blocklet bundle in ${chalk.cyan(BLOCKLET_BUNDLE_FOLDER)}...`, async () => {
    if (meta.main && meta.main !== BLOCKLET_ENTRY_FILE) {
      fs.writeFileSync(path.join(distDir, BLOCKLET_ENTRY_FILE), createBlockletEntry(blockletDir, meta.main));
    }

    await createBlockletBundle({
      blockletDir,
      meta,
      updates: meta.group === 'dapp' ? { main: BLOCKLET_ENTRY_FILE } : {},
      inMonoRepo,
      withChangeLog,
      externals,
      externalManager,
    });
  });

  // print total stats
  printSuccess(`Blocklet ${chalk.cyan(`${meta.name}@${meta.version}`)} was successfully bundled!`);

  if (createRelease) {
    print('');
    // eslint-disable-next-line no-shadow
    const { tarball, meta } = await pack(blockletDir, { createArchive });
    const pkgContents = await getContents(meta, tarball);
    logTar(pkgContents);
  }

  process.exit(0);
};
