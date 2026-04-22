const { test, expect, describe, mock, it, afterAll } = require('bun:test');
const realFs = require('fs-extra');

mock.module('fs-extra', () => {
  return {
    ...realFs,
    outputJsonSync: mock(),
    removeSync: mock(),
    readJSONSync: mock(),
  };
});

mock.module('node-stream-zip', () => {
  return {
    zipToDir: mock(),
  };
});

mock.module('../../../../lib/blocklet/storage/utils/zip', () => {
  return {
    zipToDir: mock(),
  };
});

mock.module('fast-glob', () => {
  return {
    zipToDir: mock(),
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { readJSONSync, removeSync, outputJsonSync } = require('fs-extra');
const { join } = require('path');
const { APP_STRUCT_VERSION } = require('@abtnode/constant');
const { spyOn } = require('bun:test');
const { BlockletRestore } = require('../../../../lib/blocklet/storage/restore/blocklet');

describe(__filename, () => {
  const filename = 'blocklet.json';
  const appDid = '233';
  const restoreDir = __dirname;
  const password = 'password';

  const newBlockletRestore = (...rest) => {
    /** @type {BlockletRestore} */
    const blockletRestore = new BlockletRestore({
      endpoint: '',
      appSk: '',
      password,
      ...rest,
    });
    blockletRestore.restoreDir = restoreDir;
    blockletRestore.filename = filename;

    return blockletRestore;
  };

  describe('#import', () => {
    test('should work', async () => {
      const blockletsRestore = newBlockletRestore();

      const mockBlocklet = {
        structVersion: APP_STRUCT_VERSION,
        appDid,
      };
      const params = {};
      spyOn(blockletsRestore, 'getBlocklet').mockReturnValue(mockBlocklet);
      spyOn(blockletsRestore, 'decrypt').mockReturnValue(mockBlocklet);

      await blockletsRestore.import(params);

      expect(blockletsRestore.getBlocklet).toBeCalled();
      expect(blockletsRestore.decrypt).toBeCalledWith(mockBlocklet, params);
      expect(removeSync).toBeCalledWith(join(restoreDir, filename));
      expect(outputJsonSync).toBeCalledWith(join(restoreDir, filename), mockBlocklet);
    });
  });

  describe('#getBlocklet', () => {
    it('should work', () => {
      readJSONSync.mockReturnValue({});

      const blockletsRestore = newBlockletRestore();

      expect(blockletsRestore.getBlocklet()).toEqual({});
    });
  });

  describe('#decrypt', () => {
    it('should work when blocklet.migratedFrom is  a array', () => {
      const blockletsRestore = newBlockletRestore();

      expect(
        blockletsRestore.decrypt(
          {
            migratedFrom: [
              {
                appSk: 'appSk',
              },
            ],
          },
          { salt: 'salt' }
        )
      ).toEqual({
        migratedFrom: [
          {
            appSk: '',
          },
        ],
      });
    });

    it('should work when blocklet.migratedFrom is not a array', () => {
      const blockletsRestore = newBlockletRestore();

      expect(blockletsRestore.decrypt(undefined)).toEqual(undefined);
      expect(blockletsRestore.decrypt({})).toEqual({});
    });
  });

  describe('#getImportParams', () => {
    it('should work', () => {
      const blockletsRestore = newBlockletRestore();
      spyOn(blockletsRestore, 'getBlocklet').mockReturnValue({
        structVersion: APP_STRUCT_VERSION,
        appDid,
      });

      expect(blockletsRestore.getImportParams()).toEqual({ salt: appDid });
    });

    it('should an error when blocklet.structVersion !== APP_STRUCT_VERSION', () => {
      const blockletsRestore = newBlockletRestore();
      spyOn(blockletsRestore, 'getBlocklet').mockReturnValue({
        appDid,
      });

      expect(() => blockletsRestore.getImportParams()).toThrow(
        'Only new version backup can be restored to this server'
      );
    });
  });
});
