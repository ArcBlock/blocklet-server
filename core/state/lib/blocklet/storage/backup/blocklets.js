const { join } = require('path');
const validUrl = require('valid-url');
const pAll = require('p-all');
const { BaseBackup } = require('./base');
const { dirToZip } = require('../utils/zip');
const { compareAndMove } = require('../utils/hash');
const { getFileObject } = require('../utils/disk');

/**
 * @typedef {{sourceDir: string, zipPath: string}} DirToZipMeta
 */

/**
 * @description
 * @class BlockletsBackup
 * @extends {BaseBackup}
 */
class BlockletsBackup extends BaseBackup {
  /**
   *
   * @returns {Promise<{dirs: DirToZipMeta[]}>}
   * @memberof BlockletsBackup
   */
  async export() {
    const blockletMetas = this.getBlockletMetas(this.blocklet);
    const serverBlockletsDir = join(this.serverDir, 'blocklets');

    const blockletMetasFromLocal = blockletMetas.filter(
      (b) => !validUrl.isHttpUri(b.tarball) && !validUrl.isHttpsUri(b.tarball)
    );

    /** @type {DirToZipMeta[]} */
    const dirs = [];
    for (const blockletMeta of blockletMetasFromLocal) {
      const sourceDir = join(serverBlockletsDir, blockletMeta.name, blockletMeta.version);
      const zipPath = join(this.backupDir, 'blocklets', blockletMeta.name, `${blockletMeta.version}.zip`);
      dirs.push({ sourceDir, zipPath });
    }
    await this.dirsToZip(dirs);

    return {
      dirs,
    };
  }

  /**
   *
   *
   * @param {import('@blocklet/server-js').BlockletState} blocklet
   * @returns {Array<{name: string, version: string, tarball: string}>}
   * @memberof BlockletsBackup
   */
  getBlockletMetas(blocklet) {
    if (!blocklet?.meta?.bundleName || !blocklet?.meta?.version) {
      return [];
    }

    const metas = [];
    metas.push({
      name: blocklet.meta.bundleName,
      version: blocklet.meta.version,
      tarball: blocklet?.meta?.dist?.tarball,
    });

    for (const child of blocklet.children) {
      metas.push(...this.getBlockletMetas(child));
    }

    return metas;
  }

  /**
   * @param {DirToZipMeta[]} dirs: /some/folder/to/compress
   * @param {String} zipPath: /path/to/created.zip
   * @returns {Promise}
   * @memberof BlockletsBackup
   */
  async dirsToZip(dirs) {
    await pAll(
      dirs.map((dir) => {
        return async () => {
          const tempZipPath = `${dir.zipPath}.bak`;
          await dirToZip(dir.sourceDir, tempZipPath);
          await compareAndMove(tempZipPath, dir.zipPath);
        };
      }),
      {
        concurrency: 4,
      }
    );
  }

  /**
   *
   * @returns {Promise<import('./base').SyncObject[]>}
   * @memberof BlockletsBackup
   */
  async collectSyncObjects() {
    const { dirs } = await this.export();

    const objects = dirs.map((dir) => {
      return getFileObject(dir.zipPath, this.backupDir);
    });

    return objects;
  }
}

module.exports = { BlockletsBackup };
