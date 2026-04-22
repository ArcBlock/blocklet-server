const { joinURL } = require('ufo');
const get = require('lodash/get');
const omit = require('lodash/omit');
const logger = require('@abtnode/logger')('@abtnode/core:blocklet:manager:notification');
const { getDidDomainForBlocklet } = require('@abtnode/util/lib/get-domain-for-blocklet');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { sendToUser } = require('@blocklet/sdk/lib/util/send-notification');
const {
  WELLKNOWN_BLOCKLET_ADMIN_PATH,
  NOTIFICATION_SEND_CHANNEL,
  NOTIFICATION_SEND_STATUS,
  ROLES,
  SERVER_ROLES,
  EVENTS,
} = require('@abtnode/constant');

const states = require('../../../states');
const { isCLI } = require('../../../util');
const { transformNotification } = require('../../../util/notification');

/**
 * Create notification for blocklet
 * @param {Object} manager - BlockletManager instance
 * @param {string} did - Blocklet DID
 * @param {Object} notification - Notification data
 * @param {Object} options
 * @returns {Promise<Object|undefined>}
 */
async function _createNotification(manager, did, notification, { skipGetBlocklet = false } = {}) {
  if (isCLI()) {
    return undefined;
  }

  try {
    let blockletUrl;
    let blocklet;
    try {
      blocklet = skipGetBlocklet ? null : await manager.getBlocklet(did);
      if (blocklet) {
        const urls = blocklet.site?.domainAliases || [];
        const customUrl = urls.find((x) => !x.isProtected)?.value;
        blockletUrl = `http://${
          customUrl || getDidDomainForBlocklet({ did: blocklet.appPid })
        }${WELLKNOWN_BLOCKLET_ADMIN_PATH}`;
      }
    } catch (error) {
      logger.error('[_createNotification] get blocklet url failed', { did, error });
    }

    // if blocklet is external, no need to create notification in server
    const extra = await states.blockletExtras.getMeta(did);
    const isExternal = !!extra?.controller;

    if (!isExternal) {
      // 需要处理 action,  staging 环境中 path 要带有 admin/
      const { action } = notification;
      let actionPath = action;
      if (actionPath) {
        const nodeInfo = await states.node.read();
        actionPath =
          process.env.NODE_ENV === 'production' ? joinURL(nodeInfo.routing.adminPath, actionPath) : actionPath;
      }

      await manager.teamManager.createNotification({
        ...notification,
        action: actionPath,
        blockletUrl,
        sender: did,
        source: 'system',
      });
    }

    if (blocklet) {
      const doc = await manager.teamManager.createNotification({
        teamDid: did,
        ...notification,
        action: notification.blockletDashboardAction || notification.action,
        blockletUrl,
        sender: did,
        source: 'system',
      });
      return doc;
    }
    return undefined;
  } catch (error) {
    logger.error('create notification failed', { did, error });
    return undefined;
  }
}

/**
 * Get webhooks from webhook status
 * @param {string} webhook - Webhook status JSON
 * @param {Array<string>} urls - URLs to filter
 * @param {boolean} resendFailedOnly - Only resend failed webhooks
 * @returns {Array}
 */
function getWebhooks(webhook, urls = [], resendFailedOnly = true) {
  const webhooks = [];
  try {
    const parsedWebhook = JSON.parse(webhook ?? '{}');
    for (const item of Object.entries(parsedWebhook)) {
      const [url, values] = item;
      const value = values[0]; // 或者最新的状态
      const isFailed = value.status === NOTIFICATION_SEND_STATUS.FAILED;
      const canResend = isFailed || !resendFailedOnly;
      if (!urls.length && canResend) {
        webhooks.push({
          url,
          type: value.type || 'api',
        });
      }
      if (urls.length > 0 && urls.includes(url) && canResend) {
        webhooks.push({
          url,
          type: value.type || 'api',
        });
      }
    }
    return webhooks;
  } catch (error) {
    logger.error('Failed to get webhooks', { error });
    return [];
  }
}

