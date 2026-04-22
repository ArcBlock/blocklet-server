/* eslint-disable no-console */
/**
 * @typedef {{
 *  appDid: string
 *  event: import('events').EventEmitter,
 *  abortController?: AbortController
 * }} BaseBackupInput
 *
 * @typedef {{
 *  encrypt: (v: string) => string,
 *  decrypt: (v: string) => string,
 * }} BaseSecurityContext
 */

/**
 * @typedef {import('@did-space/core').Object} SyncObject
 */

const { Hasher } = require('@ocap/mcrypto');
const { toBuffer } = require('@ocap/util');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const security = require('@abtnode/util/lib/security');

class BaseBackup {
  /**
   * @type {BaseBackupInput}
   * @memberof BaseBackup
   */
  input;

  /**
   * @description blocklet state 对象
   * @type {import('@blocklet/server-js').BlockletState}
   * @memberof BaseBackup
   */
  blocklet;

  /**
   * @description 当前 blocklet 的数据目录
   * @type {string}
   * @memberof BaseBackup
   */
  backupDir;

  /**
   *
   * @description 安全相关的上下文
   * @type {BaseSecurityContext}
   * @memberof BaseBackup
   */
  securityContext;

  /**
   *
   * @description server 的数据目录
   * @type {string}
   * @memberof BaseBackup
   */
  serverDir;

  constructor(input) {
    this.input = input;
    this.input.abortController = this.input.abortController ?? new AbortController();
  }

  /**
   *
   * @param {BaseBackup} backup
   * @memberof BaseBackup
   */
  ensureParams(backup) {
    this.blocklet = backup.blocklet;
    this.serverDir = backup.serverDir;
    this.backupDir = backup.backupDir;
    this.securityContext = backup.securityContext;
  }

  // eslint-disable-next-line require-await
  async export() {
    throw new Error('not implemented');
  }

  async _getSecurityContext(states) {
    const blocklet = await states.blocklet.getBlocklet(this.input.appDid);
    const nodeInfo = await states.node.read();

    const { wallet } = getBlockletInfo(blocklet, nodeInfo.sk);

    const { secretKey, address } = wallet; // we encrypt using latest wallet, not the permanent wallet
    const password = toBuffer(Hasher.SHA3.hash256(Buffer.concat([secretKey, address].map(toBuffer))));
    const encrypt = (v) => security.encrypt(v, address, password);
    const decrypt = (v) => security.decrypt(v, address, password);

    return {
      signer: wallet,
      delegation: '',
      encrypt,
      decrypt,
    };
  }

  /**
   *
   * @param {BaseBackup} dataBackup
   * @param {Array<BaseBackup>} storages
   * @memberof BaseBackup
   */
  async _exportData(dataBackup, storages) {
    // @note: dataBackup 需要先于 blockletBackup 执行，并且 blockletBackup 与其他 backup的执行可以是无序的
    dataBackup.ensureParams(this);
    await dataBackup.export();

    await Promise.all(
      storages.map((storage) => {
        storage.ensureParams(this);
        return storage.export();
      })
    );
  }

  /**
   *
   * @param {import('./data').DataBackup} dataBackup
   * @param {Array<BaseBackup>} storages
   * @returns {Promise<SyncObject[]>}
   * @memberof BaseBackup
   */
  async collectSyncObjects(dataBackup, storages) {
    /**
     * @type {SyncObject[]}
     */
    let syncObjects = [];

    // @note: dataBackup 需要先于 blockletBackup 执行，并且 blockletBackup 与其他 backup的执行可以是无序的
    dataBackup.ensureParams(this);
    syncObjects = syncObjects.concat(await dataBackup.collectSyncObjects());

    await Promise.all(
      storages.map(async (storage) => {
        this.throwErrorIfAborted();
        storage.ensureParams(this);
        syncObjects.push(...(await storage.collectSyncObjects()));
      })
    );

    return syncObjects;
  }

  abort() {
    this.input.abortController.abort();
  }

  throwErrorIfAborted() {
    if (this.input.abortController.signal.aborted) {
      throw new Error('Operation has been aborted');
    }
  }
}

module.exports = {
  BaseBackup,
};
