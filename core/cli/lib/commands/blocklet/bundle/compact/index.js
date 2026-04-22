/* eslint-disable no-await-in-loop */
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { BLOCKLET_BUNDLE_FOLDER, BLOCKLET_ENTRY_FILE } = require('@blocklet/constant');
const { parse: parseBlockletMeta } = require('@blocklet/meta/lib/parse');
const { installExternalDependencies } = require('@abtnode/core/lib/util/install-external-dependencies');

const { print, printSuccess } = require('../../../../util');
const { wrapSpinner } = require('../../../../ui');
const pack = require('../pack');
const { createBlockletBundle, createBlockletEntry, getExtraFiles } = require('../bundle');
const { logTar, getContents } = require('../../../../util/blocklet/tar');
const { bundleMergeExtra } = require('./bundle-merge-extra');
const { defaultExternals } = require('./default-external');

async function deleteNotSelectedFiles(dir, keepFiles) {
  try {
    if (!dir || !(await fs.exists(dir))) {
      return;
    }
    const entries = await fs.readdir(dir);
    for (const entry of entries) {
      if (!entry?.name) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (!fullPath || !(await fs.exists(fullPath))) {
        // eslint-disable-next-line no-continue
        continue;
      }
      if (entry.isDirectory()) {
        await deleteNotSelectedFiles(fullPath, keepFiles);
        const remaining = await fs.readdir(fullPath);
        if (remaining.length === 0) {
          await fs.rmdir(fullPath);
        }
      } else if (entry.isFile()) {
        if (!keepFiles.has(fullPath)) {
          await fs.unlink(fullPath);
        }
      }
    }
  } catch (err) {
    console.error(`Error processing directory ${dir}:`, err);
    throw err;
  }
}

exports.run = async ({
  meta,
  blockletDir,
  createRelease = false,
  createArchive = false,
  inMonoRepo = false,
  withChangeLog = true,
  sourceMap,
  nosourcesSourceMap,
  externalManager,
  minify,
  externals: inputExternals = [],
  dependenciesDepth = 9,
}) => {
  // Merge all external dependencies (deduplicated)
  const externals = Array.from(new Set([...defaultExternals, ...inputExternals]));

  // eslint-disable-next-line no-param-reassign
  meta = meta || parseBlockletMeta(blockletDir);

  const buildOutputDir = path.join(blockletDir, BLOCKLET_BUNDLE_FOLDER);

  if (fs.existsSync(buildOutputDir)) {
    fs.removeSync(buildOutputDir);
  }
  fs.mkdirSync(buildOutputDir, { recursive: true });

  let selectedFiles = [];

  await wrapSpinner(`Creating blocklet bundle in ${chalk.cyan(BLOCKLET_BUNDLE_FOLDER)}...`, async () => {
    if (meta.main && meta.main !== BLOCKLET_ENTRY_FILE) {
      fs.writeFileSync(path.join(buildOutputDir, BLOCKLET_ENTRY_FILE), createBlockletEntry(blockletDir, meta.main));
    }

    selectedFiles = await createBlockletBundle({
      blockletDir,
      meta,
      updates: meta.group === 'dapp' ? { main: BLOCKLET_ENTRY_FILE } : {},
      inMonoRepo,
      withChangeLog,
      compact: true,
    });
  });

  await wrapSpinner(`Bundle single file in ${chalk.cyan(BLOCKLET_BUNDLE_FOLDER)}...`, async () => {
    const apiDir = path.dirname(path.join(buildOutputDir, meta.main));
    const keepFiles = new Set(
      (selectedFiles || [])
        .map((file) => {
          return path.join(buildOutputDir, file);
        })
        .filter(Boolean)
    );
    await deleteNotSelectedFiles(apiDir, keepFiles);
    print('');
    const extraFiles = getExtraFiles(blockletDir, meta).filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

    // clean history builded files
    for (const file of extraFiles) {
      fs.rmSync(path.dirname(path.join(buildOutputDir, file)), { force: true, recursive: true });
    }

    await bundleMergeExtra({
      extraFiles,
      srcPath: blockletDir,
      distDir: buildOutputDir,
      sourceMap,
      nosourcesSourceMap,
      enterFile: meta.main || BLOCKLET_ENTRY_FILE,
      externalManager,
      externals,
      minify,
      dependenciesDepth,
    });
  });

  printSuccess('Using Bun to install external dependencies...');
  await installExternalDependencies({
    appDir: buildOutputDir,
    nodeInfo: { isDockerInstalled: false },
  });
  fs.removeSync(path.join(buildOutputDir, 'node_modules'));
  fs.removeSync(path.join(buildOutputDir, 'node_modules_os_lock'));

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
