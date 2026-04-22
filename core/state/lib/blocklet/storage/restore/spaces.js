/**
 * @typedef {{
 *  appDid: string; // --> appDid
 *  appPid: string;
 *  endpoint: string;
 *  password: Buffer; // derived from (appSk, appDid)
 *  delegation: string; // from appDid --> serverDid for downloading
 *  wallet: import('@ocap/wallet').WalletObject; // server wallet
 *  event: import('events').EventEmitter,
 *  userDid: string,
 *  referrer: string,
 * }} SpaceRestoreInput
 */

const validUrl = require('valid-url');
const merge = require('lodash/merge');
const { BlockletEvents, RESTORE_PROGRESS_STATUS } = require('@blocklet/constant');
const { SpaceClient, RestoreBlockletCommand } = require('@blocklet/did-space-js');
const { ensureDirSync, existsSync, rmSync } = require('fs-extra');
const { join } = require('path');

const logger = require('@abtnode/logger')('@abtnode/core:storage:restore');

const { BaseRestore } = require('./base');
const { BlockletExtrasRestore } = require('./blocklet-extras');
const { BlockletRestore } = require('./blocklet');
const { BlockletsRestore } = require('./blocklets');
const states = require('../../../states');

class SpacesRestore extends BaseRestore {
  /**
   *
   * @type {SpaceRestoreInput}
   * @memberof SpacesRestore
   */
  input;

  /**
   * @description 当前 blocklet 的数据目录
   * @type {string}
   * @memberof SpacesRestore
   */
  restoreDir;

  /**
   *
   * @description server 的数据目录
   * @type {string}
   * @memberof SpacesRestore
   */
  serverDir;

  storages;

  /**
   *
   * @param {SpaceRestoreInput} input
   * @memberof SpacesRestore
   */
  constructor(input) {
    super(input);
    this.verify(input);
    this.input = input;
    this.storages = [
      new BlockletExtrasRestore(this.input),
      new BlockletRestore(this.input),
      new BlockletsRestore(this.input),
    ];
  }

  /**
   *
   * @param {SpaceRestoreInput} input
   * @returns {void}
   * @memberof SpacesRestore
   */
  verify(input) {
    if (!validUrl.isWebUri(input.endpoint)) {
      throw new Error(`endpoint(${input.endpoint}) must be a WebUri`);
    }
  }

  initialize() {
    this.serverDir = process.env.ABT_NODE_DATA_DIR;
    this.restoreDir = join(this.serverDir, 'tmp/restore', this.input.appPid);
    if (existsSync(this.restoreDir)) {
      rmSync(this.restoreDir, { recursive: true });
    }
    ensureDirSync(this.restoreDir);

    this.storages.map((x) => x.ensureParams(this));
  }

  async restore() {
    await this.initialize();
    await this.syncFromSpaces();

    const params = await Promise.all(this.storages.map((x) => x.getImportParams()));
    await this.import(merge(...params));

    return this.storages.map((x) => x.getInstallParams());
  }

  async syncFromSpaces() {
    const { endpoint, wallet, delegation } = this.input;
    /**
     * @type {import('@blocklet/server-js').NodeState}
     */
    const node = await states.node.read();
    const serverDid = node.did;

    const spaceClient = new SpaceClient({
      endpoint,
      delegation,
      wallet,
    });

    const output = await spaceClient.send(
      new RestoreBlockletCommand({
        appPid: this.input.appPid,
        appDid: this.input.appDid,
        target: join(this.restoreDir, '/'),
        debug: true,
        concurrency: 4,
        retryCount: 10,
        onAfterUpload: (data) => {
          logger.info('restore progress', { appDid: this.input.appDid, data });
          this.input.event.emit(BlockletEvents.restoreProgress, {
            appDid: this.input.appDid,
            meta: { did: this.input.appPid },
            status: RESTORE_PROGRESS_STATUS.downloading,
            data,
          });
        },

        userDid: this.input.userDid,
        referrer: this.input.referrer,
        serverDid,
      })
    );

    if (output.statusCode !== 200) {
      console.error('syncFromSpaces.error', output);
      throw new Error(output.statusMessage);
    }
  }

  async import(params) {
    this.input.event.emit(BlockletEvents.restoreProgress, {
      appDid: this.input.appDid,
      meta: { did: this.input.appPid },
      status: RESTORE_PROGRESS_STATUS.importData,
    });

    await Promise.all(
      this.storages.map((storage) => {
        return storage.import(params);
      })
    );
    this.input.event.emit(BlockletEvents.restoreProgress, {
      appDid: this.input.appDid,
      meta: { did: this.input.appPid },
      status: RESTORE_PROGRESS_STATUS.importDataSuccess,
    });
  }
}

module.exports = {
  SpacesRestore,
};
