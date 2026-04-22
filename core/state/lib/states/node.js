/* eslint-disable no-underscore-dangle */
const semver = require('semver');
const isUrl = require('is-url');
const omit = require('lodash/omit');
const isEmpty = require('lodash/isEmpty');
const security = require('@abtnode/util/lib/security');
const { CustomError } = require('@blocklet/error');
const { generateRandomString } = require('@abtnode/models/lib/util');
const { isFromPublicKey } = require('@arcblock/did');
const { getLauncherInfo } = require('@abtnode/auth/lib/launcher');
const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');
const {
  NODE_MODES,
  DISK_ALERT_THRESHOLD_PERCENT,
  EVENTS,
  SERVER_STATUS,
  DEFAULT_NFT_DOMAIN_URL,
  SERVER_CACHE_TTL,
} = require('@abtnode/constant');
const logger = require('@abtnode/logger')('@abtnode/core:states:node');

const BaseState = require('./base');
const { validateOwner } = require('../util');
const { get: getDefaultConfigs } = require('../util/default-node-config');
const { checkDockerInstalled } = require('../util/docker/check-docker-installed');

/**
 * @extends BaseState<import('@abtnode/models').ServerState>
 */
class NodeState extends BaseState {
  /**
   * Creates an instance of NodeState.
   * @param {object} model
   * @param {object} config
   * @memberof NodeState
   */
  constructor(model, config = {}, dataDirs = {}, notification) {
    super(model, config);

    // Initialize the store
    if (!config.nodeSk) {
      throw new CustomError(400, 'Can not initialize node store without valid nodeSk');
    }
    if (!config.nodePk) {
      throw new CustomError(400, 'Can not initialize node store without valid nodePk');
    }
    if (!config.nodeDid) {
      throw new CustomError(400, 'Can not initialize node store without valid nodeDid');
    }
    if (!isFromPublicKey(config.nodeDid, config.nodePk)) {
      throw new CustomError(400, 'Node pk and did does not match');
    }

    this.dataDirs = dataDirs;
    this.notification = notification;
    this.cacheGroup = `node-${config.nodeDid}`;
  }

  cache = new DBCache(() => ({
    prefix: 'node-state',
    ttl: SERVER_CACHE_TTL,
    ...getAbtNodeRedisAndSQLiteUrl(),
  }));

  isInitialized(doc) {
    const isOwnerConnected = !!doc.nodeOwner;
    const isControlledBy3rdParty =
      !doc.enablePassportIssuance && Array.isArray(doc.trustedPassports) && doc.trustedPassports.length > 0;
    return isOwnerConnected || isControlledBy3rdParty;
  }

  deleteCache = async () => {
    try {
      await this.cache.del(this.cacheGroup);
      logger.debug('deleteCache success', { cacheGroup: this.cacheGroup });
    } catch (error) {
      logger.error('deleteCache failed', { error });
    }
  };

  /**
   * Ensure we have an node record in the database
   *
   * @returns {Promise<import('@blocklet/server-js').NodeState>} Node document json
   * @memberof NodeState
   */
  async _read() {
    const { nodeDid, dek } = this.config;

    let doc = await this.findOne({ did: nodeDid });
    if (doc) {
      if (dek) {
        doc.sk = security.decrypt(doc.sk, doc.did, dek);
      }
      doc.isDockerInstalled = await checkDockerInstalled();
      return doc;
    }

    const {
      name,
      description,
      nodeSk,
      nodePk,
      nodeOwner,
      port,
      version,
      routing = { provider: 'default' },
      docker,
      mode,
      runtimeConfig,
      ownerNft,
      launcher,
      registerUrl,
      didRegistry,
      didDomain,
      slpDomain,
      enablePassportIssuance = true,
      trustedPassports = [],
      webWalletUrl,
      enableFileSystemIsolation = true,
    } = this.config;

    if (nodeOwner && !validateOwner(nodeOwner)) {
      throw new CustomError(400, 'Node owner is invalid');
    }

    const initialized = this.isInitialized({ nodeOwner, enablePassportIssuance, trustedPassports });
    const defaultConfigs = await getDefaultConfigs();
    const entity = {
      ...(defaultConfigs || {}),
      name,
      description,
      pk: nodePk,
      sk: dek ? security.encrypt(nodeSk, nodeDid, dek) : nodeSk,
      did: nodeDid,
      initialized,
      version,
      nodeOwner: nodeOwner || null,
      port,
      initializedAt: initialized ? new Date() : null,
      startedAt: null,
      routing,
      docker,
      mode,
      enableWelcomePage: mode !== NODE_MODES.SERVERLESS,
      enableBetaRelease: false,
      runtimeConfig,
      ownerNft,
      diskAlertThreshold: DISK_ALERT_THRESHOLD_PERCENT,
      launcher: launcher || null,
      registerUrl,
      didRegistry,
      didDomain,
      slpDomain,
      enablePassportIssuance,
      trustedPassports,
      customBlockletNumber: 0,
      webWalletUrl,
      nftDomainUrl: DEFAULT_NFT_DOMAIN_URL,
      sessionSalt: generateRandomString(16),
      enableFileSystemIsolation,
    };

    if (entity.registerUrl && isUrl(entity.registerUrl)) {
      const launcherInfo = await getLauncherInfo(entity.registerUrl);
      entity.registerInfo = launcherInfo;
      logger.info(`Init launcher info from ${entity.registerUrl}`, launcherInfo);
    }

    doc = await this.insert(entity);

    if (dek) {
      doc.sk = security.decrypt(doc.sk, doc.did, dek);
    }
    doc.isDockerInstalled = await checkDockerInstalled();

    return doc;
  }

  read() {
    return this.cache.autoCache(this.cacheGroup, () => this._read());
  }

