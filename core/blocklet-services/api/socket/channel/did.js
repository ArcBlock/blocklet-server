const {
  validateNotification,
  validateMessage,
  NOTIFICATION_TYPES,
} = require('@blocklet/sdk/lib/validators/notification');
const { Joi } = require('@arcblock/validator');
const {
  NODE_MODES,
  NOTIFICATION_SEND_STATUS,
  NOTIFICATION_SEND_FAILED_REASON,
  NOTIFICATION_SEND_CHANNEL,
} = require('@abtnode/constant');
const JWT = require('@arcblock/jwt');
const uniq = require('lodash/uniq');

const logger = require('../../libs/logger')('blocklet-services:socket-channel:did');
const { ensureSenderApp, getSenderServer, parseNotification, EVENTS } = require('../util');
const states = require('../../state');
const { sendEmail } = require('../../libs/email');
const { sendPush } = require('../../libs/push-kit');

const CHANNEL_FIELD_MAP = {
  [NOTIFICATION_SEND_CHANNEL.WALLET]: [
    'walletSendStatus',
    'walletSendAt',
    'walletSendFailedReason',
    'walletSendRecord',
  ],
  [NOTIFICATION_SEND_CHANNEL.PUSH]: [
    'pushKitSendStatus',
    'pushKitSendAt',
    'pushKitSendFailedReason',
    'pushKitSendRecord',
  ],
  [NOTIFICATION_SEND_CHANNEL.EMAIL]: ['emailSendStatus', 'emailSendAt', 'emailSendFailedReason', 'emailSendRecord'],
};

const CHANNEL_MAP = {
  [NOTIFICATION_TYPES.HI]: [NOTIFICATION_SEND_CHANNEL.WALLET],
  [NOTIFICATION_TYPES.CONNECT]: [NOTIFICATION_SEND_CHANNEL.WALLET],
  [NOTIFICATION_TYPES.PASSTHROUGH]: [NOTIFICATION_SEND_CHANNEL.WALLET, NOTIFICATION_SEND_CHANNEL.PUSH],
};

const updateNotificationSendStatus = async ({
  node,
  teamDid,
  notificationId,
  receivers = [],
  channel = '',
  status,
  failedReason = '',
  webhookParams = {},
  email = '',
}) => {
  if (!node || !notificationId || !receivers.length) {
    return undefined;
  }
  try {
    if (channel === NOTIFICATION_SEND_CHANNEL.WEBHOOK && Object.keys(webhookParams).length > 0) {
      const updateParams = {
        receivers,
        teamDid,
        notificationId,
        updates: {
          webhookParams,
        },
      };

      const res = await node.updateNotificationStatus(updateParams);
      return res;
    }

    const [field, at, reasonField, recordField] = CHANNEL_FIELD_MAP[channel];
    if (!field || !at) {
      return undefined;
    }

    const updates = {
      [field]: status,
      [at]: new Date(),
      ...(failedReason ? { [reasonField]: failedReason } : {}),
    };

    updates.record = {
      field: recordField,
      content: {
        sendStatus: status,
        sendAt: updates[at],
        ...(failedReason ? { failedReason } : {}),
      },
    };

    if (channel === NOTIFICATION_SEND_CHANNEL.EMAIL && email) {
      updates.email = email;
    }

    const updateParams = {
      receivers,
      teamDid,
      notificationId,
      updates,
    };

    const res = await node.updateNotificationStatus(updateParams);
    return res;
  } catch (error) {
    logger.error('Failed to update notification send status', { error });
    return undefined;
  }
};

/**
 * app send notification to user
 *
 * @param {Object} options
 * @param {Object} options.sender
 * @param {string} options.sender.did
 * @param {string} options.sender.token
 * @param {'server'|'blocklet'} [options.sender.type=blocklet]
 * @param {string[]|string} options.receiver
 * @param {object[]|object} options.notification
 * @param {object} options.options
 * @param {boolean} options.options.keepForOfflineUser 是否为离线用户保存消息，上线的时候会发出
 * @param {('app'| 'email'| 'push'| 'webhook')[]} options.options.channels 发送通知的渠道 app: 钱包消息，email: 邮件，webhook: 钩子，push: pushKit
 * @param {ABTNode} options.node
 * @param {WsServer} options.wsServer
 */
