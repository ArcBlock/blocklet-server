/* eslint-disable no-await-in-loop */
/* eslint-disable no-shadow */
/**
 * BlockletManager Config Tests
 * Tests for configuration, reset, list, and get operations
 */

const { test, expect, describe, beforeEach, beforeAll, afterAll, afterEach } = require('bun:test');
const { fromRandom } = require('@ocap/wallet');
const { types } = require('@ocap/mcrypto');

const {
  createTestContext,
  createAppWallet,
  states,
  DEFAULT_SERVER,
  staticDemoDid,
  staticDemoUrl,
  mainBlockletDid,
  subBlockletDid,
  fs,
  path,
} = require('./disk-test-setup');

describe('BlockletManager - Config', () => {
  const testCtx = createTestContext();
  let manager;
  let context;
  let instance;
  let waitForRemoved;
  let remove;

  beforeAll(async () => {
    const result = await testCtx.setup();
    manager = result.manager;
    context = result.context;
    instance = testCtx.getInstance();
    waitForRemoved = result.waitForRemoved;
    remove = result.remove;
  });

  beforeEach(async () => {
    await testCtx.beforeEachCleanup();
  });

  afterEach(async () => {
    await testCtx.afterEachCleanup();
  });

  afterAll(async () => {
    await testCtx.teardown();
  });

  describe('Config Validation', () => {
    test('should throw error if configs is not an array', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;

      await expect(manager.config({ did: appDid })).rejects.toThrow(/configs list is not an array/i);
      await expect(manager.config({ did: appDid, configs: null })).rejects.toThrow(/configs list is not an array/i);
      await expect(manager.config({ did: appDid, configs: {} })).rejects.toThrow(/configs list is not an array/i);
    });
  });

  describe('Config Operations', () => {
    test('should config blocklet as expected', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${staticDemoDid}/blocklet.json`;
      await manager.install({ url, appSk, sync: true }, context);

      const { configObj: env1 } = await manager.ensureBlocklet(appDid);
      expect(env1.TEST_ENV).toBe(undefined);

      await manager.config({
        did: appDid,
        configs: [
          {
            key: 'TEST_ENV',
            value: 'test_value',
            custom: true,
          },
        ],
      });

      const { configObj: env2 } = await manager.ensureBlocklet(appDid);
      expect(env2.TEST_ENV).toBe('test_value');

      await remove({ did: appDid });
    }, 20_000);

    test('should config and reset blocklet as expected', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: staticDemoUrl, appSk, sync: true }, context);

      // Config custom env
      await manager.config({
        did: appDid,
        configs: [{ key: 'TEST_ENV', value: 'abc', custom: true }],
      });

      const { configObj: env2 } = await manager.ensureBlocklet(appDid);
      expect(env2.TEST_ENV).toBe('abc');

      // Config app name and description
      await manager.config({
        did: appDid,
        configs: [
          { key: 'BLOCKLET_APP_NAME', value: 'custom name' },
          { key: 'BLOCKLET_APP_DESCRIPTION', value: 'custom description' },
        ],
      });

      const { meta: meta21 } = await manager.ensureBlocklet(appDid);
      expect(meta21.title).toBe('custom name');
      expect(meta21.description).toBe('custom description');

      // Reset should clear custom configs
      await manager.reset({ did: appDid }, { refreshRouterProvider: false });

      const { configObj: env3 } = await manager.ensureBlocklet(appDid);
      expect(env3.TEST_ENV).toBeUndefined();

      await remove({ did: appDid });
    }, 20_000);

    test('should config and rotate app sk as expected', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: staticDemoUrl, appSk, sync: true }, context);

      const oldB = await manager.ensureBlocklet(appDid);
      expect(oldB.appDid).toBeTruthy();
      expect(oldB.appPid).toEqual(oldB.appDid);
      expect(oldB.migratedFrom).toEqual([]);

      const migrateTo = fromRandom({ role: types.RoleType.ROLE_APPLICATION });

      const newB = await manager.config({
        skipDidDocument: true,
        did: appDid,
        configs: [{ key: 'BLOCKLET_APP_SK', value: migrateTo.secretKey }],
      });

      expect(newB.appDid).not.toEqual(oldB.appDid);
      expect(newB.appPid).toEqual(oldB.appPid);
      expect(newB.migratedFrom.length).toEqual(1);
      expect(newB.migratedFrom.find((x) => x.appDid === oldB.appDid)).toBeTruthy();

      await remove({ did: appDid });
    }, 20_000);

    test('should config and reset component as expected', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${mainBlockletDid}/blocklet.json`;

      await manager.install({ url, appSk, sync: true }, context);

      const b1 = await manager.ensureBlocklet(appDid);
      expect(b1.children.length).toBe(2);
      expect(b1.children[0].meta.name).toBe('main-blocklet');
      expect(b1.children[1].meta.name).toBe('sub-blocklet');

      // Config parent component
      await manager.config({
        did: [appDid, mainBlockletDid],
        configs: [{ key: 'TEST_PARENT', value: 'test-parent', custom: true }],
      });

      // Config child component
      await manager.config({
        did: [appDid, subBlockletDid],
        configs: [{ key: 'TEST_CHILD', value: 'test-child', custom: true }],
      });

      const b2 = await manager.ensureBlocklet(appDid);
      expect(b2.children[1].configObj.TEST_CHILD).toBe('test-child');
      expect(b2.children[0].configObj.TEST_PARENT).toBe('test-parent');

      // Reset child only
      await manager.reset({ did: appDid, childDid: subBlockletDid });

      const b3 = await manager.ensureBlocklet(appDid);
      expect(b3.children[1].configObj.TEST_CHILD).toBeUndefined();
      expect(b3.children[0].configObj.TEST_PARENT).toBe('test-parent');

      await remove({ did: appDid });
    }, 20_000);
  });

  describe('Remove', () => {
    test('Should remove blocklet', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${staticDemoDid}/blocklet.json`;
      await manager.install({ url, appSk, sync: true }, context);

      await manager.delete({ did: appDid, keepData: false }, context);
      await waitForRemoved(appDid);

      const b = await states.blocklet.getBlocklet(appDid);
      expect(b).toBeFalsy();
    }, 20_000);

    test('Should remove blocklet and keep data', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${staticDemoDid}/blocklet.json`;
      await manager.install({ url, appSk, sync: true }, context);
      const b1 = await states.blocklet.getBlocklet(appDid);

      await manager.delete({ did: appDid, keepData: true }, context);
      await waitForRemoved(appDid);

      // Data directory should still exist
      const dataDir = path.join(instance.dataDirs.data, b1.meta.name);
      const exists = await fs.pathExists(dataDir);
      expect(exists).toBe(true);

      // Cleanup
      await fs.remove(dataDir);
    }, 20_000);

    test('Should remove blocklet and keep logs only', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: staticDemoUrl, appSk, sync: true }, context);
      const {
        env: { logsDir, dataDir },
      } = await manager.ensureBlocklet(appDid);

      expect(fs.existsSync(logsDir)).toBe(true);
      expect(fs.existsSync(dataDir)).toBe(true);

      await manager.delete({ did: appDid, keepLogsDir: false }, context);
      await waitForRemoved(appDid);

      expect(fs.existsSync(logsDir)).toBe(false);
      expect(fs.existsSync(dataDir)).toBe(true);

      // Cleanup
      await fs.remove(dataDir);
    }, 20_000);

    test('Should remove blocklet configs only', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: staticDemoUrl, appSk, sync: true }, context);
      expect(await states.blockletExtras.getConfigs(appDid)).toBeTruthy();

      await manager.delete({ did: appDid, keepConfigs: false }, context);
      await waitForRemoved(appDid);

      expect(await states.blockletExtras.getConfigs(appDid)).toBeFalsy();
    }, 20_000);

    test('Should remove all blocklet data', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: staticDemoUrl, appSk, sync: true }, context);
      const {
        env: { logsDir, dataDir },
      } = await manager.ensureBlocklet(appDid);

      await manager.delete({ did: appDid, keepData: false }, context);
      await waitForRemoved(appDid);

      expect(fs.existsSync(logsDir)).toBe(false);
      expect(fs.existsSync(dataDir)).toBe(false);
      expect(await states.blockletExtras.getConfigs(appDid)).toBeFalsy();
    }, 20_000);
  });

  describe('List and Get', () => {
    test('Should list blocklets', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${staticDemoDid}/blocklet.json`;
      await manager.install({ url, appSk, sync: true }, context);

      const result = await manager.list({ includeRuntimeInfo: false }, context);
      expect(result.blocklets.length).toBeGreaterThan(0);
      expect(result.blocklets.some((b) => b.meta.did === appDid)).toBe(true);

      await remove({ did: appDid });
    }, 20_000);

    test('Should get blocklet', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${staticDemoDid}/blocklet.json`;
      await manager.install({ url, appSk, sync: true }, context);

      const b = await manager.getBlocklet(appDid);
      expect(b.meta.did).toEqual(appDid);
      expect(b.children[0].meta.did).toEqual(staticDemoDid);

      await remove({ did: appDid });
    }, 20_000);

    test('Should get blocklet detail with cache', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: staticDemoUrl, appSk, sync: true }, context);

      await manager.config({
        did: appDid,
        configs: [{ key: 'TEST_CACHE', value: '1', custom: true }],
      });

      const b10 = await manager.detail({ did: appDid, useCache: true });
      expect(b10.configObj.TEST_CACHE).toBe('1');

      const b11 = await manager.detail({ did: appDid, useCache: true });
      expect(b11.configObj.TEST_CACHE).toBe('1');

      await manager.config({
        did: appDid,
        configs: [{ key: 'TEST_CACHE', value: '2', custom: true }],
      });

      const b12 = await manager.detail({ did: appDid, useCache: true });
      // Cache should be updated
      expect(b12.configObj.TEST_CACHE).toBe('2');

      await remove({ did: appDid });
    }, 20_000);
  });

  describe('Backup', () => {
    test('Should get blocklet backups', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${staticDemoDid}/blocklet.json`;
      await manager.install({ url, appSk, sync: true }, context);

      const backups = await manager.getBlockletBackups({ did: appDid }, context);
      expect(Array.isArray(backups)).toBe(true);

      await remove({ did: appDid });
    }, 20_000);
  });

  describe('Crons', () => {
    test('Should get crons', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${staticDemoDid}/blocklet.json`;
      await manager.install({ url, appSk, sync: true }, context);

      const crons = await manager.getCrons({ did: appDid }, context);
      expect(Array.isArray(crons)).toBe(true);

      await remove({ did: appDid });
    }, 20_000);
  });

  describe('SubService Settings', () => {
    test('should update valid sub-service settings', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${staticDemoDid}/blocklet.json`;
      await manager.install({ url, appSk, sync: true }, context);

      await manager.updateBlockletSettings(
        {
          did: appDid,
          subService: {
            enabled: true,
            domain: '*.sites.example.com',
            staticRoot: 'sites',
          },
        },
        context
      );

      const settings = await states.blockletExtras.getSettings(appDid);
      expect(settings.subService.enabled).toBe(true);
      expect(settings.subService.domain).toBe('*.sites.example.com');
      expect(settings.subService.staticRoot).toBe('sites');

      await remove({ did: appDid });
    }, 20_000);

    test('should update sub-service settings with single domain', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${staticDemoDid}/blocklet.json`;
      await manager.install({ url, appSk, sync: true }, context);

      await manager.updateBlockletSettings(
        {
          did: appDid,
          subService: {
            enabled: true,
            domain: 'static.example.com',
            staticRoot: 'public',
          },
        },
        context
      );

      const settings = await states.blockletExtras.getSettings(appDid);
      expect(settings.subService.domain).toBe('static.example.com');
      expect(settings.subService.staticRoot).toBe('public');

      await remove({ did: appDid });
    }, 20_000);

    test('should reject path traversal in staticRoot', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${staticDemoDid}/blocklet.json`;
      await manager.install({ url, appSk, sync: true }, context);

      await expect(
        manager.updateBlockletSettings(
          {
            did: appDid,
            subService: {
              enabled: true,
              domain: '*.sites.example.com',
              staticRoot: '../../../etc',
            },
          },
          context
        )
      ).rejects.toThrow(/path cannot contain/i);

      await remove({ did: appDid });
    }, 20_000);

    test('should reject absolute path in staticRoot', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${staticDemoDid}/blocklet.json`;
      await manager.install({ url, appSk, sync: true }, context);

      await expect(
        manager.updateBlockletSettings(
          {
            did: appDid,
            subService: {
              enabled: true,
              domain: '*.sites.example.com',
              staticRoot: '/etc/passwd',
            },
          },
          context
        )
      ).rejects.toThrow(/path cannot contain/i);

      await remove({ did: appDid });
    }, 20_000);

    test('should reject hidden path traversal in staticRoot', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${staticDemoDid}/blocklet.json`;
      await manager.install({ url, appSk, sync: true }, context);

      await expect(
        manager.updateBlockletSettings(
          {
            did: appDid,
            subService: {
              enabled: true,
              domain: '*.sites.example.com',
              staticRoot: 'sites/../../../etc',
            },
          },
          context
        )
      ).rejects.toThrow(/path cannot contain/i);

      await remove({ did: appDid });
    }, 20_000);

    test('should allow disabling sub-service', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${staticDemoDid}/blocklet.json`;
      await manager.install({ url, appSk, sync: true }, context);

      // Enable first
      await manager.updateBlockletSettings(
        {
          did: appDid,
          subService: {
            enabled: true,
            domain: '*.sites.example.com',
            staticRoot: 'sites',
          },
        },
        context
      );

      // Then disable
      await manager.updateBlockletSettings(
        {
          did: appDid,
          subService: {
            enabled: false,
            domain: '',
            staticRoot: '',
          },
        },
        context
      );

      const settings = await states.blockletExtras.getSettings(appDid);
      expect(settings.subService.enabled).toBe(false);

      await remove({ did: appDid });
    }, 20_000);

    test('should require domain and staticRoot when enabled', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${staticDemoDid}/blocklet.json`;
      await manager.install({ url, appSk, sync: true }, context);

      // Missing domain
      await expect(
        manager.updateBlockletSettings(
          {
            did: appDid,
            subService: {
              enabled: true,
              staticRoot: 'sites',
            },
          },
          context
        )
      ).rejects.toThrow(/required/i);

      // Missing staticRoot
      await expect(
        manager.updateBlockletSettings(
          {
            did: appDid,
            subService: {
              enabled: true,
              domain: '*.sites.example.com',
            },
          },
          context
        )
      ).rejects.toThrow(/required/i);

      await remove({ did: appDid });
    }, 20_000);
  });
});
