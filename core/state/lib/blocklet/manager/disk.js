/* eslint-disable max-classes-per-file */
/* eslint-disable no-await-in-loop */
const get = require('lodash/get');
const omit = require('lodash/omit');
const isFunction = require('lodash/isFunction');
const defaultsDeep = require('lodash/defaultsDeep');
const logger = require('@abtnode/logger')('@abtnode/core:blocklet:manager');
const { CustomError } = require('@blocklet/error');
const { APP_STRUCT_VERSION, CHECK_UPDATE, BACKUPS } = require('@abtnode/constant');
const { forEachBlockletSync, hasStartEngine } = require('@blocklet/meta/lib/util');
const { titleSchema } = require('@blocklet/meta/lib/schema');

const {
  BlockletStatus,
  BlockletEvents,
  BlockletInternalEvents,
  BlockletGroup,
  RESTORE_PROGRESS_STATUS,
  CHAIN_PROP_MAP_REVERSE,
} = require('@blocklet/constant');

const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { isDidDomain, getOriginUrl } = require('@abtnode/util/lib/url-evaluation');
const { isWorkerInstance } = require('@abtnode/util/lib/pm2/is-instance-worker.js');
const util = require('../../util');

const blockletUtils = require('../../util/blocklet');
const states = require('../../states');
const BaseBlockletManager = require('./base');
const { BlockletRuntimeMonitor } = require('../../monitor/blocklet-runtime-monitor');
const { SpacesBackup } = require('../storage/backup/spaces');
const { BlockletImporter } = require('../storage/import/importer');
const { installApplicationFromDev } = require('./helper/install-application-from-dev');
const { installComponentFromDev } = require('./helper/install-component-from-dev');
const { diff } = require('./helper/install-component-from-upload');
const UpgradeComponents = require('./helper/upgrade-components');
const BlockletDownloader = require('../downloader/blocklet-downloader');
const RollbackCache = require('./helper/rollback-cache');
const { migrateApplicationToStructV2 } = require('./helper/migrate-application-to-struct-v2');
const { getBackupJobId, getCheckUpdateJobId } = require('../../util/spaces');
const ConfigSynchronizer = require('./config-synchronizer');
const {
  createProject,
  getProject,
  getProjects,
  updateProject,
  deleteProject,
  createRelease,
  getReleases,
  getRelease,
  deleteRelease,
  getSelectedResources,
  updateSelectedResources,
  connectToStore,
  connectToEndpoint,
  connectToAigne,
  publishToStore,
  publishToEndpoint,
  connectByStudio,
  disconnectFromStore,
} = require('../project');
const { ensureBlockletRunning } = require('./ensure-blocklet-running');
const { generateUserUpdateData } = require('../../util/user');
const { verifyAigneConfig } = require('../../util/aigne-verify');
const settingsManager = require('./disk/settings-manager');
const configManager = require('./disk/config-manager');
const queryManager = require('./disk/query-manager');
const lifecycleManager = require('./disk/lifecycle-manager');
const installManager = require('./disk/install-manager');
const envConfigManager = require('./disk/env-config-manager');
const cleanupManager = require('./disk/cleanup-manager');
const hookManager = require('./disk/hook-manager');
const jobManager = require('./disk/job-manager');
const notificationManager = require('./disk/notification-manager');
const federatedManager = require('./disk/federated-manager');
const backupManager = require('./disk/backup-manager');
const updateManager = require('./disk/update-manager');
const downloadManager = require('./disk/download-manager');
const componentManager = require('./disk/component-manager');
const authManager = require('./disk/auth-manager');
const controllerManager = require('./disk/controller-manager');
const installComponentManager = require('./disk/install-component-manager');
const { statusLock } = require('./lock');

const {
  deleteBlockletProcess,
  parseComponents,
  filterDuplicateComponents,
  getBlocklet,
  checkVersionCompatibility,
  getBlockletDidDomainList,
  updateDidDocument: updateBlockletDocument,
} = blockletUtils;
const { getBlockletMeta } = util;

class DiskBlockletManager extends BaseBlockletManager {
  /**
   *
   * @param {{
   *   nodeAPI: import('../../api/node'),
   *   teamAPI: import('../../api/team'),
   *   dataDirs: import('../../util/data-dirs'),
   *   startQueue: import('@abtnode/queue'),
   *   installQueue: import('@abtnode/queue'),
   *   backupQueue: import('@abtnode/queue'),
   *   restoreQueue: import('@abtnode/queue'),
   *   checkUpdateQueue: import('@abtnode/queue'),
   *   reportComponentUsageQueue: import('@abtnode/queue'),
   *   resendNotificationQueue: import('@abtnode/queue'),
   *   daemon: boolean,
   *   teamManager: import('../../team/manager'),
   * }} param0
   */
  constructor({
    dataDirs,
    startQueue,
    installQueue,
    backupQueue,
    restoreQueue,
    checkUpdateQueue,
    reportComponentUsageQueue,
    resendNotificationQueue,
    teamManager,
    nodeAPI,
    teamAPI,
    certManager,
    routerManager,
  }) {
    super();

    this.dataDirs = dataDirs;
    this.installDir = dataDirs.blocklets;
    this.startQueue = startQueue;
    this.installQueue = installQueue;
    /**
     * @type {ReturnType<import('@abtnode/queue')>}
     */
    this.backupQueue = backupQueue;
    this.restoreQueue = restoreQueue;
    this.checkUpdateQueue = checkUpdateQueue;
    this.reportComponentUsageQueue = reportComponentUsageQueue;
    this.resendNotificationQueue = resendNotificationQueue;
    this.teamManager = teamManager;
    this.certManager = certManager;
    this.routerManager = routerManager;
    /**
     * @type {import('../../api/node')}
     */
    this.nodeAPI = nodeAPI;
    this.teamAPI = teamAPI;

    if (isFunction(this.backupQueue.on)) {
      /**
       *
       * @param {{
       *  id: string,
       *  job: { did: string }
       * }} param0
       */
      const handleBackupComplete = async ({ id: jobId, job }) => {
        await this.backupQueue.delete(jobId);
        SpacesBackup.abort(job.did);

        const autoBackup = await this.getAutoBackup({ did: job.did });
        if (autoBackup?.enabled) {
          job.backupState = {
            strategy: BACKUPS.STRATEGY.AUTO,
          };
          this.backupQueue.push(job, jobId, true, BACKUPS.JOB.INTERVAL);
        }
      };
      this.backupQueue.on('finished', handleBackupComplete).on('failed', handleBackupComplete);
    }

    this.runtimeMonitor = new BlockletRuntimeMonitor({ states });

    this.blockletDownloader = new BlockletDownloader({
      installDir: this.installDir,
      downloadDir: this.dataDirs.tmp,
      cache: states.cache,
      getNodeInfo: () => states.node.read(),
    });

    this._rollbackCache = new RollbackCache({ dir: this.dataDirs.tmp });

    this.configSynchronizer = new ConfigSynchronizer({ manager: this, states });

    if (isFunction(this.checkUpdateQueue?.on)) {
      /**
       *
       * @param {{
       *  id: string,
       *  job: { did: string }
       * }} param0
       */
      const handleCheckUpdateComplete = async ({ id: jobId, job }) => {
        await this.checkUpdateQueue.delete(jobId);
        const { did } = job;
        const checkUpdate = await this.getAutoCheckUpdate({ did });
        if (checkUpdate?.enabled) {
          this.checkUpdateQueue.push(job, jobId, true, CHECK_UPDATE.JOB.DAY_INTERVAL);
        }
      };
      this.checkUpdateQueue.on('finished', handleCheckUpdateComplete).on('failed', handleCheckUpdateComplete);
    }
  }

