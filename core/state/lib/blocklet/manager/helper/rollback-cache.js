const fs = require('fs-extra');
const path = require('path');

const DIR_NAME = 'rollback-cache';
const security = require('@abtnode/util/lib/security');

class RollbackCache {
  constructor({ dir, dek }) {
    this.dir = dir;
    this.dek = dek;
  }

  async backup({ did, action, oldBlocklet }) {
    const file = this._getFile(did);
    const data = this.dek ? security.encrypt(JSON.stringify(oldBlocklet), did, this.dek) : oldBlocklet;
    await fs.outputJSON(file, { action, oldBlocklet: data });
  }

  async remove({ did }) {
    const file = this._getFile(did);
    await fs.remove(file);
  }

  async restore({ did }) {
    const file = this._getFile(did);
    if (fs.existsSync(file)) {
      const data = await fs.readJSON(file);
      if (data?.oldBlocklet && this.dek) {
        data.oldBlocklet = JSON.parse(security.decrypt(data.oldBlocklet, did, this.dek));
      }
      return data;
    }
    return null;
  }

  _getFile(did) {
    return path.join(this.dir, DIR_NAME, `${did}.json`);
  }
}

module.exports = RollbackCache;
