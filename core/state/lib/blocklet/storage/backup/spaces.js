/**
 * @typedef {{
 *  appDid: string
 *  appPid: string,
 *  event: import('events').EventEmitter,
 *  userDid: string,
 *  referrer: string,
 *  locale: 'zh' | 'en',
 *  backup: import('@abtnode/models').BackupState,
 *  abortController?: AbortController
 * }} SpaceBackupInput
 *
 * @typedef {{
 *  signer: import('@ocap/wallet').WalletObject
 *  encrypt: (v: string) => string,
 *  decrypt: (v: string) => string,
 *  delegation: string,
 * }} SecurityContext
 */

const path = require('path');
const { isValid } = require('@arcblock/did');
const { BLOCKLET_CONFIGURABLE_KEY, BlockletEvents } = require('@blocklet/constant');
const { SpaceClient, IncrementalBackupBlockletCommand } = require('@blocklet/did-space-js');
const { ensureDirSync, existsSync, remove } = require('fs-extra');
const isEmpty = require('lodash/isEmpty');
const { join, basename } = require('path');
const { getAppName, getAppDescription } = require('@blocklet/meta/lib/util');
const logger = require('@abtnode/logger')('@abtnode/core:storage:backup');
const { default: axios } = require('axios');
const xbytes = require('xbytes');

const states = require('../../../states');
const { BaseBackup } = require('./base');
const { BlockletBackup } = require('./blocklet');
const { BlockletExtrasBackup } = require('./blocklet-extras');
const { BlockletsBackup } = require('./blocklets');
const { DataBackup } = require('./data');
const { RoutingRuleBackup } = require('./routing-rule');
const { translate } = require('../../../locales');
const { getFolderSize, formatMemoryUsage } = require('../utils/disk');
const { dockerExecChown } = require('../../../util/docker/docker-exec-chown');
const checkDockerRunHistory = require('../../../util/docker/check-docker-run-history');
const { dockerBackupPgBlockletDb } = require('../../../util/docker/docker-backup-pg-blocklet-db');

/**
 * @param {{ appDid: string, appPid: string }} params
 * @returns {{ appDid: string, meta: { did: string } }}
 */
const getAppId = (params) => ({ appDid: params.appDid, meta: { did: params.appPid } });

class SpacesBackup extends BaseBackup {
  /**
   * @type {Map<string, SpacesBackup>}
   * @memberof SpacesBackup
   */
  static instanceMap = new Map();

  /**
   *
   * @type {SpaceBackupInput}
   * @memberof SpacesBackup
   */
  input;

  /**
   * @description blocklet state 对象
   * @type {import('@blocklet/server-js').BlockletState}
   * @memberof SpacesBackup
   */
  blocklet;

  /**
   * @description 当前 blocklet 的数据目录
   * @type {string}
   * @memberof SpacesBackup
   */
  backupDir;

  /**
   *
   * @description server 的数据目录
   * @type {string}
   * @memberof SpacesBackup
   */
  serverDir;

  /**
   *
   * @description spaces 的 endpoint
   * @type {string}
   * @memberof SpacesBackup
   */
  spaceBackupEndpoint;

  /**
   *
   * @description spaces 安全相关的上下文
   * @type SecurityContext
   * @memberof SpacesBackup
   */
  securityContext;

  storages;

  dataBackup;

  /**
   * @type {import('@did-space/core').Object[]}
   * @description
   * @memberof SpacesBackup
   */
  syncObjects;

  /**
   * @type {import('@blocklet/did-space-js').IncrementalBackupBlockletCommandOutput | null}
   * @description
   * @memberof SpacesBackup
   */
  backupOutput;

  /**
   *
   * @param {SpaceBackupInput} input
   * @memberof SpacesBackup
   */
  constructor(input) {
    super(input);
    this.verify(input);
    this.input = input;
    this.storages = [
      // @note: 我们不应该备份从 server 里面搜索出 audit log 文件，然后备份它。如果 audit log 文件过大，这会导致内存暴涨。 related: https://github.com/ArcBlock/blocklet-server/issues/9837#issuecomment-2370427184
      new BlockletBackup(this.input),
      new BlockletsBackup(this.input),
      new BlockletExtrasBackup(this.input),
      new RoutingRuleBackup(this.input),
    ];
    this.dataBackup = new DataBackup(this.input);
  }

  /**
   * @param {SpaceBackupInput} input
   * @returns {void}
   * @memberof SpacesBackup
   */
  verify(input) {
    if (isEmpty(input?.appDid) || !isValid(input?.appDid)) {
      throw new Error(`input.appDid(${input?.appDid}) is not a valid did`);
    }
  }

