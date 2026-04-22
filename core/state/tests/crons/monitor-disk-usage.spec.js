const { test, describe, expect, mock, afterEach, afterAll } = require('bun:test');

mock.module('../../lib/states', () => ({
  notification: { create: mock(() => {}) },
  node: {
    read: mock(() => ({
      diskAlertThreshold: 80,
      routing: { adminPath: '/admin' },
    })),
  },
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { DISK_ALERT_THRESHOLD_PERCENT } = require('@abtnode/constant');
const info = require('../../lib/util/sysinfo');
const states = require('../../lib/states');

const { check, getCron } = require('../../lib/crons/monitor-disk-usage');

describe('monitor-disk-usage', () => {
  const teamManager = {
    createNotification: mock(),
  };

  afterEach(() => {
    mock.clearAllMocks();
    states.node.read = mock(() => ({
      diskAlertThreshold: DISK_ALERT_THRESHOLD_PERCENT,
      routing: { adminPath: '/admin' },
    }));
  });

  describe('get', () => {
    test('should send alarm if exceeds threshold', async () => {
      info.getSysInfo = mock(() => ({
        disks: [
          {
            used: undefined, // undefined / 0 = NaN, 不发送报警
            total: 1,
          },
          {
            used: (DISK_ALERT_THRESHOLD_PERCENT - 1) / 100, // 阈值以下, 不发送报警
            total: 1,
          },
          {
            used: DISK_ALERT_THRESHOLD_PERCENT / 100, // 等于阈值, 发送报警
            total: 1,
          },
          {
            used: (DISK_ALERT_THRESHOLD_PERCENT + 1) / 100, // 阈值以上，发送报警
            total: 1,
          },
        ],
      }));

      await check(teamManager);
      expect(teamManager.createNotification.mock.calls.length).toEqual(2);
    });

    test('should not send alarm if usage ratio is NaN', async () => {
      info.getSysInfo = mock().mockResolvedValue({
        disks: [
          {
            used: undefined, // undefined / 0 = NaN
            total: 0,
          },
        ],
      });

      await check(teamManager);
      expect(teamManager.createNotification.mock.calls.length).toEqual(0);
    });

    test('should not send alarm if not exceeds threshold', async () => {
      info.getSysInfo = mock(() => ({
        disks: [
          {
            used: (DISK_ALERT_THRESHOLD_PERCENT - 1) / 100,
            total: 1,
          },
          {
            used: (DISK_ALERT_THRESHOLD_PERCENT - 2) / 100,
            total: 1,
          },
        ],
      }));

      await check(teamManager);
      expect(teamManager.createNotification.mock.calls.length).toEqual(0);
    });
  });

  describe('getCron', () => {
    test('should return correct properties', () => {
      const result = getCron();
      expect(result.name).toEqual('monitor-disk-usage');
      expect(result.time).toEqual('0 5 * * * *');
      expect(typeof result.fn).toEqual('function');
      expect(result.options).toEqual({ runOnInit: true });
    });
  });
});
