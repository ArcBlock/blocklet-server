const { test, expect, describe, afterEach } = require('bun:test');
const path = require('path');
const fs = require('fs-extra');

const {
  writeExportMeta,
  EXPORT_META_VERSION,
  EXPORT_META_FILENAME,
} = require('../../../../lib/blocklet/storage/export/export-meta');

describe('export-meta', () => {
  const outDir = path.join(__dirname, 'tmp-export-meta-test');

  afterEach(() => {
    if (fs.existsSync(outDir)) {
      fs.removeSync(outDir);
    }
  });

  describe('#writeExportMeta', () => {
    test('should write export-meta.json with correct fields', async () => {
      fs.ensureDirSync(outDir);

      const blocklet = {
        meta: {
          did: 'z1blocklet-did',
          name: 'test-blocklet',
          title: 'Test Blocklet',
          version: '1.0.0',
        },
        structVersion: 2,
      };

      const meta = await writeExportMeta({
        outDir,
        blocklet,
        serverDid: 'z1server-did',
        appSk: 'test-app-sk',
        appDid: 'z1app-did',
      });

      expect(meta.version).toEqual(EXPORT_META_VERSION);
      expect(meta.exportedAt).toBeDefined();
      expect(meta.sourceServerDid).toEqual('z1server-did');
      expect(meta.blockletDid).toEqual('z1blocklet-did');
      expect(meta.blockletName).toEqual('test-blocklet');
      expect(meta.blockletTitle).toEqual('Test Blocklet');
      expect(meta.blockletVersion).toEqual('1.0.0');
      expect(meta.structVersion).toEqual(2);
      expect(meta.appSk).toEqual('test-app-sk');
      expect(meta.appDid).toEqual('z1app-did');

      // Verify file was written
      const filePath = path.join(outDir, EXPORT_META_FILENAME);
      expect(fs.existsSync(filePath)).toBe(true);

      const written = fs.readJSONSync(filePath);
      expect(written.appSk).toEqual('test-app-sk');
      expect(written.version).toEqual(EXPORT_META_VERSION);
    });
  });

  describe('constants', () => {
    test('EXPORT_META_VERSION should be 1', () => {
      expect(EXPORT_META_VERSION).toEqual(1);
    });

    test('EXPORT_META_FILENAME should be export-meta.json', () => {
      expect(EXPORT_META_FILENAME).toEqual('export-meta.json');
    });
  });
});
