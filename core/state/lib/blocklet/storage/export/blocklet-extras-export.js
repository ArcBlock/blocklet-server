const { readFileSync } = require('fs-extra');
const isEmpty = require('lodash/isEmpty');
const { join } = require('path');
const security = require('@abtnode/util/lib/security');

const { BlockletExtrasBackup } = require('../backup/blocklet-extras');

class BlockletExtrasExport extends BlockletExtrasBackup {
  /**
   * Decrypt secure configs to plaintext using .sock key.
   * Keep config.secure = true so that import-side encryptSecurityData() re-encrypts correctly.
   */
  encrypt(configs) {
    if (isEmpty(configs)) {
      return;
    }

    const dk = readFileSync(join(this.serverDir, '.sock'));
    for (const config of configs) {
      if (config.secure) {
        config.value = security.decrypt(config.value, this.blocklet.meta.did, dk);
      }
    }
  }
}

module.exports = { BlockletExtrasExport };
