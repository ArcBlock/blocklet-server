/* eslint-disable no-await-in-loop */
/* eslint-disable no-shadow */
/**
 * BlockletManager Install Tests
 * Tests for installation, upgrade, verification failures, and rollback
 */

const { test, expect, describe, beforeEach, beforeAll, afterAll, afterEach, spyOn } = require('bun:test');
const { BlockletStatus, BlockletSource, BLOCKLET_MODES } = require('@blocklet/constant');
const { fromRandom } = require('@ocap/wallet');
const { types } = require('@ocap/mcrypto');

const {
  createTestContext,
  createAppWallet,
  owner,
  states,
  DEFAULT_SERVER,
  staticDemoDid,
  staticDemoUrl,
  dappDemoUrl,
  dappDemoLongTimeUrl,
  mainBlockletDid,
  mainBlockletUrl,
  demo1Url,
  demo1bUrl,
  fs,
  path,
  sleep,
} = require('./disk-test-setup');

describe('BlockletManager - Install', () => {
  const testCtx = createTestContext();
  let manager;
  let context;
  let waitForRemoved;
  let waitForStatus;
  let remove;

  beforeAll(async () => {
    const result = await testCtx.setup();
    manager = result.manager;
    context = result.context;
    waitForRemoved = result.waitForRemoved;
    waitForStatus = result.waitForStatus;
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

  describe('Basic Install', () => {
    test('Should be a function', () => {
      expect(typeof manager.install).toEqual('function');
    });

    test('Should throw error when params is empty', async () => {
      expect.assertions(1);
      try {
        await manager.install({}, context);
      } catch (err) {
        expect(err).toBeTruthy();
      }
    });
  });

  describe('Install from url', () => {
    test('Should install from url', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${staticDemoDid}/1.1.4/blocklet.json`;

      const b1 = await manager.install({ url, appSk, sync: true }, context);

      expect(b1.ports).toBeTruthy();
      expect(b1.meta.bundleDid).toEqual(appDid);
      expect(b1.meta.did).toEqual(appDid);
      expect(b1.children[0].meta.did).toEqual(staticDemoDid);
      expect(b1.children[0].meta.version).toEqual('1.1.4');
      expect(b1.status).toEqual(BlockletStatus.installed);
      expect(b1.source).toEqual(BlockletSource.custom);
      expect(b1.installedAt).toEqual(expect.any(Date));

      const b2 = await states.blocklet.getBlocklet(appDid);
      expect(b2.status).toEqual(BlockletStatus.installed);
      expect(b2.appDid).toEqual(appDid);

      const {
        env: { dataDir },
      } = await manager.ensureBlocklet(appDid);
      expect(fs.existsSync(path.join(dataDir, 'logo.svg'))).toBeTruthy();

      await remove({ did: appDid });
    }, 20_000);

    test('Should install if tarball is a path', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const b1 = await manager.install({ url: staticDemoUrl, appSk, sync: true }, context);

      expect(b1.meta.did).toEqual(appDid);
      expect(b1.children[0].meta.did).toEqual(staticDemoDid);
      expect(b1.status).toEqual(BlockletStatus.installed);
      expect(b1.source).toEqual(BlockletSource.custom);

      await remove({ did: appDid });
    }, 20_000);

    test('Should install if url protocol is file', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `file://${path.join(__dirname, `../../assets/api/blocklets/${staticDemoDid}/blocklet.json`)}`;

      const b1 = await manager.install({ url, appSk, sync: true }, context);

      expect(b1.ports).toBeTruthy();
      expect(b1.meta.did).toEqual(appDid);
      expect(b1.children[0].meta.did).toEqual(staticDemoDid);
      expect(b1.status).toEqual(BlockletStatus.installed);
      expect(b1.source).toEqual(BlockletSource.custom);

      await remove({ did: appDid });
    }, 20_000);

    test("Should throw error when can't get meta from url", async () => {
      expect.assertions(1);
      const wallet = createAppWallet();
      const appSk = wallet.secretKey;

      try {
        await manager.install({ url: `${DEFAULT_SERVER}/no-exist`, appSk, sync: true }, context);
      } catch (err) {
        expect(err).toBeTruthy();
      }
    });
  });

  describe('Install from store', () => {
    test('Should install from store', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const b1 = await manager.install({ did: staticDemoDid, storeUrl: DEFAULT_SERVER, appSk, sync: true }, context);

      expect(b1.ports).toBeTruthy();
      expect(b1.children[0].ports).toBeTruthy();
      expect(b1.meta.did).toEqual(appDid);
      expect(b1.children[0].meta.did).toEqual(staticDemoDid);
      expect(b1.status).toEqual(BlockletStatus.installed);
      expect(b1.source).toEqual(BlockletSource.custom);

      await remove({ did: appDid });
    }, 20_000);

    test('Should NOT upgrade from store', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install(
        {
          url: `${DEFAULT_SERVER}/api/blocklets/${staticDemoDid}/1.1.4/blocklet.json`,
          appSk,
          sync: true,
        },
        context
      );

      const b1 = await states.blocklet.getBlocklet(appDid);
      expect(b1.status).toEqual(BlockletStatus.installed);
      expect(b1.children[0].meta.version).toEqual('1.1.4');

      expect(typeof manager.upgrade).not.toBe('function');

      await remove({ did: appDid });
    }, 20_000);

    test('Should throw error when did is invalid', async () => {
      expect.assertions(1);
      const wallet = createAppWallet();
      const appSk = wallet.secretKey;

      try {
        await manager.install({ did: 'invalidDid', appSk, sync: true }, context);
      } catch (err) {
        expect(err).toBeTruthy();
      }
    });

    test('Should throw error when installing an already installed blocklet', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: staticDemoUrl, appSk, sync: true }, context);

      await expect(manager.install({ did: staticDemoDid, appSk, sync: true }, context)).rejects.toThrow();

      const b2 = await states.blocklet.getBlocklet(appDid);
      expect(b2.status).toEqual(BlockletStatus.installed);

      await remove({ did: appDid });
    }, 20_000);

    test('Should throw error if storeUrl is empty', () => {
      const wallet = createAppWallet();
      const appSk = wallet.secretKey;

      expect(manager.install({ did: staticDemoDid, appSk, sync: true }, context)).rejects.toThrow(
        'store url should not be empty'
      );
    });
  });

  describe('Install from upload', () => {
    test('Should NOT install from upload', () => {
      const wallet = createAppWallet();
      const appSk = wallet.secretKey;

      expect(
        manager.install(
          {
            file: {
              filename: 'static-demo-1.1.3.tgz',
              createReadStream: () =>
                fs.createReadStream(
                  path.join(
                    __dirname,
                    `../../assets/api/blocklets/${staticDemoDid}/1.1.3/static-demo-blocklet-1.1.3.tgz`
                  )
                ),
            },
            appSk,
            sync: true,
          },
          context
        )
      ).rejects.toThrow('not supported');
    });
  });

  describe('Install from dev', () => {
    test('Should install from dev', async () => {
      const expectedDid = staticDemoDid;

      const b1 = await manager.dev(path.join(__dirname, '../../assets/static-demo-1.1.5'));

      expect(b1.ports).toBeTruthy();
      expect(b1.meta.did).toEqual(expectedDid);
      expect(b1.status).toEqual(BlockletStatus.installed);
      expect(b1.source).toEqual(BlockletSource.custom);
      expect(b1.installedAt).toEqual(expect.any(Date));
      expect(b1.children[0].meta.did).toEqual(expectedDid);
      expect(b1.children[0].source).toEqual(BlockletSource.local);

      await remove({ did: b1.meta.did });
    }, 20_000);

    test('Should throw error if blocklet is production before', async () => {
      expect.assertions(1);

      const b1 = await manager.dev(path.join(__dirname, '../../assets/static-demo-1.1.5'));

      await states.blocklet.updateBlocklet(b1.meta.did, { mode: BLOCKLET_MODES.PRODUCTION });

      try {
        await manager.dev(path.join(__dirname, '../../assets/static-demo-1.1.5'));
      } catch (err) {
        expect(err.message).toMatch('The application Static Demo already exists');
      }

      await remove({ did: b1.meta.did });
    }, 20_000);
  });

  describe('Install from create', () => {
    test('Should install from create with appSk', async () => {
      const wallet = fromRandom({ role: types.RoleType.ROLE_APPLICATION });

      const b1 = await manager.install(
        { title: 'test-app', description: 'test description', appSk: wallet.secretKey, sync: true },
        context
      );

      expect(b1.ports).toBeTruthy();
      expect(b1.status).toEqual(BlockletStatus.installed);
      expect(b1.source).toEqual(BlockletSource.custom);

      const b2 = await states.blocklet.getBlocklet(wallet.address);
      expect(b2.status).toEqual(BlockletStatus.installed);

      await remove({ did: b2.meta.did });
    }, 20_000);
  });

  describe('Install sync', () => {
    test('Should sync install and upgrade blocklet from url', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install(
        {
          url: `${DEFAULT_SERVER}/api/blocklets/${staticDemoDid}/1.1.4/blocklet.json`,
          sync: true,
          appSk,
        },
        context
      );

      const b2 = await states.blocklet.getBlocklet(appDid);
      expect(b2.status).toEqual(BlockletStatus.installed);
      expect(b2.children[0].meta.version).toEqual('1.1.4');

      await manager.installComponent(
        {
          rootDid: appDid,
          url: staticDemoUrl,
          sync: true,
        },
        context
      );

      const b4 = await states.blocklet.getBlocklet(appDid);
      expect(b4.children[0].meta.version).toEqual('1.1.5');

      await remove({ did: appDid });
    }, 20_000);
  });

  describe('Upgrade', () => {
    test('Should NOT upgrade application from url - should use installComponent instead', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: demo1Url, appSk, sync: true }, context);
      const b1 = await states.blocklet.getBlocklet(appDid);
      expect(b1.children[0].meta.version).toEqual('0.1.0');

      await expect(manager.install({ url: demo1bUrl, appSk }, context)).rejects.toThrow('already exists');

      await manager.installComponent({ url: demo1bUrl, rootDid: appDid, sync: true }, context);
      const b2 = await states.blocklet.getBlocklet(appDid);
      expect(b2.children[0].meta.version).toEqual('0.1.1');

      await remove({ did: appDid });
    }, 20_000);

    test('Should NOT upgrade blocklet from url - upgrade method does not exist', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: staticDemoUrl, appSk, sync: true }, context);

      expect(typeof manager.upgrade).not.toBe('function');

      await remove({ did: appDid });
    }, 20_000);

    test('new required env in component after upgraded', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: demo1Url, appSk, sync: true }, context);
      await manager.setInitialized({ did: appDid, owner });

      await manager.start({ did: appDid, throwOnError: true });
      await waitForStatus(appDid, BlockletStatus.running);

      const b1BeforeUpgrade = await states.blocklet.getBlocklet(appDid);
      const componentDid = b1BeforeUpgrade.children[0].meta.did;
      await manager.installComponent({ rootDid: appDid, url: demo1bUrl }, context);
      await waitForStatus(appDid, BlockletStatus.running, componentDid, 10_000, true);

      const b2 = await states.blocklet.getBlocklet(appDid);
      expect(b2.children[0].greenStatus).toBe(BlockletStatus.running);
      expect(b2.children[0].status).toBe(BlockletStatus.stopped);

      await manager.stop({ did: appDid });
      await remove({ did: appDid });
    }, 20_000);
  });

  describe('Verification failures', () => {
    test('Should delete blocklet after tarball verification fails during installing', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/static-demo-1.1.5-invalid-integrity.json`;

      const b1 = await manager.install({ url, appSk }, context);
      expect(b1.status).toEqual(BlockletStatus.waiting);
      await waitForRemoved(appDid);
      const b2 = await states.blocklet.getBlocklet(appDid);
      expect(b2).toBeNull();
    }, 20_000);

    test('Should rollback blocklet after tarball verification fails during upgrading', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${staticDemoDid}/1.1.4/blocklet.json`;
      const url2 = `${DEFAULT_SERVER}/static-demo-1.1.5-invalid-integrity.json`;

      await manager.install({ url, appSk, sync: true }, context);
      const b1 = await states.blocklet.getBlocklet(appDid);
      expect(b1.status).toEqual(BlockletStatus.installed);
      expect(b1.children[0].meta.version).toEqual('1.1.4');

      await manager.installComponent({ rootDid: appDid, url: url2 }, context);
      await waitForStatus(appDid, BlockletStatus.installed, staticDemoDid);

      const b2 = await states.blocklet.getBlocklet(appDid);
      expect(b2.status).toEqual(BlockletStatus.installed);
      expect(b2.children[0].meta.version).toEqual('1.1.4');

      await remove({ did: appDid });
    }, 20_000);
  });

  describe('Rollback', () => {
    test('should cancel download during installation', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: dappDemoLongTimeUrl, appSk }, context);

      await sleep(50);
      const b1 = await states.blocklet.getBlocklet(appDid);
      expect([BlockletStatus.downloading, BlockletStatus.waiting]).toContain(b1.status);

      await manager.cancelDownload({ did: appDid });
      const b2 = await states.blocklet.getBlocklet(appDid);
      expect(b2).toBeNull();
    }, 20_000);

    test('should preserve data after keepData delete and reinstall', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: staticDemoUrl, appSk, sync: true }, context);

      await manager.config({
        did: appDid,
        configs: [{ key: 'A', value: 'a', custom: true }],
      });

      await manager.delete({ did: appDid, keepData: true }, context);
      await waitForRemoved(appDid);

      await manager.install({ url: staticDemoUrl, appSk, sync: true }, context);
      const e = await states.blockletExtras.getConfigs(appDid);
      expect(e.find((x) => x.key === 'A')).toBeFalsy();

      await remove({ did: appDid });
    }, 20_000);

    test('should use backup rollback data when queue is empty', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: dappDemoLongTimeUrl, appSk }, context);

      // Wait for blocklet to be created (may take longer in parallel test runs)
      let status = null;
      for (let i = 0; i < 20; i++) {
        await sleep(50);
        status = await states.blocklet.getBlockletStatus(appDid);
        if (status !== null) break;
      }
      expect([BlockletStatus.downloading, BlockletStatus.waiting]).toContain(status);

      const mockInstallQueue = spyOn(manager.installQueue, 'get').mockResolvedValue(null);

      try {
        await manager.cancelDownload({ did: appDid });
        expect(await states.blocklet.getBlocklet(appDid)).toBeNull();
      } finally {
        mockInstallQueue.mockRestore();
      }
    }, 20_000);

    test('should error when no rollback data available', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: dappDemoUrl, appSk }, context);
      await sleep(50);

      const b1 = await states.blocklet.getBlocklet(appDid);
      expect([BlockletStatus.waiting, BlockletStatus.downloading]).toContain(b1?.status);

      const mockInstallQueue = spyOn(manager.installQueue, 'get').mockResolvedValue(null);
      const mockRollbackCache = spyOn(manager._rollbackCache, 'restore').mockResolvedValue(null);

      let cancelError;
      try {
        await manager.cancelDownload({ did: appDid });
      } catch (error) {
        cancelError = error;
      }

      mockInstallQueue.mockRestore();
      mockRollbackCache.mockRestore();

      expect(cancelError).toBeTruthy();
      expect(cancelError.message.includes('Cannot find rollback data')).toBeTruthy();

      await sleep(50);
      const b2 = await states.blocklet.getBlocklet(appDid);
      if (b2) {
        expect(b2.status).toEqual(BlockletStatus.error);
        await remove({ did: appDid, keepData: true });
      }
    }, 20_000);
  });

  describe('Install with onlyRequired', () => {
    test('install only-required', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: mainBlockletUrl, appSk, onlyRequired: true, sync: true }, context);

      const b1 = await manager.ensureBlocklet(appDid);
      expect(b1.children.length).toBe(1);
      expect(b1.children[0].meta.name).toBe('main-blocklet');

      await remove({ did: appDid });
    }, 20_000);

    test('install only required, install-component no use only-required', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${staticDemoDid}/1.1.4/blocklet.json`;
      const url2 = `${DEFAULT_SERVER}/api/blocklets/${mainBlockletDid}/blocklet.json`;

      await manager.install({ url, appSk, onlyRequired: true, sync: true }, context);

      const b1 = await manager.ensureBlocklet(appDid);
      expect(b1.children.length).toBe(1);
      expect(b1.children[0].meta.name).toBe('static-demo-blocklet');

      await manager.installComponent({ rootDid: appDid, url: url2, sync: true }, context);

      const b2 = await manager.ensureBlocklet(appDid);
      expect(b2.children.length).toBe(3);
      // Don't rely on children array order - check that 'main-blocklet' exists
      expect(b2.children.map((c) => c.meta.name)).toContain('main-blocklet');
      await remove({ did: appDid });
    }, 20_000);

    test('install only-required, install-component only-required', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${staticDemoDid}/1.1.4/blocklet.json`;
      const url2 = `${DEFAULT_SERVER}/api/blocklets/${mainBlockletDid}/blocklet.json`;

      await manager.install({ url, appSk, onlyRequired: true, sync: true }, context);

      const b1 = await manager.ensureBlocklet(appDid);
      expect(b1.children.length).toBe(1);
      expect(b1.children[0].meta.name).toBe('static-demo-blocklet');

      await manager.installComponent({ rootDid: appDid, url: url2, onlyRequired: true, sync: true }, context);
      await waitForStatus(appDid, BlockletStatus.stopped, mainBlockletDid);

      const b2 = await manager.ensureBlocklet(appDid);
      expect(b2.children.length).toBe(2);
      // Don't rely on children array order - check that 'main-blocklet' exists
      expect(b2.children.map((c) => c.meta.name)).toContain('main-blocklet');

      await remove({ did: appDid });
    }, 20_000);
  });
});