const sendToUserDid = async ({ sender, receiver: rawDid, notification, options, node }) => {
  // FIXME: 默认不应该有 push（仅在测试阶段加上），后期需要移除
  const { channels = ['app', 'email', 'webhook', 'push'], ...rest } = options || {};

  if (channels.length === 0) {
    return undefined;
  }
  const teamDid = sender.appDid;

  const nodeInfo = await node.getNodeInfo({ useCache: true });

  if (nodeInfo.mode !== NODE_MODES.DEBUG) {
    try {
      await validateNotification(notification);
    } catch (error) {
      logger.error('Failed to validate notification', { error });
      // 抛出错误，阻止后续执行
      throw error;
    }
  }

  if (!sender.token) {
    throw new Error('Invalid sender: token empty');
  }

  // 认证校验，如果校验成功，则不需要后续重复校验
  try {
    await ensureSenderApp({ sender, node, nodeInfo });
    sender.verified = true; // 认证成功标志位
  } catch (error) {
    logger.error('Failed to ensure sender app', { error });
    // 抛出错误，阻止后续执行
    throw error;
  }

  const notifications = Array.isArray(notification) ? notification : [notification];

  const isServer = !teamDid || teamDid === nodeInfo.did;

  // 开始执行 service 消息的推送，不需要同步执行
  Promise.all(
    notifications.map((_notification) => {
      // 如果类型不存在或者是 notification 类型是才进行保存数据库，其他类型只需要通知到用户即可
      // eg: type = 'passthrough', 'hi', 'connect', 'feed', 默认只需要通知 wallet
      const pushOnly = _notification.type && _notification.type.toLowerCase() !== NOTIFICATION_TYPES.NOTIFICATION;

      // 通知渠道的确定有两种方式 1. 用户传入的 channels 2. 根据 notification 类型确定
      // 如果是 hi connect, 只需要通知 wallet
      // passthrough 类型，用于 discuss kit 的 chat channel
      // 1. push kit: native 通知快速跳转到 chat channel
      // 2. app: 钱包消息，可以查看到接收到消息

      return node.createNotification({
        teamDid,
        ...(pushOnly ? { notification: _notification } : { ..._notification }),
        receiver: rawDid,
        componentDid: sender.componentDid,
        // 这两个字段用于 socket 通知
        entityType: _notification.entityType || 'blocklet',
        entityId: _notification.entityId || sender.appDid,
        source: isServer ? 'system' : _notification.source || 'component',
        channels: CHANNEL_MAP[_notification.type] || channels,
        sender,
        options: { ...rest },
        pushOnly,
      });
    })
  ).catch((error) => {
    logger.error('Failed to send notification', { error });
  });
  return true;
};

// server send notification to app
const sendToAppDid = async ({
  event,
  sender,
  notification,
  receiver,
  appDid,
  data,
  node,
  options,
  pushOnly,
  wsServer,
  source,
}) => {
  if (notification && sender) {
    const { keepForOfflineUser = true, ttl } = options || {};
    const teamDid = sender.appDid;
    const { id } = notification;
    if (Array.isArray(receiver)) {
      throw new Error('Invalid receiver: 1 receiver each time');
    }
    if (Array.isArray(notification)) {
      throw new Error('Invalid notification: 1 message each time');
    }
    const nodeInfo = await node.getNodeInfo({ useCache: true });
    // parse notification
    const senderInfo = await ensureSenderApp({ sender, node, nodeInfo });
    // parse notification
    const [payload] = parseNotification({ ...notification }, senderInfo);

    wsServer.broadcast(receiver, EVENTS.MESSAGE, payload, {}, async ({ count } = {}) => {
      if (!pushOnly) {
        updateNotificationSendStatus({
          node,
          teamDid,
          notificationId: id,
          receivers: [receiver],
          channel: NOTIFICATION_SEND_CHANNEL.WALLET,
          status: count > 0 ? NOTIFICATION_SEND_STATUS.SENT : NOTIFICATION_SEND_STATUS.FAILED,
          failedReason: count > 0 ? null : NOTIFICATION_SEND_FAILED_REASON.NOT_ONLINE,
        });
      }

      if (count <= 0 && keepForOfflineUser && source !== 'system') {
        // 系统发出的消息不进行缓存
        logger.debug('Online client was not found', { userDid: receiver });
        await states.message.insert({
          did: receiver,
          event: EVENTS.MESSAGE,
          data: payload,
          ttl: typeof ttl === 'number' && ttl > 0 ? ttl : null,
        });
      }
    });
    return;
  }
  const senderInfo = await getSenderServer({ node });

  const _notification = {
    data,
  };

  _notification.sender = {
    did: senderInfo.wallet.address,
    pk: senderInfo.wallet.publicKey,
    token: await JWT.sign(senderInfo.wallet.address, senderInfo.wallet.secretKey),
    name: senderInfo.name,
  };

  wsServer.broadcast(appDid, event, _notification, { noCluster: true });
};