  async initialize() {
    await this.ensureAutoBackupJobs();
    await this.ensureAutoCheckUpdateJobs();
    this.ensureBlockletRunning();
  }

  ensureBlockletRunning = () => {
    if (isWorkerInstance()) {
      return;
    }
    ensureBlockletRunning.initialize({
      start: async (params) => {
        await this.start(params);
      },
      createAuditLog: (params) => this.createAuditLog(params),
      notification: (did, title, description, severity) => {
        try {
          this._createNotification(did, {
            title,
            description,
            action: `/blocklets/${did}/overview`,
            blockletDashboardAction: `${WELLKNOWN_SERVICE_PATH_PREFIX}/admin/blocklets`,
            entityType: 'blocklet',
            entityId: did,
            severity,
          });
        } catch (err) {
          logger.error('create notification failed', { err });
        }
      },
      checkSystemHighLoad: (...args) => this.nodeAPI.runtimeMonitor.checkSystemHighLoad(...args),
    });
  };

  ensureJobs(params) {
    return jobManager.ensureJobs(this, params);
  }

  async ensureAutoBackupJobs() {
    await this.ensureJobs({
      queue: this.backupQueue,
      getJobId: getBackupJobId,
      find: {
        'settings.autoBackup.enabled': true,
      },
      entity: 'blocklet',
      action: 'backupToSpaces',
      interval: BACKUPS.JOB.INTERVAL,
      restoreCancelled: true,
    });
  }

  async ensureAutoCheckUpdateJobs() {
    await this.ensureJobs({
      queue: this.checkUpdateQueue,
      getJobId: getCheckUpdateJobId,
      find: {
        'settings.autoCheckUpdate.enabled': true,
      },
      entity: 'blocklet',
      action: 'autoCheckUpdate',
      interval: CHECK_UPDATE.JOB.DAY_INTERVAL,
      restoreCancelled: true,
    });
  }

  // This property will be injected after the node instance is instantiated.
  createAuditLog = (params) => {
    console.warn('createAuditLog not initialized', params);
  };

  // ============================================================================================
  // Public API for Installing/Upgrading Application or Components
  // ============================================================================================

  /**
   *
   *
   * @param {{
   *  url: string;
   *  did: string;
   *  title: string;
   *  description: string;
   *  storeUrl: string;
   *  appSk: string;
   *  skSource: string;
   *  sync: boolean = false; // download synchronously, not use queue
   *  delay: number; // push download task to queue after a delay
   *  downloadTokenList: Array<{did: string, token: string}>;
   *  startImmediately: boolean;
   *  controller: Controller
   *  onlyRequired: boolean;
   *  type: BLOCKLET_INSTALL_TYPE
   * }} params
   * @param {{
   *  [key: string]: any
   * }} context
   * @return {*}
   * @memberof BlockletManager
   */
  install(params, context = {}) {
    return installManager.install(this, params, context);
  }

  /**
   * @param {String} rootDid
   * @param {String} mountPoint
   *
   * installFromUrl
   * @param {String} url
   *
   * InstallFromUpload
   * @param {Object} file
   * @param {String} did for diff upload or custom component did
   * @param {String} diffVersion for diff upload
   * @param {Array} deleteSet for diff upload
   *
   * Custom info
   * @param {String} title custom component title
   * @param {String} name custom component name
   *
   * @param {ConfigEntry} configs pre configs
   * @param {Boolean} onlyRequired only install required components
   */
  installComponent(params, context) {
    return installComponentManager.installComponent(this, params, context);
  }

  diff({ did, hashFiles, rootDid }) {
    return diff({ did, hashFiles, rootDid, states, manager: this });
  }

  /**
   * After the dev function finished, the caller should send a BlockletEvents.installed event to the daemon
   * @returns {Object} blocklet
   */
  dev(folder, { rootDid, mountPoint, defaultStoreUrl, skipParseDependents } = {}) {
    logger.info('dev component', { folder, rootDid, mountPoint });

    const meta = getBlockletMeta(folder, { defaultStoreUrl });
    if (meta.group !== 'static' && hasStartEngine(meta) && (!meta.scripts || !meta.scripts.dev)) {
      throw new Error('Incorrect blocklet.yml: missing `scripts.dev` field');
    }

    if (!rootDid) {
      return installApplicationFromDev({ folder, meta, manager: this, states });
    }

    return installComponentFromDev({ folder, meta, rootDid, mountPoint, skipParseDependents, manager: this, states });
  }

  async checkComponentsForUpdates({ did }) {
    const blocklet = await this.ensureBlocklet(did);
    await this.checkControllerStatus(blocklet, 'upgrade');
    return UpgradeComponents.check({ did, states });
  }

  upgradeComponents({ updateId, selectedComponents: componentDids }, context = {}) {
    return UpgradeComponents.upgrade({ updateId, componentDids, context, states, manager: this });
  }

  migrateApplicationToStructV2({ did, appSk, context = {} }) {
    return migrateApplicationToStructV2({ did, appSk, context, manager: this, states });
  }

  startRequiredComponents(params) {
    return lifecycleManager.startRequiredComponents(this, params);
  }

