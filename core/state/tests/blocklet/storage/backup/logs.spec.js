const { test, expect, describe, mock, afterAll } = require('bun:test');

const realFs = require('fs-extra');

mock.module('fs-extra', () => {
  return {
    ...realFs,
    copy: mock(),
    ensureDirSync: mock(),
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { copy, ensureDirSync } = require('fs-extra');
const { join } = require('path');
const { LogsBackup } = require('../../../../lib/blocklet/storage/backup/logs');

describe(__filename, () => {
  const serverDir = __dirname;
  const backupDir = join(__dirname);
  const did = 'znkomkclejcfbjaxw9knzzebmzmqrxjnn9bb';
  /** @type {import('@blocklet/server-js').BlockletState} */
  const blocklet = {
    meta: {
      did,
      name: 'spaces',
    },
  };
  const sourceLogsDir = join(serverDir, 'logs', blocklet.meta.name);
  const targetLogsDir = join(backupDir, 'logs');

  const newLogsBackup = () => {
    /**
     * @type {LogsBackup}
     */
    const logsBackup = new LogsBackup({
      did,
    });
    logsBackup.backupDir = backupDir;
    logsBackup.blocklet = blocklet;
    logsBackup.serverDir = serverDir;
    logsBackup.blockletWallet = {
      address: 'address',
      secretKey: 'secretKey',
    };

    return logsBackup;
  };

  describe('#export', () => {
    test('should work', async () => {
      const logsBackup = newLogsBackup();

      await logsBackup.export();

      expect(ensureDirSync).toBeCalledWith(join(serverDir, 'logs', blocklet.meta.name));

      expect(copy.mock.calls[0][0]).toEqual(sourceLogsDir);
      expect(copy.mock.calls[0][1]).toEqual(targetLogsDir);
      expect(copy.mock.calls[0][2]).toMatchObject({
        overwrite: true,
      });
    });
  });
});
