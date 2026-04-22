/* eslint-disable global-require */
/**
 * Access Control Manager is the business logic layer of access control related
 */
const path = require('path');
const { EventEmitter } = require('events');
const upperFirst = require('lodash/upperFirst');
const get = require('lodash/get');
const set = require('lodash/set');
const pick = require('lodash/pick');
const omit = require('lodash/omit');
const { Op } = require('sequelize');

const { createRBAC, MemoryStorage, SequelizeStorage } = require('@abtnode/rbac');
const logger = require('@abtnode/logger')('@abtnode/core:team:manager');
const { ROLES, RBAC_CONFIG, EVENTS, NOTIFICATION_SEND_CHANNEL, PASSPORT_STATUS } = require('@abtnode/constant');
const { BlockletEvents } = require('@blocklet/constant');
const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');
const {
  BaseState,
  doSchemaMigration,
  createSequelize,
  destroySequelize,
  getBlockletModels,
  setupModels,
} = require('@abtnode/models');
const { isActivityIncluded } = require('@abtnode/util/lib/notification-preview/util');
const { joinURL, withHttps } = require('ufo');
const { isCustomDomain } = require('@abtnode/util/lib/url-evaluation');
const dayjs = require('@abtnode/util/lib/dayjs');
const { getDidDomainForBlocklet } = require('@abtnode/util/lib/get-domain-for-blocklet');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { getDomainsByDid } = require('../router/helper');
const { isCLI, getDbFilePath } = require('../util');
const { transformNotification } = require('../util/notification');

const States = {
  User: require('../states/user'),
  UserSession: require('../states/user-session'),
  Passport: require('../states/passport'),
  PassportLog: require('../states/passport-log'),
  ConnectedAccount: require('../states/connect-account'),
  Session: require('../states/session'),
  Tag: require('../states/tag'),
  Tagging: require('../states/tagging'),
  Project: require('../states/project'),
  Release: require('../states/release'),
  Notification: require('../states/notification'),
  VerifyCode: require('../states/verify-code'),
  SecurityRule: require('../states/security-rule'),
  AccessPolicy: require('../states/access-policy'),
  ResponseHeaderPolicy: require('../states/response-header-policy'),

  WebhookEndpoint: require('../states/webhook-endpoint'),
  WebhookAttempt: require('../states/webhook-attempts'),
  WebhookEvent: require('../states/webhook-events'),

  OauthClient: require('../states/oauth-client'),
  OauthCode: require('../states/oauth-code'),

  AccessKey: require('../states/access-key'),
  Org: require('../states/org'),
  AuditLog: require('../states/audit-log'),
};

const getDefaultTeamState = () => ({
  rbac: null,
  user: null,
  passport: null,
  passportLog: null,
  connectedAccount: null,
  session: null,
  tag: null,
  tagging: null,
  project: null,
  release: null,
  notification: null,
  notificationReceivers: null,
  verifyCode: null,
  securityRule: null,
  accessPolicy: null,
  responseHeaderPolicy: null,

  webhookEndpoint: null,
  webhookAttempt: null,
  webhookEvent: null,

  accessKey: null,
  org: null,
  auditLog: null,
});

class TeamManager extends EventEmitter {
  constructor({ nodeDid, dataDirs, states }) {
    super();

    // HACK: do not emit any events from CLI
    if (isCLI()) {
      this.emit = (name) => logger.debug('stopped router manager event in CLI', name);
    }

    this.nodeDid = nodeDid;
    this.dataDirs = dataDirs;
    this.states = states;

    // cache: { [did]: { rbac, user, session } }
    this.cache = {};

    this.models = new Map();
    this.connections = new Map();

    this.init();

    this.lock = new DBCache(() => ({
      prefix: 'team-manager-locks',
      ttl: 1000 * 30,
      ...getAbtNodeRedisAndSQLiteUrl(),
    }));
  }