  start(params, context) {
    return lifecycleManager.start(this, params, context);
  }

  _start(params, context) {
    return lifecycleManager._start(this, params, context);
  }

  stop(params, context) {
    return lifecycleManager.stop(this, params, context);
  }

  /**
   * @param {import('@blocklet/server-js').RequestBackupBlockletInput} input
   * @memberof BlockletManager
   */
  // eslint-disable-next-line no-unused-vars
  async backupBlocklet({ appDid, to }, context) {
    const blocklet = await states.blocklet.getBlocklet(appDid);
    if (blocklet.structVersion !== APP_STRUCT_VERSION) {
      throw new Error('Only new version app can be backup to spaces, please migrate this app first');
    }

    if (to === 'spaces') {
      return this._backupToSpaces({ blocklet, context });
    }

    if (to === 'disk') {
      return this._backupToDisk({ blocklet }, context);
    }

    throw new Error('Can only backup to spaces or disk');
  }

  /**
   * @param {import('@blocklet/server-js').RequestAbortBlockletBackupInput} input
   * @memberof BlockletManager
   */
  abortBlockletBackup({ appPid }) {
    SpacesBackup.abort(appPid);
  }

  /**
   * @param {import('@blocklet/server-js').RequestRestoreBlockletInput} input
   * @memberof BlockletManager
   */
  async restoreBlocklet(input, context) {
    const { from, ...param } = input;

    if (input.overwrite) {
      try {
        const blocklet = await this.getBlocklet(input.appPid);
        if (blocklet) {
          this.emit(BlockletEvents.restoreProgress, {
            appDid: input.appDid,
            meta: { did: input.appPid },
            status: RESTORE_PROGRESS_STATUS.waiting,
          });
          await this.delete({ did: input.appPid, keepData: false, keepLogsDir: false, keepConfigs: false }, context);
        }
      } catch (error) {
        logger.error('Failed to delete blocklet', { error, did: input.appPid });
      }
    }

    if (from === 'spaces') {
      return this._restoreFromSpaces(param, context);
    }

    if (from === 'disk') {
      return this._restoreFromDisk(param, context);
    }

    throw new Error('Can only restore from spaces or disk');
  }

  /**
   * Import a blocklet from an export directory
   * @param {{ inputDir: string, overwrite?: boolean }} input
   * @param {Record<string, any>} context
   */
  async importBlocklet(input, context = {}) {
    if (input.overwrite && input.blockletDid) {
      const existing = await this.getBlocklet(input.blockletDid);
      if (existing) {
        await this.delete({ did: input.blockletDid, keepData: false, keepLogsDir: false, keepConfigs: false }, context);
      }
    }

    const importer = new BlockletImporter({
      inputDir: input.inputDir,
      manager: this,
      states,
      context,
      progressCallback: input.progressCallback,
    });
    return importer.import();
  }

  /**
   *
   * @param {import('@blocklet/server-js').RequestBlockletInput} param0
   * @param {Record<string, any>} context
   * @returns {import('@blocklet/server-js').BlockletState}
   */
  restart(params, context) {
    return lifecycleManager.restart(this, params, context);
  }

  // eslint-disable-next-line no-unused-vars
  reload(params, context) {
    return lifecycleManager.reload(this, params, context);
  }

  delete(params, context) {
    return lifecycleManager.delete(this, params, context);
  }

  _safeRemoveDir(did, childDid, inputDirs) {
    return lifecycleManager._safeRemoveDir(this, did, childDid, inputDirs);
  }

  reset(params, context = {}) {
    return lifecycleManager.reset(this, params, context);
  }

  deleteComponent(params, context) {
    return lifecycleManager.deleteComponent(this, params, context);
  }

  cancelDownload({ did: inputDid }) {
    return downloadManager.cancelDownload(this, { did: inputDid }, statusLock);
  }

  /**
   *
   * @param {object} param - params
   * @param {string} param.did - blocklet did
   * @param {string[]} param.componentDids - component dids
   * @param {boolean} param.shouldUpdateBlockletStatus - should update blocklet status
   * @param {*} context
   * @returns
   */
  deleteProcess = async ({ did, componentDids, shouldUpdateBlockletStatus = true, isGreen = false }, context) => {
    const blocklet = await this.getBlocklet(did);

    logger.info('delete blocklet process', { did, componentDids });

    await deleteBlockletProcess(blocklet, { ...context, componentDids, isGreen });
    logger.info('blocklet process deleted successfully', { did, componentDids });

    // 有些情况不需要更新 blocklet 状态, 比如下载完成，安装之前清理 process 时, 不需要更新 blocklet 状态
    if (shouldUpdateBlockletStatus) {
      const result = await states.blocklet.setBlockletStatus(did, BlockletStatus.stopped, { componentDids, isGreen });
      logger.info('blocklet status updated to stopped after deleted processes', { did, componentDids });
      return result;
    }

    return blocklet;
  };

  // Get blocklet by blockletDid or appDid
  detail(params, context) {
    return queryManager.detail(this, params, context);
  }

  list(params = {}, context) {
    return queryManager.list(this, params, context);
  }

  listBackups() {
    return queryManager.listBackups(this);
  }

  /**
   * Config blocklet environment
   */
  config({ did, configs: newConfigs, skipHook, skipDidDocument, skipEmitEvents }, context) {
    return envConfigManager.config(
      this,
      { did, configs: newConfigs, skipHook, skipDidDocument, skipEmitEvents },
      context
    );
  }

  configNavigations({ did, navigations = [] }, context) {
    return configManager.configNavigations(this, { did, navigations }, context);
  }

  configTheme({ did, theme = {} }, context) {
    return configManager.configTheme(this, { did, theme }, context);
  }

  configAuthentication({ did, authentication = {} }, context) {
    return configManager.configAuthentication(this, { did, authentication }, context);
  }

  configDidConnect({ did, didConnect = {} }, context) {
    return configManager.configDidConnect(this, { did, didConnect }, context);
  }

  async configDidConnectActions({ did, actionConfig = {} }, context) {
    const oldConfig = await states.blockletExtras.getSettings(did, 'actionConfig', {});
    const parsedData = JSON.parse(actionConfig);
    const mergeConfig = defaultsDeep(parsedData, oldConfig);
    await states.blockletExtras.setSettings(did, { actionConfig: mergeConfig });
    const newState = await this.getBlocklet(did);
    this.emit(BlockletInternalEvents.appSettingChanged, { appDid: did });
    this.emit(BlockletEvents.updated, { ...newState, context });
    return newState;
  }

