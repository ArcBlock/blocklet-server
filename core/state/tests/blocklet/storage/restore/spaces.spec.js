const { test, expect, describe, mock, beforeEach, spyOn, afterAll } = require('bun:test');

const realFs = require('fs-extra');
const realMeta = require('@blocklet/meta');
const realDidSpaceJs = require('@blocklet/did-space-js');
const realOcapWallet = require('@ocap/wallet');

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
    ensureDirSync: mock(),
    removeSync: mock(),
    rmSync: mock(),
    readJSONSync: mock(),
  };
});

mock.module('@blocklet/meta', () => {
  return {
    ...realMeta,
    getBlockletInfo: mock(),
  };
});

mock.module('@blocklet/did-space-js', () => {
  class SpaceClient {
    send = mock(() => {
      return {
        statusCode: 200,
        statusMessage: 'OK',
      };
    });
  }
  SpaceClient.prototype.send = mock();

  return {
    ...realDidSpaceJs,
    SpaceClient,
    RestoreBlockletCommand: mock(),
  };
});

mock.module('@ocap/wallet', () => {
  return {
    ...realOcapWallet,
    OcapWallet: mock(),
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { EventEmitter } = require('events');
const { existsSync, rmSync, ensureDirSync } = require('fs-extra');
const { SpaceClient, RestoreBlockletCommand } = require('@blocklet/did-space-js');
const { getBlockletInfo } = require('@blocklet/meta');
const { join } = require('path');
const { SpacesRestore } = require('../../../../lib/blocklet/storage/restore/spaces');

describe(__filename, () => {
  const event = new EventEmitter();

  const userDid = 'bbqaw5mgxc6fnihrwqcejcxvukkdgkk4anwxwk5msvm';
  const referrer = 'https://bbqaw5mgxc6fnihrwqcejcxvukkdgkk4anwxwk5msvm.did.abtnet.io/';

  const appPid = 'zNKYt57Y2YL6qk5wd5gmZWW5ZuLBgDFmvVfs';
  const appDid = 'zNKYt57Y2YL6qk5wd5gmZWW5ZuLBgDFmvVfs';
  const endpoint =
    'https://storage.staging.abtnet.io/app/api/space/z3T6UtuEsoKbYbB6JTMbVHzGuQvW5JHUKnf93/app/zNKYt57Y2YL6qk5wd5gmZWW5ZuLBgDFmvVfs/object/';

  const wallet = {
    address: 'zNKYt57Y2YL6qk5wd5gmZWW5ZuLBgDFmvVfs',
    secretKey: 'secretKey',
  };

  const restoreDir = join(__dirname, 'tmp/restore', wallet.address);

  /**
   *
   *
   * @param {import('../../../../lib/blocklet/storage/backup/spaces').SpaceBackupInput} input
   * @return {SpacesRestore}
   */
  const newSpacesRestore = (input) => {
    const spacesRestore = new SpacesRestore({ appPid, appDid, event, ...input });
    return spacesRestore;
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

  describe('#verify', () => {
    test('should work', () => {
      const spacesRestore = newSpacesRestore({ endpoint });

      expect(spacesRestore).toBeTruthy();
    });

    test('should throw an error when did is not a valid did', () => {
      expect(() => newSpacesRestore({ endpoint: '233', event })).toThrow('endpoint(233) must be a WebUri');
    });
  });

  describe('#initialize', () => {
    beforeEach(() => {
      process.env.ABT_NODE_DATA_DIR = __dirname;
    });

    test('should work', async () => {
      const spacesRestore = newSpacesRestore({ endpoint });

      existsSync.mockReturnValue(true);

      await spacesRestore.initialize();

      expect(spacesRestore.serverDir).toEqual(__dirname);
      expect(spacesRestore.restoreDir).toEqual(restoreDir);
      expect(existsSync).toBeCalledWith(restoreDir);
      expect(rmSync).toBeCalledWith(restoreDir, { recursive: true });
      expect(ensureDirSync).toBeCalledWith(restoreDir);
    });
  });

  describe('#restore', () => {
    test('should work', async () => {
      const spacesRestore = newSpacesRestore({ endpoint });

      spyOn(spacesRestore, 'initialize').mockResolvedValue(null);
      spyOn(spacesRestore, 'syncFromSpaces').mockResolvedValue(null);

      for (const storage of spacesRestore.storages) {
        spyOn(storage, 'getImportParams').mockResolvedValue({ slat: '233' });
        spyOn(storage, 'getInstallParams').mockResolvedValue();
      }

      spyOn(spacesRestore, 'import').mockResolvedValue(null);

      await spacesRestore.restore();

      expect(spacesRestore.initialize).toBeCalled();
      expect(spacesRestore.syncFromSpaces).toBeCalled();
      expect(spacesRestore.import).toBeCalledWith({ slat: '233' });
    });
  });

  describe('#syncFromSpaces', () => {
    test('should work', async () => {
      const spacesRestore = newSpacesRestore({
        endpoint,
        userDid,
        referrer,
      });

      SpaceClient.prototype.send.mockResolvedValue({
        statusCode: 200,
      });

      spacesRestore.restoreDir = __dirname;

      await spacesRestore.syncFromSpaces();

      expect(RestoreBlockletCommand.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          appPid: spacesRestore.input.appPid,
          appDid: spacesRestore.input.appDid,
          target: join(spacesRestore.restoreDir, '/'),
          debug: true,
          concurrency: 4,
          retryCount: 10,

          userDid: spacesRestore.input.userDid,
          referrer: spacesRestore.input.referrer,
        })
      );
    });

    test('should throw an error when errorCount != 0', async () => {
      const spacesRestore = newSpacesRestore({ endpoint });

      SpaceClient.prototype.send.mockResolvedValue({
        data: {
          errorCount: 1,
        },
        statusMessage: 'QAQ',
      });

      spacesRestore.restoreDir = __dirname;

      try {
        await spacesRestore.syncFromSpaces();
      } catch (error) {
        expect(error.message).toBe('QAQ');
      }
    });
  });

  describe('#import', () => {
    test('should work', async () => {
      const spacesRestore = newSpacesRestore({ endpoint, appDid });

      const params = { slat: '233' };

      for (const storage of spacesRestore.storages) {
        spyOn(storage, 'import').mockResolvedValue();
      }

      await spacesRestore.import(params);

      for (const storage of spacesRestore.storages) {
        expect(storage.import).toBeCalled();
      }
    });
  });
});
