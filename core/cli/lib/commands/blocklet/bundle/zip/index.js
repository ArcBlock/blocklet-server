/* eslint-disable no-console */
const fs = require('fs-extra');
const chalk = require('chalk');
const { join, dirname, basename, extname, relative } = require('path');
const { BLOCKLET_BUNDLE_FOLDER, BLOCKLET_BUNDLE_FILE, BLOCKLET_ENTRY_FILE } = require('@blocklet/constant');
const { parse: parseBlockletMeta } = require('@blocklet/meta/lib/parse');
const detectWorkspace = require('@abtnode/util/lib/detect-workspace');

const { print, printInfo, printSuccess, printError } = require('../../../../util');
const { wrapSpinner } = require('../../../../ui');
const main = require('./main');
const pack = require('../pack');
const { createBlockletBundle, createBlockletEntry, getExtraFiles } = require('../bundle');
const { logTar, getContents } = require('../../../../util/blocklet/tar');

const debug = require('../../../../debug')('bundle:zip');

module.exports.run = async ({
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
  meta = meta || parseBlockletMeta(blockletDir, { ensureFiles: true });

  const destFolder = join(blockletDir, BLOCKLET_BUNDLE_FOLDER);

  if (fs.existsSync(destFolder)) {
    fs.removeSync(destFolder);
  } else {
    fs.mkdirSync(destFolder, { recursive: true });
  }

  const workspace = detectWorkspace(blockletDir);
  const extraFiles = getExtraFiles(blockletDir, meta);

  const zipConfig = {
    options: {},
    destFolder,
    extraPaths: [],
    skippable: true,
  };

  const mainPath = join(blockletDir, meta.main || '/');
  const hasMainFile = fs.statSync(mainPath).isFile();

  // 1. for dapp entry
  if (hasMainFile) {
    zipConfig.srcFolder = dirname(mainPath);
    zipConfig.srcFile = basename(mainPath);
    zipConfig.srcFilter = (x) => [zipConfig.srcFile].includes(x);
    zipConfig.skippable = false;
  }

  // 2. for hook scripts
  if (extraFiles.length) {
    zipConfig.extraPaths = extraFiles.map((x) => join(blockletDir, x));
    zipConfig.skippable = false;
  }

  // 3. static blocklets may also include hook scripts
  if (!zipConfig.srcFile && extraFiles.length) {
    const srcFile = zipConfig.extraPaths.shift();
    zipConfig.srcFolder = dirname(srcFile);
    zipConfig.srcFile = basename(srcFile);
    zipConfig.srcFilter = (x) => [zipConfig.srcFile].includes(x);
    zipConfig.skippable = false;
  }
  debug('config', zipConfig);
  debug('workspace', workspace);

  // 4. create zip bundles
  let archive;
  if (zipConfig.skippable === false) {
    const archives = await wrapSpinner(`Bundle blocklet from entry: ${chalk.cyan(meta.main)}`, () =>
      main.zipEntries(zipConfig)
    );
    debug('archives', archives);

    [archive] = archives;
    if (!archive) {
      printError('Failed to create zipped bundle');
      process.exit(1);
    }
  }

  // 5. handle extraFiles
  const entryParts = ['.'];
  let relativePath = '';

  if (inMonoRepo && workspace) {
    relativePath = relative(workspace.dir, blockletDir);
  } else if (archive) {
    relativePath = relative(archive.prefix, blockletDir);
  }
  if (relativePath) {
    entryParts.push(relativePath);
    extraFiles.forEach((f) => {
      if (extname(f) === '.js') {
        const absoluteFilepath = join(blockletDir, BLOCKLET_BUNDLE_FOLDER, f);
        fs.ensureDirSync(dirname(absoluteFilepath));

        const requirePath = relative(
          dirname(absoluteFilepath),
          join(blockletDir, BLOCKLET_BUNDLE_FOLDER, relativePath, f)
        );
        fs.writeFileSync(absoluteFilepath, createBlockletEntry(blockletDir, requirePath));
      }
    });
  }

  // 6. produce a `blocklet.js` file
  let outputFile;
  if (hasMainFile) {
    entryParts.push(meta.main);
    outputFile = join(blockletDir, BLOCKLET_BUNDLE_FOLDER, BLOCKLET_ENTRY_FILE);
    fs.writeFileSync(outputFile, createBlockletEntry(blockletDir, entryParts.filter(Boolean).join('/')));
  }

  // 7. rename bundle to blocklet.zip
  let outputZip;
  if (archive) {
    outputZip = join(blockletDir, BLOCKLET_BUNDLE_FOLDER, BLOCKLET_BUNDLE_FILE);
    fs.renameSync(archive.path, outputZip);
  }

  print('');
  printInfo(`Source: ${mainPath}`);
  if (outputFile) {
    printInfo(`Entry: ${outputFile}`);
  }
  if (outputZip) {
    printInfo(`Archive: ${outputZip}`);
  }

  // 8. create bundle
  await wrapSpinner(`Creating blocklet bundle in ${chalk.cyan(BLOCKLET_BUNDLE_FOLDER)}...`, async () => {
    await createBlockletBundle({
      blockletDir,
      meta,
      updates: hasMainFile ? { main: basename(outputZip) } : {},
      inMonoRepo,
      withChangeLog,
      externals,
      externalManager,
    });
  });

  printSuccess(`Blocklet ${chalk.cyan(`${meta.name}@${meta.version}`)} is successfully bundled!`);

  // 9. create release
  if (createRelease) {
    print('');
    // eslint-disable-next-line no-shadow
    const { tarball, meta } = await pack(blockletDir, { createArchive });
    const pkgContents = await getContents(meta, tarball);
    logTar(pkgContents);
  }

  process.exit(0);
};