const sendCachedMessages = async (wsServer, did) => {
  try {
    const messages = await states.message.find({ did });
    if (!messages.length) {
      return;
    }

    messages.forEach(({ did: channel, event, data }) => {
      wsServer.broadcast(channel, event, data);
    });

    await states.message.remove({ did });
  } catch (error) {
    logger.error('Error on sending cached messages', { error });
  }
};

/**
 * Receive message from channel
 * @param {{
 *   {WsServer} wsServer
 *   {ABTNode} Node
 *   {string} topic
 *   {string} event
 *   {Object} payload
 * }}
 * @returns
 */
const onMessage = async ({ channel: from, event = EVENTS.MESSAGE, payload: message, wsServer, node }) => {
  if (event !== EVENTS.MESSAGE) {
    throw new Error(`Invalid event. expect: "message". got: "${event}"`);
  }

  await validateMessage(message);

  // validate receiver
  const { receiver, ...data } = message;

  const blocklet = await node.getBlocklet({ did: receiver.did, attachConfig: false, useCache: true });
  if (!blocklet) {
    const nodeInfo = await node.getNodeInfo({ useCache: true });

    // only throw error if receiver is a blocklet (not server)
    if (nodeInfo.did !== receiver.did) {
      throw new Error(`App is not installed in the server. receiver: ${receiver.did}`);
    }
  }

  logger.info('send message to blocklet', { sender: from, receiver: receiver.did });
  wsServer.broadcast(receiver.did, event, {
    ...data,
    sender: {
      did: from,
    },
  });
};

const onJoin = async ({ channel: did, payload, wsServer, node }) => {
  await sendCachedMessages(wsServer, did);

  if (payload.message) {
    await onMessage({
      channel: did,
      payload: payload.message,
      wsServer,
      node,
    });
  }
};

const onAuthenticate = async ({ channel, did, payload }) => {
  if (did !== channel) {
    throw new Error(`verified did and channel does not match. did: ${did}, channel: ${channel}`);
  }

  if (payload.message) {
    await validateMessage(payload.message);
  }
};

/**
 * 安全地更新 webhook 状态，不影响主流程
 * @param {object} params - 更新参数
 * @param {object} params.node - node 实例
 * @param {object} params.webhook - webhook 对象
 * @param {string} params.teamDid - team DID
 * @param {boolean} params.isService - 是否为服务
 * @param {Array<string>} params.receivers - 接收者列表
 * @param {number|undefined} params.consecutiveFailures - 连续失败次数，0=重置，undefined=自动+1
 */
const safeUpdateWebhookState = async ({ node, webhook, teamDid, isService, receivers, consecutiveFailures }) => {
  try {
    await node.updateWebHookState({
      webhook,
      teamDid,
      isService,
      userDids: receivers,
      consecutiveFailures,
    });
  } catch (error) {
    logger.debug('Failed to update webhook state', {
      error,
      teamDid,
      receivers,
      webhook: webhook.url,
      consecutiveFailures,
    });
  }
};

