const logger = require('@abtnode/logger')('@abtnode/core:states:notification');
const { MAX_PAGE_SIZE } = require('@abtnode/constant');
const { Sequelize, Op } = require('sequelize');
const { isValid } = require('@arcblock/did');
const { Joi } = require('@arcblock/validator');
const { ROLES, SERVER_ROLES, NOTIFICATION_SEND_CHANNEL, NOTIFICATION_SEND_STATUS } = require('@abtnode/constant');
const dayjs = require('@abtnode/util/lib/dayjs');
const BaseState = require('./base');
const { getReceiversStatistics } = require('../util/notification');

const receiverDidValidation = (receiver, context) => {
  const { did } = context?.user ?? {};
  if (!receiver || did !== receiver) {
    return "You are not allowed to visit other user's notification.";
  }
  if (!isValid(receiver)) {
    return 'Please provide a valid receiver DID.';
  }
  return '';
};

const readUnreadInputValidation = ({ notificationIds, receiver }, context) => {
  if (!notificationIds.length) {
    return 'Please provide the notificationId(s) to mark as read.';
  }
  return receiverDidValidation(receiver, context);
};

const safeJsonParse = (json) => {
  if (typeof json !== 'string') {
    return json;
  }
  return JSON.parse(json);
};

const pagingSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).default(10),
});

const isAdminRole = (role) => {
  return [
    ROLES.ADMIN,
    ROLES.OWNER,
    SERVER_ROLES.BLOCKLET_ADMIN,
    SERVER_ROLES.BLOCKLET_OWNER,
    SERVER_ROLES.BLOCKLET_SDK,
  ].includes(role);
};

/**
 * @extends BaseState<import('@abtnode/models').NotificationState>
 */
class NotificationState extends BaseState {
  constructor(baseDir, config = {}, models) {
    super(baseDir, { filename: 'notification.db', ...config });

    this.models = models;
    this.notificationReceivers = new BaseState(models.NotificationReceivers, config);
    this.user = new BaseState(models.User, config);
    this.connectedAccount = new BaseState(models.ConnectedAccount, config);

    this.defaultSender = config.defaultSender || '';
    this.defaultReceiver = config.defaultReceiver || '';
  }

  setDefaultSender(sender) {
    this.defaultSender = sender;
  }

  setDefaultReceiver(receiver) {
    this.defaultReceiver = receiver;
  }

  async create(payload) {
    if (!this.notificationReceivers) {
      throw new Error('Invalid database: missing notification_receivers tables');
    }

    /**
     * 当 type 为 feed 时，title 和 description 为空
     * 当 type 为 feed 时，会有一个 data 字段，data 为 feed 的详情
     */

    let title = payload.title || '';
    const description = payload.description || payload.body; // description 可以为空，因为有attachments
    const attachments = payload.attachments || [];

    if (payload.type === 'feed') {
      title = payload.data.cardTitle;
    }

    // 校验必填字段
    if (!title) {
      throw new Error('Invalid notification payload: title is required');
    }

    // sender 为空时，使用默认发送者
    // sender 存储的内容有两个内容：1. 发送者用户, 2. 发送者应用; 默认的 sender 为 server 的 did
    const sender = payload.activity?.actor || payload?.sender?.did || this.defaultSender;
    const { componentDid } = payload;

    const actions = payload.actions ?? [];
    if (payload.action) {
      actions.push({
        name: 'Visit',
        link: payload.action,
      });
    }

    let { severity } = payload;
    if (severity === 'normal') {
      severity = 'info';
    }

    const notificationData = {
      sender,
      receiver: '',
      entityType: payload.entityType || '',
      entityId: payload.entityId || '',
      action: payload.action || '',
      title,
      read: false,
      description,
      severity: severity || 'info',
      attachments,
      actions,
      blocks: payload.blocks ? payload.blocks : [],
      type: payload.type || 'notification',
      source: payload.source || (!componentDid || componentDid === payload.teamDid ? 'system' : 'component'), // 如果 componentDid 为空，则认为是系统消息
      componentDid,
      feedType: payload.feedType || '',
      data: payload.data || {},
      activity: payload.activity || {},
      options: payload.options || {},
    };
    const doc = await this.insert(notificationData);

    return doc;
  }

