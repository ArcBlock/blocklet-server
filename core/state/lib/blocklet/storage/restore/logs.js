const { removeSync, existsSync } = require('fs-extra');
const { join } = require('path');
const { BaseRestore } = require('./base');
const { zipToDir } = require('../utils/zip');

class LogsRestore extends BaseRestore {
  filename = 'logs.zip';

  async import() {
    const blockletZipPath = join(this.restoreDir, this.filename);

    if (!existsSync(blockletZipPath)) {
      throw new Error(`file not found: ${blockletZipPath}`);
    }

    await zipToDir(blockletZipPath, join(this.restoreDir, 'logs'));
    removeSync(blockletZipPath);
  }
}

module.exports = { LogsRestore };
