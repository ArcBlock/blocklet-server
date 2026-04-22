const { removeSync, outputJsonSync, readJSONSync } = require('fs-extra');
const isEmpty = require('lodash/isEmpty');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const { join } = require('path');
const security = require('@abtnode/util/lib/security');
const { BLOCKLET_CONFIGURABLE_KEY } = require('@blocklet/constant');
const { BaseRestore } = require('./base');

class BlockletExtrasRestore extends BaseRestore {
  filename = 'blocklet-extras.json';

  import(params) {
    const extras = this.cleanExtras(this.getExtras(), params);
    removeSync(join(this.restoreDir, this.filename));
    outputJsonSync(join(this.restoreDir, this.filename), extras);
  }

  /**
   *
   * @description
   * @return {import('@blocklet/server-js').BlockletState}
   * @memberof BlockletExtrasRestore
   */
  getExtras() {
    /**
     * @type {import('@blocklet/server-js').BlockletState}
     */
    return readJSONSync(join(this.restoreDir, this.filename));
  }

  /**
   *
   * @description 清理数据并加密
   * @param {import('@blocklet/server-js').BlockletState} raw
   * @returns {import('@blocklet/server-js').BlockletState}
   * @memberof BlockletExtrasRestore
   */
  cleanExtras(raw, params) {
    const blockletExtra = cloneDeep(raw);

    const queue = [blockletExtra];
    while (queue.length) {
      const current = queue.pop();

      // 加解密
      this.decryptConfigs(current.configs, params);

      if (current?.children) {
        queue.push(...current.children);
      }
    }

    return blockletExtra;
  }

  /**
   *
   * @description 解密加密的数据
   * @param {import('@blocklet/server-js').ConfigEntry[]} configs
   * @param {object} params
   * @return {void}
   * @memberof BlockletExtrasRestore
   */
  decryptConfigs(configs, params) {
    if (isEmpty(configs)) {
      return;
    }

    const { password } = this.input;
    for (const config of configs) {
      if (config.secure) {
        config.value = security.decrypt(config.value, params.salt, password);
      }
    }

    const skConfig = configs.find((x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SK);
    if (skConfig) {
      this.appSk = skConfig.value;
    }
  }

  getInstallParams() {
    return {
      appSk: this.appSk,
    };
  }
}

module.exports = { BlockletExtrasRestore };
