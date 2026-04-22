const { describe, test, expect, beforeAll, beforeEach, afterEach } = require('bun:test');
const os = require('os');
const path = require('path');
const dayjs = require('@abtnode/util/lib/dayjs');
const BackupState = require('../../lib/states/backup');

const { setupInMemoryModels } = require('../../tools/fixture');

describe('AccessKeyState', () => {
  let backup = null;
  let models = null;

  beforeAll(async () => {
    models = await setupInMemoryModels();
  });

  beforeEach(() => {
    backup = new BackupState(models.Backup);
  });

  afterEach(async () => {
    await backup.reset();
  });

  const did = 'zNKagKrhPaQp79zffNngHYKkBEp7sWz72gp6';

  const backupRawData = {
    appPid: did,
    userDid: 'zNKagKrhPaQp79zffNngHYKkBEp7sWz72gp6',
    strategy: 1,
    target: 'Spaces',
    sourceUrl: path.join(os.tmpdir(), did),
    targetName: 'DID Space',
    metadata: {},
  };

  describe('#start', () => {
    const backupStartRawData = {
      appPid: 'zNKagKrhPaQp79zffNngHYKkBEp7sWz72gp6',
      userDid: 'zNKagKrhPaQp79zffNngHYKkBEp7sWz72gp6',
      strategy: 1,
      sourceUrl: path.join(os.tmpdir(), 'backup', 'zNKagKrhPaQp79zffNngHYKkBEp7sWz72gp6'),
      targetName: 'DID Space',
    };

    test('should be started backup', async () => {
      const backupRecord = await backup.start(backupStartRawData);

      expect(backupRecord).toEqual(expect.objectContaining(backupStartRawData));
    });
  });

  describe('#success', () => {
    const backupStartRawData = {
      appPid: 'zNKagKrhPaQp79zffNngHYKkBEp7sWz72gp6',
      userDid: 'zNKagKrhPaQp79zffNngHYKkBEp7sWz72gp6',
      strategy: 1,
      sourceUrl: path.join(os.tmpdir(), 'backup', 'zNKagKrhPaQp79zffNngHYKkBEp7sWz72gp6'),
      targetName: 'DID Space',
    };
    const backupSuccessRawData = {
      targetUrl:
        'https://bbqaw5mgxc6fnihrwqcejcxvukkdgkk4anwxwk5msvm.did.abtnet.io/app/space/zNKhe8jwgNZX2z7ZUfwNddNECxSe3wyg7VtS/apps/zNKagKrhPaQp79zffNngHYKkBEp7sWz72gp6/explorer?key=/apps/zNKagKrhPaQp79zffNngHYKkBEp7sWz72gp6/.did-objects/zNKagKrhPaQp79zffNngHYKkBEp7sWz72gp6/',
    };

    test('backup should be success', async () => {
      const backupRecord = await backup.start(backupStartRawData);

      const [, [successBackup]] = await backup.success(backupRecord.id, backupSuccessRawData);

      expect(successBackup).toEqual(expect.objectContaining(backupStartRawData));
      expect(successBackup).toEqual(expect.objectContaining(backupSuccessRawData));
    });
  });

  describe('#fail', () => {
    const backupStartRawData = {
      appPid: 'zNKagKrhPaQp79zffNngHYKkBEp7sWz72gp6',
      userDid: 'zNKagKrhPaQp79zffNngHYKkBEp7sWz72gp6',
      strategy: 1,
      sourceUrl: path.join(os.tmpdir(), 'backup', 'zNKagKrhPaQp79zffNngHYKkBEp7sWz72gp6'),
      targetName: 'DID Space',
    };
    const backupFailRawData = {
      message: 'hello world',
    };

    test('backup should be fail', async () => {
      const backupRecord = await backup.start(backupStartRawData);

      const [, [successBackup]] = await backup.fail(backupRecord.id, backupFailRawData);

      expect(successBackup).toEqual(expect.objectContaining(backupStartRawData));
      expect(successBackup).toEqual(expect.objectContaining(backupFailRawData));
    });
  });

  describe('#create', () => {
    test('should be created', async () => {
      const backupRecord = await backup.create(backupRawData);
      expect(backupRecord).toEqual(expect.objectContaining(backupRawData));
    });

    test('throw an error when validate error', () => {
      expect(
        backup.create({
          ...backupRawData,
          appPid: 'error did',
        })
      ).rejects.toThrow('Expect "appPid" to be valid did');
    });
  });

  describe('#update', () => {
    test('should be updated', async () => {
      const backupCreated = await backup.create(backupRawData);
      const [, [backupUpdated]] = await backup.update(backupCreated, {
        $set: {
          targetUrl: '',
          status: 1,
        },
      });
      expect(backupUpdated).toEqual(
        expect.objectContaining({
          targetUrl: '',
          status: 1,
        })
      );
    });

    test('throw an error when validate error', () => {
      expect(
        backup.create({
          ...backupRawData,
          appPid: 'error did',
        })
      ).rejects.toThrow('Expect "appPid" to be valid did');
    });
  });

  describe('#getBlockletBackups', () => {
    test('should be work when backups are empty', async () => {
      expect(await backup.getBlockletBackups({ did })).toEqual([]);
    });

    test('should be work when backups are not empty', async () => {
      await backup.create(backupRawData);

      const backups = await backup.getBlockletBackups({
        did,
        startTime: dayjs().startOf('day').toISOString(),
        endTime: dayjs().endOf('day').toISOString(),
      });

      expect(backups.length).toEqual(1);
      expect(backups[0]).toEqual(expect.objectContaining(backupRawData));
    });
  });
});