/**
 * Handle resend notification job
 * @param {Object} manager - BlockletManager instance
 * @param {Object} job - Job data
 * @returns {Promise<void>}
 */
async function _onResendNotification(manager, job) {
  const { notification, user, sender, channels, webhookUrls, resendFailedOnly = true } = job;
  logger.info('Start to resend notification', { notification: notification.id, user: user.did });
  const { userInfo, sendStatus } = user;
  try {
    const walletEnabled = get(userInfo, 'extra.notifications.wallet', true);
    // 需要向 wallet 重发消息
    if (channels.includes(NOTIFICATION_SEND_CHANNEL.WALLET) && walletEnabled) {
      const { walletSendStatus } = sendStatus;
      if (walletSendStatus === NOTIFICATION_SEND_STATUS.FAILED || !resendFailedOnly) {
        await sendToUser(userInfo.did, notification, sender, {
          channels: [NOTIFICATION_SEND_CHANNEL.WALLET],
        });
      }
    }
  } catch (error) {
    logger.error('Failed to resend notification to wallet', { error });
  }

  try {
    const emailEnabled = get(userInfo, 'extra.notifications.email', true);
    if (channels.includes(NOTIFICATION_SEND_CHANNEL.EMAIL) && emailEnabled && userInfo.email) {
      const { emailSendStatus } = sendStatus;
      if (emailSendStatus === NOTIFICATION_SEND_STATUS.FAILED || !resendFailedOnly) {
        await sendToUser(userInfo.did, notification, sender, {
          channels: [NOTIFICATION_SEND_CHANNEL.EMAIL],
        });
      }
    }
  } catch (error) {
    logger.error('Failed to resend notification to email', { error });
  }

  try {
    const pushEnabled = get(userInfo, 'extra.notifications.push', true);
    if (channels.includes(NOTIFICATION_SEND_CHANNEL.PUSH) && pushEnabled) {
      const { pushKitSendStatus } = sendStatus;
      if (pushKitSendStatus === NOTIFICATION_SEND_STATUS.FAILED || !resendFailedOnly) {
        await sendToUser(userInfo.did, notification, sender, {
          channels: [NOTIFICATION_SEND_CHANNEL.PUSH],
        });
      }
    }
  } catch (error) {
    logger.error('Failed to resend notification to push', { error });
  }

  try {
    const { webhook } = sendStatus;
    const webhooks = getWebhooks(webhook, webhookUrls, resendFailedOnly);
    if (webhooks.length) {
      await sendToUser(
        userInfo.did,
        {
          ...notification,
          appInfo: { webhooks },
        },
        sender,
        {
          channels: [NOTIFICATION_SEND_CHANNEL.WEBHOOK],
        }
      );
    }
  } catch (error) {
    logger.error('Failed to resend notification to webhook', { error });
  }
}

/**
 * Resend notification
 * @param {Object} manager - BlockletManager instance
 * @param {Object} props - Props
 * @param {string} props.teamDid - Blocklet DID
 * @param {string} props.notificationId - Notification ID
 * @param {Array<string>} props.receivers - Receiver DIDs
 * @param {Array<string>} props.channels - Channels
 * @param {Array<string>} props.webhookUrls - Webhook URLs
 * @param {boolean} props.resendFailedOnly - Only resend failed
 * @param {Object} context - Context
 * @returns {Promise<void>}
 */
