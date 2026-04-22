const { readFileSync, outputJson } = require('fs-extra');
const isEmpty = require('lodash/isEmpty');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const { join } = require('path');
const security = require('@abtnode/util/lib/security');

const states = require('../../../states');
const { BaseBackup } = require('./base');
const { getFileObject } = require('../utils/disk');

class BlockletExtrasBackup extends BaseBackup {
  filename = 'blocklet-extras.json';

  get blockletExtraExportPath() {
    return join(this.backupDir, this.filename);
  }

  async export() {
    const blockletExtra = await this.getBlockletExtra();
    await outputJson(this.blockletExtraExportPath, blockletExtra);
  }

  /**
   *
   * @description
   * @return {Promise<import('@blocklet/server-js').BlockletState>}
   * @memberof BlockletExtrasBackup
   */
  async getBlockletExtra() {
    /**
     * @type {import('@blocklet/server-js').BlockletState}
     */
    const blockletExtra = await states.blockletExtras.findOne({
      did: this.blocklet.meta.did,
    });
    if (isEmpty(blockletExtra)) {
      throw new Error('blockletExtra cannot be empty');
    }

    return this.cleanData(blockletExtra);
  }

  /**
   *
   * @description 清理数据并加密
   * @param {import('@blocklet/server-js').BlockletState} raw
   * @return {Promise<any>}
   * @memberof BlockletExtrasBackup
   */
  cleanData(raw) {
    const blockletExtra = cloneDeep(raw);

    const queue = [blockletExtra];
    while (queue.length) {
      const current = queue.pop();

      // 删除父 blocklet 的某些数据
      if (current.id) {
        delete current.id;
        delete current.createdAt;
        delete current.updatedAt;
      }

      // 加解密
      this.encrypt(current.configs);

      if (current?.children) {
        queue.push(...current.children);
      }
    }

    return blockletExtra;
  }

  /**
   *
   * @description 清理数据并加密
   * @param {import('@blocklet/server-js').ConfigEntry[]} configs
   * @return {void}
   * @memberof BlockletExtrasBackup
   */
  encrypt(configs) {
    if (isEmpty(configs)) {
      return;
    }

    const dk = readFileSync(join(this.serverDir, '.sock'));
    for (const config of configs) {
      if (config.secure) {
        const decrypted = security.decrypt(config.value, this.blocklet.meta.did, dk);
        config.value = this.securityContext.encrypt(decrypted);
      }
    }
  }

  /**
   *
   * @returns {Promise<import('./base').SyncObject[]>}
   * @memberof BlockletExtrasBackup
   */
  async collectSyncObjects() {
    await this.export();

    const objects = [getFileObject(this.blockletExtraExportPath, this.backupDir)];

    return objects;
  }
}

module.exports = { BlockletExtrasBackup };