  async init() {
    // init server
    this.cache[this.nodeDid] = getDefaultTeamState();
    logger.info('init node team manager', { nodeDid: this.nodeDid });

    this.cache[this.nodeDid] = {
      rbac: await createRBAC({ storage: new MemoryStorage(), data: RBAC_CONFIG }),
      user: await this.createState(this.nodeDid, 'User'),
      userSession: await this.createState(this.nodeDid, 'UserSession'),
      tag: await this.createState(this.nodeDid, 'Tag'),
      tagging: await this.createState(this.nodeDid, 'Tagging'),
      passport: await this.createState(this.nodeDid, 'Passport'),
      passportLog: await this.createState(this.nodeDid, 'PassportLog'),
      connectedAccount: await this.createState(this.nodeDid, 'ConnectedAccount'),
      session: await this.createState(this.nodeDid, 'Session'),
      notification: await this.createState(this.nodeDid, 'Notification'),
      verifyCode: await this.createState(this.nodeDid, 'VerifyCode'),
      securityRule: await this.createState(this.nodeDid, 'SecurityRule'),
      accessPolicy: await this.createState(this.nodeDid, 'AccessPolicy'),
      responseHeaderPolicy: await this.createState(this.nodeDid, 'ResponseHeaderPolicy'),

      webhookEndpoint: await this.createState(this.nodeDid, 'WebhookEndpoint'),
      webhookAttempt: await this.createState(this.nodeDid, 'WebhookAttempt'),
      webhookEvent: await this.createState(this.nodeDid, 'WebhookEvent'),

      accessKey: await this.createState(this.nodeDid, 'AccessKey'),
      Org: await this.createState(this.nodeDid, 'Org'),
      AuditLog: await this.createState(this.nodeDid, 'AuditLog'),
    };
  }

  getUserState(teamDid) {
    return this.getState(teamDid, 'user');
  }

  getUserSessionState(teamDid) {
    return this.getState(teamDid, 'userSession');
  }

  getTagState(teamDid) {
    return this.getState(teamDid, 'tag');
  }

  getTaggingState(teamDid) {
    return this.getState(teamDid, 'tagging');
  }

  getPassportState(teamDid) {
    return this.getState(teamDid, 'passport');
  }

  getPassportLogState(teamDid) {
    return this.getState(teamDid, 'passportLog');
  }

  getConnectedAccountState(teamDid) {
    return this.getState(teamDid, 'connectedAccount');
  }

  getSessionState(teamDid) {
    return this.getState(teamDid, 'session');
  }

  getAccessKeyState(teamDid) {
    return this.getState(teamDid, 'accessKey');
  }

  getOrgState(teamDid) {
    return this.getState(teamDid, 'org');
  }

  getAuditLogState(teamDid) {
    return this.getState(teamDid, 'auditLog');
  }

  async getNotificationState(teamDid) {
    const state = await this.getState(teamDid ?? this.nodeDid, 'notification');
    state.setDefaultSender(this.nodeDid);
    return state;
  }

  getVerifyCodeState(teamDid) {
    return this.getState(teamDid, 'verifyCode');
  }

  /**
   * 判断 passport 是否已经过期
   */
  isPassportExpired(passport, now) {
    return passport.status !== 'valid' || (passport.expirationDate && dayjs(passport.expirationDate).isBefore(now));
  }

  /**
   * 验证用户是否有效（是否存在、passport是否过期）
   * @private
   */
  _filterValidUsers(users) {
    const now = dayjs();
    return users.filter((user) => {
      if (!user) {
        return false;
      }
      const { passports = [] } = user;
      // 如果用户没有 passport，或者 有一个 passport 没有过期，则返回 true
      if (!passports?.length || passports.some((x) => !this.isPassportExpired(x, now))) {
        return true;
      }
      logger.warn(`user's passports are all expired: ${user.did}`);
      return false;
    });
  }

