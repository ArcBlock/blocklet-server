/* eslint-disable global-require */
const { describe, expect, beforeEach, mock, spyOn, test, afterAll } = require('bun:test');

// Mock @blocklet/meta/lib/util
mock.module('@blocklet/meta/lib/util', () => ({
  forEachBlockletSync: mock().mockImplementation((blocklet, callback) => {
    callback(blocklet, { id: blocklet.meta.did, ancestors: [] });
    (blocklet.children || []).forEach((child) => {
      callback(child, { id: child.meta.did, ancestors: [blocklet] });
    });
  }),
  getComponentName: mock().mockReturnValue('test-component'),
  getComponentMissingConfigs: mock().mockReturnValue([]),
}));

// Mock dotenv-flow
mock.module('dotenv-flow', () => {
  const mockEnvFiles = ['.env', '.env.development', '.env.development.local'];
  return {
    parse: mock().mockReturnValue({}),
    listFiles: mock().mockImplementation((dir) => {
      return mockEnvFiles.map((file) => `${dir}/${file}`);
    }),
    config: mock(),
  };
});

// Mock @arcblock/pm2
mock.module('@arcblock/pm2', () => ({
  connect: mock(),
  disconnect: mock(),
  list: mock().mockResolvedValue([]),
  describe: mock().mockResolvedValue({}),
  start: mock().mockResolvedValue({}),
  stop: mock().mockResolvedValue({}),
  delete: mock().mockResolvedValue({}),
  reload: mock().mockResolvedValue({}),
  launchBus: mock().mockImplementation((cb) =>
    cb(null, {
      on: mock(),
      off: mock(),
    })
  ),
}));

// Mock getComponentApiKey
mock.module('@abtnode/util/lib/blocklet', () => ({
  getComponentApiKey: mock().mockReturnValue('mock-api-key'),
}));

// Mock @blocklet/meta/lib/blocklet
mock.module('@blocklet/meta/lib/blocklet', () => ({
  getComponentsInternalInfo: mock().mockReturnValue([]),
  forEachComponentV2Sync: mock(),
}));

// Mock @abtnode/core/lib/util/blocklet
mock.module('@abtnode/core/lib/util/blocklet', () => ({
  getRuntimeEnvironments: mock().mockReturnValue({}),
}));

// Mock which
mock.module('which', () => ({
  sync: mock().mockReturnValue('/usr/local/bin/node'),
}));

// Mock run-script
mock.module('@abtnode/util/lib/run-script', () => mock().mockResolvedValue());

mock.module('../../../lib/manager', () => {
  return {
    checkRunning: mock().mockResolvedValue(true),
  };
});
mock.module('../../../lib/node', () => ({
  getNode: mock().mockResolvedValue({}),
}));
mock.module('../../../lib/util', () => ({
  printError: mock().mockImplementation(() => {}),
  printInfo: mock().mockImplementation(() => {}),
  printWarning: mock().mockImplementation(() => {}),
  getCLIBinaryName: mock().mockReturnValue('blocklet'),
}));
mock.module('@blocklet/meta/lib/parse', () => ({}));
mock.module('../../../lib/util/blocklet/env', () => mock().mockResolvedValue());

const mockScript = 'test-script.js';
const mockAppId = 'z8iZqgNX5YzAVkE3qitX4BkwdpBKGxtqhzaW';
const mockDid = {
  isValid: mock().mockImplementation((did) => did === mockAppId),
  toAddress: mock().mockReturnValue(mockAppId),
};

mock.module('@arcblock/did', () => mockDid);

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const fs = require('fs');

const chalk = require('chalk');

const { checkRunning } = require('../../../lib/manager');
const { getNode } = require('../../../lib/node');
const exec = require('../../../lib/commands/blocklet/exec');
const util = require('../../../lib/util');

spyOn(fs, 'existsSync').mockReturnValue(true);

describe('command.blocklet.exec', () => {
  beforeEach(() => {
    mock.clearAllMocks();
    process.env.BLOCKLET_DEV_APP_DID = undefined;
    process.env.ABT_NODE_SK = 'test-sk';

    // Mock checkRunning
    checkRunning.mockResolvedValue(true);

    // Mock fs
    fs.existsSync.mockReturnValue(true);

    // Mock getNode
    getNode.mockResolvedValue({
      node: {
        onReady: async (cb) => {
          await cb();
          return '';
        },
        getBlocklet: mock().mockResolvedValue({
          meta: { name: 'test-blocklet', did: mockAppId },
          children: [],
          env: { processId: 'test-process' },
        }),
        states: {
          node: {
            getEnvironments: mock().mockResolvedValue({}),
          },
        },
        getNodeInfo: mock().mockResolvedValue({
          sk: 'test-sk',
        }),
      },
    });
  });

  test('should exit if blocklet server is not running', async () => {
    checkRunning.mockResolvedValue(false);
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
    util.getCLIBinaryName.mockReturnValue('blocklet');

    await exec.run(mockScript, { appId: mockAppId });

    expect(util.printError).toHaveBeenCalledWith('Blocklet Server is not running, can not execute anything!');
    expect(util.printInfo).toHaveBeenCalledWith(expect.stringContaining('blocklet server start'));
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('should exit if script file does not exist', async () => {
    fs.existsSync.mockReturnValue(false);
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});

    await exec.run(mockScript, { appId: mockAppId });

    expect(util.printError).toHaveBeenCalledWith(expect.stringContaining('does not exist'));
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('should exit if appId is invalid', async () => {
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});

    await exec.run(mockScript, { appId: 'invalid-did' });

    expect(util.printError).toHaveBeenCalledWith(expect.stringContaining('is not valid'));
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('should use BLOCKLET_DEV_APP_DID from env if appId not provided', async () => {
    process.env.BLOCKLET_DEV_APP_DID = mockAppId;
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});

    await exec.run(mockScript);

    expect(util.printWarning).toHaveBeenCalledWith(`Use ${chalk.cyan('--app-id')} from env: ${chalk.cyan(mockAppId)}`);
    expect(mockExit).not.toHaveBeenCalledWith(0);
  });

  test('should exit if blocklet not found', async () => {
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
    getNode.mockResolvedValue({
      node: {
        onReady: (cb) => cb(),
        getBlocklet: mock().mockResolvedValue(null),
        states: {
          node: {
            getEnvironments: mock().mockResolvedValue({}),
          },
        },
        getNodeInfo: mock().mockResolvedValue({
          sk: 'test-sk',
        }),
      },
    });

    await exec.run(mockScript, { appId: mockAppId });

    expect(util.printError).toHaveBeenCalledWith(
      `Blocklet ${mockAppId} not found, you should install the blocklet first.`
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('should execute script successfully', async () => {
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});

    await exec.run(mockScript, { appId: mockAppId });

    expect(mockExit).not.toHaveBeenCalledWith(0);
  });
});
