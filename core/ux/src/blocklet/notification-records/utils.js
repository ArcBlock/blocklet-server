import {
  NOTIFICATION_SEND_STATUS,
  NOTIFICATION_SEND_FAILED_REASON,
  NOTIFICATION_SEND_CHANNEL,
} from '@abtnode/constant';
import get from 'lodash/get';
import dayjs from '@abtnode/util/lib/dayjs';
import { formatToDatetime } from '../../util';

const getFailedReason = (t, channel, reason = '') => {
  if (!reason || !channel) {
    return '';
  }
  switch (reason) {
    case NOTIFICATION_SEND_FAILED_REASON.USER_DISABLED:
      return t('notification.sendStatus.reason.disabled', { channel });
    case NOTIFICATION_SEND_FAILED_REASON.CHANNEL_UNAVAILABLE:
      return t('notification.sendStatus.reason.unavailable', { channel });
    case NOTIFICATION_SEND_FAILED_REASON.CHANNEL_DISABLED:
      return t('notification.sendStatus.reason.notSent', { channel });
    case NOTIFICATION_SEND_FAILED_REASON.NOT_ONLINE:
      return t('notification.sendStatus.reason.offline');
    default:
      return reason;
  }
};

/**
 * 根据发送状态显示更加详细的内容
 * @param {Object} config 包含 status, updatedAt, reason 的对象
 * @param {Function} t 翻译函数
 * @param {String} locale 语言
 * @returns {String} {
 *  status: 状态图标 pending, success, failed
 *  title: 状态标题 未发送, 发送成功, 发送失败
 *  sentTime: 发送时间
 *  reason: 失败/未发送原因
 * }
 */
export function getStatusPreview(t, locale, config = {}) {
  const { status, updatedAt, reason = '', channel = 'wallet' } = config;
  const sentTime = updatedAt
    ? t('notification.sendStatus.sentTime', { date: formatToDatetime(updatedAt, locale) })
    : '';
  const failedReason = getFailedReason(t, channel, reason);

  if (status === NOTIFICATION_SEND_STATUS.FAILED) {
    return {
      status: 'failed',
      title: t('notification.sendStatus.failed'),
      sentTime,
      reason: failedReason,
    };
  }
  if (status === NOTIFICATION_SEND_STATUS.SENT) {
    return {
      status: 'success',
      title: t('notification.sendStatus.success'),
      sentTime,
    };
  }
  return {
    status: 'pending',
    title: t('notification.sendStatus.pending'),
    reason: failedReason,
    sentTime,
  };
}

export const sendStatusColor = {
  pending: '#aaaaaa',
  success: '#34BE74',
  failed: '#D0021B',
};

export const channels = ['wallet', 'pushKit', 'email'];

export const severities = ['info', 'success', 'error', 'warning'];

export const emailServiceAvailable = (blocklet) => {
  const { settings } = blocklet;
  return settings?.notification?.email?.enabled;
};

export const pushKitServiceAvailable = (blocklet) => {
  const { settings } = blocklet;
  return settings?.notification?.pushKit?.enabled;
};

export const canResendEmail = (blocklet, user) => {
  const emailEnabled = get(user, 'extra.notifications.email', true);
  return {
    available: emailServiceAvailable(blocklet),
    enabled: emailEnabled,
  };
};

export const canResendPushKit = (blocklet, user) => {
  const pushKitEnabled = get(user, 'extra.notifications.push', true);
  return {
    available: pushKitServiceAvailable(blocklet),
    enabled: pushKitEnabled,
  };
};

export const canResendWallet = (user) => {
  const walletEnabled = get(user, 'extra.notifications.wallet', true);
  return {
    enabled: walletEnabled,
  };
};

export const canResendWebhook = (user) => {
  const webhookEnabled = get(user, 'extra.webhooks', []);
  return {
    enabled: webhookEnabled.length > 0,
  };
};

export const delay = (time = 3) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time * 1000);
  });
};

export const getCheckList = (t, channel) => {
  if (channel === 'wallet' || channel === 'webhook') {
    return [
      {
        channel,
        type: 'enabled',
        pass: t('notification.sendStatus.reason.enabled', { channel }),
        fail: t('notification.sendStatus.reason.disabled', { channel }),
      },
    ];
  }
  if (channel === 'pushKit' || channel === 'email') {
    return [
      {
        channel,
        type: 'available',
        pass: t('notification.sendStatus.reason.available', { channel }),
        fail: t('notification.sendStatus.reason.unavailable', { channel }),
      },
      {
        channel,
        type: 'enabled',
        pass: t('notification.sendStatus.reason.enabled', { channel }),
        fail: t('notification.sendStatus.reason.disabled', { channel }),
      },
    ];
  }
  return [];
};

const countTodayRecords = (records = []) => {
  const today = dayjs().startOf('day');
  return records.filter((record) => dayjs(record.sendAt).isSame(today, 'day')).length;
};

export const getResendCount = (notificationReceiver, checkChannel = '') => {
  if (checkChannel && channels.includes(checkChannel)) {
    const field = `${checkChannel}SendRecord`;
    const records = get(notificationReceiver, field, []);
    return countTodayRecords(records);
  }
  // webhook
  const webhook = get(notificationReceiver, 'webhook', {});
  const webhookUrls = Object.keys(webhook ?? {}) ?? [];
  if (checkChannel && webhookUrls.includes(checkChannel)) {
    const record = webhook[checkChannel] ?? [];
    return countTodayRecords(record);
  }

  const result = {};

  // wallet, email, pushKit
  channels.forEach((channel) => {
    const field = `${channel}SendRecord`;
    const records = get(notificationReceiver, field, []);
    const count = countTodayRecords(records);

    result[channel] = count;
  });

  if (webhookUrls.length > 0) {
    webhookUrls.forEach((url) => {
      const record = webhook[url] ?? [];
      const count = countTodayRecords(record);
      result[url] = count;
    });
  }
  return result;
};

export const filterUpdate = (filterList, filterPos, index) => {
  if (!Array.isArray(filterList)) {
    throw new Error('Invalid filterList or index');
  }
  filterList[index].splice(filterPos, 1);
  return filterList;
};

export const filterLogic = (location, filters) => {
  if (!Array.isArray(filters)) {
    throw new Error('filters must be an array');
  }
  if (filters.length) return !filters.includes(location);
  return false;
};

export const getTitleByChannel = (channel) => {
  switch (channel) {
    case NOTIFICATION_SEND_CHANNEL.WALLET:
      return 'Wallet';
    case NOTIFICATION_SEND_CHANNEL.PUSH:
      return 'Push Kit';
    case NOTIFICATION_SEND_CHANNEL.EMAIL:
      return 'Email';
    case NOTIFICATION_SEND_CHANNEL.WEBHOOK:
      return 'Webhook';
    default:
      return '';
  }
};

// 修改 MUIDataTableFilter 和 MuiPopover 的样式
export const getMuiThemeOpts = () => ({
  components: {
    MUIDataTableFilter: {
      styleOverrides: {
        header: {
          marginBottom: 0,
          p: {
            margin: 0,
          },
        },
        root: {
          '& .MuiGrid-container': {
            marginTop: 0,
            '& .MuiGrid-item': {
              paddingTop: 0,
            },
          },
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        root: {
          '&.MuiPopover-root': {
            '& .MuiPaper-root:has(.filter-container)': {
              width: '420px', // 只修改筛选器的弹窗宽度
            },
          },
        },
      },
    },
  },
});