  async createNotificationReceiver({ receiverInstance }) {
    if (!receiverInstance || !receiverInstance.notificationId || !receiverInstance.receiver) {
      logger.error('Error: Missing required field "notificationId" or "receiver".');
      throw new Error('Error: Missing required field "notificationId" or "receiver".');
    }
    try {
      if (receiverInstance.email) {
        const row = await this.notificationReceivers.findOne({
          where: {
            notificationId: receiverInstance.notificationId,
            email: receiverInstance.email,
            emailSendStatus: {
              [Op.not]: NOTIFICATION_SEND_STATUS.PENDING,
            },
          },
          attributes: ['emailSendStatus', 'emailSendFailedReason', 'emailSendAt', 'emailSendRecord'],
          row: true,
        });
        if (row) {
          receiverInstance.emailSendStatus = row.emailSendStatus;
          receiverInstance.emailSendFailedReason = row.emailSendFailedReason;
          receiverInstance.emailSendAt = row.emailSendAt;
          receiverInstance.emailSendRecord = row.emailSendRecord;
        }
      }

      if (receiverInstance.webhookUrls) {
        const urls = receiverInstance.webhookUrls.split('#');
        const rows = await Promise.all(
          urls.map((url) => {
            return this.notificationReceivers.findOne({
              where: {
                notificationId: receiverInstance.notificationId,
                webhookUrls: {
                  [Op.like]: `%${url}%`,
                },
              },
              attributes: ['webhook'],
              row: true,
            });
          })
        );
        const webhook = {};
        urls.forEach((url, index) => {
          const row = rows[index];
          if (row && row.webhook) {
            const webhookResult = row.webhook;
            if (webhookResult[url]) {
              webhook[url] = webhookResult[url];
            }
          }
        });
        receiverInstance.webhook = webhook;
      }
      const doc = await this.notificationReceivers.insert(receiverInstance);
      return doc;
    } catch (error) {
      logger.error('Error: Failed to create notification receiver.', { error });
      throw error;
    }
  }

  /**
   * 从通知列表中获取actor信息并构建映射
   * @private
   * @param {Array} notifications 通知列表
   * @returns {Promise<Map<string, Object>>} actor信息的映射
   */
  _getActorMapFromNotifications(notifications) {
    // 获取所有通知中 activity.actor 的唯一 DID 列表
    const actorDids = notifications
      .map((notification) => notification.activity?.actor)
      .filter((did) => did && typeof did === 'string');

    // 如果没有 actor DID，返回空映射
    if (actorDids.length <= 0) {
      return new Map();
    }

    return this.getUsersByDids(actorDids);
  }

  /**
   * 获取用户的全部 did
   */
  async getUserDids(did) {
    try {
      const result = await this.connectedAccount.find({
        where: { userDid: did },
        attributes: ['did', 'userDid'],
        raw: true,
      });
      return result.length > 0 ? result.map((item) => item.did) : [did];
    } catch (error) {
      logger.warn('getUserDids error: ', error);
      return [did];
    }
  }

