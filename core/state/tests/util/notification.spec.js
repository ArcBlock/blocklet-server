const { describe, test, expect } = require('bun:test');
const { NOTIFICATION_SEND_STATUS, NOTIFICATION_SEND_CHANNEL } = require('@abtnode/constant');
const { checkPushChannelAvailable, getNotificationPushState } = require('../../lib/util/notification');

describe('notification util', () => {
  describe('checkPushChannelAvailable', () => {
    test('should return correct channel availability based on blocklet settings', () => {
      // 默认的配置
      const emptyBlocklet = {};
      const emptyResult = checkPushChannelAvailable(emptyBlocklet);
      expect(emptyResult[NOTIFICATION_SEND_CHANNEL.WALLET].enabled).toBe(true);
      expect(emptyResult[NOTIFICATION_SEND_CHANNEL.PUSH].enabled).toBe(false);
      expect(emptyResult[NOTIFICATION_SEND_CHANNEL.EMAIL].enabled).toBe(false);
      expect(emptyResult[NOTIFICATION_SEND_CHANNEL.WEBHOOK].enabled).toBe(true);

      // 完整配置时
      const configuredBlocklet = {
        settings: {
          notification: {
            pushKit: {
              enabled: true,
              endpoint: 'https://push.example.com',
            },
            email: {
              enabled: true,
            },
          },
        },
      };
      const configuredResult = checkPushChannelAvailable(configuredBlocklet);
      expect(configuredResult[NOTIFICATION_SEND_CHANNEL.WALLET].enabled).toBe(true);
      expect(configuredResult[NOTIFICATION_SEND_CHANNEL.PUSH].enabled).toBe(true);
      expect(configuredResult[NOTIFICATION_SEND_CHANNEL.EMAIL].enabled).toBe(true);
      expect(configuredResult[NOTIFICATION_SEND_CHANNEL.WEBHOOK].enabled).toBe(true);

      // isServer = true 时，只返回 wallet 和 webhook
      const serverResult = checkPushChannelAvailable(configuredBlocklet, true);
      expect(serverResult[NOTIFICATION_SEND_CHANNEL.WALLET].enabled).toBe(true);
      expect(serverResult[NOTIFICATION_SEND_CHANNEL.PUSH]).toBeUndefined();
      expect(serverResult[NOTIFICATION_SEND_CHANNEL.EMAIL]).toBeUndefined();
      expect(serverResult[NOTIFICATION_SEND_CHANNEL.WEBHOOK].enabled).toBe(true);
    });
  });

  describe('getNotificationPushState', () => {
    test('should return correct statistics for wallet channel', () => {
      const results = [
        {
          walletSendStatus: NOTIFICATION_SEND_STATUS.SENT,
          walletSendAt: '2024-01-01T10:00:00Z',
          walletSendFailedReason: '',
          pushKitSendStatus: NOTIFICATION_SEND_STATUS.PENDING,
          pushKitSendAt: null,
          pushKitSendFailedReason: '',
          emailSendStatus: NOTIFICATION_SEND_STATUS.PENDING,
          emailSendAt: null,
          emailSendFailedReason: '',
          webhook: {
            'https://webhook1.example.com': [
              {
                status: NOTIFICATION_SEND_STATUS.SENT,
                sendAt: '2024-01-01T10:00:00Z',
                type: 'webhook',
                failedReason: '',
              },
            ],
          },
        },
        {
          walletSendStatus: NOTIFICATION_SEND_STATUS.SENT,
          walletSendAt: '2024-01-01T09:00:00Z',
          walletSendFailedReason: '',
          pushKitSendStatus: NOTIFICATION_SEND_STATUS.SENT,
          pushKitSendAt: '2024-01-01T09:00:00Z',
          pushKitSendFailedReason: '',
          emailSendStatus: NOTIFICATION_SEND_STATUS.FAILED,
          emailSendAt: '2024-01-01T09:00:00Z',
          emailSendFailedReason: 'Email service error',
          webhook: {
            'https://webhook2.example.com': [
              {
                status: NOTIFICATION_SEND_STATUS.FAILED,
                sendAt: '2024-01-01T09:00:00Z',
                type: 'webhook',
                failedReason: 'Connection timeout',
              },
            ],
          },
        },
        {
          walletSendStatus: NOTIFICATION_SEND_STATUS.PENDING,
          walletSendAt: null,
          walletSendFailedReason: '',
          pushKitSendStatus: NOTIFICATION_SEND_STATUS.PENDING,
          pushKitSendAt: null,
          pushKitSendFailedReason: 'Push Kit Service is not Enabled.',
          emailSendStatus: NOTIFICATION_SEND_STATUS.PENDING,
          emailSendAt: null,
          emailSendFailedReason: '',
          webhook: {},
        },
      ];

      const channelsAvailable = {
        [NOTIFICATION_SEND_CHANNEL.WALLET]: { enabled: true },
        [NOTIFICATION_SEND_CHANNEL.PUSH]: { enabled: true },
        [NOTIFICATION_SEND_CHANNEL.EMAIL]: { enabled: true },
        [NOTIFICATION_SEND_CHANNEL.WEBHOOK]: { enabled: true },
      };

      const result = getNotificationPushState(results, channelsAvailable);

      // 验证 wallet 统计
      expect(result.wallet.enabled).toBe(true);
      expect(result.wallet.state.total).toBe(3);
      expect(result.wallet.state.success).toBe(2);
      expect(result.wallet.state.ignored).toBe(1);
      expect(result.wallet.state.failed).toBe(0);
      expect(result.wallet.last.sendAt).toBe('2024-01-01T10:00:00Z');
      expect(result.wallet.last.sendStatus).toBe('success');

      // 验证 pushKit 统计
      expect(result.pushKit.enabled).toBe(true);
      expect(result.pushKit.state.total).toBe(3);
      expect(result.pushKit.state.success).toBe(1);
      expect(result.pushKit.state.ignored).toBe(2);
      expect(result.pushKit.state.failed).toBe(0);

      // 验证 email 统计
      expect(result.email.enabled).toBe(true);
      expect(result.email.state.total).toBe(3);
      expect(result.email.state.success).toBe(0);
      expect(result.email.state.ignored).toBe(2);
      expect(result.email.state.failed).toBe(1);

      // 验证 webhook 统计
      expect(result.webhook.enabled).toBe(true);
      expect(result.webhook.state.total).toBe(2);
      expect(result.webhook.state.success).toBe(1);
      expect(result.webhook.state.failed).toBe(1);
      expect(result.webhook.state.ignored).toBe(0);
      expect(result.webhook.last.sendAt).toBe('2024-01-01T10:00:00Z');
      expect(result.webhook.last.sendStatus).toBe('success');

      // isServer = true 时，只返回 wallet 和 webhook
      const serverChannelsAvailable = {
        [NOTIFICATION_SEND_CHANNEL.WALLET]: { enabled: true },
        [NOTIFICATION_SEND_CHANNEL.WEBHOOK]: { enabled: true },
      };
      const serverResult = getNotificationPushState(results, serverChannelsAvailable, true);
      expect(serverResult.wallet).toBeDefined();
      expect(serverResult.webhook).toBeDefined();
      expect(serverResult.pushKit).toBeUndefined();
      expect(serverResult.email).toBeUndefined();
    });

    test('should handle multiple webhook URLs correctly', () => {
      const results = [
        {
          walletSendStatus: NOTIFICATION_SEND_STATUS.SENT,
          walletSendAt: '2024-01-01T10:00:00Z',
          walletSendFailedReason: '',
          pushKitSendStatus: NOTIFICATION_SEND_STATUS.SENT,
          pushKitSendAt: '2024-01-01T10:00:00Z',
          pushKitSendFailedReason: '',
          emailSendStatus: NOTIFICATION_SEND_STATUS.SENT,
          emailSendAt: '2024-01-01T10:00:00Z',
          emailSendFailedReason: '',
          webhook: {
            'https://webhook1.example.com': [
              {
                status: NOTIFICATION_SEND_STATUS.SENT,
                sendAt: '2024-01-01T10:00:00Z',
                type: 'webhook',
                failedReason: '',
              },
            ],
            'https://webhook2.example.com': [
              {
                status: NOTIFICATION_SEND_STATUS.SENT,
                sendAt: '2024-01-01T10:00:00Z',
                type: 'webhook',
                failedReason: '',
              },
            ],
            'https://webhook3.example.com': [
              {
                status: NOTIFICATION_SEND_STATUS.FAILED,
                sendAt: '2024-01-01T10:00:00Z',
                type: 'webhook',
                failedReason: 'Connection error',
              },
            ],
          },
        },
      ];

      const channelsAvailable = {
        [NOTIFICATION_SEND_CHANNEL.WALLET]: { enabled: true },
        [NOTIFICATION_SEND_CHANNEL.PUSH]: { enabled: false },
        [NOTIFICATION_SEND_CHANNEL.EMAIL]: { enabled: false },
        [NOTIFICATION_SEND_CHANNEL.WEBHOOK]: { enabled: true },
      };

      const result = getNotificationPushState(results, channelsAvailable);

      // 验证 webhook 统计
      expect(result.webhook.state.total).toBe(3);
      expect(result.webhook.state.success).toBe(2);
      expect(result.webhook.state.failed).toBe(1);
      expect(result.webhook.state.ignored).toBe(0);
    });

    test('should sort webhook records by sendAt and use the latest', () => {
      const results = [
        {
          walletSendStatus: NOTIFICATION_SEND_STATUS.SENT,
          walletSendAt: '2024-01-01T10:00:00Z',
          walletSendFailedReason: '',
          pushKitSendStatus: NOTIFICATION_SEND_STATUS.SENT,
          pushKitSendAt: '2024-01-01T10:00:00Z',
          pushKitSendFailedReason: '',
          emailSendStatus: NOTIFICATION_SEND_STATUS.SENT,
          emailSendAt: '2024-01-01T10:00:00Z',
          emailSendFailedReason: '',
          webhook: {
            'https://webhook1.example.com': [
              {
                status: NOTIFICATION_SEND_STATUS.SENT,
                sendAt: '2024-01-01T11:00:00Z',
                type: 'webhook',
                failedReason: '',
              },
              {
                status: NOTIFICATION_SEND_STATUS.FAILED,
                sendAt: '2024-01-01T10:00:00Z',
                type: 'webhook',
                failedReason: 'Old failed attempt',
              },
            ],
          },
        },
      ];

      const channelsAvailable = {
        [NOTIFICATION_SEND_CHANNEL.WALLET]: { enabled: true },
        [NOTIFICATION_SEND_CHANNEL.PUSH]: { enabled: true },
        [NOTIFICATION_SEND_CHANNEL.EMAIL]: { enabled: true },
        [NOTIFICATION_SEND_CHANNEL.WEBHOOK]: { enabled: true },
      };

      const result = getNotificationPushState(results, channelsAvailable);

      // 应该使用最新的记录（status 为 SENT）
      expect(result.webhook.state.total).toBe(1);
      expect(result.webhook.state.success).toBe(1);
      expect(result.webhook.state.failed).toBe(0);
      expect(result.webhook.last.sendAt).toBe('2024-01-01T11:00:00Z');
      expect(result.webhook.last.sendStatus).toBe('success');
    });
  });
});