  async getNotificationReceivers(payload) {
    const { teamDid, userDids = [], roles = [], selection = {}, includeConnectedAccounts = false, paging } = payload;
    // 会根据 teamDid 返回对应 state
    const userState = await this.getUserState(teamDid);
    if (!userDids.length && !roles.length) {
      return paging
        ? { list: [], paging: { total: 0, pageSize: paging.size || 20, pageCount: 0, page: paging.page || 1 } }
        : [];
    }
    try {
      // 这些用户信息已经是 approved 的用户，不需要再次确认
      let users = [];
      if (roles.length > 0) {
        const roleUsers = await userState.getUsersByRoles({ roles, selection, includeConnectedAccounts });
        users = users.concat(roleUsers);
      }
      if (userDids.length > 0) {
        let queryUsers = [];
        if (userDids.includes('*')) {
          const result = await userState.getUsersByDids({
            dids: userDids,
            query: {
              approved: true,
              selection,
              includeConnectedAccounts,
              includePassports: true,
            },
            paging,
          });

          // 如果是分页查询，处理分页结果
          if (paging && result.list) {
            const validUsers = this._filterValidUsers(result.list);
            return {
              list: users.concat(validUsers),
              paging: result.paging,
            };
          }

          queryUsers = result;
        } else {
          // 使用 getUser 查询的目的是为了避免传入的 receiver 不在user表中而存在于 connected_account 表中
          queryUsers = await Promise.all(
            userDids.map((did) =>
              userState.getUser(did, {
                enableConnectedAccount: true,
                includeConnectedAccounts: false,
                selection,
              })
            )
          );
        }

        const validUsers = this._filterValidUsers(queryUsers);
        users = users.concat(validUsers);
      }

      return users;
    } catch (error) {
      logger.error('get receivers failed: ', error);
      return paging
        ? { list: [], paging: { total: 0, pageSize: paging.size || 20, pageCount: 0, page: paging.page || 1 } }
        : [];
    }
  }

  async getAdminReceivers({ teamDid }) {
    try {
      const receivers = await this.getNotificationReceivers({
        teamDid: teamDid ?? this.nodeDid,
        roles: [ROLES.ADMIN, ROLES.OWNER],
        selection: { did: 1 },
      });
      return receivers.map((r) => r.did);
    } catch (error) {
      logger.error('get admin receivers failed', { error });
      return [];
    }
  }

  /**
   * 获取消息中链接的 Origin
   * @returns
   */
  async getActionLinkOrigin(teamDid, blocklet) {
    const isServices = teamDid && !this.isNodeTeam(teamDid);

    if (!isServices && process.env.NODE_ENV === 'development') {
      return process.env.ABT_NODE_BASE_URL || '';
    }
    // 如果有 appUrl 先返回
    if (blocklet) {
      const nodeInfo = await this.states.node.read();
      const blockletInfo = getBlockletInfo(blocklet, nodeInfo.sk);
      if (blockletInfo.appUrl) {
        return blockletInfo.appUrl;
      }
    }

    const domains = await getDomainsByDid(isServices ? teamDid : this.nodeDid, this);
    const customDomains = domains.filter((d) => isCustomDomain(d));

    // 优先显示自定义域名
    if (customDomains.length) {
      return withHttps(customDomains[0]);
    }

    // 如果存在域名，则返回第一个域名
    if (domains.length) {
      return withHttps(domains[0]);
    }

    // 如果消息是 services 的消息
    if (isServices) {
      return withHttps(getDidDomainForBlocklet({ did: teamDid }));
    }

    return process.env.ABT_NODE_BASE_URL || '';
  }

  /**
   * 检查通知是否已存在
   * @private
   */
  async _checkExistingNotification(notificationState, notificationId) {
    if (!notificationId) return false;

    try {
      await notificationState.findNotification({ id: notificationId });
      return true;
    } catch (error) {
      logger.error('find notification failed', { error });
      return false;
    }
  }

  /**
   * 获取接收者列表（支持分页）
   * @private
   * @param {string} teamDid - 团队 DID
   * @param {string|string[]} receiver - 接收者
   * @param {boolean} isExist - 通知是否已存在
   * @returns {AsyncGenerator<string[]>} 异步生成器，每次返回一页接收者的 DID 列表
   */
  async *_getReceiverList(teamDid, receiver, isExist) {
    // 1. 如果通知已存在，直接返回规范化后的接收者
    // 这种情况 receiver 一定存在。
    if (isExist) {
      yield this._normalizeReceiver(receiver);
      return;
    }

    const receivers = this._normalizeReceiver(receiver);

    // 2. 如果传入的是具体的 DID 数组（不包含 *），不需要分页查询，直接拿来用
    if (receivers && !receivers.includes('*')) {
      yield receivers;
      return;
    }

    // 3. 如果传入 receiver 包含 * 需要分页查询，返回一页的数据，开始执行一页
    if (receivers && receivers.includes('*')) {
      try {
        const pageSize = 100; // 每页查询 100 个用户
        let currentPage = 1;
        let hasMore = true;

        // eslint-disable-next-line no-await-in-loop
        while (hasMore) {
          // eslint-disable-next-line no-await-in-loop
          const result = await this.getNotificationReceivers({
            teamDid,
            userDids: receivers,
            selection: { did: 1 },
            paging: { page: currentPage, pageSize },
          });

          const userDids = result.list.map((u) => u.did);

          if (userDids.length > 0) {
            yield userDids;
          }

          hasMore = currentPage < result.paging.pageCount;
          currentPage += 1;
        }
      } catch (error) {
        logger.error('get receivers failed with pagination', { error });
        yield [];
      }
      return;
    }

    // 4. 如果没有传入 receiver，需要查询站点的 admin 相关的用户
    const adminReceivers = await this.getAdminReceivers({ teamDid });
    yield adminReceivers;
  }

