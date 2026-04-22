const { outputJson, createWriteStream, createReadStream, ensureDir } = require('fs-extra');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const { join, basename, dirname } = require('path');
const { BLOCKLET_CONFIGURABLE_KEY } = require('@blocklet/constant');
const isEmpty = require('lodash/isEmpty');
const streamToPromise = require('stream-to-promise');
const axios = require('@abtnode/util/lib/axios');
const isUrl = require('is-url');
const { getLogoUrl } = require('@abtnode/util/lib/logo');
const { BaseBackup } = require('./base');
const { getFileObject } = require('../utils/disk');

class BlockletBackup extends BaseBackup {
  filename = 'blocklet.json';

  get blockletExportPath() {
    return join(this.backupDir, this.filename);
  }

  async export() {
    const blocklet = await this.cleanData();

    const targetLogoPath = await this.writeLogoFile();
    blocklet.meta.appLogo = basename(targetLogoPath);

    await ensureDir(dirname(this.blockletExportPath));
    await outputJson(this.blockletExportPath, blocklet);

    return {
      targetLogoPath,
    };
  }

  /**
   * @description 清理数据
   * @see blocklet.db 中需要删除哪些字段呢？ https://github.com/ArcBlock/blocklet-server/issues/6120#issuecomment-1383798348
   * @return {Promise<import('@blocklet/server-js').BlockletState>}
   * @memberof BlockletBackup
   */
  cleanData() {
    const clone = cloneDeep(this.blocklet);

    /** @type {import('@blocklet/server-js').ComponentState[]} */
    const queue = [clone];

    // 广度优先遍历
    while (queue.length) {
      const current = queue.pop();

      // 父组件才需要删除的属性
      if (current.id) {
        delete current.id;
        delete current.createdAt;
        delete current.startedAt;
        delete current.installedAt;
      }

      // 子组件和父组件都需要删除的属性
      delete current.status;
      delete current.ports;
      delete current.environments;

      if (current.children) {
        queue.push(...current.children);
      }
    }

    return this.encrypt(clone);
  }

  /**
   *
   * @description 清理数据并加密
   * @param {import('@blocklet/server-js').BlockletState} info
   * @memberof BlockletExtrasBackup
   */
  encrypt(info) {
    if (Array.isArray(info?.migratedFrom)) {
      info.migratedFrom = info.migratedFrom.map((x) => {
        x.appSk = this.securityContext.encrypt(x.appSk);
        return x;
      });
    }

    return info;
  }

  /**
   *
   * @description 获取 blocklet 的 logo,并写入到备份文件夹的 data 目录下
   * @param {string} target
   * @returns {Promise<string>}
   * @memberof DataBackup
   */
  async writeLogoFile() {
    const customLogoSquareUrl = this.blocklet.environments.find(
      (e) => e.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_SQUARE
    )?.value;
    const appDir = this.blocklet.environments.find((e) => e.key === 'BLOCKLET_APP_DIR')?.value;
    const dataDir = this.blocklet.environments.find((e) => e.key === 'BLOCKLET_DATA_DIR')?.value;
    const logo = this.blocklet?.meta?.logo;
    const defaultLogoPath = join(this.serverDir, 'data', this.blocklet.meta.name, 'logo.svg');

    const logoUrl = await getLogoUrl({
      customLogoSquareUrl,
      appDir,
      dataDir,
      logo,
      defaultLogoPath,
    });

    const logoStream = await this.getLogoStream(logoUrl);
    const targetLogoPath = join(this.backupDir, 'data', basename(logoUrl));
    await ensureDir(dirname(targetLogoPath));
    await streamToPromise(logoStream.pipe(createWriteStream(targetLogoPath)));

    return targetLogoPath;
  }

  /**
   *
   *
   * @param {string} logoUrl
   * @returns {Promise<NodeJS.ReadStream>}
   * @memberof DataBackup
   */
  async getLogoStream(logoUrl) {
    if (isEmpty(logoUrl)) {
      throw new Error(`logoUrl(${logoUrl}) cannot be empty`);
    }

    if (isUrl(logoUrl)) {
      const res = await axios.get(logoUrl, {
        responseType: 'stream',
      });
      return res.data;
    }

    return createReadStream(logoUrl);
  }

  /**
   *
   * @returns {Promise<import('./base').SyncObject[]>}
   * @memberof BlockletBackup
   */
  async collectSyncObjects() {
    const { targetLogoPath } = await this.export();

    const objects = [
      getFileObject(this.blockletExportPath, this.backupDir),
      getFileObject(targetLogoPath, this.backupDir),
    ];

    return objects;
  }
}

module.exports = { BlockletBackup };