  /**
   * 测试邮件发送
   * @param {string} did
   * @param {string} receiver, 接收者邮箱
   * @param {string} email, 邮件内容
   * @returns
   */
  sendEmail({ did, receiver, email }) {
    return configManager.sendEmail(this, { did, receiver, email });
  }

  sendPush({ did, receiver, notification }) {
    return configManager.sendPush(this, { did, receiver, notification });
  }

  configNotification({ did, notification = {} }, context) {
    return configManager.configNotification(this, { did, notification }, context);
  }

  // -------------------------------------

  // TODO: this method can be removed if title is not changed anymore
  async updateComponentTitle({ did, rootDid: inputRootDid, title }, context) {
    await titleSchema.validateAsync(title);

    const blocklet = await states.blocklet.getBlocklet(inputRootDid);

    if (!blocklet) {
      throw new Error('blocklet does not exist');
    }

    const rootDid = blocklet.meta.did;

    const { children } = blocklet;
    const component = children.find((x) => x.meta.did === did);

    if (!component) {
      throw new Error('component does not exist');
    }

    component.meta.title = title;
    await states.blocklet.updateBlocklet(rootDid, { children });

    // trigger meta.js refresh
    // trigger dashboard frontend refresh
    this.emit(BlockletEvents.updated, { ...blocklet, context });

    return this.getBlocklet(rootDid);
  }

  updateComponentMountPoint(params, context) {
    return componentManager.updateComponentMountPoint(this, params, context);
  }

  updateAppSessionConfig({ did, config }, context) {
    return settingsManager.updateAppSessionConfig(this, { did, config }, context);
  }

  updateVault({ did, vaults }, context) {
    return settingsManager.updateVault(this, { did, vaults }, context);
  }

  // eslint-disable-next-line no-unused-vars
  getRuntimeHistory({ did, hours }) {
    return queryManager.getRuntimeHistory(this, { did, hours });
  }

  ensureBlocklet(did, opts = {}) {
    return getBlocklet({ ...opts, states, dataDirs: this.dataDirs, did, ensureIntegrity: true });
  }

  /**
   * 获取 blocklet 信息, 其实仅仅是复用 getBlocklet 方法,区别是 ensureIntegrity 为 false
   * @param {string} did
   * @param {Object} opts
   * @param {boolean} opts.useCache - 是否使用缓存
   * @returns {Promise<Object>}
   */
  getBlocklet(did, opts = {}) {
    return getBlocklet({ ...opts, states, dataDirs: this.dataDirs, did, ensureIntegrity: false });
  }

  hasBlocklet({ did }) {
    return states.blocklet.hasBlocklet(did);
  }

  setInitialized({ did, owner, purpose = '' }, context) {
    return settingsManager.setInitialized(this, { did, owner, purpose }, context);
  }

  updateOwner({ did, owner }, context) {
    return settingsManager.updateOwner(this, { did, owner }, context);
  }

  status(did, opts = {}) {
    return queryManager.status(this, did, opts);
  }

  refreshListCache() {
    return queryManager.refreshListCache(this);
  }

  updateAllBlockletEnvironment() {
    return queryManager.updateAllBlockletEnvironment(this);
  }

  prune() {
    return queryManager.prune(this);
  }

  _updateBlockletCertificate(did) {
    return queryManager._updateBlockletCertificate(this, did);
  }

  /**
   * Update certificates for all blocklets in batches
   * Memory-efficient: processes 100 blocklets at a time
   */
  updateAllBlockletCertificate() {
    return queryManager.updateAllBlockletCertificate(this);
  }

  /**
   * @description
   * @param {{
   *  entity: string;
   *  action: string;
   *  id: string;
   * }} job
   * @memberof BlockletManager
   */
  onJob(job) {
    return jobManager.onJob(this, job);
  }

  getCrons() {
    return jobManager.getCrons(this);
  }

  /**
   * @description
   * @param {{
   *  did: import('@blocklet/server-js').RequestAddBlockletSpaceGatewayInput,
   *  spaceGateway: import('@blocklet/server-js').SpaceGateway
   * }} { did, spaceGateway }
   * @return {Promise<void>}
   * @memberof BlockletManager
   */
  addBlockletSpaceGateway({ did, spaceGateway }) {
    return settingsManager.addBlockletSpaceGateway(this, { did, spaceGateway });
  }

  /**
   * @description
   * @param {import('@blocklet/server-js').RequestAddBlockletSpaceGatewayInput} { did, spaceGatewayDid }
   * @return {Promise<void>}
   * @memberof BlockletManager
   */
  deleteBlockletSpaceGateway({ did, spaceGatewayDid }) {
    return settingsManager.deleteBlockletSpaceGateway(this, { did, spaceGatewayDid });
  }

  /**
   * @description
   * @param {{
   *  did: string,
   *  where: import('@blocklet/server-js').SpaceGateway
   *  spaceGateway: import('@blocklet/server-js').SpaceGateway
   * }} { did, spaceGateway }
   * @return {Promise<void>}
   * @memberof BlockletManager
   */
  updateBlockletSpaceGateway({ did, where, spaceGateway }) {
    return settingsManager.updateBlockletSpaceGateway(this, { did, where, spaceGateway });
  }

  /**
   * @description
   * @param {{ did: string }} { did }
   * @return {Promise<Array<import('@blocklet/server-js').SpaceGateway>>}
   * @memberof BlockletManager
   */
  getBlockletSpaceGateways({ did }) {
    return settingsManager.getBlockletSpaceGateways(this, { did });
  }

  updateUserSpaceHosts({ did, url }) {
    return settingsManager.updateUserSpaceHosts(this, { did, url });
  }

  getUserSpaceHosts({ did }) {
    return settingsManager.getUserSpaceHosts(this, { did });
  }

  /**
   * @description
   * @param {{
   *  did: string,
   *  autoBackup: import('@blocklet/server-js').AutoBackup
   * }} { did, autoBackup }
   * @param {{}} context
   * @memberof DiskBlockletManager
   */
  updateAutoBackup({ did, autoBackup }, context) {
    return settingsManager.updateAutoBackup(this, { did, autoBackup }, context);
  }

