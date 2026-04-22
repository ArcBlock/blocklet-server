const fs = require('fs-extra');
const { isValid } = require('@arcblock/did');
const { ensureDirSync } = require('fs-extra');
const isEmpty = require('lodash/isEmpty');
const { join } = require('path');
const { getAppName } = require('@blocklet/meta/lib/util');

const states = require('../../../states');
const { getBackupDirs } = require('../utils/disk');
const { BaseBackup } = require('./base');
const { BlockletBackup } = require('./blocklet');
const { BlockletExtrasBackup } = require('./blocklet-extras');
const { BlockletsBackup } = require('./blocklets');
const { DataBackup } = require('./data');
const { RoutingRuleBackup } = require('./routing-rule');

class DiskBackup extends BaseBackup {
  /**
   *
   * @type {import('./base').BaseBackupInput}
   * @memberof DiskBackup
   */
  input;

  /**
   * @description blocklet state 对象
   * @type {import('@blocklet/server-js').BlockletState}
   * @memberof DiskBackup
   */
  blocklet;

  /**
   * @type {string}
   * @memberof DiskBackup
   */
  backupDir;

  /**
   *
   * @description server 的数据目录
   * @type {string}
   * @memberof DiskBackup
   */
  serverDir;

  /**
   *
   * @type {import('./base').BaseSecurityContext}
   * @memberof DiskBackup
   */
  securityContext;

  storages;

  dataBackup;

  /**
   *
   * @param {import('./base').BaseBackupInput} input
   * @memberof DiskBackup
   */
  constructor(input) {
    super(input);
    this.verify(input);
    this.input = input;
    this.storages = [
      new BlockletBackup(this.input),
      new BlockletsBackup(this.input),
      new BlockletExtrasBackup(this.input),
      new RoutingRuleBackup(this.input),
    ];
    this.dataBackup = new DataBackup(this.input);
  }

  /**
   * @param {import('./base').BaseBackupInput} input
   * @returns {void}
   * @memberof DiskBackup
   */
  verify(input) {
    if (isEmpty(input?.appDid) || !isValid(input?.appDid)) {
      throw new Error(`input.appDid(${input?.appDid}) is not a valid did`);
    }
  }

  /**
   *
   * @returns {Promise<void>}
   * @memberof DiskBackup
   */
  async backup() {
    await this.initialize();
    await this.addMeta();
    await this.export();
  }

  async initialize() {
    this.blocklet = await states.blocklet.getBlocklet(this.input.appDid);
    if (isEmpty(this.blocklet)) {
      throw new Error('blocklet cannot be empty');
    }

    this.serverDir = process.env.ABT_NODE_DATA_DIR;
    const { baseBackupDir, backupDir } = getBackupDirs(this.serverDir, this.blocklet.appDid);
    this.baseBackupDir = baseBackupDir;
    this.backupDir = backupDir;
    ensureDirSync(this.backupDir);

    this.securityContext = await this._getSecurityContext(states);
  }

  // eslint-disable-next-line require-await
  async export() {
    return this._exportData(this.dataBackup, this.storages);
  }

  async addMeta() {
    const meta = {
      appDid: this.blocklet.appDid,
      appPid: this.blocklet.appPid,
      name: getAppName(this.blocklet),
      createdAt: Date.now(),
    };

    await fs.writeJSON(join(this.baseBackupDir, 'meta.json'), meta);
  }
}

module.exports = {
  DiskBackup,
};
