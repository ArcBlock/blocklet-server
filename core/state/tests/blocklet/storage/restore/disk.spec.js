/* eslint-disable import/order */
const { test, expect, describe, mock, beforeEach, spyOn, afterAll } = require('bun:test');

const realFs = require('fs-extra');
const realMeta = require('@blocklet/meta');

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
    rmSync: mock(),
    ensureDirSync: mock(),
    removeSync: mock(),
    readJSONSync: mock().mockReturnValue({ structVersion: '2' }),
    copy: mock(),
  };
});

mock.module('@blocklet/meta', () => {
  return {
    ...realMeta,
    getBlockletInfo: mock(),
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { EventEmitter } = require('events');
const { existsSync, rmSync, ensureDirSync, copy } = require('fs-extra');
const { getBlockletInfo } = require('@blocklet/meta');
const { join } = require('path');
const { DiskRestore } = require('../../../../lib/blocklet/storage/restore/disk');

// FIXME: @yejianchao
// eslint-disable-next-line jest/no-disabled-tests
describe(__filename, () => {
  const event = new EventEmitter();

  const wallet = {
    address: 'zNKYt57Y2YL6qk5wd5gmZWW5ZuLBgDFmvVfs',
    secretKey: 'secretKey',
  };

  const restoreDir = join(__dirname, 'tmp/restore-disk', wallet.address);

  /**
   *
   *
   * @param {import('../../../../lib/blocklet/storage/backup/disk').SpaceBackupInput} input
   * @return {DiskRestore}
   */
  const newDiskRestore = (input) => {
    const diskRestore = new DiskRestore({ ...input, event, appDid: wallet.address });
    return diskRestore;
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
    test('should work', () => {
      const diskRestore = new DiskRestore({ event, appDid: wallet.address });

      expect(diskRestore).toBeTruthy();
    });

    test('should throw an error when did is not a valid did', () => {
      expect(() => new DiskRestore({ appDid: '233', event })).toThrow('233) is not a valid did');
    });
  });

  describe('#initialize', () => {
    beforeEach(() => {
      process.env.ABT_NODE_DATA_DIR = __dirname;
    });

    test('should work', async () => {
      const diskRestore = newDiskRestore({});

      existsSync.mockReturnValue(true);

      await diskRestore.initialize();

      expect(diskRestore.serverDir).toEqual(__dirname);
      expect(diskRestore.restoreDir).toEqual(restoreDir);
      expect(existsSync).toBeCalledWith(restoreDir);
      expect(rmSync).toBeCalledWith(restoreDir, { recursive: true });
      expect(ensureDirSync).toBeCalledWith(restoreDir);
    });
  });

  describe('#restore', () => {
    test('should work', async () => {
      const diskRestore = newDiskRestore({});

      spyOn(diskRestore, 'import').mockResolvedValue(null);

      await diskRestore.restore();

      expect(copy).toHaveBeenLastCalledWith(
        expect.stringContaining(`data/_abtnode/backup/${wallet.address}/${wallet.address}`),
        restoreDir
      );
      expect(diskRestore.import).toBeCalled();
    });
  });

  describe('#import', () => {
    test('should work', async () => {
      const diskRestore = newDiskRestore({});

      for (const storage of diskRestore.storages) {
        spyOn(storage, 'ensureParams').mockResolvedValue(null);
        spyOn(storage, 'import').mockResolvedValue(null);
      }

      await diskRestore.initialize();
      await diskRestore.import();

      for (const storage of diskRestore.storages) {
        expect(storage.ensureParams).toBeCalled();
        expect(storage.import).toBeCalled();
      }
    });
  });
});
