const { copy } = require('fs-extra');
const { join } = require('path');

const { BaseBackup } = require('./base');
const { getFolderObjects } = require('../utils/disk');

class DataBackup extends BaseBackup {
  /**
   *
   * @returns {Promise<void>}
   * @memberof BlockletsBackup
   */
  async export() {
    const blockletDataDir = join(this.serverDir, 'data', this.blocklet.meta.name);
    const blockletBackupDataDir = join(this.backupDir, 'data');

    await copy(blockletDataDir, blockletBackupDataDir, { overwrite: true });
  }

  /**
   * @description
   * @return {Promise<import('@did-space/core').Object[]>}
   * @memberof DataBackup
   */
  async collectSyncObjects() {
    const blockletDataDir = join(this.serverDir, 'data', this.blocklet.meta.name);

    // @note: 存储到 did-spaces 的应用的 /data 目录下
    const objects = await getFolderObjects(blockletDataDir, '/data');

    return objects;
  }
}

module.exports = { DataBackup };
