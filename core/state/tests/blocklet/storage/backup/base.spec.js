const { test, expect, describe } = require('bun:test');
const { BaseBackup } = require('../../../../lib/blocklet/storage/backup/base');

describe(__filename, () => {
  const newBaseRestore = () => {
    /** @type {BaseBackup} */
    const baseBackup = new BaseBackup({
      did: '',
    });

    return baseBackup;
  };

  describe('#ensureParams', () => {
    test('should work', () => {
      const baseBackup = newBaseRestore();

      const spacesBackup = {
        blocklet: {},
        backupDir: __dirname,
        serverDir: __dirname,
      };

      baseBackup.ensureParams(spacesBackup);

      expect(baseBackup.blocklet).toEqual(spacesBackup.blocklet);
      expect(baseBackup.backupDir).toEqual(spacesBackup.backupDir);
      expect(baseBackup.serverDir).toEqual(spacesBackup.serverDir);
    });
  });

  describe('#import', () => {
    test('should throw an error', async () => {
      const baseBackup = newBaseRestore();
      try {
        await baseBackup.export();
      } catch (error) {
        expect(error.message).toBe('not implemented');
      }
    });
  });
});
