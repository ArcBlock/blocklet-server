/* eslint-disable no-await-in-loop */
/**
 * Install Utilities Module
 *
 * Functions for blocklet installation, verification, and bundle management
 * Extracted from blocklet.js for better modularity
 */

const fs = require('fs-extra');
const path = require('node:path');
const get = require('lodash/get');
const streamToPromise = require('stream-to-promise');
const { Throttle } = require('stream-throttle');
const ssri = require('ssri');
const diff = require('deep-diff');

const logger = require('@abtnode/logger')('@abtnode/core:util:blocklet:install-utils');
const formatBackSlash = require('@abtnode/util/lib/format-back-slash');
const hashFiles = require('@abtnode/util/lib/hash-files');
const { createSafeTarExtractStream } = require('@abtnode/util/lib/safe-tar');
const { BLOCKLET_INSTALL_TYPE } = require('@abtnode/constant');

const { BlockletStatus, BlockletSource, fromBlockletStatus } = require('@blocklet/constant');
const { forEachBlockletSync } = require('@blocklet/meta/lib/util');

/**
 * Get version scope string with hash for unique directory naming
 * @param {object} meta - Blocklet meta
 * @returns {string} Version scope string
 */
const getVersionScope = (meta) => {
  if (meta.dist?.integrity) {
    const safeHash = meta.dist.integrity
      .replace('sha512-', '')
      .slice(0, 8)
      .replace(/[^a-zA-Z0-9]/g, '');
    return `${meta.version}-${safeHash}`;
  }

  return meta.version;
};

/**
 * Expand tarball to destination directory
 * @param {object} options - Options
 * @param {string} options.source - Source tarball path
 * @param {string} options.dest - Destination directory
 * @param {number} options.strip - Number of leading directories to strip (default: 1)
 * @returns {Promise<string>} Destination path
 */
const expandTarball = async ({ source, dest, strip = 1 }) => {
  logger.info('expand blocklet', { source, dest });

  if (!fs.existsSync(source)) {
    throw new Error(`Blocklet tarball ${source} does not exist`);
  }

  fs.mkdirSync(dest, { recursive: true });

  await streamToPromise(
    fs
      .createReadStream(source)
      .pipe(new Throttle({ rate: 1024 * 1024 * 20 })) // 20MB
      .pipe(createSafeTarExtractStream({ cwd: dest, strip }))
  );

  return dest;
};

/**
 * Verify file integrity using SSRI
 * @param {object} options - Options
 * @param {string} options.file - File path
 * @param {string} options.integrity - Expected integrity hash
 * @returns {Promise<boolean>} True if valid
 */
const verifyIntegrity = async ({ file, integrity: expected }) => {
  const stream = fs.createReadStream(file);
  const result = await ssri.checkStream(stream, ssri.parse(expected));
  logger.debug('verify integrity result', { result });
  stream.destroy();
  return true;
};

/**
 * Get all app directories from install directory
 * @param {string} installDir - Installation directory
 * @returns {Promise<Array<{ key: string, dir: string }>>} App directories
 */
const getAppDirs = async (installDir) => {
  const appDirs = [];

  const getNextLevel = (level, name) => {
    if (level === 'root') {
      if (name.startsWith('@')) {
        return 'scope';
      }
      return 'name';
    }
    if (level === 'scope') {
      return 'name';
    }
    if (level === 'name') {
      return 'version';
    }
    throw new Error(`Invalid level ${level}`);
  };

  const fillAppDirs = async (dir, level = 'root') => {
    if (level === 'version') {
      appDirs.push({
        key: formatBackSlash(path.relative(installDir, dir)),
        dir,
      });

      return;
    }

    const nextDirs = [];
    for (const x of await fs.promises.readdir(dir)) {
      if (!fs.lstatSync(path.join(dir, x)).isDirectory()) {
        logger.error('pruneBlockletBundle: invalid file in bundle storage', { dir, file: x });
        // eslint-disable-next-line no-continue
        continue;
      }
      nextDirs.push(x);
    }

    for (const x of nextDirs) {
      await fillAppDirs(path.join(dir, x), getNextLevel(level, x));
    }
  };

  await fillAppDirs(installDir, 'root');

  return appDirs;
};

/**
 * Prune unused blocklet bundles from install directory
 * @param {object} options - Options
 * @param {Array} options.blocklets - Current blocklets
 * @param {string} options.installDir - Installation directory
 * @param {Array} options.blockletSettings - Blocklet settings with children
 */
