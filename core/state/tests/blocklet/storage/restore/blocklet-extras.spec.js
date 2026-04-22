const { test, expect, describe, mock, beforeEach, it, afterAll } = require('bun:test');
const realFs = require('fs-extra');

mock.module('fs-extra', () => {
  return {
    ...realFs,
    readJSONSync: mock(),
    removeSync: mock(),
    outputJsonSync: mock(),
  };
});

mock.module('../../../../lib/states', () => ({
  blockletExtras: {
    findOne: mock(() => null),
  },
}));

mock.module('@abtnode/util/lib/security', () => {
  return {
    decrypt: mock(() => 'decrypt'),
    encrypt: mock(() => 'encrypt'),
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const cloneDeep = require('@abtnode/util/lib/deep-clone');
const { readJSONSync, removeSync, outputJsonSync } = require('fs-extra');
const { join } = require('path');
const security = require('@abtnode/util/lib/security');
const { BlockletExtrasRestore } = require('../../../../lib/blocklet/storage/restore/blocklet-extras');

describe(__filename, () => {
  const filename = 'blocklet-extras.json';
  const did = 'znkomkclejcfbjaxw9knzzebmzmqrxjnn9bb';
  const appSk = 'appSk';

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

  const newBlockletExtrasRestore = () => {
    /**
     * @type {BlockletExtrasRestore}
     */
    const blockletExtrasRestore = new BlockletExtrasRestore({
      endpoint: 'endpoint',
      appDid: did,
      password: 'password',
    });
    blockletExtrasRestore.restoreDir = __dirname;
    blockletExtrasRestore.appSk = appSk;

    return blockletExtrasRestore;
  };

  beforeEach(() => {
    mock.clearAllMocks();
  });

  describe('#import', () => {
    test('should work', async () => {
      const blockletExtrasRestore = newBlockletExtrasRestore();
      /** @type {import('@blocklet/server-js').BlockletState} */
      const testBlockletExtra = cloneDeep(blockletExtra);

      readJSONSync.mockReturnValue(testBlockletExtra);
      security.decrypt.mockReturnValue('decrypt');

      await blockletExtrasRestore.import({ salt: '123' });

      expect(readJSONSync).toBeCalledWith(join(blockletExtrasRestore.restoreDir, filename));

      expect(security.decrypt).toBeCalledWith('secure_value', '123', blockletExtrasRestore.input.password);
      expect(removeSync).toBeCalledWith(join(blockletExtrasRestore.restoreDir, filename));

      const finalBlockletExtra = cloneDeep(blockletExtra);
      finalBlockletExtra.configs[1].value = 'decrypt';

      expect(outputJsonSync).toBeCalledWith(join(blockletExtrasRestore.restoreDir, filename), finalBlockletExtra);
    });

    test('should work when configs is null', async () => {
      const blockletExtrasRestore = newBlockletExtrasRestore();
      /** @type {import('@blocklet/server-js').BlockletState} */
      const testBlockletExtra = cloneDeep(blockletExtra);
      testBlockletExtra.configs = null;

      readJSONSync.mockReturnValue(testBlockletExtra);
      security.decrypt.mockReturnValue('decrypt');

      await blockletExtrasRestore.import({ salt: '123' });

      expect(readJSONSync).toBeCalledWith(join(blockletExtrasRestore.restoreDir, filename));

      expect(security.decrypt).toBeCalledTimes(0);
      expect(removeSync).toBeCalledWith(join(blockletExtrasRestore.restoreDir, filename));

      const finalBlockletExtra = cloneDeep(blockletExtra);
      finalBlockletExtra.configs = null;

      expect(outputJsonSync).toBeCalledWith(join(blockletExtrasRestore.restoreDir, filename), finalBlockletExtra);
    });
  });

  describe('#getInstallParams', () => {
    it('should work', async () => {
      const blockletExtrasRestore = newBlockletExtrasRestore();

      const installParams = await blockletExtrasRestore.getInstallParams();

      expect(installParams).toEqual({ appSk });
    });
  });
});
