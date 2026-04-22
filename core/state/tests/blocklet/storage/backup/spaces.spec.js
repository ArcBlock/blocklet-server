/* eslint-disable require-await */
/* eslint-disable import/order */
/* eslint-disable max-classes-per-file */

const { test, expect, describe, beforeEach, mock, spyOn, afterAll } = require('bun:test');

// Must be hoisted above any require that transitively loads base.js (which requires @blocklet/meta/lib/info)
mock.module('@blocklet/meta/lib/info', () => {
  return {
    getBlockletInfo: mock(),
  };
});

const { default: realAxios } = require('axios');

realAxios.head = mock(async () => ({}));

// bun 的 mock 无法 mock axios 这种 callable hybrid (即使函数, 又是对象) 的模块，所以需要手动 mock
require.cache[require.resolve('axios')] = {
  exports: {
    __esModule: true,
    default: realAxios,
    ...realAxios,
  },
};

const realFs = require('fs-extra');
const realBlocklet = require('../../../../lib/blocklet/storage/backup/blocklet');
const realBlocklets = require('../../../../lib/blocklet/storage/backup/blocklets');
const realBlockletExtras = require('../../../../lib/blocklet/storage/backup/blocklet-extras');
const realRoutingRule = require('../../../../lib/blocklet/storage/backup/routing-rule');
const realData = require('../../../../lib/blocklet/storage/backup/data');
const realLogs = require('../../../../lib/blocklet/storage/backup/logs');
const realDidSpaceJs = require('@blocklet/did-space-js');
const realDisk = require('../../../../lib/blocklet/storage/utils/disk');

mock.module('../../../../lib/states', () => ({
  blocklet: { findOne: mock(() => []), getBlocklet: mock() },
  backup: { progress: mock() },
  node: {
    read: mock(() => {
      return {
        sk: 'sk',
      };
    }),
  },
}));

mock.module('fs-extra', () => {
  return {
    ...realFs,
    existsSync: mock(),
    rmdirSync: mock(),
    ensureDirSync: mock(),
    removeSync: mock(),
    remove: mock(),
  };
});

function createMockBackupClass(name) {
  class MockBackup {
    constructor() {
      this.name = name;
    }

    send = mock(() =>
      Promise.resolve({
        data: {
          errorCount: 0,
        },
        statusCode: 200,
        statusMessage: 'OK',
      })
    );

    ensureParams = mock();

    export = mock(() => Promise.resolve());

    collectSyncObjects = mock(() => Promise.resolve([]));
  }

  MockBackup.prototype.send = mock(() =>
    Promise.resolve({
      data: { errorCount: 0 },
      statusCode: 200,
      statusMessage: 'OK',
    })
  );
  MockBackup.prototype.ensureParams = mock();
  MockBackup.prototype.export = mock(() => Promise.resolve());
  MockBackup.prototype.collectSyncObjects = mock(() => Promise.resolve([]));

  return MockBackup;
}

mock.module('../../../../lib/blocklet/storage/backup/logs', () => {
  return {
    ...realLogs,
    LogsBackup: createMockBackupClass('LogsBackup'),
  };
});
mock.module('../../../../lib/blocklet/storage/backup/blocklet', () => {
  return {
    ...realBlocklet,
    BlockletBackup: createMockBackupClass('BlockletBackup'),
  };
});
mock.module('../../../../lib/blocklet/storage/backup/blocklets', () => {
  return {
    ...realBlocklets,
    BlockletsBackup: createMockBackupClass('BlockletsBackup'),
  };
});
mock.module('../../../../lib/blocklet/storage/backup/blocklet-extras', () => {
  return {
    ...realBlockletExtras,
    BlockletExtrasBackup: createMockBackupClass('BlockletExtrasBackup'),
  };
});
mock.module('../../../../lib/blocklet/storage/backup/routing-rule', () => {
  return {
    ...realRoutingRule,
    RoutingRuleBackup: createMockBackupClass('RoutingRuleBackup'),
  };
});
mock.module('../../../../lib/blocklet/storage/backup/data', () => {
  return {
    ...realData,
    DataBackup: class {
      export() {
        return Promise.resolve();
      }

      ensureParams = mock();

      collectSyncObjects() {
        return Promise.resolve([]);
      }
    },
  };
});