  async backupChown() {
    const nodeInfo = await states.node.read();

    if (checkDockerRunHistory(nodeInfo)) {
      let paths = [];

      if (this.blocklet) {
        paths = this.blocklet.children.map((child) => {
          if (!child.meta?.docker?.image) {
            return null;
          }
          return path.join(process.env.ABT_NODE_DATA_DIR, 'blocklets', child.meta.name, child.meta.version);
        });
      }
      await dockerExecChown({
        name: `${this.input.appPid}-backup`,
        dirs: [path.join(process.env.ABT_NODE_DATA_DIR, 'data', this.input.appPid), ...paths.filter(Boolean)],
      });
    }
  }

  async backupPostgres() {
    if (!this.blocklet) {
      return;
    }
    const dataDir =
      this.blocklet.environments?.find((v) => v.key === 'BLOCKLET_APP_DATA_DIR')?.value ||
      path.join(process.env.ABT_NODE_DATA_DIR, 'data', this.blocklet.appPid || this.blocklet.appDid);
    const dbPath = path.join(dataDir, 'blocklet.db');

    await dockerBackupPgBlockletDb(dbPath);
  }

  /**
   *
   * @returns {Promise<void>}
   * @memberof SpacesBackup
   */
  async backup() {
    try {
      this.throwErrorIfAborted();

      if (SpacesBackup.instanceMap.has(this.input.appPid)) {
        throw new Error(`This app(${this.input.appPid}) is already running backup`);
      }
      SpacesBackup.instanceMap.set(this.input.appPid, this);

      logger.info(this.input.appPid, 'initialize.before', formatMemoryUsage());
      await this.initialize();
      logger.info(this.input.appPid, 'initialize.after', formatMemoryUsage());

      await this.backupChown();
      await this.backupPostgres();

      logger.info(this.input.appPid, 'export.before', formatMemoryUsage());
      await this.export();
      logger.info(this.input.appPid, 'export.after', formatMemoryUsage());

      logger.info(this.input.appPid, 'verifySpace.before', formatMemoryUsage());
      await this.verifySpace();
      logger.info(this.input.appPid, 'verifySpace.after', formatMemoryUsage());

      logger.info(this.input.appPid, 'syncToSpaces.before', formatMemoryUsage());
      await this.syncToSpaces();
      logger.info(this.input.appPid, 'syncToSpaces.after', formatMemoryUsage());
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      await this.destroy();
    }
  }

  async initialize() {
    this.throwErrorIfAborted();

    this.blocklet = await states.blocklet.getBlocklet(this.input.appDid);

    if (isEmpty(this.blocklet)) {
      throw new Error('blocklet cannot be empty');
    }

    this.serverDir = process.env.ABT_NODE_DATA_DIR;
    this.backupDir = join(this.serverDir, 'tmp/backup', this.blocklet.appDid);
    ensureDirSync(this.backupDir);

    this.spaceBackupEndpoint = this.blocklet.environments.find(
      (e) => e.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_BACKUP_ENDPOINT
    )?.value;
    if (isEmpty(this.spaceBackupEndpoint)) {
      throw new Error('spaceEndpoint cannot be empty');
    }

    this.securityContext = await this._getSecurityContext(states);
  }

  async export() {
    this.throwErrorIfAborted();

    this.input.event.emit(BlockletEvents.backupProgress, {
      ...getAppId(this.input),
      message: 'Preparing data for backup...',
      progress: 15,
      completed: false,
    });
    await states.backup.progress(this.input.backup.id, {
      message: 'Preparing data for backup...',
      progress: 15,
    });

    this.syncObjects = await this.collectSyncObjects(this.dataBackup, this.storages);

    this.input.event.emit(BlockletEvents.backupProgress, {
      ...getAppId(this.input),
      message: 'Data ready, start backup...',
      progress: 20,
      completed: false,
    });
    await states.backup.progress(this.input.backup.id, {
      message: 'Data ready, start backup...',
      progress: 20,
    });
  }