const pruneBlockletBundle = async ({ blocklets, installDir, blockletSettings }) => {
  for (const blocklet of blocklets) {
    if (
      [
        BlockletStatus.waiting,
        BlockletStatus.installing,
        BlockletStatus.upgrading,
        BlockletStatus.downloading,
      ].includes(blocklet.status)
    ) {
      logger.info('There are blocklet activities in progress, abort pruning', {
        bundleName: blocklet.meta.bundleName,
        status: fromBlockletStatus(blocklet.status),
      });
      return;
    }
  }

  // blockletMap: { <[scope/]name/version>: true }
  const blockletMap = {};
  for (const blocklet of blocklets) {
    forEachBlockletSync(blocklet, (component) => {
      blockletMap[`${component.meta.bundleName}/${component.meta.version}`] = true;
      blockletMap[`${component.meta.bundleName}/${getVersionScope(component.meta)}`] = true;
    });
  }
  for (const setting of blockletSettings) {
    for (const child of setting.children || []) {
      if (child.status !== BlockletStatus.deleted) {
        forEachBlockletSync(child, (component) => {
          blockletMap[`${component.meta.bundleName}/${component.meta.version}`] = true;
          blockletMap[`${component.meta.bundleName}/${getVersionScope(component.meta)}`] = true;
        });
      }
    }
  }

  // fill appDirs
  let appDirs = [];
  try {
    appDirs = await getAppDirs(installDir);
  } catch (error) {
    logger.error('fill app dirs failed', { error });
  }

  const ensureBundleDirRemoved = async (dir) => {
    const relativeDir = path.relative(installDir, dir);
    const arr = relativeDir.split(path.sep).filter(Boolean);
    const { length } = arr;
    const bundleName = arr[length - 2];
    const scopeName = length > 2 ? arr[length - 3] : '';
    const bundleDir = path.join(installDir, scopeName, bundleName);
    const isDirEmpty = (await fs.promises.readdir(bundleDir)).length === 0;
    if (isDirEmpty) {
      logger.info('Remove bundle folder', { bundleDir });
      await fs.remove(bundleDir);
    }
    if (scopeName) {
      const scopeDir = path.join(installDir, scopeName);
      const isScopeEmpty = (await fs.promises.readdir(scopeDir)).length === 0;
      if (isScopeEmpty) {
        logger.info('Remove scope folder', { scopeDir });
        await fs.remove(scopeDir);
      }
    }
  };

  // remove trash
  for (const app of appDirs) {
    if (!blockletMap[app.key]) {
      logger.info('Remove app folder', { dir: app.dir });
      await fs.remove(app.dir);
      await ensureBundleDirRemoved(app.dir);
    }
  }

  logger.info('Blocklet source folder has been pruned');
};

/**
 * Get install type from params
 * @param {object} params - Install params
 * @returns {string} BLOCKLET_INSTALL_TYPE
 */
const getTypeFromInstallParams = (params) => {
  if (params.type) {
    if (!Object.values(BLOCKLET_INSTALL_TYPE).includes(params.type)) {
      throw new Error(`Can only install blocklet from ${Object.values(BLOCKLET_INSTALL_TYPE).join('/')}`);
    }
    return params.type;
  }

  if (params.url) {
    return BLOCKLET_INSTALL_TYPE.URL;
  }

  if (params.file) {
    throw new Error('install from upload is not supported');
  }

  if (params.did) {
    return BLOCKLET_INSTALL_TYPE.STORE;
  }

  if (params.title && params.description) {
    return BLOCKLET_INSTALL_TYPE.CREATE;
  }

  throw new Error(`Can only install blocklet from ${Object.values(BLOCKLET_INSTALL_TYPE).join('/')}`);
};

/**
 * Get diff files between input files and source directory
 * @param {Array} inputFiles - Input files with hash
 * @param {string} sourceDir - Source directory
 * @returns {Promise<{ addSet: Array, changeSet: Array, deleteSet: Array }>}
 */
const getDiffFiles = async (inputFiles, sourceDir) => {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`${sourceDir} does not exist`);
  }

  const files = inputFiles.reduce((obj, item) => {
    obj[item.file] = item.hash;
    return obj;
  }, {});

  const { files: sourceFiles } = await hashFiles(sourceDir, {
    filter: (x) => x.indexOf('node_modules') === -1,
    concurrentHash: 1,
  });

  const addSet = [];
  const changeSet = [];
  const deleteSet = [];

  const diffFiles = diff(sourceFiles, files);
  if (diffFiles) {
    diffFiles.forEach((item) => {
      if (item.kind === 'D') {
        deleteSet.push(item.path[0]);
      }
      if (item.kind === 'E') {
        changeSet.push(item.path[0]);
      }
      if (item.kind === 'N') {
        addSet.push(item.path[0]);
      }
    });
  }

  return {
    addSet,
    changeSet,
    deleteSet,
  };
};

const checkCompatibleOnce = {};

/**
 * Check compatibility with old blocklets that use blocklet.yml
 * @param {string} dir - Directory to check
 * @returns {boolean}
 */
const compatibleWithOldBlocklets = (dir) => {
  if (checkCompatibleOnce[dir] !== undefined) {
    return checkCompatibleOnce[dir];
  }

  checkCompatibleOnce[dir] = !!fs.existsSync(path.join(dir, 'blocklet.yml'));

  return checkCompatibleOnce[dir];
};

/**
 * Get bundle directory for blocklet
 * @param {string} installDir - Installation directory
 * @param {object} meta - Blocklet meta
 * @returns {string} Bundle directory path
 */
const getBundleDir = (installDir, meta) => {
  const oldDir = path.join(installDir, meta.bundleName || meta.name, meta.version);
  if (compatibleWithOldBlocklets(oldDir)) {
    return oldDir;
  }

  return path.join(installDir, meta.bundleName || meta.name, getVersionScope(meta));
};

/**
 * Check if blocklet needs to be downloaded
 * @param {object} blocklet - New blocklet
 * @param {object} oldBlocklet - Existing blocklet
 * @returns {boolean}
 */
const needBlockletDownload = (blocklet, oldBlocklet) => {
  if ([BlockletSource.upload, BlockletSource.local, BlockletSource.custom].includes(blocklet.source)) {
    return false;
  }

  if (!get(oldBlocklet, 'meta.dist.integrity')) {
    return true;
  }

  return get(oldBlocklet, 'meta.dist.integrity') !== get(blocklet, 'meta.dist.integrity');
};

module.exports = {
  getVersionScope,
  expandTarball,
  verifyIntegrity,
  getAppDirs,
  pruneBlockletBundle,
  getTypeFromInstallParams,
  getDiffFiles,
  compatibleWithOldBlocklets,
  getBundleDir,
  needBlockletDownload,
};
