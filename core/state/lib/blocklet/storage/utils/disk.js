/* eslint-disable no-console */

const fs = require('fs-extra');
const { join, basename } = require('path');
const logger = require('@abtnode/logger')('@abtnode/core:storage:utils:disk');
const FastGlob = require('fast-glob');
const mapValues = require('lodash/mapValues');
const xbytes = require('xbytes');

const backupDirName = '_abtnode/backup';
const restoreDirName = 'tmp/restore-disk';

/**
 * @description
 * @param {string} dataDir
 * @return {any[]}
 */
const getBackupList = (dataDir) => {
  const baseBackupDir = join(dataDir, backupDirName);
  const backupList = [];
  const appDidList = fs.existsSync(baseBackupDir) ? fs.readdirSync(baseBackupDir) : [];

  appDidList.forEach((appDid) => {
    const metaFile = join(baseBackupDir, appDid, 'meta.json');
    if (fs.existsSync(metaFile)) {
      try {
        const meta = fs.readJsonSync(metaFile);
        if (meta.appDid === appDid) {
          backupList.push(meta);
        }
      } catch (error) {
        logger.error('read meta.json error', error);
      }
    }
  });

  return backupList;
};

/**
 *
 * @param {string} dataDir
 * @param {string} appDid
 * @returns {Promise<boolean>}
 */
const removeBackup = async (dataDir, appDid) => {
  try {
    const baseBackupDir = join(dataDir, backupDirName);
    const backupDir = join(baseBackupDir, appDid);
    if (fs.existsSync(backupDir)) {
      await fs.remove(backupDir);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('remove backup error', error);
    return false;
  }
};

const getBackupDirs = (serverDir, appDid) => {
  const baseBackupDir = join(serverDir, 'data', backupDirName, appDid);
  const backupDir = join(baseBackupDir, appDid);
  const restoreDir = join(serverDir, restoreDirName, appDid);
  return {
    baseBackupDir,
    backupDir,
    restoreDir,
  };
};

/**
 * @description
 * @param {string} folderPath
 * @return {number}
 */
function getFolderSize(folderPath) {
  let totalSize = 0;
  const stack = [folderPath];

  while (stack.length) {
    const currentPath = stack.pop();
    const stats = fs.statSync(currentPath);

    if (stats.isFile()) {
      totalSize += stats.size;
    } else if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach((file) => {
        const filePath = join(currentPath, file);
        stack.push(filePath);
      });
    }
  }

  return totalSize;
}

/**
 * @description
 * @param {string} path
 * @param {string} [prefix='']
 * @return {Promise<Array<import('@did-space/core').Object>>}
 */
// eslint-disable-next-line require-await
async function getFolderObjects(path, prefix = '') {
  // @note: 我尝试动手解析 .gitignore 文件，但是发现 fast-glob 不支持解析它的规则，并找到了对应的 issue: https://github.com/mrmlnc/fast-glob/issues/265#issue-579211456
  const ignore = ['**/node_modules/**', '**/.next/**', '**/.DS_Store'];
  const stream = FastGlob.stream('**', {
    cwd: path,
    objectMode: true,
    stats: true,
    onlyFiles: true,
    absolute: true,
    dot: true,
    concurrency: 2,
    ignore,
  });

  const objects = [];
  // eslint-disable-next-line no-unreachable-loop
  for await (const element of stream) {
    /**
     * @type {import('fast-glob').Entry}
     */
    const entry = element;
    const key = entry.path.replace(path, prefix);
    const { stats } = entry;

    objects.push({
      key,
      name: basename(key),
      size: stats.size,
      lastModified: new Date(stats.mtime).getTime(),
      absolutePath: entry.path,
    });
  }

  return objects;
}

/**
 * @description
 * @param {string} absolutePath
 * @param {string} [prefix='']
 * @return {import('@did-space/core').Object}
 */
function getFileObject(absolutePath, prefix = '') {
  const stats = fs.statSync(absolutePath);

  if (!stats.isFile()) {
    throw new Error(`Path ${absolutePath} is not a path to a file`);
  }

  const key = absolutePath.replace(prefix, '');

  return {
    key,
    name: basename(key),
    isDir: false,
    size: stats.size,
    lastModified: new Date(stats.mtime).getTime(),
    editable: true,
    absolutePath,
  };
}

function formatMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  return mapValues(memoryUsage, (x) => xbytes(x));
}

module.exports = {
  getBackupList,
  removeBackup,
  getBackupDirs,
  getFolderSize,
  getFolderObjects,
  getFileObject,
  formatMemoryUsage,
};
