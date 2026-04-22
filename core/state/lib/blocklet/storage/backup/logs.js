const { ensureDirSync, copy, statSync } = require('fs-extra');
const { join } = require('path');
const { BaseBackup } = require('./base');

// note: 可以不需要备份
class LogsBackup extends BaseBackup {
  async export() {
    const sourceLogsDir = join(this.serverDir, 'logs', this.blocklet.meta.name);
    ensureDirSync(sourceLogsDir);

    const targetLogsDir = join(this.backupDir, 'logs');

    await copy(sourceLogsDir, targetLogsDir, {
      overwrite: true,
      filter: (src) => {
        return !statSync(src).isSymbolicLink();
      },
    });
  }
}

module.exports = {
  LogsBackup,
};
