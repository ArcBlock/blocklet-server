const { test, expect, describe, mock, afterAll } = require('bun:test');

const realFs = require('fs-extra');

mock.module('fs-extra', () => {
  return {
    ...realFs,
    existsSync: mock(),
    ensureDirSync: mock(),
    removeSync: mock(),
    remove: mock(),
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

const fastGlobMock = mock();
fastGlobMock.zipToDir = mock();
require.cache[require.resolve('fast-glob')] = {
  exports: fastGlobMock,
};

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
  delete require.cache[require.resolve('fast-glob')];
});

const { existsSync, remove, ensureDirSync } = require('fs-extra');
const { join } = require('path');
const fg = require('fast-glob');
const { BlockletsRestore } = require('../../../../lib/blocklet/storage/restore/blocklets');
const { zipToDir } = require('../../../../lib/blocklet/storage/utils/zip');

describe(__filename, () => {
  const filename = 'blocklets';
  const blockletZipPath = join(__dirname, filename);
  const newBlockletsRestore = () => {
    /** @type {BlockletsRestore} */
    const auditLogBackup = new BlockletsRestore({
      endpoint: '',
      appSk: '',
    });
    auditLogBackup.restoreDir = __dirname;
    auditLogBackup.filename = filename;
    auditLogBackup.blocklet = __dirname;

    return auditLogBackup;
  };

  describe('#import', () => {
    test('should work', async () => {
      const blockletsRestore = newBlockletsRestore();

      fg.mockResolvedValue(['test.zip']);
      existsSync.mockReturnValueOnce(true);
      existsSync.mockReturnValueOnce(false);

      await blockletsRestore.import();

      expect(ensureDirSync).toBeCalledWith('test');
      expect(zipToDir).toBeCalledWith('test.zip', 'test');
      expect(remove).toBeCalledWith('test.zip');
    });

    test('should throw an error when file not found', async () => {
      const blockletsRestore = newBlockletsRestore();

      existsSync.mockReturnValue(false);

      expect(await blockletsRestore.import()).toBeUndefined();

      expect(existsSync).toBeCalledWith(blockletZipPath);
      expect(ensureDirSync).toBeCalledWith(blockletZipPath);
    });
  });
});