  /**
   * @description
   * @param {import('@blocklet/server-js').RequestGetAutoBackupInput} { did }
   * @return {Promise<import('@blocklet/server-js').AutoBackup>}
   * @memberof DiskBlockletManager
   */
  getAutoBackup({ did }) {
    return settingsManager.getAutoBackup(this, { did });
  }

  /**
   * @description
   * @param {{
   *  did: string,
   *  autoCheckUpdate: import('@blocklet/server-js').AutoCheckUpdate
   * }} { did, autoCheckUpdate }
   * @param {{}} context
   * @memberof DiskBlockletManager
   */
  updateAutoCheckUpdate({ did, autoCheckUpdate }, context) {
    return settingsManager.updateAutoCheckUpdate(this, { did, autoCheckUpdate }, context);
  }

  /**
   * @description
   * @param {import('@blocklet/server-js').RequestGetAutoCheckUpdateInput} { did }
   * @return {Promise<import('@blocklet/server-js').AutoCheckUpdate>}
   * @memberof DiskBlockletManager
   */
  getAutoCheckUpdate({ did }) {
    return settingsManager.getAutoCheckUpdate(this, { did });
  }

  /**
   * @description
   * @param {import('@blocklet/server-js').RequestGetBlockletBackupsInput} options
   * @return {Promise<Array<import('@blocklet/server-js').Backup>>}
   * @memberof BlockletManager
   */
  async getBlockletBackups(options) {
    const backups = await states.backup.getBlockletBackups(options);

    return backups;
  }

  /**
   * @description 获取备份统计摘要信息
   * @param {{ did: string, start_time: string, end_time: string }} params
   * @return {Promise<Array<{date: string, successCount: number, errorCount: number}>>}
   * @memberof BlockletManager
   */
  async getBlockletBackupSummary(params, context) {
    const summary = await states.backup.getBlockletBackupSummary({ ...params, timezone: context?.timezone });

    return summary;
  }

  updateBlockletSettings({ did, enableSessionHardening, invite, gateway, aigne, org, subService }, context) {
    return settingsManager.updateBlockletSettings(
      this,
      { did, enableSessionHardening, invite, gateway, aigne, org, subService },
      context
    );
  }

  setBlockletBlurhash({ did, blurhash }) {
    return settingsManager.setBlockletBlurhash(this, { did, blurhash });
  }

  getBlockletBlurhash({ did }) {
    return settingsManager.getBlockletBlurhash(this, { did });
  }

  syncAppConfig(did, { serverVersion } = {}) {
    return this.configSynchronizer.syncAppConfig(did, { serverVersion });
  }

  createProject({ did, ...params } = {}, context) {
    return createProject({ did, ...params, context, manager: this });
  }

  getProjects({ did, componentDid, tenantScope } = {}, context) {
    return getProjects({ did, componentDid, tenantScope, context, manager: this });
  }

  getProject({ did, projectId, messageId } = {}, context) {
    return getProject({ did, projectId, messageId, context, manager: this });
  }

  updateProject({ did, projectId, ...params } = {}, context) {
    return updateProject({ did, projectId, ...params, context, manager: this });
  }

  deleteProject({ did, projectId } = {}, context) {
    return deleteProject({ did, projectId, context, manager: this });
  }

  // eslint-disable-next-line no-unused-vars
  createRelease({ did, projectId, ...params } = {}, context) {
    return createRelease({ did, projectId, ...params, context, manager: this });
  }

  getReleases({ did, projectId } = {}, context) {
    return getReleases({ did, projectId, context, manager: this });
  }

  getRelease({ did, projectId, releaseId } = {}, context) {
    return getRelease({ did, projectId, releaseId, context, manager: this });
  }

  deleteRelease({ did, projectId, releaseId } = {}, context) {
    return deleteRelease({ did, projectId, releaseId, context, manager: this });
  }

  connectToStore(params, context) {
    return connectToStore({ ...params, context, manager: this });
  }

  connectToEndpoint(params, context) {
    return connectToEndpoint({ ...params, context, manager: this });
  }

  connectToAigne(params, context) {
    return connectToAigne({ ...params, context, manager: this });
  }

  async disconnectToAigne({ did, url, key }, context) {
    try {
      const blocklet = await this.getBlocklet(did);
      if (!blocklet) {
        throw new CustomError(400, 'blocklet did invalid, no blocklet found');
      }
      const aigneSetting = get(blocklet, 'settings.aigne', {});
      const _url = getOriginUrl(url);
      const settingUrl = getOriginUrl(aigneSetting.url);
      if (aigneSetting.key !== key && _url !== settingUrl) {
        throw new CustomError(400, 'Invalid key or url provided');
      }
      await states.blockletExtras.setSettings(did, {
        aigne: {
          ...aigneSetting,
          key: '',
          accessKeyId: '',
          secretAccessKey: '',
          validationResult: '',
        },
      });
      const newState = await this.getBlocklet(did);
      this.emit(BlockletInternalEvents.appSettingChanged, { appDid: did });
      this.emit(BlockletEvents.updated, { ...newState, context });

      return newState;
    } catch (error) {
      logger.error('disconnectToAigne error', { did, url, key, error });
      throw error;
    }
  }

  async verifyAigneConnection({ did }) {
    try {
      const blocklet = await this.getBlocklet(did);
      if (!blocklet) {
        throw new CustomError(400, 'blocklet did invalid, no blocklet found');
      }
      const aigne = get(blocklet, 'settings.aigne', {});
      const verified = await verifyAigneConfig(aigne, blocklet);
      if (!verified.valid) {
        await states.blockletExtras.setSettings(did, {
          aigne: { ...aigne, validationResult: verified?.error || 'failed' },
        });
        throw new CustomError(500, verified.error);
      }
      await states.blockletExtras.setSettings(did, { aigne: { ...aigne, validationResult: 'success' } });
    } catch (error) {
      logger.error('verify aigne connection error', { did, error });
      throw error;
    }
  }

  disconnectFromStore(params, context) {
    return disconnectFromStore({ ...params, context, manager: this });
  }

  async disconnectFromEndpoint({ did, endpointId, projectId }, context) {
    if (!did) throw new Error('Invalid did');

    const { projectState } = await this._getProjectState(did);
    return projectState.deleteConnectedEndpoint({ projectId, endpointId, createdBy: context?.user?.did });
  }

  connectByStudio(params, context) {
    return connectByStudio({ ...params, context, manager: this });
  }

  publishToStore(params, context) {
    return publishToStore({ ...params, context, manager: this });
  }

