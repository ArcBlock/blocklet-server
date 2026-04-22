const { removeSync, outputJsonSync, readJSONSync } = require('fs-extra');
const { join } = require('path');
const { APP_STRUCT_VERSION } = require('@abtnode/constant');
const security = require('@abtnode/util/lib/security');

const { BaseRestore } = require('./base');

class BlockletRestore extends BaseRestore {
  filename = 'blocklet.json';

  import(params) {
    const blocklet = this.decrypt(this.getBlocklet(), params);
    removeSync(join(this.restoreDir, this.filename));
    outputJsonSync(join(this.restoreDir, this.filename), blocklet);
  }

  /**
   *
   * @description
   * @return {import('@blocklet/server-js').BlockletState}
   * @memberof BlockletRestore
   */
  getBlocklet() {
    return readJSONSync(join(this.restoreDir, this.filename));
  }

  /**
   *
   * @description 解密加密的数据
   * @param {import('@blocklet/server-js').BlockletState} blocklet
   * @return {import('@blocklet/server-js').BlockletState}
   * @memberof BlockletRestore
   */
  decrypt(blocklet, params) {
    const { password } = this.input;
    if (Array.isArray(blocklet?.migratedFrom)) {
      blocklet.migratedFrom = blocklet.migratedFrom.map((x) => {
        x.appSk = security.decrypt(x.appSk, params.salt, password);
        return x;
      });
    }

    return blocklet;
  }

  getImportParams() {
    const blocklet = this.getBlocklet();
    if (blocklet.structVersion !== APP_STRUCT_VERSION) {
      throw new Error('Only new version backup can be restored to this server');
    }

    return { salt: blocklet.appDid };
  }
}

module.exports = { BlockletRestore };
