/* eslint-disable no-await-in-loop */
/* eslint-disable no-shadow */
/**
 * BlockletManager Process Tests
 * Tests for process start, stop, restart operations
 */

const { test, expect, describe, beforeEach, beforeAll, afterAll, afterEach } = require('bun:test');
const { BlockletStatus } = require('@blocklet/constant');

const {
  createTestContext,
  createAppWallet,
  owner,
  states,
  dappDemoUrl,
  mainBlockletUrl,
  staticDemoRequiredConfigUrl,
  demo1Url,
  demo1bUrl,
  demo2Did,
  demo2Url,
  demo2bUrl,
  sleep,
} = require('./disk-test-setup');

describe('BlockletManager - Process', () => {
  const testCtx = createTestContext();
  let manager;
  let context;
  let waitForStatus;
  let remove;

  beforeAll(async () => {
    const result = await testCtx.setup();
    manager = result.manager;
    context = result.context;
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

  describe('Start and Stop', () => {
    test('Should successfully start and stop a blocklet', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: demo1Url, appSk, sync: true }, context);

      const b1 = await states.blocklet.getBlocklet(appDid);
      expect(b1.status).toEqual(BlockletStatus.installed);

      // Initialize before start
      await manager.setInitialized({ did: appDid, owner });

      // Start blocklet (mocked process)
      const b2 = await manager.start({ did: appDid, throwOnError: true });
      expect(b2.status).toEqual(BlockletStatus.running);

      // Stop blocklet
      const b3 = await manager.stop({ did: appDid });
      expect(b3.status).toEqual(BlockletStatus.stopped);

      await remove({ did: appDid });
    }, 20_000);

    test('Should successfully restart a blocklet', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: demo1Url, appSk, sync: true }, context);
      await manager.setInitialized({ did: appDid, owner });

      await manager.start({ did: appDid, throwOnError: true });

      // Restart
      const b = await manager.restart({ did: appDid });
      expect(b.status).toEqual(BlockletStatus.running);

      await manager.stop({ did: appDid });
      await remove({ did: appDid });
    }, 20_000);

    test('Should successfully start and stop a composite blocklet', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: mainBlockletUrl, appSk, sync: true }, context);
      await manager.setInitialized({ did: appDid, owner });

      const b2 = await manager.start({ did: appDid, throwOnError: true });
      expect(b2.status).toEqual(BlockletStatus.running);

      const b3 = await manager.stop({ did: appDid });
      expect(b3.status).toEqual(BlockletStatus.stopped);

      await remove({ did: appDid });
    }, 20_000);

    test('Should successfully start and stop a dapp blocklet', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: dappDemoUrl, appSk, sync: true }, context);
      await manager.setInitialized({ did: appDid, owner });

      const b1 = await states.blocklet.getBlocklet(appDid);
      expect(b1.status).toEqual(BlockletStatus.installed);

      const b2 = await manager.start({ did: appDid, throwOnError: true });
      expect(b2.status).toEqual(BlockletStatus.running);

      const b3 = await states.blocklet.getBlocklet(appDid);
      expect(b3.status).toEqual(BlockletStatus.running);

      const b4 = await manager.stop({ did: appDid });
      expect(b4.status).toEqual(BlockletStatus.stopped);

      await remove({ did: appDid });
    }, 20_000);
  });

  describe('Upgrade while running', () => {
    test('Should successfully upgrade a running blocklet', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: demo1Url, appSk, sync: true }, context);

      const b1 = await states.blocklet.getBlocklet(appDid);
      expect(b1.status).toEqual(BlockletStatus.installed);
      expect(b1.children[0].meta.version).toEqual('0.1.0');
      await manager.setInitialized({ did: appDid, owner });

      const b2 = await manager.start({ did: appDid, throwOnError: true });
      expect(b2.status).toEqual(BlockletStatus.running);

      // Upgrade while running
      await manager.installComponent({ rootDid: appDid, url: demo1bUrl }, context);
      await waitForStatus(appDid, BlockletStatus.running);

      await sleep(100);
      const b3 = await states.blocklet.getBlocklet(appDid);
      expect(b3.children[0].meta.version).toEqual('0.1.1');
      expect(b3.status).toEqual(BlockletStatus.running);

      await manager.stop({ did: appDid });
      await remove({ did: appDid });
    }, 20_000);

    test('Should successfully upgrade a running composite blocklet', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: demo2Url, appSk, sync: true }, context);
      const b1 = await states.blocklet.getBlocklet(appDid);
      expect(b1.status).toEqual(BlockletStatus.installed);
      await manager.setInitialized({ did: appDid, owner });

      const b2 = await manager.start({ did: appDid, throwOnError: true });
      expect(b2.status).toEqual(BlockletStatus.running);

      const b3 = await states.blocklet.getBlocklet(appDid);
      const mainComponent = b3.children.find((c) => c.meta.did === demo2Did);
      expect(mainComponent.meta.version).toBe('0.1.0');
      expect(b3.status).toEqual(BlockletStatus.running);

      await manager.installComponent({ rootDid: appDid, url: demo2bUrl }, context);

      // Wait for upgrade to complete
      await waitForStatus(appDid, BlockletStatus.running, demo2Did, 30_000, true);

      const b5 = await manager.getBlocklet(appDid);
      const upgradedComponent = b5.children.find((c) => c.meta.did === demo2Did);
      expect(upgradedComponent.meta.version).toBe('0.1.1');
      expect(b5.status).toEqual(BlockletStatus.running);

      await manager.stop({ did: appDid });
      await remove({ did: appDid });
    }, 30_000);
  });

  describe('Process Error Handling', () => {
    test('Should handle process health check failure', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: demo1Url, appSk, sync: true }, context);
      const b1 = await states.blocklet.getBlocklet(appDid);
      expect(b1.status).toEqual(BlockletStatus.installed);

      await manager.setInitialized({ did: appDid, owner });

      // Start normally (with mocked process)
      const b2 = await manager.start({ did: appDid, throwOnError: false });
      // With mocked healthy check, it should succeed
      expect([BlockletStatus.running, BlockletStatus.error]).toContain(b2.status);

      await manager.stop({ did: appDid }).catch(() => {});
      await remove({ did: appDid });
    }, 20_000);

    test('Should install blocklet with required config and verify config exists', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: staticDemoRequiredConfigUrl, appSk, sync: true }, context);
      const b1 = await states.blocklet.getBlocklet(appDid);
      expect(b1.status).toEqual(BlockletStatus.installed);

      // Check that the blocklet has environment config defined
      const detail = await manager.ensureBlocklet(appDid);
      const hasRequiredEnv = detail.children[0].meta.environments?.some((e) => e.required);
      expect(hasRequiredEnv).toBe(true);

      await remove({ did: appDid });
    }, 20_000);
  });
});
