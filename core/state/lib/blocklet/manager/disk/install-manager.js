/**
 * Install Manager - Orchestrates blocklet installation operations
 *
 * This module re-exports functionality from specialized sub-modules:
 * - install-core-manager.js: Core installation functions (install, _installBlocklet, _addBlocklet, _onInstall)
 * - install-download-manager.js: Download and install operations (_downloadAndInstall)
 * - install-upgrade-manager.js: Upgrade operations (_upgradeBlocklet, _runMigration, _onRestart, etc.)
 */

const { _onInstall, _installBlocklet, _addBlocklet, install } = require('./install-core-manager');
const { _downloadAndInstall: _downloadAndInstallBase } = require('./install-download-manager');
const {
  _onRestart,
  _runMigration,
  _cleanUploadFile,
  _ensureDeletedChildrenInSettings,
  _upgradeBlocklet,
} = require('./install-upgrade-manager');

// Wrap _downloadAndInstall to inject dependencies
function _downloadAndInstall(manager, params) {
  return _downloadAndInstallBase(manager, params, { _onInstall, _upgradeBlocklet });
}

module.exports = {
  _downloadAndInstall,
  _onInstall,
  _onRestart,
  _installBlocklet,
  _runMigration,
  _cleanUploadFile,
  _upgradeBlocklet,
  _ensureDeletedChildrenInSettings,
  _addBlocklet,
  install,
};