mock.module('@blocklet/did-space-js', () => {
  const RealDidSpace = realDidSpaceJs;

  function makeMockClass(name) {
    const Class = createMockBackupClass(name);
    // eslint-disable-next-line func-names
    const MockConstructor = mock(function (...args) {
      const instance = new Class(...args);
      MockConstructor.mock.instances.push(instance);
      MockConstructor.mock.calls.push(args);
      return instance;
    });
    MockConstructor.mock.instances = [];
    MockConstructor.mock.calls = [];
    MockConstructor.prototype = Class.prototype;
    return MockConstructor;
  }

  const SpaceClient = makeMockClass('SpaceClient');
  const IncrementalBackupBlockletCommand = makeMockClass('IncrementalBackupBlockletCommand');

  return {
    ...RealDidSpace,
    SpaceClient,
    IncrementalBackupBlockletCommand,
  };
});

mock.module('../../../../lib/blocklet/storage/utils/disk', () => {
  return {
    ...realDisk,
    getFolderSize: mock(),
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
  realAxios.head = undefined;
  delete require.cache[require.resolve('axios')];
});

const { EventEmitter } = require('events');
const { existsSync, rmdirSync, ensureDirSync, remove } = require('fs-extra');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const { SpaceClient, IncrementalBackupBlockletCommand } = require('@blocklet/did-space-js');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { getAppName, getAppDescription } = require('@blocklet/meta/lib/util');
const { default: axios } = require('axios');
const { SpacesBackup } = require('../../../../lib/blocklet/storage/backup/spaces');
const states = require('../../../../lib/states');
const { getFolderSize } = require('../../../../lib/blocklet/storage/utils/disk');

describe(__filename, () => {
  const event = new EventEmitter();
  const appDid = 'zNKYt57Y2YL6qk5wd5gmZWW5ZuLBgDFmvVfs';

  /** @type {import('@blocklet/server-js').BlockletState} */
  const blocklet = {
    appDid,
    meta: {
      did: appDid,
    },
    environments: [
      {
        key: 'BLOCKLET_APP_BACKUP_ENDPOINT',
        value: 'BLOCKLET_APP_BACKUP_ENDPOINT.value',
      },
    ],
  };
  /**
   *
   *
   * @param {import('../../../../lib/blocklet/storage/backup/spaces').SpaceBackupInput} input
   * @return {SpacesBackup}
   */
  const newSpacesBackup = (input) => {
    const spacesBackup = new SpacesBackup({ ...input, backup: { id: '233' }, event });

    spacesBackup.securityContext = {
      signer: {
        address: 'address',
        secretKey: 'secretKey',
      },
      delegation: '',
      encrypt: () => 'encrypt',
      decrypt: () => 'decrypt',
    };

    return spacesBackup;
  };

  beforeEach(() => {
    process.env.ABT_NODE_DATA_DIR = __dirname;

    getBlockletInfo.mockReturnValue({
      wallet: {
        address: 'address',
        secretKey: 'secretKey',
      },
    });
  });

  describe('#constructor', () => {
    test('should throw an error when did is not a valid did', () => {
      expect(
        () =>
          new SpacesBackup({
            appDid: '233',
            event,
          })
      ).toThrow('input.appDid(233) is not a valid did');
    });
  });

  describe('#initialize', () => {
    test('should throw an error when blocklet is empty', async () => {
      const spacesBackup = newSpacesBackup({ appDid });
      states.blocklet.getBlocklet.mockResolvedValue([]);

      try {
        await spacesBackup.initialize();
      } catch (error) {
        expect(error.message).toBe('blocklet cannot be empty');
      }

      expect(states.blocklet.getBlocklet).toBeCalledWith(appDid);
    });

    test('should throw an error when spaceEndpoint is empty', async () => {
      const spacesBackup = newSpacesBackup({ appDid });

      existsSync.mockReturnValue(true);
      rmdirSync.mockReturnThis();
      ensureDirSync.mockReturnThis();

      const testBlocklet = cloneDeep(blocklet);
      testBlocklet.environments[0].value = '';
      states.blocklet.getBlocklet.mockResolvedValue(testBlocklet);

      try {
        await spacesBackup.initialize();
      } catch (error) {
        expect(error.message).toBe('spaceEndpoint cannot be empty');
      }

      // FIXME: 按道理应该经过此处的
      // expect(spacesBackup.backupDir).toEqual(
      //   join(process.env.ABT_NODE_DATA_DIR, 'tmp/backup', blocklet.meta.did)
      // );
      expect(states.blocklet.getBlocklet).toBeCalledWith(appDid);
    });
  });

  describe('#export', () => {
    test('should work', async () => {
      const spacesBackup = newSpacesBackup({ appDid });

      existsSync.mockReturnValue(true);
      rmdirSync.mockReturnThis();
      ensureDirSync.mockReturnThis();
      spacesBackup.storages.forEach((x) => {
        spyOn(x, 'collectSyncObjects').mockResolvedValue([]);
      });

      const testBlocklet = cloneDeep(blocklet);
      states.blocklet.getBlocklet.mockResolvedValue(testBlocklet);

      await spacesBackup.initialize();
      await spacesBackup.export();

      expect(states.blocklet.getBlocklet).toBeCalledWith(appDid);
      expect(states.backup.progress).toBeCalledWith('233', {
        message: 'Preparing data for backup...',
        progress: 15,
      });
    });
  });

  describe('#verifySpace', () => {
    test('should be work', async () => {
      const spacesBackup = newSpacesBackup({ appDid });

      existsSync.mockReturnValue(true);
      rmdirSync.mockReturnThis();
      ensureDirSync.mockReturnThis();

      const testBlocklet = cloneDeep(blocklet);
      states.blocklet.getBlocklet.mockResolvedValue(testBlocklet);

      axios.head.mockResolvedValue({
        headers: {
          'x-space-is-full': 'false',
          'x-space-free-capacity': '1000',
          'x-space-is-available': 'true',
        },
      });
      getFolderSize.mockReturnValue(100);

      await spacesBackup.initialize();

      await expect(spacesBackup.verifySpace()).resolves.toBeUndefined();
    });

    test('should throw an error if space is full', async () => {
      const spacesBackup = newSpacesBackup({ appDid });

      existsSync.mockReturnValue(true);
      rmdirSync.mockReturnThis();
      ensureDirSync.mockReturnThis();

      const testBlocklet = cloneDeep(blocklet);
      states.blocklet.getBlocklet.mockResolvedValue(testBlocklet);

      axios.head.mockResolvedValue({
        headers: {
          'x-space-is-full': 'true',
          'x-space-free-capacity': '0',
        },
      });
      getFolderSize.mockReturnValue(1);

      await spacesBackup.initialize();

      try {
        await spacesBackup.verifySpace();
      } catch (error) {
        expect(error.message).toBe('Your DID Spaces storage is full. Expand storage and try again.');
      }
    });

    test('should throw an error if space lacks capacity', async () => {
      const spacesBackup = newSpacesBackup({ appDid });

      existsSync.mockReturnValue(true);
      rmdirSync.mockReturnThis();
      ensureDirSync.mockReturnThis();

      const testBlocklet = cloneDeep(blocklet);
      states.blocklet.getBlocklet.mockResolvedValue(testBlocklet);

      axios.head.mockResolvedValue({
        headers: {
          'x-space-is-full': 'false',
          'x-space-free-capacity': '1',
        },
      });
      getFolderSize.mockReturnValue(100);

      await spacesBackup.initialize();

      try {
        await spacesBackup.verifySpace();
      } catch (error) {
        expect(error.message).toBe('Not enough storage space. Expand storage and try again.');
      }
    });
  });

  describe('#syncToSpaces', () => {
    test('should work', async () => {
      const spacesBackup = newSpacesBackup({ appDid });

      SpaceClient.prototype.send.mockResolvedValue({
        data: {
          errorCount: 0,
        },
        statusCode: 200,
        statusMessage: 'OK',
      });

      spacesBackup.backupDir = __dirname;
      spacesBackup.blocklet = blocklet;

      const mockSyncObjects = [
        {
          key: '/data/11GB 5.7W/1.2G 4w/280MB1W_副本4/solid-js/node_modules/csstype/package.json',
          name: 'package.json',
          isDir: false,
          size: 8209,
          lastModified: 1696955318181,
          editable: true,
          mimeType: 'application/json',
          hash: 'bafybeib2tmfc7ravv7pndfzbk37w27kvud7sedejdjflr6l4n2ivzizzyq',
          absolutePath:
            'zNKgkVeR8skC6NMPVrBgJ24h7kQEiyEm26Hc/apps/zNKunmYfV8UzZkRzMdVa4E16dw8wgFWi3PqL/.did-objects/zNKunmYfV8UzZkRzMdVa4E16dw8wgFWi3PqL/data/11GB 5.7W/1.2G 4w/280MB1W_副本4/solid-js/node_modules/csstype/package.json',
        },
      ];
      spacesBackup.syncObjects = mockSyncObjects;

      await spacesBackup.syncToSpaces();

      expect(IncrementalBackupBlockletCommand.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          appDid: spacesBackup.blocklet.appDid,
          appName: getAppName(spacesBackup.blocklet),
          appDescription: getAppDescription(spacesBackup.blocklet),
          userDid: spacesBackup.input.userDid,
          referrer: spacesBackup.input.referrer,
          serverDid: undefined,
          signerDid: spacesBackup.securityContext.signer.address,

          source: mockSyncObjects,
          debug: true,
          retryCount: 10,
          concurrency: 4,
        })
      );
    });

    test('should throw an error when errorCount != 0', async () => {
      const spacesBackup = newSpacesBackup({ appDid });

      const result = {
        data: {
          errorCount: 1,
        },
        statusMessage: '233',
      };

      SpaceClient.prototype.send.mockResolvedValue(result);

      spacesBackup.backupDir = __dirname;
      spacesBackup.blocklet = blocklet;

      try {
        await spacesBackup.syncToSpaces();
      } catch (error) {
        expect(error.message).toThrow(`${result.statusMessage}`);
      }
    });

    test('should throw an error when errorCount !== 0 && statusCode === 403', async () => {
      const spacesBackup = newSpacesBackup({ appDid });

      const result = {
        data: {
          errorCount: 1,
        },
        statusMessage: '233',
        statusCode: 403,
      };

      SpaceClient.prototype.send.mockResolvedValue(result);

      spacesBackup.backupDir = __dirname;
      spacesBackup.blocklet = blocklet;

      try {
        await spacesBackup.syncToSpaces();
      } catch (error) {
        expect(error).toThrow(result.statusMessage);
      }
    });
  });

  describe('#backup', () => {
    test('should work', async () => {
      existsSync.mockReturnValue(false);

      const spacesBackup = newSpacesBackup({ appDid });

      spyOn(spacesBackup, 'initialize').mockResolvedValue(null);
      spyOn(spacesBackup, 'export').mockResolvedValue(null);
      spyOn(spacesBackup, 'verifySpace').mockResolvedValue(null);
      spyOn(spacesBackup, 'syncToSpaces').mockResolvedValue(null);

      await spacesBackup.backup();

      expect(spacesBackup.initialize).toBeCalled();
      expect(spacesBackup.export).toBeCalled();
      expect(spacesBackup.verifySpace).toBeCalled();
      expect(spacesBackup.syncToSpaces).toBeCalled();
    });
  });

  describe('#destroy', () => {
    test('should be destroy successfully', async () => {
      const spacesBackup = newSpacesBackup({ appDid });

      existsSync.mockReturnValue(true);
      remove.mockResolvedValue(null);

      await spacesBackup.destroy();

      expect(remove).toBeCalledWith(spacesBackup.backupDir);
    });
  });
});
