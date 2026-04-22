export const NOTIFICATION_SEND_STATUS = {
  PENDING: 0, // pending send
  SENT: 1, // sent
  FAILED: 2, // send failed
};

export const NOTIFICATION_SEND_FAILED_REASON = {
  USER_DISABLED: 'user_disabled', // user has not enabled this channel
  CHANNEL_UNAVAILABLE: 'channel_unavailable', // service not enabled
  CHANNEL_DISABLED: 'channel_disabled', // developer has not selected this channel
  NOT_ONLINE: 'not_online', // user is not online — wallet channel only
};

export const NOTIFICATION_SEND_CHANNEL = {
  WALLET: 'app',
  EMAIL: 'email',
  PUSH: 'push',
  WEBHOOK: 'webhook',
};

export const WEBHOOK_CONSECUTIVE_FAILURES_THRESHOLD = 50;