  /**
   * @description 验证 Space 的空间是否足够备份所需
   * @memberof SpacesBackup
   */
  async verifySpace() {
    this.throwErrorIfAborted();

    const { headers } = await axios.head(`${this.spaceBackupEndpoint}?withExtras=true`, {
      // @FIXME: 等到 space 的存储优化专项完成后，这里可以给出更小的超时时间
      timeout: 1000 * 120,
      headers: {
        'x-locale': this.input.locale,
      },
    });

    const [spaceIsFull, spaceFreeCapacity, spaceIsAvailable, errorMessage] = [
      headers['x-space-is-full'] === 'true',
      +headers['x-space-free-capacity'],
      headers['x-space-is-available'] === 'true',
      headers['x-error-message'],
    ];
    const backupFolderSize = getFolderSize(this.backupDir);

    logger.info('verifySpace', {
      spaceIsAvailable,
      spaceIsFull,
      spaceFreeCapacity: xbytes(spaceFreeCapacity),
      backupFolderSize: xbytes(backupFolderSize),
      backupDir: this.backupDir,
    });

    if (spaceIsFull) {
      throw new Error(translate(this.input.locale, 'backup.space.isFull'));
    }

    if (spaceFreeCapacity <= backupFolderSize) {
      throw new Error(translate(this.input.locale, 'backup.space.lackOfSpace'));
    }

    if (spaceIsAvailable === false) {
      const autoBackup = await this.input.event.getAutoBackup({ did: this.input.appDid });
      if (autoBackup.enabled) {
        await this.input.event.updateAutoBackup(
          { did: this.input.appDid, autoBackup: { enabled: false } },
          {
            referrer: this.input.referrer,
            user: { did: this.input.userDid, locale: this.input.locale },
          }
        );
      }
      throw new Error(decodeURIComponent(errorMessage));
    }
  }

  async syncToSpaces() {
    this.throwErrorIfAborted();

    /**
     * @type {import('@blocklet/server-js').NodeState}
     */
    const node = await states.node.read();
    const serverDid = node.did;

    const spaceClient = new SpaceClient({
      endpoint: this.spaceBackupEndpoint,
      wallet: this.securityContext.signer,
      delegation: this.securityContext.delegation,
    });

    const onAfterUpload = async (data) => {
      // @note: 当备份失败时 && 偶然会存在一些其他的备份请求后来发送成功了，此时会造成备份进度紊乱(明明失败了，错误信息显示上传某个文件成功了)的情况，所以失败的备份不需要再发送事件了
      const currentBackup = await states.backup.findOne({ id: this.input.backup.id });
      if (currentBackup.status === 1) {
        return;
      }

      // 0.8 是因为上传文件到 spaces 占进度的 80%，+ 20 是因为需要累加之前的进度
      const percent = +Number(((data.completed * 100) / data.total) * 0.8).toFixed(2) + 20;
      const progress = percent === Math.floor(percent) ? percent : percent.toFixed(2);
      const progressMessage = `(${data.completed}/${data.total}) Uploading file ${basename(data.key)}`;

      await states.backup.progress(this.input.backup.id, {
        progress,
        message: progressMessage,
      });
      this.input.event.emit(BlockletEvents.backupProgress, {
        ...getAppId(this.input),
        message: progressMessage,
        // 0.8 是因为上传文件到 spaces 占进度的 80%，+ 20 是因为需要累加之前的进度
        progress,
        completed: false,
      });
    };

    const output = await spaceClient.send(
      new IncrementalBackupBlockletCommand({
        appPid: this.input.appPid,
        appDid: this.blocklet.appDid,
        appName: getAppName(this.blocklet),
        appDescription: getAppDescription(this.blocklet),
        userDid: isValid(this.input.userDid) ? this.input.userDid : process.env.ABT_NODE_DID,
        referrer: this.input.referrer,
        serverDid,
        signerDid: this.securityContext.signer.address,

        source: this.syncObjects,
        debug: true,
        concurrency: 4,
        retryCount: 10,
        onAfterUpload,
        abortController: this.input.abortController,
      })
    );
    this.backupOutput = output;

    if (output.statusCode !== 200) {
      const errorMessage = output.statusMessage.toLowerCase().includes('<html')
        ? `Request failed with status code ${output.statusCode}`
        : output.statusMessage;

      throw new Error(errorMessage);
    }
  }

  async destroy() {
    if (existsSync(this.backupDir)) {
      await remove(this.backupDir);
    }
    if (SpacesBackup.instanceMap.has(this.input.appPid)) {
      SpacesBackup.instanceMap.delete(this.input.appPid);
    }
  }

  /**
   *
   *
   * @static
   * @param {string} appPid
   * @memberof SpacesBackup
   */
  static isRunning(appPid) {
    return SpacesBackup.instanceMap.has(appPid);
  }

  /**
   *
   *
   * @static
   * @param {string} appPid
   * @memberof SpacesBackup
   */
  static abort(appPid) {
    if (SpacesBackup.instanceMap.has(appPid)) {
      const instance = SpacesBackup.instanceMap.get(appPid);
      instance.abort();
    }
  }
}

module.exports = {
  SpacesBackup,
};
