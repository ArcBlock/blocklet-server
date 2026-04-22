const createQueue = require('@abtnode/core/lib/util/queue');
const { validateNotification } = require('@blocklet/sdk/lib/validators/notification');
const states = require('@abtnode/core/lib/states');
const { Joi } = require('@arcblock/validator');
const JWT = require('@arcblock/jwt');
const md5 = require('@abtnode/util/lib/md5');
const isUrl = require('is-url');
const { isSlackWebhookUrl } = require('@abtnode/util/lib/url-evaluation');
const { wipeSensitiveData } = require('@blocklet/meta/lib/util');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const { NOTIFICATION_TYPES } = require('@blocklet/sdk/lib/validators/notification');
const { isWorkerInstance } = require('@abtnode/util/lib/pm2/is-instance-worker');
const {
  NODE_MODES,
  EVENTS,
  NOTIFICATION_SEND_CHANNEL,
  NOTIFICATION_SEND_STATUS,
  NOTIFICATION_SEND_FAILED_REASON,
} = require('@abtnode/constant');
const sleep = require('@abtnode/util/lib/sleep');
const { nanoid } = require('@blocklet/meta/lib/util');
const get = require('lodash/get');
const uniqBy = require('lodash/uniqBy');
const { getQueueConcurrencyByMem } = require('@abtnode/core/lib/util');
const { getBlockletInfo } = require('../../cache');
const { updateNotificationSendStatus } = require('../../socket/channel/did');
const eventHub =
  process.env.NODE_ENV === 'test'
    ? require('@arcblock/event-hub/single').default
    : require('@arcblock/event-hub').default;

const logger = require('../../libs/logger')('blocklet-services:notification-queue');

const emailSchema = Joi.string().email().required();

const concurrency = getQueueConcurrencyByMem();

/**
 *
 * 校验是否是有效的 passthrough 消息
 * 场景：discuss kit chat 中发送消息时会有两个通知，一个通知是消息的已读状态没有消息体，一个通知发送的内容，
 */
const validPassthroughMessage = (notification) => {
  if (
    !notification ||
    notification.type !== NOTIFICATION_TYPES.PASSTHROUGH ||
    notification.passthroughType !== 'messageStatus'
  ) {
    return true;
  }
  const { data } = notification;
  return data && data.message;
};

const createNotificationQueue = (name, options, handler) => {
  if (!handler || typeof handler !== 'function') {
    throw new Error('Handler is required');
  }
  return createQueue({
    name,
    model: states.job,
    daemon: true,
    options: {
      maxRetries: 3,
      retryDelay: 10 * 1000,
      maxTimeout: 60 * 1000, // throw timeout error after 1 minutes
      concurrency,
      ...(options ?? {}),
    },
    onJob: async (job) => {
      await handler(job);
      if (options.delay) {
        await sleep(options.delay * 1000);
      }
    },
  });
};

