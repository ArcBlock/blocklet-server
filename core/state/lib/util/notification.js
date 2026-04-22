const { joinURL } = require('ufo');
const isUrl = require('is-url');
const omit = require('lodash/omit');
const groupBy = require('lodash/groupBy');
const {
  NOTIFICATION_SEND_STATUS,
  NOTIFICATION_SEND_CHANNEL,
  NOTIFICATION_SEND_FAILED_REASON,
} = require('@abtnode/constant');

const REMOVE_FIELDS = [
  'description',
  'createdAt',
  'sender',
  'receiver',
  'entityType',
  'entityId',
  'action',
  'read',
  'componentDid',
  'source',
  'severity',
  'receivers',
  'options',
];

// eslint-disable-next-line import/prefer-default-export
function transformNotification(notification, origin = '') {
  const removeFields =
    notification.type !== 'feed' || !notification.feedType ? [...REMOVE_FIELDS, 'data', 'feedType'] : REMOVE_FIELDS;

  const actions = (notification.actions ?? []).map((action) => {
    if (!action.link || isUrl(action.link)) {
      return action;
    }
    return {
      ...action,
      link: joinURL(origin, action.link),
    };
  });

  const result = {
    ...omit(notification, removeFields),
    actions,
    body: notification.description,
    severity: notification.severity === 'info' ? 'normal' : notification.severity,
  };

  // 移除空对象字段。“”, [], {}
  Object.keys(result).forEach((key) => {
    const value = result[key];
    if (
      value === '' ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)
    ) {
      delete result[key];
    }
  });

  return result;
}

function getStatusCounts(receivers, statusField) {
  return {
    pending: receivers.filter((item) => item[statusField] === NOTIFICATION_SEND_STATUS.PENDING).length,
    success: receivers.filter((item) => item[statusField] === NOTIFICATION_SEND_STATUS.SENT).length,
    failed: receivers.filter((item) => item[statusField] === NOTIFICATION_SEND_STATUS.FAILED).length,
  };
}

function getEmailStatics(receivers) {
  const groupByEmail = groupBy(receivers, 'email');
  const emailList = Object.keys(groupByEmail).filter((email) => !!email);
  return {
    total: emailList.length,
    pending: emailList.filter((email) => groupByEmail[email].some((item) => item.emailSendStatus === 0)).length,
    success: emailList.filter((email) => groupByEmail[email].every((item) => item.emailSendStatus === 1)).length,
    failed: emailList.filter((email) => groupByEmail[email].every((item) => item.emailSendStatus === 2)).length,
  };
}

function getWebhookStatusCounts(receivers) {
  const result = {
    total: 0,
    pending: [],
    success: [],
    failed: [],
  };

  receivers.forEach((receiver) => {
    const { webhook } = receiver;
    if (typeof webhook !== 'object' || Object.keys(webhook).length === 0) {
      return;
    }
    const entries = Object.entries(webhook);
    result.total += entries.length;

    entries.forEach(([url, values]) => {
      // 取最新的记录
      const value = values[0];
      switch (value.status) {
        case NOTIFICATION_SEND_STATUS.PENDING:
          result.pending.push(url);
          break;
        case NOTIFICATION_SEND_STATUS.SENT:
          result.success.push(url);
          break;
        case NOTIFICATION_SEND_STATUS.FAILED:
          result.failed.push(url);
          break;
        default:
          break;
      }
    });
  });

  return result;
}

function getReceiversStatistics(receivers) {
  const receiverLength = receivers.length;
  return {
    total: receiverLength,
    wallet: {
      total: receiverLength,
      ...getStatusCounts(receivers, 'walletSendStatus'),
    },
    email: getEmailStatics(receivers),
    push: {
      total: receiverLength,
      ...getStatusCounts(receivers, 'pushKitSendStatus'),
    },
    webhook: getWebhookStatusCounts(receivers),
  };
}

/**
 * 检测消息推送渠道是否开启
 */
function checkPushChannelAvailable(blocklet = {}, isServer = false) {
  const config = blocklet.settings?.notification || {};

  const pushKitEnabled = config.pushKit?.enabled && config.pushKit?.endpoint;
  const emailEnabled = config.email?.enabled;

  return {
    [NOTIFICATION_SEND_CHANNEL.WALLET]: {
      enabled: true,
    },
    ...(isServer
      ? {}
      : {
          [NOTIFICATION_SEND_CHANNEL.PUSH]: {
            enabled: !!pushKitEnabled,
          },
          [NOTIFICATION_SEND_CHANNEL.EMAIL]: {
            enabled: emailEnabled || false,
          },
        }),
    [NOTIFICATION_SEND_CHANNEL.WEBHOOK]: {
      enabled: true,
    },
  };
}

function getColumnField(channel, suffix) {
  switch (channel) {
    case NOTIFICATION_SEND_CHANNEL.WALLET:
      return `wallet${suffix}`;
    case NOTIFICATION_SEND_CHANNEL.PUSH:
      return `pushKit${suffix}`;
    case NOTIFICATION_SEND_CHANNEL.EMAIL:
      return `email${suffix}`;
    default:
      return '';
  }
}