  publishToEndpoint(params, context) {
    return publishToEndpoint({ ...params, context, manager: this });
  }

  getSelectedResources({ did, projectId, releaseId, componentDid } = {}, context) {
    return getSelectedResources({ did, projectId, releaseId, componentDid, context, manager: this });
  }

  async updateSelectedResources({ did, projectId, releaseId, componentDid, resources } = {}, context) {
    const nodeInfo = await states.node.read();
    return updateSelectedResources({
      did,
      projectId,
      releaseId,
      componentDid,
      resources,
      context,
      manager: this,
      nodeInfo,
    });
  }

  // ============================================================================================
  // Private API that are used by self of helper function
  // ============================================================================================

  _getProjectState(did) {
    return this.teamManager.getProjectState(did);
  }

  /**
   * Download and install blocklet
   */
  _downloadAndInstall(params) {
    return installManager._downloadAndInstall(this, params);
  }

  /**
   * On install callback
   */
  _onInstall({ blocklet, componentDids, context, oldBlocklet }) {
    return installManager._onInstall(this, { blocklet, componentDids, context, oldBlocklet });
  }

  /**
   * On restart callback
   */
  _onRestart({ did, componentDids, context, operator }) {
    return installManager._onRestart(this, { did, componentDids, context, operator });
  }

  _onCheckIfStarted = async (jobInfo, { skipRunningCheck = false, isGreen = false } = {}) => {
    const { did, minConsecutiveTime = 2000, timeout, componentDids } = jobInfo;
    const blocklet = await this.getBlocklet(did);

    const nodeInfo = await states.node.read();

    if (!skipRunningCheck) {
      await blockletUtils.checkBlockletProcessHealthy(blocklet, {
        minConsecutiveTime,
        timeout,
        componentDids,
        isGreen,
        appDid: did,
        enableDocker: nodeInfo.enableDocker,
        getBlocklet: () => {
          return this.getBlocklet(did);
        },
      });
    }
  };

  /**
   * @param {{
   *  did: string,
   *  blocklet: import('@blocklet/server-js').BlockletState,
   *  context: {
   *    referrer: string;
   *    user: {
   *      did: string;
   *    }
   *  },
   *  backupState: Pick<import('@abtnode/models').BackupState, 'strategy'>
   * }} { blocklet, context }
   * @memberof BlockletManager
   */
  _onBackupToSpaces({ did, context, backupState }) {
    return backupManager._onBackupToSpaces(this, { did, context, backupState });
  }

  /**
   * @param {{
   *  input: import('@blocklet/server-js').RequestRestoreBlockletInput,
   *  context: Record<string, string>,
   * }} {input, context}
   * @memberof BlockletManager
   */
  // eslint-disable-next-line no-unused-vars
  _onRestoreFromSpaces({ input, context }) {
    return backupManager._onRestoreFromSpaces(this, { input, context });
  }

  _onCheckForComponentUpdate({ did }) {
    return updateManager._onCheckForComponentUpdate(this, { did });
  }

  _reportComponentUsage({ did, componentDids, eventType, time }) {
    return updateManager._reportComponentUsage(this, { did, componentDids, eventType, time });
  }

  /**
   * @description send notification to multiple users, and send different notifications according to the user's own language
   * @param {{
   * did: string,
   * blocklet: import('@blocklet/server-js').BlockletState,
   * title: {zh: string, en: string},
   * body: {zh: string, en: string},
   * button: {zh: string, en: string},
   * description: {zh: string, en: string},
   * attachments: Array<import('@blocklet/server-js').NotificationAttachment>,
   * action: string,
   * blockletDashboardAction: string,
   * sender: { appDid: string, appSk: string },
   * users: Array<{ did: string, locale: string }>
   * componentDids: Array<string>
   * */
  _sendAllMessageToUser(params) {
    return notificationManager._sendAllMessageToUser(this, params);
  }

  getBlockletEnvironments(did) {
    return queryManager.getBlockletEnvironments(this, did);
  }

  _updateBlockletEnvironment(did) {
    return queryManager._updateBlockletEnvironment(this, did);
  }

  _attachBlockletListRuntimeInfo({ blocklets }, context) {
    return queryManager._attachBlockletListRuntimeInfo(this, { blocklets }, context);
  }

  // 处理 domainAliases#value SLOT_FOR_IP_DNS_SITE
  getDomainAliases({ blocklet, nodeInfo }, context = {}) {
    return queryManager.getDomainAliases(this, { blocklet, nodeInfo }, context);
  }

  _attachRuntimeInfo(params) {
    return queryManager._attachRuntimeInfo(this, params);
  }

  async _getChildrenForInstallation(component) {
    if (!component) {
      return [];
    }

    const { dynamicComponents } = await parseComponents(component);
    if (component.meta.group !== BlockletGroup.gateway) {
      dynamicComponents.unshift(component);
    }

    const children = filterDuplicateComponents(dynamicComponents);
    checkVersionCompatibility(children);
    return children;
  }

  _addBlocklet(params) {
    return installManager._addBlocklet(this, params);
  }

  /**
   * Install blocklet
   */
  _installBlocklet({ did, oldBlocklet, componentDids, context, createNotification = true }) {
    return installManager._installBlocklet(this, {
      did,
      oldBlocklet,
      componentDids,
      context,
      createNotification,
    });
  }

  /**
   * Run migration scripts
   */
  _runMigration({ parallel, did, blocklet, oldBlocklet, componentDids }) {
    return installManager._runMigration(this, { parallel, did, blocklet, oldBlocklet, componentDids });
  }

  /**
   * Clean upload file
   */
  _cleanUploadFile(url) {
    return installManager._cleanUploadFile(url);
  }

  /**
   * Upgrade blocklet
   */
  _upgradeBlocklet(params) {
    return installManager._upgradeBlocklet(this, params);
  }

  /**
   * Ensure deleted children in settings
   */
  _ensureDeletedChildrenInSettings(blocklet) {
    return installManager._ensureDeletedChildrenInSettings(this, blocklet);
  }