const init = ({ node, notificationService }) => {
  const webhookState = states.webhook;
  const blockletState = states.blocklet;

  const getServerWebhooks = async () => {
    const webhookList = (await webhookState.list()) ?? [];
    return webhookList.flatMap((item) =>
      item.params
        .filter((param) => param.name === 'url' && param.value)
        .map((param) => ({
          id: item.id,
          type: item.type,
          url: param.value,
          enabled: param.enabled ?? true,
          consecutiveFailures: param.consecutiveFailures || 0,
        }))
    );
  };

  /**
   * wallet 推送队列
   */
  const walletPushQueue = createNotificationQueue(
    'send-notification-wallet',
    {
      maxRetries: 1,
      retryDelay: 0,
      enableScheduledJob: true,
    },
    async (job) => {
      try {
        const { receiver, notification, sender, options, source } = job;

        if (!receiver) {
          throw new Error('Invalid receiver');
        }

        await notificationService.sendToApp.exec({
          sender,
          receiver,
          notification,
          options,
          pushOnly: job.pushOnly,
          source,
        });
      } catch (error) {
        logger.error('Failed to send to app', { notificationId: job.notification.id, receiver: job.receiver, error });
        throw error;
      }
    }
  );

  /**
   * Push Kit 推送队列
   */
  const pushKitPushQueue = createNotificationQueue(
    'send-notification-push',
    {
      enableScheduledJob: true,
    },
    async (job) => {
      try {
        const { notification, receiver, sender } = job;

        if (!receiver) {
          throw new Error('Invalid receiver');
        }

        await notificationService.sendToPush.exec({
          sender,
          receiver,
          notification,
          pushOnly: job.pushOnly,
        });
      } catch (error) {
        if (error.logLevel === 'debug') {
          logger.debug('Failed to send to push', {
            notificationId: job.notification.id,
            receiver: job.receiver,
            error,
          });
        } else {
          logger.error('Failed to send to push', {
            notificationId: job.notification.id,
            receiver: job.receiver,
            error,
          });
        }
      }
    }
  );

  /**
   * email 推送队列
   */
  const emailPushQueue = createNotificationQueue(
    'send-notification-email',
    {
      maxRetries: 1,
      retryDelay: 0,
      maxTimeout: 10 * 60 * 1000, // throw timeout error after 10 minutes
      id: (job) => (job ? md5(`${job.email}_${job.notificationId}`) : ''),
      enableScheduledJob: true,
    },
    async (job) => {
      try {
        const { input, email } = job;
        if (!input) {
          throw new Error('Job input is missing or invalid');
        }

        if (!email) {
          throw new Error('Email address is missing. Unable to send email notification');
        }

        const { notification, sender, teamDid, receivers = [], userInfo, options } = input;

        const { allowUnsubscribe = true } = options || {};

        if (!userInfo) {
          logger.error('Invalid receiver', { dids: userInfo.did });
          throw new Error('Invalid receiver');
        }

        let wallet;

        if (sender.type !== 'server') {
          const blockletInfo = await getBlockletInfo({ did: teamDid, node });
          wallet = blockletInfo.wallet;
        }

        const now = Math.floor(Date.now() / 1000);
        const unsubscribeToken =
          wallet && allowUnsubscribe
            ? await JWT.signV2(wallet.address, wallet.secretKey, {
                userDid: userInfo.did,
                channel: 'email',
                exp: String(now + 30 * 24 * 60 * 60), // 30 days
              })
            : null;

        logger.info('Start send to email', {
          notificationId: job.notificationId,
        });
        await notificationService.sendToMail.exec({
          sender,
          receiver: email,
          notification: {
            ...notification,
            appInfo: {
              ...(notification.appInfo || {}),
              receivers: receivers.length > 0 ? receivers : [userInfo.did],
              ...(unsubscribeToken ? { unsubscribeToken } : {}),
              userInfo: {
                did: userInfo.did,
                fullName: userInfo.fullName,
              },
              template: job.input.template,
              extraData: job.input.extraData,
            },
          },
          pushOnly: input.pushOnly,
          options,
        });
        logger.info('End send to email', {
          notificationId: job.notificationId,
        });
      } catch (error) {
        if (error.logLevel === 'debug') {
          logger.debug('Failed to send to email', {
            notificationId: job.notificationId,
            receivers: job.input.receivers.join(','),
            email: job.email,
            error,
          });
        } else {
          logger.error('Failed to send to email', {
            notificationId: job.notificationId,
            receivers: job.input.receivers.join(','),
            email: job.email,
            error,
          });
        }
        throw error;
      }
    }
  );

  /**
   * webhook 推送队列
   */
  const webhookQueue = createNotificationQueue(
    'send-notification-webhook',
    {
      maxRetries: 3,
      retryDelay: 10 * 1000,
      maxTimeout: 10 * 60 * 1000, // throw timeout error after 10 minutes
      id: (job) => (job ? md5(`${job.url}_${job.notificationId}`) : ''),
      enableScheduledJob: true,
    },
    async (job) => {
      try {
        const { input } = job;
        if (!input) {
          throw new Error('Invalid job');
        }

        const { notification, webhook, sender, receivers = [] } = input;

        if (!receivers.length) {
          throw new Error('Invalid receiver');
        }

        if (!webhook || !webhook.url) {
          throw new Error('Invalid webhook');
        }

        logger.info('Start send to webhook', {
          url: webhook.url,
          notificationId: job.notificationId,
        });
        await notificationService.sendToWebhook.exec({
          sender,
          receiver: receivers,
          notification: {
            ...notification,
            appInfo: {
              ...(notification.appInfo || {}),
              webhooks: [webhook],
            },
          },
          pushOnly: input.pushOnly,
        });
        logger.info('End send to webhook', {
          url: webhook.url,
          notificationId: job.notificationId,
        });
      } catch (error) {
        logger.error('Failed to send to webhook', {
          url: job?.input?.webhook?.url,
          notificationId: job?.input?.notificationId,
          receivers: job.input.receivers.join(','),
          error,
        });
        throw error;
      }
    }
  );

  /**
   * 网页 websocket 通知
   */
  const websocketQueue = createNotificationQueue('send-notification-websocket', {}, async (job) => {
    try {
      const { input } = job;
      const { notification, receiver, teamDid, isServices } = input;
      let broadcastEvent = '';

      const broadcastData = {
        ...notification,
        description: notification.description ?? notification.body ?? '',
        severity: notification.severity === 'normal' ? 'info' : notification.severity,
        teamDid: isServices ? teamDid : '',
        receivers: [
          {
            receiver,
            read: false,
          },
        ],
      };

      if (isServices) {
        const metaDid = await blockletState.getBlockletMetaDid(teamDid);
        broadcastEvent = EVENTS.NOTIFICATION_BLOCKLET_CREATE;
        broadcastData.meta = {
          did: metaDid,
        };
      }

      let safeData = broadcastData;
      if (get(safeData, 'meta.did', '')) {
        safeData = wipeSensitiveData(cloneDeep(safeData));
      }

      if (get(safeData, 'blocklet.meta.did', '')) {
        safeData.blocklet = wipeSensitiveData(cloneDeep(safeData.blocklet));
      }

      if (broadcastEvent) {
        eventHub.broadcast(broadcastEvent, safeData); // 广播到所有节点
      }
    } catch (error) {
      logger.error('Failed to send to websocket', { error });
    }
  });

  const insertToEmailPushQueue = (props, nodeInfo, isResend) => {
    const { channels, notification, sender, userInfo, teamDid, options, template, extraData } = props;

    const commonParams = {
      node,
      teamDid: teamDid ?? nodeInfo.did,
      notificationId: notification.id,
    };

    // 当 allowUnsubscribe 为 false 时，强制发送邮件通知，忽略用户的邮件通知设置
    const emailEnabled = options.allowUnsubscribe === false || get(userInfo, 'extra.notifications.email', true);

    const email = userInfo?.email;

    const receiverDid = userInfo.did;

    const channelEnabled = emailEnabled && channels.includes(NOTIFICATION_SEND_CHANNEL.EMAIL);

    const { error } = emailSchema.validate(email);

    if (channelEnabled && email && !error) {
      const _userInfo = {
        did: receiverDid,
        fullName: userInfo.fullName,
      };
      // 这里可以根据 email 获取到需要发送的 userInfo 和 receivers
      logger.info('Insert to email push queue', {
        notificationId: notification.id,
        receiver: receiverDid,
      });
      emailPushQueue.push({
        job: {
          email,
          notificationId: notification.id,
          teamDid: teamDid ?? nodeInfo.did,
          input: {
            notification,
            sender,
            teamDid,
            receivers: [receiverDid],
            userInfo: _userInfo,
            isResend,
            pushOnly: props.pushOnly && !isResend,
            options,
            template,
            extraData,
          },
        },
        delay: 8,
      });
    } else {
      // eslint-disable-next-line no-lonely-if
      if (!isResend && !props.pushOnly) {
        updateNotificationSendStatus({
          ...commonParams,
          email,
          receivers: [receiverDid],
          channel: NOTIFICATION_SEND_CHANNEL.EMAIL,
          status: NOTIFICATION_SEND_STATUS.FAILED,
          // eslint-disable-next-line no-nested-ternary
          failedReason: error
            ? `Invalid email address: ${email}`
            : !emailEnabled
              ? NOTIFICATION_SEND_FAILED_REASON.USER_DISABLED
              : NOTIFICATION_SEND_FAILED_REASON.CHANNEL_DISABLED,
        });
      }
    }
  };

  /**
   * 批量更新 webhook 发送失败状态（并行处理）
   * @param {Array} webhooks - webhook 列表
   * @param {string} failedReason - 失败原因
   * @param {object} params - 公共参数
   * @returns {Promise<void>}
   */
  const batchUpdateWebhookFailedStatus = (webhooks, failedReason, params) => {
    const updatePromises = webhooks.map((webhook) => {
      const { url, type } = webhook;
      const webhookParams = {
        [url]: {
          type,
          sendAt: new Date(),
          status: NOTIFICATION_SEND_STATUS.FAILED,
          failedReason,
        },
      };

      return updateNotificationSendStatus({
        ...params,
        channel: NOTIFICATION_SEND_CHANNEL.WEBHOOK,
        status: NOTIFICATION_SEND_STATUS.FAILED,
        webhookParams,
      }).catch((err) => {
        logger.debug('update webhook failed status error', { err, url });
      });
    });

    return Promise.all(updatePromises);
  };

  const insertToWebhookPushQueue = async (props, nodeInfo, isResend) => {
    const { channels, notification, sender, userInfo, teamDid, pushOnly } = props;

    const receiverDid = userInfo.did;

    const commonParams = {
      node,
      teamDid: teamDid ?? nodeInfo.did,
      notificationId: notification.id,
      receivers: [receiverDid],
    };

    const isServer = teamDid === nodeInfo.did;

    let webhooks = get(userInfo, 'extra.webhooks', []);
    if (isServer) {
      webhooks = await getServerWebhooks();
    }

    const webhookList = uniqBy(webhooks, 'url');

    // 分类 webhook：有效、禁用、类型不匹配
    const validWebhookList = [];
    const invalidWebhooks = []; // { webhook, reason }

    for (const webhook of webhookList) {
      const { url, type, enabled = true } = webhook;

      // 检查是否禁用
      if (!enabled) {
        invalidWebhooks.push({ webhook, reason: 'Current webhook is disabled' });
      } else if (type === 'api' && isUrl(url)) {
        // api 类型且 URL 有效
        validWebhookList.push(webhook);
      } else if (type === 'slack' && isUrl(url) && isSlackWebhookUrl(url)) {
        // slack 类型且 URL 有效
        validWebhookList.push(webhook);
      } else {
        // 类型不支持或 URL 无效
        invalidWebhooks.push({ webhook, reason: 'Webhook type is not supported or URL is invalid' });
      }
    }

    const isWebhookChannelEnabled = channels.includes(NOTIFICATION_SEND_CHANNEL.WEBHOOK);

    // 如果有有效的 webhook 且 channel 启用，推送到队列
    if (validWebhookList.length > 0 && isWebhookChannelEnabled) {
      for (const webhook of validWebhookList) {
        const { url } = webhook;
        logger.info('Insert to webhook push queue', {
          notificationId: notification.id,
          receiver: receiverDid,
          url,
        });
        webhookQueue.push({
          job: {
            url,
            notificationId: notification.id,
            teamDid: teamDid ?? nodeInfo.did,
            input: {
              notification,
              sender,
              receivers: [receiverDid],
              isResend,
              pushOnly: props.pushOnly && !isResend,
              webhook,
            },
          },
          delay: 5,
        });
      }
    }

    // 如果不是重发，需要更新失败状态（并行处理）
    if (!isResend && !pushOnly) {
      const updatePromises = [];

      // 处理无效的 webhook（按失败原因分组并行更新）
      if (invalidWebhooks.length > 0) {
        // 按失败原因分组
        const groupedByReason = {};
        for (const { webhook, reason } of invalidWebhooks) {
          if (!groupedByReason[reason]) {
            groupedByReason[reason] = [];
          }
          groupedByReason[reason].push(webhook);
        }

        // 每组并行更新
        for (const [reason, webhookGroup] of Object.entries(groupedByReason)) {
          updatePromises.push(batchUpdateWebhookFailedStatus(webhookGroup, reason, commonParams));
        }
      }

      // 处理有效但 channel 禁用的 webhook
      if (validWebhookList.length > 0 && !isWebhookChannelEnabled) {
        updatePromises.push(
          batchUpdateWebhookFailedStatus(
            validWebhookList,
            NOTIFICATION_SEND_FAILED_REASON.CHANNEL_DISABLED,
            commonParams
          )
        );
      }

      // 等待所有更新完成（不阻塞主流程）
      Promise.all(updatePromises).catch((err) => {
        logger.error('batch update webhook failed status error', { err });
      });
    }
  };

  const insertToPushKitPushQueue = (props, nodeInfo, isResend) => {
    const { channels, notification, sender, userInfo, teamDid, options = {} } = props;

    // 如果是无效的 passthrough 消息，则不进行推送
    if (!validPassthroughMessage(notification)) {
      return;
    }

    const receiverDid = userInfo.did;

    const commonParams = {
      node,
      teamDid: teamDid ?? nodeInfo.did,
      notificationId: notification.id,
    };
    const pushEnabled = get(userInfo, 'extra.notifications.push', true);
    if (pushEnabled && channels.includes(NOTIFICATION_SEND_CHANNEL.PUSH)) {
      logger.info('Insert to push kit push queue', {
        notificationId: notification.id,
        receiver: receiverDid,
      });
      pushKitPushQueue.push({
        job: {
          notification,
          sender,
          options,
          receiver: receiverDid,
          isResend,
          pushOnly: props.pushOnly && !isResend,
          teamDid: teamDid ?? nodeInfo.did,
        },
        delay: 10,
      });
    } else {
      // eslint-disable-next-line no-lonely-if
      if (!isResend && !props.pushOnly) {
        updateNotificationSendStatus({
          ...commonParams,
          receivers: [receiverDid],
          channel: NOTIFICATION_SEND_CHANNEL.PUSH,
          status: NOTIFICATION_SEND_STATUS.FAILED,
          failedReason: !pushEnabled
            ? NOTIFICATION_SEND_FAILED_REASON.USER_DISABLED
            : NOTIFICATION_SEND_FAILED_REASON.CHANNEL_DISABLED,
        });
      }
    }
  };

  const insertToWalletPushQueue = (props, nodeInfo, isResend) => {
    const { channels, notification, sender, userInfo, teamDid, options = {}, source } = props;

    const receiverDid = userInfo.did;

    const commonParams = {
      node,
      teamDid: teamDid ?? nodeInfo.did,
      notificationId: notification.id,
    };

    const walletEnabled = get(userInfo, 'extra.notifications.wallet', true);
    if (walletEnabled && channels.includes(NOTIFICATION_SEND_CHANNEL.WALLET)) {
      logger.info('Insert to wallet push queue', {
        notificationId: notification.id,
        receiver: receiverDid,
      });
      walletPushQueue.push({
        job: {
          notification,
          sender,
          options,
          receiver: receiverDid,
          isResend,
          pushOnly: props.pushOnly && !isResend,
          source,
          teamDid: teamDid ?? nodeInfo.did,
        },
        delay: 5,
      });
    } else {
      // 如果是重发的消息，只需要更新推送状态，不需要更新 channel状态
      // eslint-disable-next-line no-lonely-if
      if (!isResend && !props.pushOnly) {
        updateNotificationSendStatus({
          ...commonParams,
          receivers: [receiverDid],
          channel: NOTIFICATION_SEND_CHANNEL.WALLET,
          status: NOTIFICATION_SEND_STATUS.FAILED,
          failedReason: !walletEnabled
            ? NOTIFICATION_SEND_FAILED_REASON.USER_DISABLED
            : NOTIFICATION_SEND_FAILED_REASON.CHANNEL_DISABLED,
        });
      }
    }
  };

  const insertToNotificationReceiver = async (nodeInfo, userInfo, teamDid, notificationId) => {
    const receiverDid = userInfo.did;

    const receiverInstance = {
      receiver: receiverDid,
      notificationId,
    };

    const emailEnabled = get(userInfo, 'extra.notifications.email', true);
    const email = userInfo?.email;

    if (emailEnabled && email) {
      receiverInstance.email = email;
    }
    const isServer = teamDid === nodeInfo.did;

    let webhooks = get(userInfo, 'extra.webhooks', []);
    if (isServer) {
      webhooks = await getServerWebhooks();
    }
    const webhookMap = new Map();
    webhooks.forEach((webhook) => {
      if (!webhookMap.has(webhook.url)) {
        webhookMap.set(webhook.url, webhook.type ?? 'api');
      }
    });

    if (webhookMap.size > 0) {
      receiverInstance.webhookUrls = Array.from(webhookMap.keys()).join('#');
    }

    await node.createNotificationReceiver({
      teamDid,
      receiverInstance,
    });
  };

  /**
   * job 格式
   * {
   *   channels: 需要发送到的 channels,
   *   notification: {},
   *   receivers: 接收的 receiver 列表
   * }
   */
  const queue = createNotificationQueue('notification-receivers', {}, async (job) => {
    const { teamDid, channels, receiver, sender, notification, nodeInfo, ...rest } = job;

    logger.info('notification start insert to queue', {
      teamDid,
      notificationId: notification.id,
      receiver,
    });
    try {
      const selection = {
        did: 1,
        fullName: 1,
        email: 1,
        extra: 1,
      };
      const userInfo = await node.getUser({
        teamDid,
        user: { did: receiver },
        options: { enableConnectedAccount: true, selection, includePassports: false, includeConnectedAccounts: false },
      });
      if (!userInfo) {
        throw new Error(`Invalid receiver user: ${receiver}`);
      }

      // FIXME: @liushuang: notification.id.startsWith('NOTIF-') HACK 的处理方式，是一个兜底行为。
      // notificationId：存在为空的情况，比如 connect, hi，passthrough 消息时，是没有 id, 此时 pushOnly 为 true
      // 为了避免在这里非 db 生成的ID进入插入操作，这里使用一个标识，避免插入脏数据

      // 不在队列内生成 notificationId 的原因是避免队列重复执行导致相同消息生成不同ID
      if (!job.pushOnly && !notification.id.startsWith('NOTIF-')) {
        // 如果添加失败，那么需要终止执行推送
        await insertToNotificationReceiver(nodeInfo, userInfo, teamDid, notification.id, channels);
        logger.info('notification receiver created successfully', {
          notificationId: notification.id,
          receiver,
        });
        // websocket 通知
        const receiverDid = userInfo.did;
        websocketQueue.push({
          input: {
            notification: {
              ...notification,
              entityType: rest.entityType,
              entityId: rest.entityId,
              componentDid: rest.componentDid,
              source: rest.source,
              createdAt: rest.createdAt,
              ...(rest.actorInfo ? { actorInfo: rest.actorInfo } : {}),
            },
            receiver: receiverDid,
            teamDid,
            isServices: rest.isServices,
          },
        });
      }

      notification.type = notification.type || 'notification';

      const baseParams = {
        ...rest,
        teamDid,
        channels,
        receiver,
        sender,
        notification,
        userInfo,
        nodeInfo,
      };
      // 每个渠道之间的推送不会影响
      // 添加到 wallet 推送队列
      try {
        insertToWalletPushQueue(baseParams, nodeInfo, job.isExist);
      } catch (error) {
        logger.error('Failed to insert to wallet push queue', { error });
      }
      // 添加到 push 推送队列
      try {
        insertToPushKitPushQueue(baseParams, nodeInfo, job.isExist);
      } catch (error) {
        logger.error('Failed to insert to push kit push queue', { error });
      }

      // 添加到 email 推送队列
      try {
        insertToEmailPushQueue(baseParams, nodeInfo, job.isExist);
      } catch (error) {
        logger.error('Failed to insert to email push queue', { error });
      }

      //
      try {
        insertToWebhookPushQueue(baseParams, nodeInfo, job.isExist);
      } catch (error) {
        logger.error('Failed to insert to webhook push queue', { error });
      }
    } catch (error) {
      logger.error('Failed to create notification receiver', { error, notificationId: notification.id });
    }
  });

  // 监听 notification_create 事件
  eventHub.on(EVENTS.NOTIFICATION_CREATE_QUEUED, async (data) => {
    // Only first worker process handle blocklet event
    try {
      logger.info('notification start insert to queue:', {
        teamDid: data?.teamDid,
        notificationId: data?.notification?.id,
      });
      if (isWorkerInstance()) {
        return;
      }
      if (!data.notification) {
        throw new Error('Invalid notification: notification is required');
      }
      const nodeInfo = await node.getNodeInfo({ useCache: true });

      if (nodeInfo.mode !== NODE_MODES.DEBUG) {
        await validateNotification(data.notification);
      }

      // 按照 receiver 添加到推送队列
      const { receivers, teamDid, channels, notification, ...rest } = data;

      const sender =
        data.sender ??
        Object.freeze({
          appDid: teamDid || nodeInfo.did,
          appSk: nodeInfo.sk,
          verified: true,
          type: 'server',
        });

      if (receivers.length === 0) {
        throw new Error('No users found');
      }
      // 如果 notification 没有 id，则生成一个, wallet 要基于这唯一个ID进行处理
      // 同时避免 queue 重复导致的 id 重复问题
      // 需要在 queue 中区分这个 notificationId 是否存在数据库中，如果不存在，则不进行插入
      // 不存在 notificationId 的情况，是发送 connect, hi，passthrough 消息时，没有 id 的情况
      if (!notification.id) {
        // 按照逻辑，如果ID不存在的时候，pushOnly 一定为 true，为了避免出现问题，这里使用一个标识，避免插入脏数据
        notification.id = `NOTIF-${nanoid()}`;
      }

      receivers.forEach((receiverDid) => {
        queue.push({
          ...rest,
          notification,
          teamDid,
          channels,
          receiver: receiverDid,
          sender,
          nodeInfo,
        });
      });
    } catch (error) {
      logger.error('Failed to create notification receiver', {
        error,
        notificationId: data?.notification?.id,
        teamDid: data?.teamDid,
      });
    }
  });
};

module.exports = { init };
