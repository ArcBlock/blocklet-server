const { test, expect, describe } = require('bun:test');
const { BaseRestore } = require('../../../../lib/blocklet/storage/restore/base');

describe(__filename, () => {
  const newBaseRestore = () => {
    /** @type {BaseRestore} */
    const baseRestore = new BaseRestore({ endpoint: '', appDid: '', password: Buffer.from('1234') });
    baseRestore.blocklet = __dirname;

    return baseRestore;
  };

  describe('#ensureParams', () => {
    test('should work', () => {
      const baseRestore = newBaseRestore();

      const spacesRestore = {
        restoreDir: __dirname,
        serverDir: __dirname,
      };

      baseRestore.ensureParams(spacesRestore);

      expect(baseRestore.restoreDir).toEqual(spacesRestore.restoreDir);
      expect(baseRestore.serverDir).toEqual(spacesRestore.serverDir);
    });
  });

  describe('#import', () => {
    test('should throw an error', async () => {
      const baseRestore = newBaseRestore();

      try {
        await baseRestore.import();
      } catch (error) {
        expect(error.message).toBe('not implemented');
      }
    });
  });

  describe('#getInstallParams', () => {
    test('should throw an error', () => {
      const baseRestore = newBaseRestore();

      expect(baseRestore.getInstallParams()).toEqual({});
    });
  });

  describe('#getImportParams', () => {
    test('should throw an error', () => {
      const baseRestore = newBaseRestore();

      expect(baseRestore.getImportParams()).toEqual({});
    });
  });
});