  /**
   * 规范化接收者格式
   * @private
   */
  _normalizeReceiver(receiver) {
    if (Array.isArray(receiver)) return receiver;
    if (receiver) return [receiver];
    return null;
  }

  /**
   * 确定通知来源
   * @private
   */
  _determineSource(teamDid, payload) {
    if (payload.source) return payload.source;

    if (this.isNodeTeam(teamDid) || !payload.componentDid) {
      return 'system';
    }

    return payload.componentDid === teamDid ? 'component' : undefined;
  }

  /**
   * 获取默认通知渠道
   * @private
   */
  _getDefaultChannels(isServices, source) {
    const baseChannel = [NOTIFICATION_SEND_CHANNEL.WALLET];

    // 非 system 消息，默认发送所有渠道
    // system 消息，是指 blocklet 生命周期的消息
    if (source !== 'system') {
      return [
        NOTIFICATION_SEND_CHANNEL.WALLET,
        NOTIFICATION_SEND_CHANNEL.PUSH,
        NOTIFICATION_SEND_CHANNEL.WEBHOOK,
        NOTIFICATION_SEND_CHANNEL.EMAIL,
      ];
    }

    // 如果是 services 消息，发送 wallet 和 push 渠道
    if (isServices) {
      return baseChannel.concat(NOTIFICATION_SEND_CHANNEL.PUSH);
    }

    // 如果是 server 消息，发送 wallet 和 webhook 渠道
    return baseChannel.concat(NOTIFICATION_SEND_CHANNEL.WEBHOOK);
  }

