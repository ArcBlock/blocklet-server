const { test, expect, describe, mock, afterAll } = require('bun:test');

const realFs = require('fs-extra');

mock.module('fs-extra', () => {
  return {
    ...realFs,
    createReadStream: mock(),
    createWriteStream: mock(),
    ensureDir: mock(),
    outputJson: mock(),
  };
});
mock.module('@abtnode/util/lib/logo', () => {
  return {
    getLogoUrl: mock(() => 'logo.png'),
  };
});
mock.module('stream-to-promise', () => {
  return {
    __esModule: true,
    default: mock(() => 'ok'),
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { BlockletExport } = require('../../../../lib/blocklet/storage/export/blocklet-export');

describe('BlockletExport', () => {
  const did = 'znkomkclejcfbjaxw9knzzebmzmqrxjnn9bb';
  const blocklet = {
    id: 123,
    createdAt: 123,
    startedAt: 123,
    installedAt: 123,
    status: 'installed',
    ports: [80],
    environments: [{ key: 'BLOCKLET_APP_DIR', value: __dirname }],
    meta: { did, name: 'test-blocklet', logo: 'logo.png' },
    children: [{ status: 'installed', ports: [801], environments: [] }],
    migratedFrom: [{ appSk: 'plain-sk-value' }],
  };

  const newExport = () => {
    const instance = new BlockletExport({ did });
    instance.backupDir = __dirname;
    instance.blocklet = blocklet;
    instance.serverDir = __dirname;
    instance.securityContext = { encrypt: mock(() => 'should-not-be-called') };
    return instance;
  };

  describe('#ensureParams + cleanData', () => {
    test('should set appDid and appPid for non-migrated blocklet without appPid', () => {
      const instance = newExport();
      // Simulate exporter with wallet-derived appDid
      const exporter = {
        blocklet,
        serverDir: __dirname,
        backupDir: __dirname,
        securityContext: { encrypt: mock(() => 'should-not-be-called') },
        appDid: 'z1WalletDerivedAddress',
      };
      instance.ensureParams(exporter);

      const clone = instance.cleanData();
      expect(clone.appDid).toEqual('z1WalletDerivedAddress');
      expect(clone.appPid).toEqual('z1WalletDerivedAddress');
    });

    test('should preserve appPid for migrated blocklet (appPid differs from exportAppDid)', () => {
      const migratedBlocklet = {
        ...blocklet,
        appDid: 'zCurrentWalletAddr',
        appPid: 'zOriginalPermanentDid',
        migratedFrom: [{ appSk: 'old-sk', appDid: 'zOriginalPermanentDid', at: '2025-01-01' }],
      };
      const instance = new BlockletExport({ did });
      const exporter = {
        blocklet: migratedBlocklet,
        serverDir: __dirname,
        backupDir: __dirname,
        securityContext: { encrypt: mock(() => 'should-not-be-called') },
        appDid: 'zCurrentWalletAddr',
      };
      instance.ensureParams(exporter);

      const clone = instance.cleanData();
      expect(clone.appDid).toEqual('zCurrentWalletAddr');
      expect(clone.appPid).toEqual('zOriginalPermanentDid');
    });

    test('should preserve original appDid when exportAppDid is not set', () => {
      const instance = newExport();
      const clone = instance.cleanData();
      // appDid is not set on blocklet, so it should remain undefined
      expect(clone.appDid).toBeUndefined();
    });
  });

  describe('#encrypt', () => {
    test('should NOT encrypt migratedFrom.appSk (keep plaintext)', () => {
      const instance = newExport();
      const info = {
        migratedFrom: [{ appSk: 'my-secret-key' }],
      };
      const result = instance.encrypt(info);

      expect(result.migratedFrom[0].appSk).toEqual('my-secret-key');
      expect(instance.securityContext.encrypt).not.toHaveBeenCalled();
    });

    test('should handle undefined input', () => {
      const instance = newExport();
      expect(instance.encrypt(undefined)).toEqual(undefined);
    });

    test('should handle input without migratedFrom', () => {
      const instance = newExport();
      const info = { someField: 'value' };
      const result = instance.encrypt(info);
      expect(result).toEqual({ someField: 'value' });
    });
  });
});
