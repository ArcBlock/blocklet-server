const { isValid } = require('@arcblock/did');
const isEmpty = require('lodash/isEmpty');
const merge = require('lodash/merge');
const { ensureDirSync, existsSync, rmSync, copy } = require('fs-extra');

const { getBackupDirs } = require('../utils/disk');
const { BaseRestore } = require('./base');
const { BlockletExtrasRestore } = require('./blocklet-extras');
const { BlockletRestore } = require('./blocklet');
const { BlockletsRestore } = require('./blocklets');

class DiskRestore extends BaseRestore {
  /**
   *
   * @type {import('./base').BaseRestoreInput}
   * @memberof DiskRestore
   */
  input;

  /**
   * @type {string}
   * @memberof DiskRestore
   */
  restoreDir;

  /**
   *
   * @description server 的数据目录
   * @type {string}
   * @memberof DiskRestore
   */
  serverDir;

  storages;

  /**
   *
   * @param {import('./base').BaseRestoreInput} input
   * @memberof DiskRestore
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
   * @param {import('./base').BaseRestoreInput} input
   * @returns {void}
   * @memberof DiskRestore
   */
  verify(input) {
    if (isEmpty(input?.appDid) || !isValid(input?.appDid)) {
      throw new Error(`input.appDid(${input?.appDid}) is not a valid did`);
    }
  }

  initialize() {
    this.serverDir = process.env.ABT_NODE_DATA_DIR;
    this.restoreDir = getBackupDirs(this.serverDir, this.input.appDid).restoreDir;
    if (existsSync(this.restoreDir)) {
      rmSync(this.restoreDir, { recursive: true });
    }
    ensureDirSync(this.restoreDir);

    this.storages.map((x) => x.ensureParams(this));
  }

  async restore() {
    await this.initialize();
    await this.syncFromBackupDir();

    const params = await Promise.all(this.storages.map((x) => x.getImportParams()));
    await this.import(merge(...params));

    return this.storages.map((x) => x.getInstallParams());
  }

  async syncFromBackupDir() {
    const { appDid } = this.input;

    const { backupDir } = getBackupDirs(this.serverDir, appDid);

    await copy(backupDir, this.restoreDir);
  }

  async import(params) {
    await Promise.all(
      this.storages.map((storage) => {
        return storage.import(params);
      })
    );
  }
}

module.exports = {
  DiskRestore,
};
