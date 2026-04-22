/* eslint-disable import/order */
/* eslint-disable global-require */
const { test, expect, describe, mock, afterEach, beforeEach, afterAll } = require('bun:test');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const { join } = require('path');

const realFs = require('fs-extra');

mock.module('fs-extra', () => {
  return {
    ...realFs,
    readFileSync: mock(() => 'dek'),
  };
});

mock.module('../../../../lib/states', () => ({
  init: mock(),
  blockletExtras: {
    findOne: mock(() => null),
  },
}));

mock.module('@abtnode/util/lib/security', () => ({
  decrypt: mock(() => 'decrypt'),
  encrypt: mock(() => 'encrypt'),
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { BlockletExtrasBackup } = require('../../../../lib/blocklet/storage/backup/blocklet-extras');

const { readFileSync, readJSONSync, removeSync, existsSync } = require('fs-extra');
const security = require('@abtnode/util/lib/security');

const states = require('../../../../lib/states');

describe('backup blocklet extras', () => {
  const filename = 'blocklet-extras.json';
  const backupDir = __dirname;
  const did = 'znkomkclejcfbjaxw9knzzebmzmqrxjnn9bb';
  const backupPath = join(backupDir, filename);
  states.initializer = true;
  /** @type {import('@blocklet/server-js').BlockletState} */
  const blocklet = {
    meta: {
      did,
    },
  };

  /** @type {import('@blocklet/server-js').BlockletState} */
  const blockletExtra = {
    _id: 1234547566,
    createAt: 1234547566,
    updatedAt: 1234547566,
    meta: {
      did,
    },
    configs: [
      {
        key: 'BLOCKLET_APP_SK',
        value: 'blocklet_app_sk',
      },
      {
        secure: true,
        key: 'secure_key',
        value: 'secure_value',
      },
    ],
    children: [],
  };

  const newBlockletExtrasBackup = () => {
    /**
     * @type {BlockletExtrasBackup}
     */
    const blockletExtrasBackup = new BlockletExtrasBackup({ did });
    blockletExtrasBackup.backupDir = backupDir;
    blockletExtrasBackup.blocklet = blocklet;
    blockletExtrasBackup.serverDir = __dirname;
    // blockletExtrasBackup.getBlockletExtra = () => states.blockletExtras.findOne({ did });
    blockletExtrasBackup.securityContext = {
      signer: {
        address: 'address',
        secretKey: 'secretKey',
      },
      delegation: '',
      encrypt: () => 'encrypt',
      decrypt: () => 'decrypt',
    };

    return blockletExtrasBackup;
  };

  describe('#export', () => {
    beforeEach(() => {
      mock.clearAllMocks();
      // mock.restore();
    });

    test('should work', async () => {
      const blockletExtrasBackup = newBlockletExtrasBackup();
      /** @type {import('@blocklet/server-js').BlockletState} */
      const testBlockletExtra = cloneDeep(blockletExtra);

      states.blockletExtras.findOne.mockResolvedValue(testBlockletExtra);
      security.decrypt.mockReturnValue('decrypt');
      readFileSync.mockReturnValue('dek');

      await blockletExtrasBackup.export();

      expect(states.blockletExtras.findOne).toHaveBeenCalledWith({ did });
      expect(readFileSync).toHaveBeenCalledWith(join(blockletExtrasBackup.serverDir, '.sock'));
      expect(security.decrypt).toHaveBeenCalledWith('secure_value', did, 'dek');

      const finalBlockletExtra = readJSONSync(backupPath);

      expect(finalBlockletExtra.configs[0].value).toEqual('blocklet_app_sk');
      expect(finalBlockletExtra.configs[1].value).toEqual('encrypt');
    });

    test('should work when configs is empty', async () => {
      const blockletExtrasBackup = newBlockletExtrasBackup();
      /** @type {import('@blocklet/server-js').BlockletState} */
      const testBlockletExtra = cloneDeep(blockletExtra);

      testBlockletExtra.configs = [];

      states.blockletExtras.findOne.mockResolvedValue(testBlockletExtra);
      security.decrypt.mockReturnValue('decrypt');

      await blockletExtrasBackup.export();

      expect(security.decrypt).toBeCalledTimes(0);

      const finalBlockletExtra = readJSONSync(backupPath);

      expect(finalBlockletExtra.configs.length === 0).toBeTruthy();
    });

    test('should throw an error when blockletExtra not found', async () => {
      const blockletExtrasBackup = newBlockletExtrasBackup();

      states.blockletExtras.findOne.mockResolvedValue(null);

      try {
        await blockletExtrasBackup.export();
      } catch (error) {
        expect(error.message).toBe('blockletExtra cannot be empty');
      }
      expect(states.blockletExtras.findOne).toBeCalledWith({
        did,
      });
    });
  });

  afterEach(() => {
    if (existsSync(backupPath)) {
      removeSync(backupPath);
    }
  });
});
