const { test, expect, describe, mock, afterAll } = require('bun:test');

const realFs = require('fs-extra');

mock.module('fs-extra', () => {
  return {
    ...realFs,
    copy: mock(),
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { copy } = require('fs-extra');
const { join } = require('path');
const { DataBackup } = require('../../../../lib/blocklet/storage/backup/data');

describe(__filename, () => {
  const serverDir = __dirname;
  const backupDir = join(__dirname, 'data-backup');
  const did = 'znkomkclejcfbjaxw9knzzebmzmqrxjnn9bb';
  /** @type {import('@blocklet/server-js').BlockletState} */
  const blocklet = {
    meta: {
      did,
      name: 'spaces',
    },
  };
  const blockletDataDir = join(serverDir, 'data', blocklet.meta.name);
  const blockletBackupDataDir = join(backupDir, 'data');

  const newDataBackup = () => {
    /**
     * @type {DataBackup}
     */
    const dataBackup = new DataBackup({
      did,
    });
    dataBackup.backupDir = backupDir;
    dataBackup.blocklet = blocklet;
    dataBackup.serverDir = __dirname;
    dataBackup.blockletWallet = {
      address: 'address',
      secretKey: 'secretKey',
    };

    return dataBackup;
  };

  describe('#export', () => {
    test('should work', async () => {
      const dataBackup = newDataBackup();

      await dataBackup.export();

      expect(copy).toBeCalledWith(blockletDataDir, blockletBackupDataDir, { overwrite: true });
    });
  });
});