  /**
   * 创建通知文档
   * @private
   */
  async _createNotificationDoc(notificationState, payload, source, isServices, teamDid) {
    try {
      return await notificationState.create({
        ...payload,
        source,
        ...(!isServices ? {} : { teamDid }),
      });
    } catch (error) {
      logger.error('Failed to create notification document', { error });
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  /**
   * 获取 component 的挂载点
   */
  getComponentMountPoint(teamDid, componentDid, blocklet) {
    if (blocklet && componentDid && componentDid !== teamDid) {
      const component = blocklet.children?.find((x) => x.meta.did === componentDid);
      if (component) {
        return component.mountPoint;
      }
    }

    return null;
  }

  /**
   * 根据 component 的挂载点，将 activity 中的链接拼接为完整的URL
   */
  applyComponentMountPoint(teamDid, notification, componentDid, origin, blocklet) {
    if (isActivityIncluded(notification) && componentDid && teamDid && origin && blocklet) {
      const mountPoint = this.getComponentMountPoint(teamDid, componentDid, blocklet);
      // 使用辅助函数处理URL构建
      const applyMountPoint = (url) => (url ? joinURL(origin, mountPoint, url) : url);

      // 应用到相关字段
      if (notification?.activity?.meta?.id) {
        set(notification, 'activity.meta.id', applyMountPoint(notification.activity.meta.id));
      }

      if (notification?.activity?.target?.id) {
        set(notification, 'activity.target.id', applyMountPoint(notification.activity.target.id));
      }
    }
  }

  /**
   * 发送通知事件
   * @private
   */
  async _emitNotificationEvents(doc, payload, receivers, teamDid, isServices, defaultChannel, actorInfo) {
    try {
      if (!isServices) {
        // 向通过 socket 前端推送消息，使用 toast 显示消息内容。
        // 非 services 消息，如果是 service 的消息要根据 receivers 来推送消息,放在队列中执行
        this.emit(EVENTS.NOTIFICATION_CREATE, {
          ...payload,
          ...doc,
          receivers,
        });
      }

      const blocklet = await this.states.blocklet.getBlocklet(teamDid);

      const origin = await this.getActionLinkOrigin(teamDid, blocklet);

      const notification = transformNotification(doc, origin);

      this.applyComponentMountPoint(teamDid, notification, doc.componentDid, origin, blocklet);

      this.emit(EVENTS.NOTIFICATION_CREATE_QUEUED, {
        channels: payload.channels || defaultChannel,
        notification,
        entityType: doc.entityType,
        entityId: doc.entityId,
        isServices,
        receivers: Array.isArray(receivers) ? receivers : [receivers],
        teamDid: teamDid || this.nodeDid,
        componentDid: doc.componentDid,
        source: doc.source,
        createdAt: doc.createdAt,
        sender: typeof payload.sender === 'object' && payload.sender !== null ? payload.sender : undefined,
        ...(actorInfo ? { actorInfo } : {}),
        options: typeof payload.options === 'object' && payload.options !== null ? payload.options : {},
        template: payload.template,
        extraData: payload.extraData,
      });
      logger.info('notification has been added to the push queue', { teamDid, notificationId: doc.id });
    } catch (error) {
      logger.error('Failed to emit notification events', { error });
      throw new Error(`Failed to emit notification events: ${error.message}`);
    }
  }

  /**
   * 创建通知
   */
  async createNotification({ teamDid, receiver, id, notification, ...payload }) {
    try {
      // 获取 notification state
      const notificationState = await this.getNotificationState(teamDid);
      if (!notificationState) {
        return undefined;
      }

      // 检查通知是否已存在
      const isExist = await this._checkExistingNotification(notificationState, id || notification?.id);

      let doc = null;
      const source = this._determineSource(teamDid, payload);
      const isServices = teamDid && !this.isNodeTeam(teamDid);
      if (!isExist && !payload.pushOnly) {
        doc = await this._createNotificationDoc(notificationState, payload, source, isServices, teamDid);
        logger.info('notification created successfully', { teamDid, notificationId: doc.id });
      }

      // 获取 actor 信息
      const notificationActor = notification?.activity?.actor || payload.activity?.actor;
      let actorInfo = null;
      if (notificationActor) {
        const userState = await this.getUserState(teamDid);
        const user = await userState.getUser(notificationActor);
        actorInfo = pick(user, ['did', 'fullName', 'avatar']);
      }

      // 获取接收者列表（使用异步生成器逐页处理）
      const receiverGenerator = this._getReceiverList(teamDid, receiver, isExist);
      let hasReceivers = false;

      for await (const receiversPage of receiverGenerator) {
        if (!receiversPage?.length) {
          continue;
        }

        hasReceivers = true;

        if (payload.pushOnly || isExist) {
          this.emit(EVENTS.NOTIFICATION_CREATE_QUEUED, {
            channels: payload.channels || [NOTIFICATION_SEND_CHANNEL.WALLET],
            notification: {
              ...(notification || omit(payload, ['template', 'extraData'])),
            },
            receivers: receiversPage,
            teamDid: teamDid || this.nodeDid,
            sender: payload.sender,
            pushOnly: true,
            isExist,
            ...(actorInfo ? { actorInfo } : {}),
            options: typeof payload.options === 'object' && payload.options !== null ? payload.options : {},
            template: payload.template,
            extraData: payload.extraData,
          });
        } else {
          const defaultChannel = this._getDefaultChannels(isServices, source);
          await this._emitNotificationEvents(
            doc,
            payload,
            receiversPage,
            teamDid,
            isServices,
            defaultChannel,
            actorInfo
          );
        }
      }

      if (!hasReceivers && process.env.NODE_ENV !== 'test') {
        logger.warn('No valid receivers', {
          teamDid,
          receiver,
          notification: JSON.stringify(notification || payload || {}),
        });
        return undefined;
      }

      return doc;
    } catch (error) {
      logger.error('notification create failed', { teamDid, error });
      throw error;
    }
  }

  emitReadNotification(teamDid, payload) {
    let eventName = EVENTS.NOTIFICATION_READ;
    if (teamDid && !this.isNodeTeam(teamDid)) {
      eventName = EVENTS.NOTIFICATION_BLOCKLET_READ;
    }
    this.emit(eventName, { teamDid, ...payload });
  }

  async getProjectState(teamDid) {
    return {
      projectState: await this.getState(teamDid, 'project'),
      releaseState: await this.getState(teamDid, 'release'),
    };
  }

  async getSecurityState(teamDid) {
    return {
      securityRuleState: await this.getState(teamDid, 'securityRule'),
      accessPolicyState: await this.getState(teamDid, 'accessPolicy'),
      responseHeaderPolicyState: await this.getState(teamDid, 'responseHeaderPolicy'),
    };
  }

  async getWebhookState(teamDid) {
    return {
      webhookEndpointState: await this.getState(teamDid, 'webhookEndpoint'),
      webhookAttemptState: await this.getState(teamDid, 'webhookAttempt'),
      webhookEventState: await this.getState(teamDid, 'webhookEvent'),
    };
  }

  async getOAuthState(teamDid) {
    return {
      oauthClientState: await this.getState(teamDid, 'oauthClient'),
      oauthCodeState: await this.getState(teamDid, 'oauthCode'),
    };
  }

  async getState(teamDid, key) {
    const pid = await this.getPid(teamDid);
    if (!pid) {
      logger.error('teamDid does not exist', { action: 'getState', key, teamDid });
      throw new Error(`teamDid does not exist: ${teamDid}`);
    }

    if (!this.cache[pid]) {
      this.cache[pid] = getDefaultTeamState();
    }

    // Reinitialize cache if deleted during async operations
    if (!this.cache[pid]) {
      logger.warn('Cache entry was deleted, reinitializing before checking state', { teamDid, pid, key });
      this.cache[pid] = getDefaultTeamState();
    }

    if (this.cache[pid][key]) {
      return this.cache[pid][key];
    }

    const state = await this.createState(teamDid, upperFirst(key));
    logger.info(`${key} state created`, { teamDid });

    // Reinitialize cache if deleted during state creation
    if (!this.cache[pid]) {
      logger.warn('Cache entry was deleted during state creation, reinitializing', { teamDid, pid, key });
      this.cache[pid] = getDefaultTeamState();
    }

    this.cache[pid][key] = state;
    return state;
  }

  async createState(did, key) {
    const models = await this.getModels(did);
    const state = new States[key](models[key], {}, models);
    return new Promise((resolve) => {
      state.onReady(() => {
        resolve(state);
      });
    });
  }

  async getRBAC(did) {
    const pid = await this.getPid(did);

    // validate exist
    if (!pid) {
      logger.error('Did does not exist', { action: 'getRBAC', did });
      throw new Error(`Did does not exist: ${did}`);
    }

    if (!this.cache[pid]) {
      this.cache[pid] = getDefaultTeamState();
    }

    // first getRBAC after blocklet added
    if (!this.cache[pid].rbac) {
      if (this.isNodeTeam(pid)) {
        throw new Error('Blocklet Server rbac instance has not been initialized');
      }

      await this.lock.acquire(`init-rbac-${did}`);
      try {
        logger.info('create rbac', { did });
        const models = await this.getModels(did);
        const db = new BaseState(models.Rbac);
        const rbac = await createRBAC({ storage: new SequelizeStorage(db, did) });

        // Reinitialize cache if it was deleted during async operations
        if (!this.cache[pid]) {
          logger.warn('Cache entry was deleted during RBAC initialization, reinitializing', { did, pid });
          this.cache[pid] = getDefaultTeamState();
        }

        this.cache[pid].rbac = rbac;

        const roles = await rbac.getRoles();
        // 按照顺序创建, 后创建的会排在前面
        for (const x of Object.values(ROLES).reverse()) {
          if (!roles.some((role) => role.name === x)) {
            // eslint-disable-next-line no-await-in-loop
            await rbac.createRole({ name: x, title: upperFirst(x) });
          }
        }

        return rbac;
      } finally {
        this.lock.releaseLock(`init-rbac-${did}`);
      }
    }

    // use cache - reinitialize if deleted
    if (!this.cache[pid]) {
      logger.warn('Cache entry was deleted, reinitializing before returning rbac', { did, pid });
      this.cache[pid] = getDefaultTeamState();
    }

    return this.cache[pid].rbac;
  }

  isNodeTeam(did) {
    return did === this.nodeDid;
  }

  async configTrustedPassports(did, trustedPassports) {
    if (this.isNodeTeam(did)) {
      return this.states.node.updateNodeInfo({ trustedPassports });
    }

    const metaDid = await this.states.blocklet.getBlockletMetaDid(did);
    return this.states.blockletExtras.setSettings(metaDid, { trustedPassports });
  }

  configTrustedFactories(did, trustedFactories) {
    if (this.isNodeTeam(did)) {
      return this.states.node.updateNodeInfo({ trustedFactories });
    }

    return this.states.blockletExtras.setSettings(did, { trustedFactories });
  }

  async configPassportIssuance(did, enable) {
    const enablePassportIssuance = enable;
    if (this.isNodeTeam(did)) {
      return this.states.node.updateNodeInfo({ enablePassportIssuance });
    }

    const metaDid = await this.states.blocklet.getBlockletMetaDid(did);
    return this.states.blockletExtras.setSettings(metaDid, { enablePassportIssuance });
  }

  async checkEnablePassportIssuance(did) {
    let enable;
    if (this.isNodeTeam(did)) {
      const nodeInfo = await this.states.node.read();
      enable = get(nodeInfo, 'enablePassportIssuance', true);
    } else {
      const metaDid = await this.states.blocklet.getBlockletMetaDid(did);
      const settings = await this.states.blockletExtras.getSettings(metaDid);
      enable = get(settings, 'enablePassportIssuance', true);
    }

    if (!enable) {
      logger.info('Passport issuance is not enabled', { did });
      throw new Error('Passport issuance is not enabled');
    }
  }

  async checkEnableTransferAppOwner(did) {
    if (this.isNodeTeam(did)) {
      throw new Error('server owner cannot be transfer by this workflow');
    }

    const exist = await this.states.blocklet.hasBlocklet(did);

    if (!exist) {
      throw new Error(`Blocklet ${did} does not exist`);
    }
  }

  async getStoreList(did) {
    const nodeInfo = await this.states.node.read();
    const blockletRegistryList = nodeInfo.blockletRegistryList || [];
    if (this.isNodeTeam(did)) {
      return blockletRegistryList;
    }

    const metaDid = await this.states.blocklet.getBlockletMetaDid(did);
    const settings = await this.states.blockletExtras.getSettings(metaDid);
    const storeList = get(settings, 'storeList', []) || [];

    blockletRegistryList.forEach((store) => {
      if (!storeList.find((x) => x.id === store.id)) {
        storeList.push({
          ...store,
          protected: true,
        });
      }
    });
    return storeList;
  }

  async updateStoreList(did, list) {
    if (this.isNodeTeam(did)) {
      await this.states.node.updateNodeInfo({ blockletRegistryList: list });
      return;
    }

    const metaDid = await this.states.blocklet.getBlockletMetaDid(did);

    await this.states.blockletExtras.setSettings(metaDid, { storeList: list });
    this.emit(BlockletEvents.storeChange, { meta: { did: metaDid } });
  }

  async getEndpointList(did) {
    if (this.isNodeTeam(did)) {
      return [];
    }

    const metaDid = await this.states.blocklet.getBlockletMetaDid(did);
    const settings = await this.states.blockletExtras.getSettings(metaDid);
    const endpointList = get(settings, 'endpointList', []) || [];
    return endpointList;
  }

  async updateEndpointList(did, list) {
    if (this.isNodeTeam(did)) {
      return;
    }

    const metaDid = await this.states.blocklet.getBlockletMetaDid(did);
    await this.states.blockletExtras.setSettings(metaDid, { endpointList: list });
    this.emit(BlockletEvents.storeChange, { meta: { did: metaDid } });
  }

  async getOwner(did) {
    let owner;
    if (this.isNodeTeam(did)) {
      const nodeInfo = await this.states.node.read();
      owner = get(nodeInfo, 'nodeOwner');
    } else {
      const metaDid = await this.states.blocklet.getBlockletMetaDid(did);
      const settings = await this.states.blockletExtras.getSettings(metaDid);
      owner = get(settings, 'owner');
    }

    return owner;
  }

  async getRoles(did, orgId) {
    const rbac = await this.getRBAC(did);
    const roles = await rbac.getRoles(orgId);
    return roles.map((d) => pick(d, ['name', 'grants', 'title', 'description', 'extra', 'orgId']));
  }

  async initTeam(did) {
    if (!did) {
      logger.error('initTeam: did does not exist');
      return;
    }

    logger.info('initTeam', { did });

    await this.getModels(did);

    const rbac = await this.getRBAC(did);
    const user = await this.createState(did, 'User');
    const tag = await this.createState(did, 'Tag');
    const tagging = await this.createState(did, 'Tagging');
    const passport = await this.createState(did, 'Passport');
    const passportLog = await this.createState(did, 'PassportLog');
    const connectedAccount = await this.createState(did, 'ConnectedAccount');
    const session = await this.createState(did, 'Session');
    const userSession = await this.createState(did, 'UserSession');

    this.cache[did] = {
      rbac,
      user,
      userSession,
      tag,
      tagging,
      session,
      passport,
      passportLog,
      connectedAccount,
    };
  }

  async deleteTeam(did, { closeDatabase = true } = {}) {
    if (!did) {
      logger.error('deleteTeam: did does not exist');
      return;
    }

    logger.info('deleteTeam', { did, closeDatabase });

    const pid = await this.getPid(did);
    const connection = this.connections.get(did) || this.connections.get(pid);
    if (closeDatabase && connection) {
      logger.info('deleteTeam.closeDatabase', { did });
      try {
        await destroySequelize(connection);
      } catch (error) {
        logger.error('Failed to close database', { did, error });
      }
    }

    this.cache[did] = null;
    this.cache[pid] = null;
    this.models.delete(did);
    this.models.delete(pid);
    this.connections.delete(did);
    this.connections.delete(pid);
  }

  // =======
  // Private
  // =======
  async getDataFileByDid(did) {
    const dir = await this.getDataDirByDid(did);
    return getDbFilePath(path.join(dir, 'blocklet.db'));
  }

  async getDataDirByDid(did) {
    if (this.isNodeTeam(did)) {
      return this.dataDirs.core;
    }

    const blocklet = await this.states.blocklet.getBlocklet(did);
    return path.join(this.dataDirs.data, blocklet.meta.name);
  }

  async getModels(did) {
    if (this.isNodeTeam(did)) {
      return this.states.models;
    }

    if (this.models.has(did) === false) {
      const file = await this.getDataFileByDid(did);
      const sequelize = createSequelize(file);
      const models = getBlockletModels();
      logger.info('initModels', { did, models: Object.keys(models) });
      setupModels(models, sequelize);
      await this.initDatabase(did);
      this.models.set(did, models);
      this.connections.set(did, file);
    }

    return this.models.get(did);
  }

  async initDatabase(did) {
    if (this.isNodeTeam(did)) {
      return;
    }

    await this.lock.acquire(`init-database-${did}`);
    const dbPath = await this.getDataFileByDid(did);
    logger.info('initDatabase', { did, dbPath });
    try {
      await doSchemaMigration(dbPath, 'blocklet', false, `blocklet:${did}`);
    } catch (error) {
      // This error is not fatal, just log it, will happen when there are multiple service processes
      logger.error('initDatabase failed', { did, dbPath, error });
    } finally {
      this.lock.releaseLock(`init-database-${did}`);
    }
  }

  getPid(did) {
    return this.isNodeTeam(did) ? did : this.states.blocklet.getBlockletMetaDid(did);
  }

  async getOwnerAndAdminUsers(did, approved) {
    const passportState = await this.getPassportState(did);

    const passports = await passportState.find({
      where: { [Op.or]: [{ role: 'owner' }, { role: 'admin' }], status: PASSPORT_STATUS.VALID },
      attributes: ['userDid'],
    });
    const userDids = passports.map((d) => d.userDid);

    const userState = await this.getUserState(did);
    const users = await userState.find({
      where: { did: userDids, approved: !!approved },
      attributes: ['did', 'locale'],
    });
    return users;
  }
}

module.exports = TeamManager;