const sendToWebhook = async ({ sender, receiver, notification, node, pushOnly }) => {
  const teamDid = sender.appDid;
  const { id, appInfo, ...rest } = notification;
  const webhooks = appInfo?.webhooks ?? [];
  const receivers = Array.isArray(receiver) ? receiver : [receiver];
  if (!webhooks.length) {
    throw new Error('Invalid webhook: empty target');
  }
  if (webhooks.every((webhook) => !webhook.url)) {
    throw new Error('Invalid webhook: url empty');
  }
  const nodeInfo = await node.getNodeInfo({ useCache: true });

  if (nodeInfo.mode !== NODE_MODES.DEBUG) {
    await validateNotification(notification);
  }

  const senderInfo = await ensureSenderApp({ sender, node, nodeInfo });

  const isService = teamDid && teamDid !== nodeInfo.did;
  // 发送消息前要添加 sender 内容。否则邮件中没有 blocklet 的信息
  const notifications = parseNotification({ id, ...rest }, senderInfo);
  const webhookSenderMap = new Map();

  const webhookList = webhooks.filter((w) => w.url);
  const webhookPromises = webhookList.map(async (webhook) => {
    let webhookSender = webhookSenderMap.get(webhook.type);
    if (!webhookSender) {
      webhookSender = node.getMessageSender(webhook.type);
      webhookSenderMap.set(webhook.type, webhookSender);
    }
    const webhookParams = {
      [webhook.url]: {
        type: webhook.type ?? 'api',
        sendAt: new Date(),
      },
    };
    try {
      const res = await webhookSender.sendNotification(webhook.url, notifications[0]);
      if (!pushOnly) {
        webhookParams[webhook.url] = {
          ...webhookParams[webhook.url],
          status: res ? NOTIFICATION_SEND_STATUS.SENT : NOTIFICATION_SEND_STATUS.FAILED,
          failedReason: res ? '' : NOTIFICATION_SEND_FAILED_REASON.CHANNEL_UNAVAILABLE,
        };
        updateNotificationSendStatus({
          node,
          teamDid,
          notificationId: id,
          receivers,
          channel: NOTIFICATION_SEND_CHANNEL.WEBHOOK,
          webhookParams,
        });
      }
      // 发送成功，重置失败次数
      await safeUpdateWebhookState({
        node,
        webhook,
        teamDid,
        isService,
        receivers,
        consecutiveFailures: 0,
      });
      return res;
    } catch (error) {
      // 使用 debug 级别记录详细执行信息，避免与上层业务日志重复
      logger.debug('Webhook send failed', { error, webhook: webhook.url, notificationId: id });
      if (!pushOnly) {
        webhookParams[webhook.url] = {
          ...webhookParams[webhook.url],
          status: NOTIFICATION_SEND_STATUS.FAILED,
          failedReason: error.message,
        };
        updateNotificationSendStatus({
          node,
          teamDid,
          notificationId: id,
          receivers,
          channel: NOTIFICATION_SEND_CHANNEL.WEBHOOK,
          webhookParams,
        });
      }
      // 发送失败，不传入 consecutiveFailures，让底层自动 +1
      await safeUpdateWebhookState({
        node,
        webhook,
        teamDid,
        isService,
        receivers,
      });
      const err = new Error('Failed to send webhook');
      err.details = error;
      throw err;
    }
  });

  return Promise.all(webhookPromises);
};

/**
 * app send email to user
 * receiver: email
 */
const emailSchema = Joi.string().email().required();
const sendToMail = async ({ sender, receiver, notification, options, node, pushOnly }) => {
  const teamDid = sender.appDid;
  const { id, appInfo, ...rest } = notification;

  const {
    receiverDid,
    receivers: sameEmailReceivers = [],
    unsubscribeToken,
    userInfo = {},
    extraData,
    template,
  } = appInfo || {};

  const receivers = uniq(Array.isArray(receiver) ? receiver : [receiver]).filter(Boolean);
  if (receivers.length === 0) {
    throw new Error('Invalid receiver: empty');
  }
  if (receivers.some((x) => emailSchema.validate(x).error)) {
    throw new Error(`Invalid receiver: invalid email: ${receivers.join(', ')}`);
  }
  if (receivers.length > 10) {
    throw new Error('Invalid receiver: too many, should be less than 10');
  }
  if (Array.isArray(notification)) {
    throw new Error('Invalid notification: 1 message each time');
  }

  if (!notification.title && ![NOTIFICATION_TYPES.FEED, NOTIFICATION_TYPES.PASSTHROUGH].includes(notification.type)) {
    throw new Error('Invalid notification: title empty');
  }
  if (!notification.body && ![NOTIFICATION_TYPES.FEED, NOTIFICATION_TYPES.PASSTHROUGH].includes(notification.type)) {
    throw new Error('Invalid notification: body empty');
  }

  const nodeInfo = await node.getNodeInfo({ useCache: true });

  const isServer = teamDid === nodeInfo.did;
  if (nodeInfo.mode !== NODE_MODES.DEBUG) {
    await validateNotification(notification);
  }

  const senderInfo = await ensureSenderApp({ sender, node, nodeInfo });

  const notifications = parseNotification({ id, ...rest }, senderInfo);

  const { locale = 'en', raw = false, allowUnsubscribe = true } = options || {};
  const results = await Promise.allSettled(
    receivers.map((receiverItem) => {
      return sendEmail(receiverItem, notifications[0], {
        teamDid: sender.appDid,
        node,
        locale,
        raw,
        ...(unsubscribeToken && allowUnsubscribe ? { unsubscribeToken } : {}),
        ...(userInfo ? { userInfo } : {}),
        extraData,
        template,
      });
    })
  );
  return results.map((item) => {
    if (!isServer && (receiverDid || sameEmailReceivers.length > 0) && !pushOnly) {
      receivers.forEach((email) => {
        updateNotificationSendStatus({
          node,
          teamDid,
          email,
          notificationId: id,
          receivers: sameEmailReceivers.length > 0 ? sameEmailReceivers : [receiverDid],
          channel: NOTIFICATION_SEND_CHANNEL.EMAIL,
          status: item.status === 'rejected' ? NOTIFICATION_SEND_STATUS.FAILED : NOTIFICATION_SEND_STATUS.SENT,
          ...(item.status === 'rejected'
            ? {
                failedReason:
                  item.reason instanceof Error
                    ? item.reason?.message
                    : item.reason || NOTIFICATION_SEND_FAILED_REASON.CHANNEL_UNAVAILABLE,
              }
            : {}),
        });
      });
    }
    if (item.status === 'rejected') {
      return {
        ...item,
        reason: item.reason instanceof Error ? item.reason?.message : item.reason,
      };
    }
    return item;
  });
};

