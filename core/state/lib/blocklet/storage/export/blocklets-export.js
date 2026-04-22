const fs = require('fs-extra');
const { join } = require('path');
const { BlockletsBackup } = require('../backup/blocklets');
const { getBundleDir } = require('../../../util/blocklet');
const { getVersionScope } = require('../../../util/blocklet/install-utils');

/**
 * Export ALL component bundles (including registry children).
 * Unlike BlockletsBackup which filters out HTTP-URL bundles,
 * this exports everything so the import doesn't depend on the store.
 */
class BlockletsExport extends BlockletsBackup {
  async export() {
    const metas = this._getAllComponentMetas(this.blocklet);
    const serverBlockletsDir = join(this.serverDir, 'blocklets');

    /** @type {import('../backup/blocklets').DirToZipMeta[]} */
    const dirs = [];
    for (const meta of metas) {
      const sourceDir = getBundleDir(serverBlockletsDir, meta);
      if (!fs.existsSync(sourceDir)) {
        continue;
      }
      const zipPath = join(this.backupDir, 'blocklets', meta.bundleName || meta.name, `${getVersionScope(meta)}.zip`);
      dirs.push({ sourceDir, zipPath });
    }
    await this.dirsToZip(dirs);

    return { dirs };
  }

  /**
   * Collect full meta objects for all components (parent + children, recursive).
   * Returns the meta object directly so getBundleDir can compute the correct path.
   */
  _getAllComponentMetas(blocklet) {
    if (!blocklet?.meta?.bundleName || !blocklet?.meta?.version) {
      return [];
    }

    const metas = [blocklet.meta];

    for (const child of blocklet.children || []) {
      metas.push(...this._getAllComponentMetas(child));
    }

    return metas;
  }
}

module.exports = { BlockletsExport };