  /**
   *
   *
   * @param {{}} blocklet
   * @param {{}} [context={}]
   * @return {*}
   * @memberof BlockletManager
   */
  _downloadBlocklet(blocklet, context = {}) {
    const {
      appDid,
      meta: { did },
    } = blocklet;

    return this.blockletDownloader.download(blocklet, {
      ...context,
      // preDownload: () => {},
      onProgress: (data) => {
        this.emit(BlockletEvents.downloadBundleProgress, { appDid: appDid || did, meta: { did }, ...data });
      },
      postDownload: async ({ isCancelled }) => {
        if (!isCancelled) {
          // since preferences only exist in blocklet bundle, we need to populate then after downloaded
          await this._setConfigsFromMeta(did);
        }
      },
    });
  }

  /**
   * Rollback blocklet installation/upgrade
   */
  _rollback(action, did, oldBlocklet) {
    return cleanupManager._rollback(this, action, did, oldBlocklet);
  }

  /**
   * Delete blocklet
   */
  _deleteBlocklet({ did, keepData, keepLogsDir, keepConfigs }, context) {
    return cleanupManager._deleteBlocklet(this, { did, keepData, keepLogsDir, keepConfigs }, context);
  }

  /**
   * Clean blocklet data
   */
  _cleanBlockletData({ blocklet, keepData, keepLogsDir, keepConfigs, appCacheDir }) {
    return cleanupManager._cleanBlockletData(this, { blocklet, keepData, keepLogsDir, keepConfigs, appCacheDir });
  }

  /**
   * Set configs from meta
   */
  _setConfigsFromMeta(did, childDid) {
    return hookManager._setConfigsFromMeta(this, did, childDid);
  }

  /**
   * Get blocklet for installation
   */
  _getBlockletForInstallation(did) {
    return cleanupManager._getBlockletForInstallation(did);
  }

  /**
   * Run user hook
   */
  _runUserHook(name, blocklet, context) {
    return hookManager._runUserHook(this, name, blocklet, context);
  }

  // 目前：Blocklet 的安装消息都会聚合在这里。
  _createNotification(did, notification, { skipGetBlocklet = false } = {}) {
    return notificationManager._createNotification(this, did, notification, { skipGetBlocklet });
  }

  checkRenewedBlocklet() {
    return jobManager.checkRenewedBlocklet(this);
  }

  stopExpiredBlocklets() {
    return lifecycleManager.stopExpiredBlocklets(this);
  }

  cleanExpiredBlocklets() {
    return jobManager.cleanExpiredBlocklets(this);
  }

  async _updateDidDocument(blocklet) {
    const nodeInfo = await states.node.read();

    const domainAliases = (get(blocklet, 'site.domainAliases') || []).filter(
      (item) => !item.value.endsWith(nodeInfo.didDomain) && !item.value.endsWith('did.staging.arcblock.io') // did.staging.arcblock.io 是旧 did domain, 但主要存在于比较旧的节点中, 需要做兼容
    );

    const didDomainList = getBlockletDidDomainList(blocklet, nodeInfo);
    domainAliases.push(...didDomainList);

    //  先更新 routing rule db 中的 domain aliases, 这一步的目的是为了后面用
    await states.site.updateDomainAliasList(blocklet.site.id, domainAliases);

    this.emit(BlockletEvents.appDidChanged, blocklet);

    await updateBlockletDocument({
      did: blocklet.appPid,
      nodeInfo,
      states,
      teamManager: this.teamManager,
    })
      .then(() => {
        logger.info('updated blocklet dns document', { appPid: blocklet.appPid, appDid: blocklet.appDid });
      })
      .catch((err) => {
        logger.error('update blocklet dns document failed', {
          appPid: blocklet.appPid,
          appDid: blocklet.appDid,
          error: err,
        });
      });
  }

  async _updateDependents(did) {
    const blocklet = await states.blocklet.getBlocklet(did);
    const map = {};
    for (const child of blocklet.children) {
      child.dependents = [];
      map[child.meta.did] = child;
    }

    forEachBlockletSync(blocklet, (x, { id }) => {
      if (x.dependencies) {
        x.dependencies.forEach((y) => {
          if (map[y.did]) {
            map[y.did].dependents.push({ id, required: y.required });
          }
        });
      }
    });

    await states.blocklet.updateBlocklet(blocklet.meta.did, { children: blocklet.children });
  }

  /**
   * @param {{
   *  blocklet: import('@blocklet/server-js').BlockletState,
   *  context: {
   *    referrer: string;
   *    user: {
   *      did: string;
   *    }
   *  }
   * }} { blocklet, context }
   * @memberof BlockletManager
   */
  // eslint-disable-next-line no-unused-vars
  _backupToSpaces({ blocklet, context }) {
    return jobManager._backupToSpaces(this, { blocklet, context });
  }

  /**
   * @param {import('@blocklet/server-js').BlockletState} blocklet
   */
  // eslint-disable-next-line no-unused-vars
  _backupToDisk({ blocklet }, context) {
    return jobManager._backupToDisk(this, { blocklet }, context);
  }

  /**
   * FIXME: support cancel
   * @param {import('@blocklet/server-js').RequestRestoreBlockletInput} input
   * @memberof BlockletManager
   */
  // eslint-disable-next-line no-unused-vars
  _restoreFromSpaces(input, context) {
    return jobManager._restoreFromSpaces(this, input, context);
  }

  _restoreFromDisk(input, context) {
    return jobManager._restoreFromDisk(this, input, context);
  }

  async _ensureAppChainConfig(metaDid, configs, { force = true } = {}) {
    const appConfigs = await states.blockletExtras.getConfigs([metaDid]);

    const chainConfigs = configs
      // CHAIN_TYPE should not changed after first set
      .filter((x) => ['CHAIN_HOST', 'CHAIN_ID'].includes(x.key))
      .filter((x) => {
        if (force) {
          return true;
        }

        const appConfig = appConfigs.find((y) => y.key === CHAIN_PROP_MAP_REVERSE[x.key]);
        return !appConfig || !appConfig.value;
      });
    if (chainConfigs.length) {
      const items = chainConfigs.map((x) => ({
        ...omit(x, ['description', 'validation']),
        key: CHAIN_PROP_MAP_REVERSE[x.key],
        value: x.value,
        shared: true,
        secure: false,
        required: false,
        custom: false,
      }));
      await states.blockletExtras.setConfigs(metaDid, items);
    }
  }

  async _resetExtras(metaDid) {
    const did = metaDid;
    const configs = await states.blockletExtras.getConfigs(metaDid);
    const chainType = (configs || []).find((x) => x.key === 'BLOCKLET_APP_CHAIN_TYPE');
    await states.blockletExtras.remove({ did });

    if (chainType) {
      await states.blockletExtras.setConfigs(metaDid, [chainType]);
    } else {
      logger.error(`chainType does not exist in app ${metaDid}`);
    }
    await this._setConfigsFromMeta(did);
  }

