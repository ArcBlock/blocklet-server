const { BlockletBackup } = require('../backup/blocklet');

class BlockletExport extends BlockletBackup {
  ensureParams(backup) {
    super.ensureParams(backup);
    // Capture the wallet-derived appDid from the exporter
    this.exportAppDid = backup.appDid;
  }

  cleanData() {
    const clone = super.cleanData();
    // Update appDid to match wallet address derived from appSk
    // Without this, blocklet.json would have appDid = meta.did, which differs
    // from the wallet address that installApplicationFromBackup expects
    if (this.exportAppDid) {
      clone.appDid = this.exportAppDid;
      // Preserve appPid for migrated blocklets — it is the permanent DID
      // and must not be overwritten with the current wallet address.
      // Only set it when not already present (non-migrated blocklets).
      if (!clone.appPid) {
        clone.appPid = this.exportAppDid;
      }
    }
    return clone;
  }

  // No-op: keep migratedFrom.appSk as plaintext for cross-server export
  // eslint-disable-next-line class-methods-use-this
  encrypt(info) {
    return info;
  }
}

module.exports = { BlockletExport };