async function resendNotification(manager, props, context) {
  const { teamDid, notificationId, receivers, channels, webhookUrls, resendFailedOnly = true } = props;
  // 判断用户的角色
  const { user } = context || {};
  if (
    !user?.role ||
    ![ROLES.ADMIN, ROLES.OWNER, SERVER_ROLES.BLOCKLET_ADMIN, SERVER_ROLES.BLOCKLET_OWNER].includes(user?.role)
  ) {
    throw new Error('Forbidden. You do not have permission to access this resource.');
  }
  try {
    // get link origin
    const { referrer } = context;
    let origin = referrer ? new URL(referrer).origin : '';
    const nodeInfo = await states.node.read();
    const blocklet = await manager.getBlocklet(teamDid);

    if (!origin || nodeInfo.did !== teamDid) {
      origin = await manager.teamManager.getActionLinkOrigin(teamDid, blocklet);
    }

    const notificationState = await manager.teamAPI.getNotificationState(teamDid);
    const { notification, users } = await notificationState.combineNotificationReceiver({
      notificationId,
      receivers,
      channels,
      webhookUrls,
    });

    const notificationFormat = transformNotification(notification, origin);

    manager.teamManager.applyComponentMountPoint(
      teamDid,
      notificationFormat,
      notification.componentDid,
      origin,
      blocklet
    );

    // const resendReceivers = users.map((u) => u.userInfo.did);
    const { wallet } = getBlockletInfo(blocklet, nodeInfo.sk);
    const sender = Object.freeze({
      appDid: wallet.address,
      verified: true,
    });

    const receiverObject = {
      receivers: users.map((u) => u.userInfo.did),
      [NOTIFICATION_SEND_CHANNEL.WALLET]: [],
      [NOTIFICATION_SEND_CHANNEL.EMAIL]: [],
      [NOTIFICATION_SEND_CHANNEL.PUSH]: [],
      [NOTIFICATION_SEND_CHANNEL.WEBHOOK]: [],
    };

    for (const _user of users) {
      const { userInfo, sendStatus } = _user;
      const { walletSendStatus, emailSendStatus, pushKitSendStatus, webhook } = sendStatus;
      if (walletSendStatus === NOTIFICATION_SEND_STATUS.FAILED && channels.includes(NOTIFICATION_SEND_CHANNEL.WALLET)) {
        receiverObject[NOTIFICATION_SEND_CHANNEL.WALLET].push(userInfo.did);
      }
      if (emailSendStatus === NOTIFICATION_SEND_STATUS.FAILED && channels.includes(NOTIFICATION_SEND_CHANNEL.EMAIL)) {
        receiverObject[NOTIFICATION_SEND_CHANNEL.EMAIL].push(userInfo.did);
      }
      if (pushKitSendStatus === NOTIFICATION_SEND_STATUS.FAILED && channels.includes(NOTIFICATION_SEND_CHANNEL.PUSH)) {
        receiverObject[NOTIFICATION_SEND_CHANNEL.PUSH].push(userInfo.did);
      }
      // TODO: webhook 需要根据 webhookUrls 进行重发
      if (webhook === NOTIFICATION_SEND_STATUS.FAILED && channels.includes(NOTIFICATION_SEND_CHANNEL.WEBHOOK)) {
        receiverObject[NOTIFICATION_SEND_CHANNEL.WEBHOOK].push(userInfo.did);
      }
    }

    // 获取第一次构建时的 options，但是要排除 channel 字段。在重发阶段会指定 channel
    const options = omit(get(notification, 'options', {}), ['channel']);

    for (const channel of channels) {
      const resendReceivers = resendFailedOnly ? receiverObject[channel] : receiverObject.receivers;

      manager.emit(EVENTS.NOTIFICATION_CREATE_QUEUED, {
        channels: [channel],
        notification: notificationFormat,
        receivers: resendReceivers,
        isServices: true,
        teamDid,
        sender,
        pushOnly: true,
        isExist: true,
        options,
      });
    }
  } catch (error) {
    logger.error('Failed to get notification state', {
      teamDid,
      notificationId,
    });
    throw error;
  }
}

/**
 * Send all messages to user
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @returns {void}
 */
function _sendAllMessageToUser(manager, { did, title, description, action, blockletDashboardAction }) {
  // 这个方法会向用户发送消息
  manager._createNotification(did, {
    title: title.en,
    description: description.en,
    entityType: 'blocklet',
    entityId: did,
    severity: 'success',
    action,
    blockletDashboardAction,
  });
}

module.exports = {
  _createNotification,
  getWebhooks,
  _onResendNotification,
  resendNotification,
  _sendAllMessageToUser,
};
