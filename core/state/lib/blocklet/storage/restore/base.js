/**
 * @typedef {{
 *  appDid: string; // --> appDid
 *  password: Buffer; // derived from (appSk, appDid)
 *  event: import('events').EventEmitter,
 * }} BaseRestoreInput
 */

class BaseRestore {
  /**
   *
   * @type {BaseRestoreInput}
   * @memberof BaseRestore
   */
  input;

  /**
   * @type {string}
   * @memberof BaseRestore
   */
  restoreDir;

  /**
   *
   * @description server 的数据目录
   * @type {string}
   * @memberof BaseRestore
   */
  serverDir;

  constructor(input) {
    this.input = input;
  }

  /**
   *
   *
   * @param {BaseRestore} restore
   * @memberof BaseRestore
   */
  ensureParams(restore) {
    this.restoreDir = restore.restoreDir;
    this.serverDir = restore.serverDir;
  }

  // eslint-disable-next-line
  async import(params) {
    throw new Error('not implemented');
  }

  /**
   * Generate params for BlockletManager to install
   *
   * @return {object}
   * @memberof BaseRestore
   */
  getInstallParams() {
    return {};
  }

  /**
   * Generate params for other restorers
   *
   * @return {object}
   * @memberof BaseRestore
   */
  getImportParams() {
    return {};
  }
}

module.exports = {
  BaseRestore,
};