const SEND_STATUS_MAP = {
  [NOTIFICATION_SEND_STATUS.PENDING]: 'pending',
  [NOTIFICATION_SEND_STATUS.SENT]: 'success',
  [NOTIFICATION_SEND_STATUS.FAILED]: 'failed',
};

function getFailedReasonMessage(reason, channel) {
  if (!reason || !channel) {
    return reason;
  }
  switch (reason) {
    case NOTIFICATION_SEND_FAILED_REASON.USER_DISABLED:
      return `The user has disabled the notification for the "${channel}" channel.`;
    case NOTIFICATION_SEND_FAILED_REASON.CHANNEL_UNAVAILABLE:
      return `The "${channel}" channel is not available.`;
    case NOTIFICATION_SEND_FAILED_REASON.CHANNEL_DISABLED:
      return `The "${channel}" channel was not selected for this notification.`;
    case NOTIFICATION_SEND_FAILED_REASON.NOT_ONLINE:
      return 'The user is not online.';
    default:
      return reason;
  }
}

function getStatisticsState(results, channel = NOTIFICATION_SEND_CHANNEL.WALLET) {
  const last = results[0];

  const getIgnoredAndFailedCount = (data) => {
    const notSuccessCount = data.filter(
      (item) => item[getColumnField(channel, 'SendStatus')] !== NOTIFICATION_SEND_STATUS.SENT
    ).length;
    const ignoredCount = data.filter(
      (item) =>
        item[getColumnField(channel, 'SendStatus')] !== NOTIFICATION_SEND_STATUS.SENT &&
        (item[getColumnField(channel, 'SendStatus')] === NOTIFICATION_SEND_STATUS.PENDING ||
          [
            ...Object.values(NOTIFICATION_SEND_FAILED_REASON),
            'Email Service is not available.',
            'Push Kit Service is not Enabled.',
          ].includes(item[getColumnField(channel, 'SendFailedReason')]))
    ).length;

    return {
      ignored: ignoredCount,
      failed: notSuccessCount - ignoredCount,
    };
  };

  return {
    last: {
      sendAt: last[getColumnField(channel, 'SendAt')],
      sendStatus: SEND_STATUS_MAP[last[getColumnField(channel, 'SendStatus')]],
      reason: getFailedReasonMessage(last[getColumnField(channel, 'SendFailedReason')], channel),
    },
    state: {
      total: results.length,
      success: results.filter((item) => item[getColumnField(channel, 'SendStatus')] === NOTIFICATION_SEND_STATUS.SENT)
        .length,
      ...getIgnoredAndFailedCount(results),
    },
  };
}

function getWebhookStatisticsState(results) {
  // 收集所有 URL 的最新记录
  const latestRecords = [];

  const state = results.reduce(
    (acc, item) => {
      const webhook = item.webhook ?? {};
      Object.values(webhook).forEach((records) => {
        // 对每个 URL 的记录数组按 sendAt 倒序排列，取最新的
        const latestRecord = records.sort((a, b) => new Date(b.sendAt) - new Date(a.sendAt))[0];
        if (latestRecord) {
          latestRecords.push(latestRecord);
          acc.total++;
          if (latestRecord.status === NOTIFICATION_SEND_STATUS.SENT) {
            acc.success++;
          } else if (latestRecord.status === NOTIFICATION_SEND_STATUS.FAILED) {
            acc.failed++;
          } else if (latestRecord.status === NOTIFICATION_SEND_STATUS.PENDING) {
            acc.ignored++;
          }
        }
      });
      return acc;
    },
    {
      total: 0,
      success: 0,
      failed: 0,
      ignored: 0,
    }
  );

  // 从所有 URL 的最新记录中，找到最新的那个
  const lastWebhook = latestRecords.sort((a, b) => new Date(b.sendAt) - new Date(a.sendAt))[0];

  return {
    last: lastWebhook
      ? {
          sendAt: lastWebhook.sendAt,
          type: lastWebhook.type,
          sendStatus: SEND_STATUS_MAP[lastWebhook.status],
          reason: lastWebhook.failedReason,
        }
      : null,
    state,
  };
}

function getNotificationPushState(results, channelsAvailable, isServer = false) {
  return {
    wallet: {
      ...channelsAvailable[NOTIFICATION_SEND_CHANNEL.WALLET],
      ...getStatisticsState(results, NOTIFICATION_SEND_CHANNEL.WALLET),
    },
    ...(isServer
      ? {}
      : {
          pushKit: {
            ...channelsAvailable[NOTIFICATION_SEND_CHANNEL.PUSH],
            ...getStatisticsState(results, NOTIFICATION_SEND_CHANNEL.PUSH),
          },
          email: {
            ...channelsAvailable[NOTIFICATION_SEND_CHANNEL.EMAIL],
            ...getStatisticsState(results, NOTIFICATION_SEND_CHANNEL.EMAIL),
          },
        }),
    webhook: {
      ...channelsAvailable[NOTIFICATION_SEND_CHANNEL.WEBHOOK],
      ...getWebhookStatisticsState(results),
    },
  };
}

module.exports = {
  transformNotification,
  getStatusCounts,
  getWebhookStatusCounts,
  getReceiversStatistics,
  checkPushChannelAvailable,
  getNotificationPushState,
};