  checkControllerStatus(blocklet, action) {
    return controllerManager.checkControllerStatus(this, blocklet, action);
  }

  async getDomainDNS({ teamDid, domain }) {
    const blocklet = await this.getBlocklet(teamDid);
    const cnameDomain = (get(blocklet, 'site.domainAliases') || []).find((item) => isDidDomain(item.value));
    return this.routerManager.checkDomainDNS(domain, cnameDomain?.value);
  }

  /**
   * used for 1.17.7-settings-authentication migrate, don't use in other places
   * @param {string} options.did blocklet did
   */
  migrateBlockletAuthentication(params) {
    return authManager.migrateBlockletAuthentication(this, params);
  }
}

class FederatedBlockletManager extends DiskBlockletManager {
  /**
   * Joins federated login.
   * @param {object} options
   * @param {string} options.did - blocklet pid
   * @param {string} options.appUrl - 申请加入统一登录的 master appUrl
   * @returns {Promise<any>} 更新后的 blocklet 数据
   */
  joinFederatedLogin({ appUrl, did }, context) {
    return federatedManager.joinFederatedLogin(this, { appUrl, did }, context);
  }

  /**
   * member 退出统一登录站点群
   * @param {object} options
   * @param {string} options.did - blocklet pid
   * @param {string} [options.targetDid] - 要退出的目标 blocklet pid, 如果未设置，则代表退出自身
   * @returns {Promise<any>} 更新后的 blocklet 数据
   */
  quitFederatedLogin({ did, targetDid }, context) {
    return federatedManager.quitFederatedLogin(this, { did, targetDid }, context);
  }

  /**
   * master 解散统一登录站点群
   * @param {object} options
   * @param {string} options.did - blocklet pid
   * @returns {Promise<any>} 更新后的 blocklet 数据
   */
  disbandFederatedLogin({ did }, context) {
    return federatedManager.disbandFederatedLogin(this, { did }, context);
  }

  /**
   * 更改 federated 配置
   * @param {object} param
   * @param {string} param.did blocklet pid
   * @param {object} param.config federated 配置内容
   * @returns {Promise<any>} 更新后的 blocklet 数据
   */
  setFederated({ did, config }, context) {
    return federatedManager.setFederated(this, { did, config }, context);
  }

  /**
   * 审核 federated 申请
   * @param {object} param
   * @param {string} param.did master blocklet pid
   * @param {string} param.memberPid member blocklet pid
   * @param {'approved'|'revoked'|'rejected'} param.status member blocklet status
   * @returns {Promise<any>} 更新后的 blocklet 数据
   */
  auditFederatedLogin({ memberPid, did, status }) {
    return federatedManager.auditFederatedLogin(this, { memberPid, did, status });
  }

  /**
   * 更新站点群其他站点的用户信息
   * @param {object} param
   * @param {string} param.teamDid master blocklet pid
   * @param {object} param.updated 更新后的用户信息
   * @returns {Promise<void>}
   */
  updateUserInfoAndSyncFederated({ teamDid, updated }) {
    return federatedManager.updateUserInfoAndSyncFederated(this, { teamDid, updated });
  }

  updateUserExtra(args) {
    return federatedManager.updateUserExtra(this, args);
  }

  /**
   * 调用来源有两种
   * 1. js-sdk:  调用时，会处理好 user.phone 与 user.metadata.phone 的同步，已经 user.metadata.location 与 user.address.city 的同步
   * 2. node-sdk: 需要处理 node-sdk 的调用时的数据同步
   * @param {*} param0
   * @returns
   */
  updateUserInfoAndSync({ teamDid, user }) {
    return federatedManager.updateUserInfoAndSync(this, { teamDid, user }, { generateUserUpdateData });
  }

  /**
   * 同步统一登录站点群信息
   * 可同步的信息包括：站点成员列表（全量）、站点成员信息（增量）
   * @param {object} options
   * @param {string} options.did - 当前 blocklet pid
   * @param {object} options.data - 需要同步的数据
   * @param {Array} [options.data.users] - 需要同步的数据(用户)
   * @param {Array} [options.data.sites] - 需要同步的数据(站点)
   * @returns
   */
  syncFederated({ did, data, syncSites, allowStatus, userFields, siteFields } = {}) {
    return federatedManager.syncFederated(this, { did, data, syncSites, allowStatus, userFields, siteFields });
  }

  loginFederated({ did, site, data }) {
    return federatedManager.loginFederated(this, { did, site, data });
  }

  syncMasterAuthorization({ did }) {
    return federatedManager.syncMasterAuthorization(this, { did });
  }

  syncFederatedConfig({ did }) {
    return federatedManager.syncFederatedConfig(this, { did });
  }

  getWebhooks(webhook, urls = [], resendFailedOnly = true) {
    return notificationManager.getWebhooks(webhook, urls, resendFailedOnly);
  }

  /**
   * 处理 重发消息队列
   * @param {*} job
   */
  // eslint-disable-next-line consistent-return
  _onResendNotification(job) {
    return notificationManager._onResendNotification(this, job);
  }

  /**
   * 消息重发
   * @param {Object} props
   * @param {string} props.teamDid: blocklet 的 did
   * @param {string} props.notificationId：需要重发的消息 ID
   * @param {string[]} props.receivers：需要重发的用户 ID 列表
   * @param {string[]} props.channels: 需要重发的渠道列表 wallet, email, push, webhook
   * @param {string[]} props.webhookUrls: 需要重发的 webhook 列表, 用户配置的URL列表
   * 1. 如果 webhookUrls 不为空，则按照 webhookUrls 中的 URL 进行重发
   * 2. 如果 webhookUrls 为空，需要判断 channels 是否包含 webhook，如果包含，则重发全部的 webhook 消息，否则不重发
   * @param {boolean} props.resendFailedOnly: 只重发发送失败的消息
   * @param {Object} context
   */
  resendNotification(props, context) {
    return notificationManager.resendNotification(this, props, context);
  }

  setBlockletStatus(...args) {
    return states.blocklet.setBlockletStatus(...args);
  }

  async clearAllLocks() {
    await statusLock.flushAll();
  }
}

class BlockletManager extends FederatedBlockletManager {}

module.exports = BlockletManager;
