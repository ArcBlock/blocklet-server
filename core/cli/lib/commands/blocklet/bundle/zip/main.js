/* eslint-disable no-use-before-define */
/* eslint-disable func-names */
const { readdir, lstat } = require('fs');
const { join, resolve, dirname, basename, extname } = require('path');

const cpFile = require('cp-file');
const locatePath = require('locate-path');
const makeDir = require('make-dir');
const pMap = require('p-map');
const { promisify } = require('util');

const { listNodeFiles } = require('./dependencies');
const { zipNodeJs } = require('./node');

const debug = require('../../../../debug')('bundle:zip');

const pReaddir = promisify(readdir);
const pLstat = promisify(lstat);

// reduce `srcFolder/*` (Node.js files) to `destFolder/*.zip` so it can be used by Blocklet Server
const zipEntries = async function ({ srcFolder, destFolder, srcFilter, extraPaths, options = {} }) {
  const { parallelLimit = 5 } = options;
  const srcPaths = await getSrcPaths(srcFolder, srcFilter);

  const zipped = await pMap(srcPaths, (srcPath) => zipEntry({ srcPath, destFolder, extraPaths }), {
    concurrency: parallelLimit,
  });
  return zipped.filter(Boolean);
};

const zipEntry = async function ({ srcPath, destFolder, extraPaths }) {
  const { runtime, filename, extension, srcDir, stat, mainFile } = await getEntryInfo(srcPath);

  if (runtime === undefined) {
    return;
  }

  const srcFiles = await getSrcFiles({ runtime, filename, stat, mainFile, extension, srcPath, srcDir, extraPaths });

  await makeDir(destFolder);

  if (runtime === 'js') {
    if (extension === '.zip') {
      const destPath = join(destFolder, filename);
      await cpFile(srcPath, destPath);
      // eslint-disable-next-line consistent-return
      return { path: destPath, runtime };
    }

    const destPath = join(destFolder, `${basename(filename, '.js')}.zip`);
    const prefix = await zipNodeJs(srcFiles, destPath, filename, mainFile);
    // eslint-disable-next-line consistent-return
    return { path: destPath, prefix, runtime };
  }
};

const getSrcPaths = async function (srcFolder, srcFilter) {
  if (!srcFolder) {
    return [];
  }
  const filenames = await listFilenames(srcFolder);
  const srcPaths = filenames.filter(srcFilter).map((x) => resolve(srcFolder, x));
  debug('getSrcPaths', { srcFolder, srcPaths });
  return srcPaths;
};

const listFilenames = async function (srcFolder) {
  try {
    return await pReaddir(srcFolder);
  } catch (error) {
    throw new Error(`entry folder does not exist: ${srcFolder}`);
  }
};

const getEntryInfo = async function (srcPath) {
  const { filename, stat, mainFile, extension, srcDir } = await getSrcInfo(srcPath);

  if (mainFile === undefined) {
    return {};
  }

  if (extension === '.zip' || extension === '.js') {
    return { runtime: 'js', filename, stat, mainFile, extension, srcPath, srcDir };
  }

  return {};
};

const getSrcInfo = async function (srcPath) {
  const filename = basename(srcPath);
  if (filename === 'node_modules') {
    return {};
  }

  const stat = await pLstat(srcPath);
  const mainFile = await getMainFile(srcPath, filename, stat);
  if (mainFile === undefined) {
    return {};
  }

  const extension = extname(mainFile);
  const srcDir = stat.isDirectory() ? srcPath : dirname(srcPath);
  return { filename, stat, mainFile, extension, srcDir };
};

// Each `srcPath` can also be a directory with an `index.js` file or a file
// using the same filename as its directory
const getMainFile = function (srcPath, filename, stat) {
  if (!stat.isDirectory()) {
    return srcPath;
  }

  return locatePath([join(srcPath, `${filename}.js`), join(srcPath, 'index.js')], { type: 'file' });
};

const getSrcFiles = function ({ runtime, filename, stat, mainFile, extension, srcPath, srcDir, extraPaths }) {
  if (runtime === 'js' && extension === '.js') {
    return listNodeFiles({ srcPath, filename, mainFile, srcDir, stat, extraPaths });
  }

  return [srcPath];
};

module.exports = { zipEntries, zipEntry };
