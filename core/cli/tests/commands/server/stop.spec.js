/* eslint-disable import/order */
/* eslint-disable require-await */
const { describe, expect, test, mock, spyOn, afterAll, beforeEach } = require('bun:test');
const { SERVER_STATUS } = require('@abtnode/constant');
const { BLOCKLET_MODES, BlockletStatus } = require('@blocklet/constant');

process.env.NODE_ENV = 'test';

mock.module('../../../lib/util', () => ({
  printError: mock(),
  printInfo: mock(),
  printWarning: mock(),
  printSuccess: mock(),
  print: mock(),
  getCLICommandName: mock().mockReturnValue('blocklet server'),
  killPm2Process: mock().mockResolvedValue(),
  stopRouting: mock().mockResolvedValue({}),
}));
mock.module('../../../lib/manager', () => ({
  checkRunning: mock().mockResolvedValue(false),
}));
mock.module('@abtnode/router-provider', () => ({
  clearRouterByConfigKeyword: mock().mockResolvedValue(true),
  clearDockerContainer: mock().mockResolvedValue(),
  checkDockerInstalled: mock().mockResolvedValue(false),
}));
mock.module('@abtnode/util/lib/sleep', () => {
  return {
    __esModule: true,
    default: async () => {},
  };
});
mock.module('@abtnode/util/lib/pm2/async-pm2', () => ({
  killDaemonAsync: mock().mockResolvedValue(),
  listAsync: mock().mockResolvedValue([]),
}));
mock.module('../../ui', () => ({
  wrapSpinner: mock().mockImplementation((msg, fn) => fn()),
}));

// mock node
mock.module('../../../lib/node', () => ({
  getNode: mock().mockResolvedValue({
    node: {
      onReady: (cb) => cb(),
      getBlocklets: mock().mockResolvedValue([]),
      getNodeInfo: mock().mockResolvedValue({}),
      updateNodeStatus: mock(),
      stopBlocklet: mock(),
      dataDirs: { router: '/tmp/router' },
    },
    publishEvent: mock().mockResolvedValue(),
  }),
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const stop = require('../../../lib/commands/server/stop');
const util = require('../../../lib/util');
const { checkRunning } = require('../../../lib/manager');
const { getNode } = require('../../../lib/node');
const asyncPm2 = require('@abtnode/util/lib/pm2/async-pm2');

describe.serial('command.server.stop', () => {
  beforeEach(() => {
    mock.clearAllMocks();
    getNode.mockResolvedValue({
      node: {
        onReady: (cb) => cb(),
        getBlocklets: mock().mockResolvedValue([]),
        getNodeInfo: mock().mockResolvedValue({}),
        updateNodeStatus: mock(),
        stopBlocklet: mock(),
        dataDirs: { router: '/tmp/router' },
      },
      publishEvent: mock().mockResolvedValue(),
    });
  });

  describe('with mocked try-with-timeout (simulate timeout)', () => {
    test('should handle timeout during force stop (20s timeout)', async () => {
      const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
      util.printError.mockImplementation(() => {});
      util.printInfo.mockImplementation(() => {});
      util.getCLICommandName.mockReturnValue('blocklet server');
      spyOn(asyncPm2, 'killDaemonAsync').mockRejectedValue(new Error('test error'));

      await stop.run({ force: true });

      expect(util.printError).toHaveBeenCalledWith('Blocklet Server related processes stop failed: test error');
      expect(util.printInfo).toHaveBeenCalledWith(expect.stringContaining('blocklet server stop --force'));
      expect(mockExit).toHaveBeenCalledWith(0);
    });

    test('should handle timeout during normal stop (5min timeout)', async () => {
      const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
      checkRunning.mockResolvedValue(true);

      util.printError.mockImplementation(() => {});
      util.printInfo.mockImplementation(() => {});
      util.getCLICommandName.mockReturnValue('blocklet server');

      const mockNode = {
        onReady: () => {
          throw new Error('test error');
        },
        getBlocklets: mock().mockResolvedValue([]),
        getNodeInfo: mock().mockResolvedValue({}),
        updateNodeStatus: mock().mockRejectedValue('test error'),
        stopBlocklet: mock(),
        dataDirs: { router: '/tmp/router' },
      };

      getNode.mockResolvedValue({
        node: mockNode,
        publishEvent: mock(),
      });

      await stop.run({});

      expect(util.printError).toHaveBeenCalledWith('Blocklet Server failed to stop within 5 minutes');
      expect(util.printInfo).toHaveBeenCalledWith(expect.stringContaining('blocklet server stop --force'));
      expect(mockExit).toHaveBeenCalledWith(0);
    });
  });

  describe('with real try-with-timeout execution', () => {
    test('should exit process when force stop is successful', async () => {
      const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
      await stop.run({ force: true });
      expect(mockExit).toHaveBeenCalledWith(0);
    });

    test('should stop running blocklets and services', async () => {
      const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
      checkRunning.mockResolvedValue(true);

      const mockNode = {
        onReady: (cb) => cb(),
        getBlocklets: mock().mockResolvedValue([]),
        getNodeInfo: mock().mockResolvedValue({}),
        updateNodeStatus: mock(),
        stopBlocklet: mock(),
        dataDirs: { router: '/tmp/router' },
      };

      getNode.mockResolvedValue({
        node: mockNode,
        publishEvent: mock(),
      });

      await stop.run({});
      expect(mockNode.getBlocklets).toHaveBeenCalled();
      expect(mockNode.updateNodeStatus).toHaveBeenCalledWith(SERVER_STATUS.STOPPED);
      expect(mockExit).toHaveBeenCalledWith(0);
    });

    test('should handle running blocklets in dev mode', async () => {
      const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
      checkRunning.mockResolvedValue(true);

      const mockNode = {
        onReady: (cb) => cb(),
        getBlocklets: mock().mockResolvedValue({
          blocklets: [
            {
              mode: BLOCKLET_MODES.DEVELOPMENT,
              status: BlockletStatus.running,
              meta: { name: 'test-blocklet' },
            },
          ],
          paging: {},
        }),
        getNodeInfo: mock().mockResolvedValue({}),
        updateNodeStatus: mock(),
        dataDirs: { router: '/tmp/router' },
      };

      getNode.mockResolvedValue({
        node: mockNode,
        publishEvent: mock(),
      });

      util.printError.mockImplementation(() => {});

      await stop.run({});
      expect(mockNode.getBlocklets).toHaveBeenCalled();
      expect(util.printError).toHaveBeenCalledWith(expect.stringContaining('Unable to stop Blocklet Server'));
      expect(mockExit).toHaveBeenCalledWith(0);
    });

    test('should handle errors during stop process', async () => {
      const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
      checkRunning.mockResolvedValue(true);

      const mockNode = {
        onReady: (cb) => cb(),
        getBlocklets: mock().mockRejectedValue(new Error('test error')),
        getNodeInfo: mock().mockResolvedValue({}),
        updateNodeStatus: mock(),
        dataDirs: { router: '/tmp/router' },
      };

      getNode.mockResolvedValue({
        node: mockNode,
        publishEvent: mock(),
      });

      util.printWarning.mockImplementation(() => {});

      await stop.run({});

      expect(mockNode.getBlocklets).toHaveBeenCalled();
      expect(util.printWarning).toHaveBeenCalledWith('Blocklet processing skipped:', 'test error');
      expect(mockExit).toHaveBeenCalledWith(0);
    });
  });
});