  async getSqliteVersion() {
    try {
      const [result] = await this.model.sequelize.query('SELECT sqlite_version();');
      return result[0]['sqlite_version()'];
    } catch (err) {
      logger.error('getSqliteVersion failed', { err });
      return '';
    }
  }

  // FIXME: 这个接口比较危险，可能会修改一些本不应该修改的字段，后续需要考虑改进
  async updateNodeInfo(entity = {}) {
    await this.deleteCache();
    const old = await this.read();
    const doc = await this.update({ $set: omit(entity, ['ownerNft', 'sk']) });
    this.emit(EVENTS.NODE_UPDATED, doc, old);
    return doc;
  }

  cleanupDirtyMaintainState() {
    return this.read().then((doc) => {
      if (doc.nextVersion && semver.lte(doc.nextVersion, doc.version)) {
        const updates = { nextVersion: '', upgradeSessionId: '' };

        // FIXME: this may cause the node exit some mode unexpectedly if it is not being upgraded
        if (doc.previousMode) {
          updates.mode = doc.previousMode;
          updates.previousMode = '';
        }
        return this.update({ $set: updates });
      }

      return doc;
    });
  }

  async addOwner(owner) {
    const initialized = this.isInitialized({ nodeOwner: owner });
    if (this.notification && typeof this.notification.setDefaultReceiver === 'function') {
      this.notification.setDefaultReceiver(owner.did);
    }

    const updated = await this.update({
      $set: { nodeOwner: owner, initialized, initializedAt: initialized ? new Date() : null },
    });

    this.emit(EVENTS.NODE_ADDED_OWNER, updated);

    return updated;
  }

  async updateNodeOwner({ nodeOwner, ownerNft }) {
    if (!validateOwner(nodeOwner)) {
      throw new CustomError(400, 'Node owner is invalid');
    }

    const initialized = this.isInitialized({ nodeOwner });
    if (this.notification && typeof this.notification.setDefaultReceiver === 'function') {
      this.notification.setDefaultReceiver(nodeOwner.did);
    }

    const entities = { nodeOwner, initialized, initializedAt: initialized ? new Date() : null };
    if (ownerNft) {
      entities.ownerNft = ownerNft;
    }

    const updated = await this.update({ $set: entities });
    this.emit(EVENTS.NODE_ADDED_OWNER, updated);
    return updated;
  }

  async updateNftHolder(holder) {
    if (!holder) {
      throw new CustomError(400, 'NFT holder can not be empty');
    }

    const { ownerNft } = await this.read();
    if (isEmpty(ownerNft)) {
      throw new CustomError(400, 'ownerNft is empty');
    }

    ownerNft.holder = holder;

    return this.update({ $set: { ownerNft } });
  }

  async enterMode(mode) {
    if (Object.values(NODE_MODES).includes(mode) === false) {
      throw new CustomError(400, `Can not enter unsupported mode: ${mode}`);
    }

    const info = await this.read();
    if (info.mode === mode) {
      return info;
    }

    return this.updateNodeInfo({ previousMode: info.mode, mode });
  }

  async exitMode(mode) {
    if (Object.values(NODE_MODES).includes(mode) === false) {
      throw new CustomError(400, `Can not exit unsupported mode: ${mode}`);
    }

    const info = await this.read();
    if (!info.previousMode) {
      throw new CustomError(400, `Can not exit ${mode} mode when previousMode is not set`);
    }

    if (info.mode !== mode) {
      throw new CustomError(400, `Can not exit ${mode} mode because in ${info.mode} mode`);
    }

    return this.updateNodeInfo({ previousMode: '', mode: info.previousMode });
  }

  // eslint-disable-next-line require-await
  async setMode(mode) {
    if (Object.values(NODE_MODES).includes(mode) === false) {
      throw new CustomError(400, `Can not update server to unsupported mode: ${mode}`);
    }

    return this.updateNodeInfo({ previousMode: '', mode });
  }

  async getEnvironments(nodeInfo) {
    const info = nodeInfo || (await this.read());
    return {
      ABT_NODE: info.version,
      ABT_NODE_VERSION: info.version,
      ABT_NODE_DID: info.did,
      ABT_NODE_SK: info.sk,
      ABT_NODE_PK: info.pk,
      ABT_NODE_PORT: info.port,
      ABT_NODE_SERVICE_PORT: process.env.ABT_NODE_SERVICE_PORT,
      ABT_NODE_MODE: info.mode,
    };
  }

  async updateGateway(updates) {
    const old = await this.read();
    const { routing } = old;
    ['requestLimit', 'cacheEnabled', 'blockPolicy', 'proxyPolicy', 'wafPolicy', 'blacklistHash'].forEach((key) => {
      if (key in updates) {
        routing[key] = updates[key];
      }
    });

    const doc = await this.update({ $set: { routing } });
    this.emit(EVENTS.RELOAD_GATEWAY, doc);
    this.emit(EVENTS.NODE_UPDATED, doc, old);
    return doc.routing;
  }

  // eslint-disable-next-line require-await
  async updateStatus(status) {
    if (!Object.values(SERVER_STATUS).includes(status)) {
      throw new CustomError(400, 'status is invalid');
    }

    return this.update({ $set: { status } });
  }

  // eslint-disable-next-line require-await
  async resetStatus() {
    return this.updateStatus(SERVER_STATUS.RUNNING);
  }

  async update(updates) {
    await this.deleteCache();
    await this.read(); // CAUTION: 这一行不要删，当 node state 不存在时，read() 会插入新数据
    const [, [updated]] = await super.update({ did: this.config.nodeDid }, updates);
    await this.deleteCache();
    return updated;
  }
}

module.exports = NodeState;
