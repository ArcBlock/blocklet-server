const { test, expect, describe, mock, afterEach, spyOn, beforeEach, afterAll } = require('bun:test');

mock.module('../../../../lib/blocklet/storage/utils/zip', () => {
  return {
    dirToZip: mock(),
  };
});
mock.module('../../../../lib/blocklet/storage/utils/hash', () => {
  return {
    compareAndMove: mock(),
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { removeSync, existsSync, outputJSONSync } = require('fs-extra');
const { join } = require('path');
const { BlockletsBackup } = require('../../../../lib/blocklet/storage/backup/blocklets');
const { dirToZip } = require('../../../../lib/blocklet/storage/utils/zip');
const { compareAndMove } = require('../../../../lib/blocklet/storage/utils/hash');

describe('backup blocklets', () => {
  const backupDir = __dirname;
  const serverDir = __dirname;
  const did = 'znkomkclejcfbjaxw9knzzebmzmqrxjnn9bb';
  const backupPath = join(backupDir, 'blocklets.zip');
  /** @type {import('@blocklet/server-js').BlockletState} */
  const blocklet = {
    _id: 1234547566,
    createdAt: 1234547566,
    startedAt: 1234547566,
    installedAt: 1234547566,
    status: 'installed',
    ports: [80],
    environments: [],
    meta: {
      did,
    },
    children: [
      {
        status: 'installed',
        ports: [801],
        environments: [],
      },
    ],
  };

  const newBlockletsBackup = () => {
    /**
     * @type {BlockletsBackup}
     */
    const blockletsBackup = new BlockletsBackup({
      did,
    });
    blockletsBackup.backupDir = backupDir;
    blockletsBackup.blocklet = blocklet;
    blockletsBackup.serverDir = serverDir;
    blockletsBackup.blockletWallet = {
      address: 'address',
      secretKey: 'secretKey',
    };

    return blockletsBackup;
  };

  beforeEach(() => {
    spyOn(console, 'info').mockReturnValue();
  });

  describe('#export', () => {
    test('should work when blocklets is empty', async () => {
      const blockletsBackup = newBlockletsBackup();
      const dirsToZipSpy = spyOn(blockletsBackup, 'dirsToZip').mockResolvedValue();

      await blockletsBackup.export();

      expect(dirsToZipSpy).toBeCalledWith([]);
    });

    test('should work when blocklets exists', async () => {
      const blockletsBackup = newBlockletsBackup();

      blockletsBackup.blocklet.meta.bundleName = 'spaces';
      blockletsBackup.blocklet.meta.version = '1.8.8';

      const dirsToZipSpy = spyOn(blockletsBackup, 'dirsToZip').mockResolvedValue();

      await blockletsBackup.export();

      expect(dirsToZipSpy).toBeCalledWith([
        {
          sourceDir: join(serverDir, 'blocklets', 'spaces', '1.8.8'),
          zipPath: join(backupDir, 'blocklets', 'spaces', '1.8.8.zip'),
        },
      ]);
    });
  });

  describe('#dirsToZip', () => {
    test('should work', async () => {
      const blockletsBackup = newBlockletsBackup();

      const sourceDir = join(__dirname, 'blocklets');
      const zipPath = join(__dirname, 'blocklets.zip');

      /** @type {Array<{sourceDir: string, zipPath: string}>}  */
      const dirs = [
        {
          sourceDir,
          zipPath,
        },
      ];

      outputJSONSync(join(sourceDir, 'demo.txt'), []);
      outputJSONSync(zipPath, []);

      await blockletsBackup.dirsToZip(dirs);

      expect(dirToZip).toHaveBeenCalledWith(sourceDir, `${zipPath}.bak`);
      expect(compareAndMove).toHaveBeenCalledWith(`${zipPath}.bak`, zipPath);
    });
  });

  afterEach(() => {
    if (existsSync(backupPath)) {
      removeSync(backupPath);
    }
  });
});
