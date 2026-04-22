/**
 * Lifecycle Manager - Orchestrates blocklet lifecycle operations
 *
 * This module re-exports functionality from specialized sub-modules:
 * - start-manager.js: Start operations (start, _start, startRequiredComponents)
 * - stop-restart-manager.js: Stop, restart, reload operations
 * - delete-reset-manager.js: Delete and reset operations
 */

const { startRequiredComponents, start, _start } = require('./start-manager');
const { stop, restart, reload, stopExpiredBlocklets } = require('./stop-restart-manager');
const { _safeRemoveDir, delete: deleteBlocklet, reset, deleteComponent } = require('./delete-reset-manager');

module.exports = {
  startRequiredComponents,
  start,
  _start,
  stop,
  restart,
  reload,
  delete: deleteBlocklet,
  _safeRemoveDir,
  reset,
  deleteComponent,
  stopExpiredBlocklets,
};
