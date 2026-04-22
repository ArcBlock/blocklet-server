const { test, expect, describe, mock, afterAll, afterEach } = require('bun:test');
const path = require('path');
const fs = require('fs-extra');

const mockZipToDir = mock(() => Promise.resolve());

mock.module('../../../../lib/blocklet/manager/helper/install-application-from-backup', () => ({
  installApplicationFromBackup: mock(() => Promise.resolve({ meta: { did: 'test-did' } })),
}));
mock.module('../../../../lib/blocklet/storage/utils/zip', () => ({
  zipToDir: mockZipToDir,
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const {
  installApplicationFromBackup,
} = require('../../../../lib/blocklet/manager/helper/install-application-from-backup');
const { BlockletImporter } = require('../../../../lib/blocklet/storage/import/importer');

describe('BlockletImporter', () => {
  const testDir = path.join(__dirname, 'tmp-import-test');

  const createTestExportDir = (meta = {}) => {
    fs.ensureDirSync(testDir);

    const defaultMeta = {
      version: 1,
      exportedAt: new Date().toISOString(),
      sourceServerDid: 'z1server-did',
      blockletDid: 'z1blocklet-did',
      blockletName: 'test-blocklet',
      blockletTitle: 'Test Blocklet',
      blockletVersion: '1.0.0',
      structVersion: 2,
      appSk: 'test-app-sk-hex',
      appDid: 'z1app-did',
      ...meta,
    };
    fs.writeJSONSync(path.join(testDir, 'export-meta.json'), defaultMeta);
    fs.writeJSONSync(path.join(testDir, 'blocklet.json'), { meta: { did: 'z1blocklet-did' } });
    fs.writeJSONSync(path.join(testDir, 'blocklet-extras.json'), { did: 'z1blocklet-did', configs: [] });
    fs.writeJSONSync(path.join(testDir, 'routing_rule.json'), {});

    return defaultMeta;
  };

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.removeSync(testDir);
    }
    mock.clearAllMocks();
  });

  describe('constructor', () => {
    test('should throw if inputDir does not exist', () => {
      expect(() => new BlockletImporter({ inputDir: '/nonexistent/path', manager: {}, states: {} })).toThrow(
        'Input directory does not exist'
      );
    });
  });

  describe('#readExportMeta', () => {
    test('should read export-meta.json', () => {
      createTestExportDir();
      const importer = new BlockletImporter({ inputDir: testDir, manager: {}, states: {} });
      const meta = importer.readExportMeta();
      expect(meta.version).toEqual(1);
      expect(meta.appSk).toEqual('test-app-sk-hex');
    });

    test('should throw if export-meta.json is missing', () => {
      fs.ensureDirSync(testDir);
      const importer = new BlockletImporter({ inputDir: testDir, manager: {}, states: {} });
      expect(() => importer.readExportMeta()).toThrow('Export metadata not found');
    });
  });

  describe('#validate', () => {
    test('should pass for valid meta with required files', () => {
      createTestExportDir();
      const importer = new BlockletImporter({ inputDir: testDir, manager: {}, states: {} });
      const meta = importer.readExportMeta();
      expect(() => importer.validate(meta)).not.toThrow();
    });

    test('should throw if version is missing', () => {
      createTestExportDir({ version: undefined });
      const importer = new BlockletImporter({ inputDir: testDir, manager: {}, states: {} });
      const meta = importer.readExportMeta();
      expect(() => importer.validate(meta)).toThrow('missing version');
    });

    test('should throw if appSk is missing', () => {
      createTestExportDir({ appSk: undefined });
      const importer = new BlockletImporter({ inputDir: testDir, manager: {}, states: {} });
      const meta = importer.readExportMeta();
      expect(() => importer.validate(meta)).toThrow('missing appSk');
    });

    test('should throw if required file is missing', () => {
      createTestExportDir();
      fs.removeSync(path.join(testDir, 'blocklet.json'));
      const importer = new BlockletImporter({ inputDir: testDir, manager: {}, states: {} });
      const meta = importer.readExportMeta();
      expect(() => importer.validate(meta)).toThrow('Required file missing');
    });
  });

  describe('#extractBundleZips', () => {
    test('should skip if no blocklets directory exists', async () => {
      createTestExportDir();
      const importer = new BlockletImporter({ inputDir: testDir, manager: {}, states: {} });
      await expect(importer.extractBundleZips()).resolves.toBeUndefined();
    });

    test('should extract zip files in blocklets directory', async () => {
      createTestExportDir();
      const blockletsDir = path.join(testDir, 'blocklets', 'test-blocklet');
      fs.ensureDirSync(blockletsDir);
      fs.writeFileSync(path.join(blockletsDir, '1.0.0.zip'), 'fake-zip-content');

      const importer = new BlockletImporter({ inputDir: testDir, manager: {}, states: {} });
      await importer.extractBundleZips();

      expect(mockZipToDir).toHaveBeenCalledTimes(1);
      expect(mockZipToDir.mock.calls[0][0]).toContain('1.0.0.zip');
      expect(mockZipToDir.mock.calls[0][1]).toContain('1.0.0');
      expect(mockZipToDir.mock.calls[0][1]).not.toContain('.zip');
    });
  });

  describe('#import', () => {
    test('should call installApplicationFromBackup with correct params', async () => {
      const meta = createTestExportDir();
      const mockManager = { name: 'mock-manager' };
      const mockStates = { name: 'mock-states' };

      const importer = new BlockletImporter({
        inputDir: testDir,
        manager: mockManager,
        states: mockStates,
      });

      await importer.import();

      expect(installApplicationFromBackup).toHaveBeenCalledWith({
        url: `file://${testDir}`,
        appSk: meta.appSk,
        moveDir: false,
        manager: mockManager,
        states: mockStates,
        sync: true,
        context: { startImmediately: false, skipHooks: true },
      });
    });
  });
});
