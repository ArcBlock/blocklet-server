/* eslint-disable max-classes-per-file */
/* eslint-disable import/order */
const { test, expect, describe, mock, beforeEach, spyOn, afterAll } = require('bun:test');

// Must be hoisted above any require that transitively loads base.js (which requires @blocklet/meta/lib/info)
mock.module('@blocklet/meta/lib/info', () => {
  return {
    getBlockletInfo: mock(),
  };
});

const realFs = require('fs-extra');
const realBlocklet = require('../../../../lib/blocklet/storage/backup/blocklet');
const realBlocklets = require('../../../../lib/blocklet/storage/backup/blocklets');
const realBlockletExtras = require('../../../../lib/blocklet/storage/backup/blocklet-extras');
const realRoutingRule = require('../../../../lib/blocklet/storage/backup/routing-rule');
const realData = require('../../../../lib/blocklet/storage/backup/data');
const realLogs = require('../../../../lib/blocklet/storage/backup/logs');

mock.module('../../../../lib/states', () => ({
  blocklet: { findOne: mock(() => []), getBlocklet: mock() },
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
    writeJSON: mock(),
  };
});

function createMockBackupClass(name) {
  return class {
    constructor() {
      this.name = name;
    }

    ensureParams = mock();

    export = mock(() => Promise.resolve());

    collectSyncObjects = mock(() => Promise.resolve([]));
  };
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

mock.module('@blocklet/did-space-js', () => mock());

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { EventEmitter } = require('events');
const { existsSync, rmdirSync, ensureDirSync } = require('fs-extra');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const fs = require('fs-extra');
const { DiskBackup } = require('../../../../lib/blocklet/storage/backup/disk');
const states = require('../../../../lib/states');

// require('../../../../lib/blocklet/storage/backup/logs');
// require('../../../../lib/blocklet/storage/backup/blocklet');
// require('../../../../lib/blocklet/storage/backup/blocklets');
// require('../../../../lib/blocklet/storage/backup/blocklet-extras');
// require('../../../../lib/blocklet/storage/backup/routing-rule');
// require('../../../../lib/blocklet/storage/backup/data');

describe('backup disk', () => {
  const event = new EventEmitter();
  const appDid = 'zNKYt57Y2YL6qk5wd5gmZWW5ZuLBgDFmvVfs';

  /** @type {import('@blocklet/server-js').BlockletState} */
  const blocklet = {
    appDid,
    meta: {
      did: appDid,
    },
    environments: [],
  };

  const newDiskBackup = (input) => {
    const diskBackup = new DiskBackup({ ...input, event });

    diskBackup.securityContext = {
      encrypt: () => 'encrypt',
      decrypt: () => 'decrypt',
    };

    return diskBackup;
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
          new DiskBackup({
            appDid: '233',
            event,
          })
      ).toThrow('input.appDid(233) is not a valid did');
    });
  });

  describe('#initialize', () => {
    test('should throw an error when blocklet is empty', async () => {
      const diskBackup = newDiskBackup({ appDid });
      states.blocklet.getBlocklet.mockResolvedValue([]);

      try {
        await diskBackup.initialize();
      } catch (error) {
        expect(error.message).toBe('blocklet cannot be empty');
      }

      expect(states.blocklet.getBlocklet).toBeCalledWith(appDid);
    });
  });

  describe('#export', () => {
    test('should work', async () => {
      const diskBackup = newDiskBackup({ appDid });

      existsSync.mockReturnValue(true);
      rmdirSync.mockReturnThis();
      ensureDirSync.mockReturnThis();

      const testBlocklet = cloneDeep(blocklet);
      testBlocklet.appPid = 'did:abt:123';
      testBlocklet.meta.title = '锟斤拷';
      states.blocklet.getBlocklet.mockResolvedValue(testBlocklet);

      await diskBackup.initialize();
      await diskBackup.addMeta();
      await diskBackup.export();

      expect(states.blocklet.getBlocklet).toBeCalledWith(appDid);

      expect(fs.writeJSON).toHaveBeenLastCalledWith(
        expect.stringMatching(`/data/_abtnode/backup/${appDid}/meta.json`),
        {
          appDid,
          appPid: 'did:abt:123',
          name: '锟斤拷',
          createdAt: expect.any(Number),
        }
      );
    });
  });

  describe('#backup', () => {
    test('should work', async () => {
      const diskBackup = newDiskBackup({ appDid });

      spyOn(diskBackup, 'initialize').mockResolvedValue(null);
      spyOn(diskBackup, 'export').mockResolvedValue(null);
      spyOn(diskBackup, 'addMeta').mockResolvedValue(null);

      await diskBackup.backup();

      expect(diskBackup.initialize).toBeCalled();
      expect(diskBackup.export).toBeCalled();
      expect(diskBackup.addMeta).toBeCalled();
    });
  });
});
