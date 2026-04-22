/* eslint-disable global-require */
const { describe, expect, beforeEach, mock, spyOn, test, afterAll } = require('bun:test');

mock.module('../../../lib/manager', () => ({
  checkRunning: mock().mockResolvedValue(true),
}));

const mockPublishEvent = mock().mockResolvedValue();
mock.module('../../../lib/node', () => ({
  getNode: mock().mockResolvedValue({
    node: {},
    publishEvent: mockPublishEvent,
  }),
}));

mock.module('../../../lib/util', () => ({
  printError: mock().mockImplementation(() => {}),
  printInfo: mock().mockImplementation(() => {}),
  printSuccess: mock().mockImplementation(() => {}),
  getCLIBinaryName: mock().mockReturnValue('blocklet'),
}));

const mockAppDid = 'z8iZqgNX5YzAVkE3qitX4BkwdpBKGxtqhzaW';
const mockDid = {
  isValid: mock().mockImplementation((did) => did === mockAppDid),
  toAddress: mock().mockReturnValue(mockAppDid),
};
mock.module('@arcblock/did', () => mockDid);

mock.module('@blocklet/constant', () => ({
  BlockletEvents: { removed: 'blocklet:removed' },
}));

mock.module('inquirer', () => ({
  prompt: mock().mockResolvedValue({ confirmDelete: true }),
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { checkRunning } = require('../../../lib/manager');
const { getNode } = require('../../../lib/node');
const util = require('../../../lib/util');
const deleteCmd = require('../../../lib/commands/blocklet/delete');

// node.onReady(callback) is not awaited in the source code (fire-and-forget pattern),
// so we need to capture the callback promise and await it in tests.
const flush = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

describe('command.blocklet.delete', () => {
  let mockDeleteBlocklet;
  let mockGetBlocklet;

  beforeEach(() => {
    mock.clearAllMocks();

    checkRunning.mockResolvedValue(true);

    mockDeleteBlocklet = mock().mockResolvedValue({
      meta: { did: mockAppDid, title: 'Test Blocklet', name: 'test-blocklet', version: '1.0.0' },
    });
    mockGetBlocklet = mock().mockResolvedValue({
      meta: { did: mockAppDid, title: 'Test Blocklet', name: 'test-blocklet', version: '1.0.0' },
    });

    mockPublishEvent.mockResolvedValue();

    getNode.mockResolvedValue({
      node: {
        onReady: async (cb) => {
          await cb();
        },
        getBlocklet: mockGetBlocklet,
        deleteBlocklet: mockDeleteBlocklet,
      },
      publishEvent: mockPublishEvent,
    });
  });

  test('should exit if blocklet server is not running', async () => {
    checkRunning.mockResolvedValue(false);
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});

    await deleteCmd.run({ appDid: mockAppDid, yes: true });

    expect(util.printError).toHaveBeenCalledWith('Blocklet Server is not running!');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('should exit if --app-did is not provided', async () => {
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});

    await deleteCmd.run({ yes: true });

    expect(util.printError).toHaveBeenCalledWith('Please provide --app-did');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('should exit if appDid is invalid', async () => {
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});

    await deleteCmd.run({ appDid: 'invalid-did', yes: true });

    expect(util.printError).toHaveBeenCalledWith(expect.stringContaining('is not valid'));
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('should exit if blocklet not found', async () => {
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
    mockGetBlocklet.mockResolvedValue(null);
    getNode.mockResolvedValue({
      node: {
        onReady: async (cb) => {
          await cb();
        },
        getBlocklet: mockGetBlocklet,
        deleteBlocklet: mockDeleteBlocklet,
      },
      publishEvent: mockPublishEvent,
    });

    await deleteCmd.run({ appDid: mockAppDid, yes: true });
    await flush();

    expect(util.printError).toHaveBeenCalledWith(`Blocklet ${mockAppDid} not found`);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('should delete blocklet with --yes flag', async () => {
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});

    await deleteCmd.run({ appDid: mockAppDid, yes: true });
    await flush();

    expect(mockDeleteBlocklet).toHaveBeenCalledWith({
      did: mockAppDid,
      keepData: false,
      keepLogsDir: false,
      keepConfigs: false,
    });
    expect(mockPublishEvent).toHaveBeenCalledWith('blocklet:removed', {
      blocklet: expect.objectContaining({ meta: expect.objectContaining({ did: mockAppDid }) }),
      context: { keepRouting: false },
    });
    expect(util.printSuccess).toHaveBeenCalledWith(expect.stringContaining('has been deleted'));
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  test('should pass keepData and keepConfigs when --keep-data is set', async () => {
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});

    await deleteCmd.run({ appDid: mockAppDid, yes: true, keepData: true });
    await flush();

    expect(mockDeleteBlocklet).toHaveBeenCalledWith({
      did: mockAppDid,
      keepData: true,
      keepLogsDir: false,
      keepConfigs: true,
    });
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  test('should handle delete failure gracefully', async () => {
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
    mockDeleteBlocklet.mockRejectedValue(new Error('Blocklet is protected from accidental deletion'));
    getNode.mockResolvedValue({
      node: {
        onReady: async (cb) => {
          await cb();
        },
        getBlocklet: mockGetBlocklet,
        deleteBlocklet: mockDeleteBlocklet,
      },
      publishEvent: mockPublishEvent,
    });

    await deleteCmd.run({ appDid: mockAppDid, yes: true });
    await flush();

    expect(util.printError).toHaveBeenCalledWith(expect.stringContaining('Delete failed'));
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