  /**
   * 使用原生 SQL 查询实现分页
   * @private
   * @param {Object} params 查询参数
   * @returns {Promise<Object>} 查询结果
   */
  async _findPaginatedWithRawSQL({ read, paging, receiver, severity, componentDid, entityId, source } = {}, context) {
    const errorMsg = receiverDidValidation(receiver, context);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const { error, value } = pagingSchema.validate(paging || {});
    if (error) {
      const { path, message } = error.details[0];
      const field = path.join('.');

      throw new Error(`Invalid paging parameter '${field}': ${message}. Page and pageSize must be positive integers.`);
    }
    const { pageSize, page } = value;
    const curPageSize = pageSize > MAX_PAGE_SIZE ? MAX_PAGE_SIZE : pageSize;
    const offset = (page - 1) * curPageSize;

    // 构建基础查询条件
    // FIXME: 这里需要对历史数据做出过滤，避免有非 notification 类型的数据
    const conditions = ["n.type = 'notification'"];
    const dids = await this.getUserDids(receiver);
    const replacements = { dids };
    const { role } = context.user;
    if (!isAdminRole(role)) {
      conditions.push("n.source != 'system'");
    }

    if (typeof read === 'boolean') {
      conditions.push('nr.read = :read');
      replacements.read = read;
    }

    if (severity && severity.length) {
      conditions.push('n.severity IN (:severity)');
      replacements.severity = severity;
    }

    if (entityId && entityId.length) {
      conditions.push('n."entityId" IN (:entityId)');
      replacements.entityId = entityId;
    }

    if (source && source.length) {
      // Create a new condition group for source OR componentDid
      const sourceOrComponentDid = [];
      sourceOrComponentDid.push('n.source IN (:source)');
      if (componentDid && componentDid.length) {
        sourceOrComponentDid.push('n."componentDid" IN (:componentDid)');
        replacements.componentDid = componentDid;
      }
      conditions.push(`(${sourceOrComponentDid.join(' OR ')})`);
      replacements.source = source;
    } else if (componentDid && componentDid.length) {
      conditions.push('n."componentDid" IN (:componentDid)');
      replacements.componentDid = componentDid;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // 构建分页查询
    const countQuery = `
      SELECT COUNT(DISTINCT n.id) as total
      FROM notifications n
      INNER JOIN notification_receivers nr ON n.id = nr."notificationId"
      ${whereClause}
      AND nr.receiver IN (:dids)
    `;

    const dataQuery = `
      SELECT DISTINCT 
        n.*,
        nr.id as receiver_id,
        nr."notificationId" as receiver_notificationId,
        nr."receiver" as receiver_receiver,
        nr."read" as receiver_read,
        nr."readAt" as receiver_readAt,
        nr."walletSendStatus" as receiver_walletSendStatus,
        nr."walletSendAt" as receiver_walletSendAt,
        nr."pushKitSendStatus" as receiver_pushKitSendStatus,
        nr."pushKitSendAt" as receiver_pushKitSendAt,
        nr."emailSendStatus" as receiver_emailSendStatus,
        nr."emailSendAt" as receiver_emailSendAt,
        nr."createdAt" as receiver_createdAt,
        nr."walletSendFailedReason" as receiver_walletSendFailedReason,
        nr."walletSendRecord" as receiver_walletSendRecord,
        nr."pushKitSendFailedReason" as receiver_pushKitSendFailedReason,
        nr."pushKitSendRecord" as receiver_pushKitSendRecord,
        nr."emailSendFailedReason" as receiver_emailSendFailedReason,
        nr."emailSendRecord" as receiver_emailSendRecord,
        nr."webhook" as receiver_webhook,
        nr."email" as receiver_email,
        nr."webhookUrls" as receiver_webhookUrls,
        nr."deviceId" as receiver_deviceId
      FROM notifications n
      INNER JOIN notification_receivers nr ON n.id = nr."notificationId"
      ${whereClause}
      AND nr.receiver IN (:dids)
      ORDER BY n."createdAt" DESC
      LIMIT :limit OFFSET :offset
    `;

    // 执行查询
    const [countResult, rows] = await Promise.all([
      this.model.sequelize.query(countQuery, {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      }),
      this.model.sequelize.query(dataQuery, {
        replacements: { ...replacements, limit: curPageSize, offset },
        type: Sequelize.QueryTypes.SELECT,
      }),
    ]);

    const { total } = countResult[0];

    // 处理 JSON 字段和重组数据结构
    const processedRows = rows.map((row) => {
      // 提取 receiver 相关字段
      const receiverFields = {};
      Object.keys(row).forEach((key) => {
        if (key.startsWith('receiver_')) {
          const newKey = key.replace('receiver_', '');
          receiverFields[newKey] = row[key];
          delete row[key];
        }
      });

      // 处理 receiver 的 JSON 字段
      if (receiverFields.walletSendRecord) {
        receiverFields.walletSendRecord = safeJsonParse(receiverFields.walletSendRecord);
      }
      if (receiverFields.pushKitSendRecord) {
        receiverFields.pushKitSendRecord = safeJsonParse(receiverFields.pushKitSendRecord);
      }
      if (receiverFields.emailSendRecord) {
        receiverFields.emailSendRecord = safeJsonParse(receiverFields.emailSendRecord);
      }
      if (receiverFields.webhook) {
        receiverFields.webhook = safeJsonParse(receiverFields.webhook);
      }

      return {
        ...row,
        attachments: row.attachments ? safeJsonParse(row.attachments) : [],
        actions: row.actions ? safeJsonParse(row.actions) : [],
        blocks: row.blocks ? safeJsonParse(row.blocks) : [],
        data: row.data ? safeJsonParse(row.data) : {},
        activity: row.activity ? safeJsonParse(row.activity) : {},
        read: Boolean(row.read),
        receivers: [receiverFields], // 将 receiver 数据作为数组
      };
    });

    return {
      list: processedRows,
      paging: {
        total: Number(total),
        pageSize: curPageSize,
        pageCount: Math.ceil(Number(total) / curPageSize),
        page,
      },
    };
  }

  /**
   * 分页查询通知
   * @param {Object} params
   * @param {Array} params.severity
   * @param {Array} params.componentDid
   * @param {Array} params.entityId
   * @param {Array} params.source
   * @param {Object} context
   * @returns {Promise<Object>}
   */
  async findPaginated({ read, paging, receiver, severity, componentDid, entityId, source } = {}, context) {
    // 获取包含 activity.actor 的通知数据
    const [result, unreadCount] = await Promise.all([
      this._findPaginatedWithRawSQL({ read, paging, receiver, severity, componentDid, entityId, source }, context),
      this.getUnreadCountByConditions({ receiver, severity, componentDid, entityId, source }, context),
    ]);

    // 获取 actor 信息映射
    const actorMap = await this._getActorMapFromNotifications(result.list);

    // 为每个通知添加 actor 信息
    if (actorMap.size > 0) {
      result.list = result.list.map((notification) => {
        const actorDid = notification.activity?.actor;
        if (actorDid && actorMap.has(actorDid)) {
          return {
            ...notification,
            actorInfo: actorMap.get(actorDid),
          };
        }
        return notification;
      });
    }

    result.unreadCount = unreadCount;
    return result;
  }

  async findNotification({ id }) {
    if (!id) {
      throw new Error('notification id is not allow empty');
    }
    const doc = await this.findOne({ id });
    return doc;
  }

  async read({ notificationIds, receiver }, context) {
    const errorMsg = readUnreadInputValidation({ notificationIds, receiver }, context);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    logger.info('mark notification as read', { notificationIds });
    const receiverDids = await this.getUserDids(receiver);
    const { role } = context.user;

    // 根据角色过滤通知 ID，非管理员用户不能标记系统通知为已读
    let filteredNotificationIds = notificationIds;
    if (!isAdminRole(role)) {
      const nonSystemNotifications = await this.find({
        id: { $in: notificationIds },
        source: { $ne: 'system' },
      });
      filteredNotificationIds = nonSystemNotifications.map((n) => n.id);
    }

    const conditions = {
      notificationId: { $in: filteredNotificationIds },
      receiver: { $in: receiverDids },
    };
    const [numAffected, rows] = await this.notificationReceivers.update(
      conditions,
      { $set: { read: true } },
      { returnBeforeUpdatedDocs: true }
    );

    const notifications = await this.find({ id: { $in: rows.map((row) => row.notificationId) } }, { id: 1, source: 1 });
    const sourceMap = Object.fromEntries(notifications.map((n) => [n.id, { source: n.source }]));

    return { numAffected, effectRows: sourceMap };
  }

  async unread({ notificationIds, receiver }, context) {
    const errorMsg = readUnreadInputValidation({ notificationIds, receiver }, context);
    if (errorMsg) {
      throw new Error(errorMsg);
    }
    logger.info('mark notification as unread', { notificationIds });
    const receiverDids = await this.getUserDids(receiver);
    const conditions = {
      notificationId: { $in: notificationIds },
      receiver: { $in: receiverDids },
    };
    const [numAffected] = await this.notificationReceivers.update(conditions, { $set: { read: false } });
    return numAffected;
  }

  /** ******** 私有方法 ************* */
  /**
   * 构建发送记录更新参数
   * @param {*} notificationId
   * @param {*} record 最新的发送记录
   * @returns
   */
  async _buildRecordUpdates(notificationId, record) {
    if (!record?.field || record.field === 'webhook') return null;
    const { field, content } = record;
    const row = await this.notificationReceivers.findOne({
      where: { notificationId },
      attributes: [field],
      row: true,
    });
    const currentRecord = row?.[field] ?? [];
    return content ? { [field]: [content, ...currentRecord] } : null;
  }

  /**
   * 构建 webhook 发送状态记录更新参数
   * @param {*} notificationId
   * @param {*} webhookParams 最新的 webhook 发送记录
   * @returns
   */
  async _buildWebhookUpdate(notificationId, webhookParams) {
    if (!webhookParams) return {};
    const row = await this.notificationReceivers.findOne({
      where: { notificationId },
      attributes: ['webhook'],
      row: true,
    });
    const webhookResult = { ...(row?.webhook ?? {}) };

    Object.entries(webhookParams).forEach(([url, updateContent]) => {
      webhookResult[url] = [updateContent, ...(webhookResult[url] ?? [])];
    });

    return { webhook: webhookResult };
  }

  /**
   * 更新消息状态
   */
  async updateStatus({ notificationId, receivers, updates }) {
    if (!notificationId) {
      throw new Error('notificationId is not allow empty');
    }
    if (!receivers.length) {
      throw new Error('receivers is not allow empty');
    }
    const { record, webhookParams, email, ...rest } = updates;

    let updateParams = { receiver: { $in: receivers }, notificationId };
    if (email) {
      updateParams = { email, notificationId, emailSendStatus: { $nin: rest.emailSendStatus } };
    }

    try {
      const recordUpdates = await this._buildRecordUpdates(notificationId, record);
      const webhookUpdates = await this._buildWebhookUpdate(notificationId, webhookParams);
      const [numAffected] = await this.notificationReceivers.update(updateParams, {
        $set: {
          ...rest,
          ...(recordUpdates || {}),
          ...(webhookUpdates || {}),
        },
      });
      return numAffected;
    } catch (error) {
      logger.error('failed to update notification status', { error });
      throw error;
    }
  }

  /**
   * 获取当前用户未读消息数量
   */
  getUnreadCount({ receiver }, context) {
    const errorMsg = receiverDidValidation(receiver, context);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    return this.getUnreadNotificationCount({ receiver }, context);
  }

  /**
   * 将当前用户所有消息标记为已读
   */
  async makeAllAsRead({ receiver }, context) {
    const errorMsg = receiverDidValidation(receiver, context);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const receiverDids = await this.getUserDids(receiver);
    const { role } = context.user;

    // 根据角色构建查询条件，非管理员用户不能标记系统通知为已读
    let notificationIdCondition = {};
    if (!isAdminRole(role)) {
      const nonSystemNotifications = await this.find({
        source: { $ne: 'system' },
      });
      notificationIdCondition = {
        notificationId: { [Op.in]: nonSystemNotifications.map((n) => n.id) },
      };
    }

    const [numAffected, rows] = await this.notificationReceivers.update(
      {
        where: {
          receiver: { [Op.in]: receiverDids },
          read: false,
          ...notificationIdCondition,
        },
        attributes: ['notificationId'],
      },
      { $set: { read: true } },
      { returnBeforeUpdatedDocs: true }
    );
    const notifications = await this.find({ id: { $in: rows.map((row) => row.notificationId) } }, { id: 1, source: 1 });
    const sourceMap = Object.fromEntries(notifications.map((n) => [n.id, { source: n.source }]));
    return {
      numAffected,
      notificationIds: rows.map((item) => item.notificationId),
      effectRows: sourceMap,
    };
  }

  async getStatisticsByNotificationId(notificationId) {
    if (!notificationId) {
      throw new Error('notificationId is not allow empty');
    }

    const receivers = await this.notificationReceivers.find({ notificationId });
    return getReceiversStatistics(receivers);
  }

  async getUser(did) {
    const attributes = ['did', 'fullName', 'avatar'];
    let user = await this.user.findOne({ where: { did }, attributes });
    if (!user) {
      const connectedAccount = await this.connectedAccount.findOne({ did });
      if (connectedAccount) {
        user = await this.user.findOne({ where: { did: connectedAccount.userDid }, attributes });
      }
    }
    return {
      did,
      user,
    };
  }

  /**
   * 通过DIDs获取用户信息
   */
  async getUsersByDids(dids) {
    const userDids = new Set(dids);
    const users = await Promise.all(Array.from(userDids).map((did) => this.getUser(did)));
    const userMap = new Map(users.map((user) => [user.did, user.user]));
    return userMap;
  }

  /**
   * 获取消息发送记录
   */
  async getNotificationSendLog({ paging = {}, dateRange, source, componentDids, severities }, context) {
    const { user: reqUser } = context || {};
    if (
      !reqUser?.role ||
      ![ROLES.ADMIN, ROLES.OWNER, SERVER_ROLES.BLOCKLET_ADMIN, SERVER_ROLES.BLOCKLET_OWNER].includes(reqUser?.role)
    ) {
      throw new Error('Forbidden. You do not have permission to access this resource.');
    }

    const where = {};

    if (source) {
      where.source = source;
    }
    if (componentDids && componentDids.length > 0) {
      where.componentDid = { [Op.in]: componentDids };
    }

    if (severities && severities.length > 0) {
      where.severity = { [Op.in]: severities };
    }
    if (dateRange && dateRange.length === 2) {
      where.createdAt = {
        [Op.gte]: dateRange[0],
        [Op.lte]: dateRange[1],
      };
    }

    const include = [
      {
        model: this.notificationReceivers.model,
        as: 'receivers', // 关联的别名
        required: true,
        separate: true, // 会对主查询和关联查询分开执行，而不是通过单个 SQL 查询一次性完成
      },
    ];

    const { pageSize = 10 } = paging ?? {};

    const curPageSize = pageSize > MAX_PAGE_SIZE ? MAX_PAGE_SIZE : pageSize;
    const result = await this.paginate({ where, include }, { createdAt: -1 }, { ...paging, pageSize: curPageSize });

    const receiverList = result.list.reduce((acc, item) => {
      const dids = item.receivers.map((r) => r.receiver);
      return acc.concat(dids);
    }, []);

    const userMap = await this.getUsersByDids(receiverList);

    // 获取 actor 信息映射
    const actorMap = await this._getActorMapFromNotifications(result.list);

    // 一次循环同时处理 actorInfo 和 statistics
    const enhancedList = result.list.map((item) => {
      // 添加 actorInfo
      const actorDid = item.activity?.actor;
      const withActor = actorDid && actorMap.has(actorDid) ? { ...item, actorInfo: actorMap.get(actorDid) } : item;

      withActor.receivers = withActor.receivers.map((r) => {
        const user = userMap.get(r.receiver);
        return {
          ...r,
          receiverUser: user,
        };
      });

      // 添加 statistics
      return {
        ...withActor,
        statistics: getReceiversStatistics(item.receivers),
      };
    });

    return {
      ...result,
      list: enhancedList,
    };
  }

  async getNotificationReceivers(
    { paging = {}, notificationId, userName, walletSendStatus, pushKitSendStatus, emailSendStatus, dateRange },
    context
  ) {
    const { user: reqUser } = context || {};
    if (!notificationId) {
      throw new Error('notificationId is not allow empty');
    }
    if (
      !reqUser?.role ||
      ![ROLES.ADMIN, ROLES.OWNER, SERVER_ROLES.BLOCKLET_ADMIN, SERVER_ROLES.BLOCKLET_OWNER].includes(reqUser?.role)
    ) {
      throw new Error('Forbidden. You do not have permission to access this resource.');
    }
    const where = {
      notificationId,
    };
    if (userName) {
      const likeOp = this.model.sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
      const users = await this.user.find({
        where: {
          fullName: {
            [likeOp]: `%${userName}%`,
          },
        },
        attributes: ['did'],
        raw: true,
      });
      where.receiver = {
        [Op.in]: users.map((user) => user.did),
      };
    }
    if (walletSendStatus && walletSendStatus.length > 0) {
      where.walletSendStatus = {
        [Op.in]: walletSendStatus,
      };
    }
    if (pushKitSendStatus && pushKitSendStatus.length > 0) {
      where.pushKitSendStatus = {
        [Op.in]: pushKitSendStatus,
      };
    }
    if (emailSendStatus && emailSendStatus.length > 0) {
      where.emailSendStatus = {
        [Op.in]: emailSendStatus,
      };
    }
    if (dateRange && dateRange.length === 2) {
      where.createdAt = {
        [Op.gte]: dateRange[0],
        [Op.lte]: dateRange[1],
      };
    }

    const { pageSize = 10 } = paging ?? {};

    const curPageSize = pageSize > MAX_PAGE_SIZE ? MAX_PAGE_SIZE : pageSize;

    const result = await this.notificationReceivers.paginate(
      { where },
      { createdAt: -1 },
      { ...paging, pageSize: curPageSize }
    );

    const receiverList = result.list.map((item) => item.receiver);
    const userMap = await this.getUsersByDids(receiverList);

    result.list = result.list.map((item) => {
      const user = userMap.get(item.receiver);
      return {
        ...item,
        receiverUser: user,
      };
    });

    return result;
  }

  /**
   * 获取发送消息的所有 component
   */
  async getNotificationComponents({ receiver }, context) {
    const { user: reqUser } = context || {};
    const errorMsg = receiverDidValidation(receiver, context);
    if (
      errorMsg &&
      ![ROLES.ADMIN, ROLES.OWNER, SERVER_ROLES.BLOCKLET_ADMIN, SERVER_ROLES.BLOCKLET_OWNER].includes(reqUser?.role)
    ) {
      throw new Error(errorMsg);
    }
    const where = {
      componentDid: {
        [Op.and]: [
          { [Op.ne]: '' }, // 不等于空字符串
          { [Op.not]: null }, // 不等于 NULL
        ],
      },
    };

    const includeWhere = {};
    if (receiver) {
      const receiverDids = await this.getUserDids(receiver);
      includeWhere.receiver = { [Op.in]: receiverDids };
    }

    const include = [
      {
        model: this.notificationReceivers.model,
        as: 'receivers',
        attributes: [],
        where: includeWhere,
        required: false,
      },
    ];

    const result = await this.find({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('componentDid')), 'componentDid']],
      include,
      where,
      raw: true,
    });
    return result.map((item) => item.componentDid);
  }

  /**
   * 根据 notification_receiver 的 id 获取通知内容和通知用户
   * @param {string} notificationId：需要重发的消息 ID
   * @param {string[]} receivers：需要重发的用户 ID 列表
   * @param {string[]} channels：需要重发的渠道列表 wallet, email, push, webhook
   * @param {string[]} webhookUrls：需要重发的 webhook 列表, 用户配置的URL列表
   * @returns
   */
  async combineNotificationReceiver({ notificationId, receivers, channels, webhookUrls }) {
    if (!notificationId) {
      throw new Error('notificationId is not allow empty');
    }
    if (!receivers.length) {
      throw new Error('receivers is not allow empty');
    }

    let attributes = ['notificationId', 'receiver'];
    if (channels?.includes(NOTIFICATION_SEND_CHANNEL.WALLET)) {
      attributes = attributes.concat('walletSendStatus');
    }
    if (channels?.includes(NOTIFICATION_SEND_CHANNEL.EMAIL)) {
      attributes = attributes.concat('emailSendStatus');
    }
    if (channels?.includes(NOTIFICATION_SEND_CHANNEL.PUSH)) {
      attributes = attributes.concat('pushKitSendStatus');
    }
    if (webhookUrls?.length || channels?.includes(NOTIFICATION_SEND_CHANNEL.WEBHOOK)) {
      attributes = attributes.concat(['webhook']);
    }

    const notificationReceivers = await this.notificationReceivers.find({
      where: {
        receiver: { [Op.in]: receivers },
        notificationId,
      },
      attributes,
      raw: true,
    });

    const notification = await this.findOne({
      id: notificationId,
    });

    const userMap = await this.getUsersByDids(receivers);

    const usersFormat = notificationReceivers.map((item) => {
      const user = userMap.get(item.receiver);
      return {
        userInfo: user,
        sendStatus: item,
      };
    });

    return {
      notification,
      users: usersFormat,
    };
  }

  /**
   * 获取符合条件的未读通知数量
   * @param {Object} params 查询参数，与findPaginated相同
   * @param {Array} params.severity 严重程度
   * @param {Array} params.componentDid 组件ID
   * @param {Array} params.entityId 实体ID
   * @param {Array} params.source 来源
   * @param {Object} context 上下文
   * @returns {Promise<number>} 未读通知数量
   */
  getUnreadCountByConditions({ receiver, ...rest } = {}, context) {
    const errorMsg = receiverDidValidation(receiver, context);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    return this.getUnreadNotificationCount({ receiver, ...rest }, context);
  }

  async getUnreadNotificationCount({ receiver, severity, componentDid, entityId, source } = {}, context) {
    // 构建基础查询条件
    const conditions = ["n.type = 'notification'"];
    const dids = await this.getUserDids(receiver);
    const replacements = { dids };

    // 强制将read设为false，只计算未读消息
    conditions.push('nr.read = :read');
    replacements.read = false;

    const { role } = context.user;
    if (!isAdminRole(role)) {
      conditions.push("n.source != 'system'");
    }

    if (severity && severity.length) {
      conditions.push('n.severity IN (:severity)');
      replacements.severity = severity;
    }

    if (componentDid && componentDid.length) {
      conditions.push('n."componentDid" IN (:componentDid)');
      replacements.componentDid = componentDid;
    }

    if (entityId && entityId.length) {
      conditions.push('n."entityId" IN (:entityId)');
      replacements.entityId = entityId;
    }

    if (source && source.length) {
      // Create a new condition group for source OR componentDid
      const sourceOrComponentDid = [];
      sourceOrComponentDid.push('n.source IN (:source)');
      if (componentDid && componentDid.length) {
        sourceOrComponentDid.push('n."componentDid" IN (:componentDid)');
        replacements.componentDid = componentDid;
      }
      conditions.push(`(${sourceOrComponentDid.join(' OR ')})`);
      replacements.source = source;
    } else if (componentDid && componentDid.length) {
      conditions.push('n."componentDid" IN (:componentDid)');
      replacements.componentDid = componentDid;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
       SELECT COUNT(DISTINCT n.id) as total
       FROM notifications n
       INNER JOIN notification_receivers nr ON n.id = nr."notificationId"
       ${whereClause}
       AND nr.receiver IN (:dids)
     `;

    const [countResult] = await this.model.sequelize.query(countQuery, {
      replacements,
      type: Sequelize.QueryTypes.SELECT,
    });
    return Number(countResult.total);
  }

  async getNotificationsBySince({ since = '1h' }) {
    // 解析 since 参数，格式为 "数字h"，例如 "1h", "24h"
    const sinceMatch = since.match(/^(\d+)h$/);
    if (!sinceMatch) {
      throw new Error('Invalid since format. Expected format: "1h", "2h", "24h", etc.');
    }

    let hours = parseInt(sinceMatch[1], 10);

    // 验证范围：最小 1h，最大 24h
    if (hours < 1 || hours > 24) {
      logger.warn('The since parameter must be between 1h and 24h.');
      // 限制 hours 在 1-24 范围内
      hours = Math.min(Math.max(hours, 1), 24);
    }

    // 计算时间范围
    const startTime = dayjs().subtract(hours, 'hours').toDate();

    // 只查询统计所需字段，排除大的 JSON 字段 (walletSendRecord, pushKitSendRecord, emailSendRecord)
    // 这样可以大幅减少数据传输量
    const results = await this.model.sequelize.query(
      `SELECT 
        "walletSendAt", "walletSendStatus", "walletSendFailedReason",
        "pushKitSendAt", "pushKitSendStatus", "pushKitSendFailedReason",
        "emailSendAt", "emailSendStatus", "emailSendFailedReason",
        "webhook", "createdAt"
      FROM notification_receivers 
      WHERE "createdAt" >= :startTime`,
      {
        replacements: { startTime },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    // 只需要解析 webhook JSON 字段
    return results.map((item) => {
      if (typeof item.webhook === 'string') {
        try {
          item.webhook = JSON.parse(item.webhook);
        } catch {
          item.webhook = {};
        }
      }
      return item;
    });
  }
}

module.exports = NotificationState;