const sendToPush = async ({ sender, receiver, notification, options, node, pushOnly }) => {
  const teamDid = sender.appDid;
  const { id } = notification;

  const receivers = uniq(Array.isArray(receiver) ? receiver : [receiver]).filter(Boolean);
  if (receivers.length === 0) {
    throw new Error('Invalid receiver: empty');
  }
  if (Array.isArray(notification)) {
    throw new Error('Invalid notification: 1 message each time');
  }
  if (!notification.title && ![NOTIFICATION_TYPES.FEED, NOTIFICATION_TYPES.PASSTHROUGH].includes(notification.type)) {
    throw new Error('Invalid notification: title empty');
  }
  if (!notification.body && ![NOTIFICATION_TYPES.FEED, NOTIFICATION_TYPES.PASSTHROUGH].includes(notification.type)) {
    throw new Error('Invalid notification: body empty');
  }

  const nodeInfo = await node.getNodeInfo({ useCache: true });
  const isServer = teamDid === nodeInfo.did;
  if (nodeInfo.mode !== NODE_MODES.DEBUG) {
    await validateNotification(notification);
  }

  const senderInfo = await ensureSenderApp({ sender, node, nodeInfo });

  const notifications = parseNotification({ ...notification }, senderInfo);

  const { locale = 'en' } = options || {};
  return sendPush(receivers, notifications[0], {
    teamDid: sender.appDid,
    node,
    locale,
  })
    .then((res) => {
      if (!isServer && !pushOnly) {
        updateNotificationSendStatus({
          node,
          teamDid,
          notificationId: id,
          receivers,
          channel: NOTIFICATION_SEND_CHANNEL.PUSH,
          status: res ? NOTIFICATION_SEND_STATUS.SENT : NOTIFICATION_SEND_STATUS.FAILED,
          failedReason: res ? null : NOTIFICATION_SEND_FAILED_REASON.CHANNEL_UNAVAILABLE,
        });
      }
      return res;
    })
    .catch((err) => {
      // 使用 debug 级别记录详细执行信息，避免与上层业务日志重复
      logger.debug('PushKit send failed', { error: err, receivers, notificationId: id });
      if (!pushOnly) {
        updateNotificationSendStatus({
          node,
          teamDid,
          notificationId: id,
          receivers,
          channel: NOTIFICATION_SEND_CHANNEL.PUSH,
          status: NOTIFICATION_SEND_STATUS.FAILED,
          failedReason: err.message,
        });
      }
      throw err;
    });
};

module.exports = {
  onAuthenticate,
  onJoin,
  onMessage,
  sendToUserDid,
  sendToAppDid,
  sendToMail,
  sendToPush,
  emailSchema,
  sendToWebhook,
  updateNotificationSendStatus,
};
