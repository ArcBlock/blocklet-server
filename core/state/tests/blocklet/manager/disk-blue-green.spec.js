/* eslint-disable import/order */
/* eslint-disable require-await */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-shadow */
/* eslint-disable no-console */
/**
 * BlockletManager Blue-Green Restart Tests
 * Tests for blue-green deployment restart and update operations
 *
 * This test uses specific mocking for blue-green operations and cannot use
 * the shared disk-test-setup.js because blue-green logic requires different mock behavior.
 */
const { test, expect, describe, beforeEach, afterEach, beforeAll, afterAll, mock, spyOn } = require('bun:test');

const utilBlocklet = require('../../../lib/util/blocklet');
const installExternalDependencies = require('../../../lib/util/install-external-dependencies');

// Mock process-related functions for blue-green operations
mock.module('../../../lib/util/blocklet', () => {
  return {
    ...utilBlocklet,
    startBlockletProcess: mock().mockResolvedValue({ pid: 12345 }),
    checkBlockletProcessHealthy: mock().mockResolvedValue(true),
  };
});

mock.module('../../../lib/util/install-external-dependencies', () => {
  return {
    ...installExternalDependencies,
    installExternalDependencies: mock().mockResolvedValue(),
  };
});

const { fromRandom } = require('@ocap/wallet');
const { types } = require('@ocap/mcrypto');
const { BlockletEvents, BlockletStatus } = require('@blocklet/constant');
const path = require('path');

// 使用 performance.now() 确保在覆盖率模式下时间准确
const sleep = (ms) =>
  new Promise((resolve) => {
    const start = performance.now();
    const check = () => {
      if (performance.now() - start >= ms) {
        resolve();
      } else {
        setTimeout(check, Math.min(50, ms / 10));
      }
    };
    setTimeout(check, Math.min(50, ms / 10));
  });
const states = require('../../../lib/states');
const { setupInstance, tearDownInstance } = require('../../../tools/fixture');

const createAppWallet = () => fromRandom({ role: types.RoleType.ROLE_APPLICATION });
const createUserWallet = () => fromRandom({ role: types.RoleType.ROLE_ACCOUNT });

describe('BlockletManager blue green restart', () => {
  let instance = null;
  /** @type {import('../../../lib/blocklet/manager/disk')} */
  let manager = null;
  let context = {};
  let waitForEvent = async (event, timeout = 5000, instance = null) => ({}); // eslint-disable-line
  let remove = async () => {};

  const getThinBlocklet = async (appDid) => {
    const blocklet = await states.blocklet.getBlocklet(appDid);
    const { did } = blocklet.meta;
    const children = [];
    for (const child of blocklet.children) {
      children.push({
        meta: {
          did: child.meta.did,
        },
        status: child.status,
        greenStatus: child.greenStatus,
        ports: child.ports,
        greenPorts: child.greenPorts,
      });
    }
    return {
      children,
      meta: { did },
    };
  };

  const waitStatus = async (appDid, did, status, isGreen = false, timeout = 20_000) => {
    const statusField = isGreen ? 'greenStatus' : 'status';
    const checker = async () => {
      const b = await getThinBlocklet(appDid);
      const child = b.children.find((v) => v.meta?.did === did);
      if (!child) {
        return { found: false };
      }
      return { found: true, current: child[statusField], expected: status };
    };
    // 使用 performance.now() 确保在覆盖率模式下时间准确
    const t = performance.now();
    let result = { found: false };
    while (performance.now() - t < timeout) {
      result = await checker();
      if (result.found && result.current === result.expected) {
        return; // Success
      }
      await sleep(1000);
    }
    // Timeout - throw error with details
    throw new Error(
      `waitStatus timeout: expected ${statusField}=${status}, got ${result.current || 'not found'} for ${did}`
    );
  };

  beforeAll(async () => {
    delete process.env.TEST_UPDATE_ALL_BLOCKLET;
    mock.clearAllMocks();
    mock.restore();

    spyOn(console, 'info').mockReturnValue();

    // Set minimum consecutive time - needs to be long enough for blue-green transitions
    process.env.ABT_NODE_TEST_MIN_CONSECUTIVE_TIME = '200';
    // 不得禁用蓝绿发布
    process.env.ABT_NODE_DISABLE_BLUE_GREEN = undefined;

    instance = await setupInstance('blocklet-manager-disk-blue-green');
    manager = instance.blockletManager;
    await manager.clearAllLocks?.();
    context = {
      hostname: 'test.abtnode.com',
      user: {
        did: fromRandom().address,
      },
    };
    waitForEvent = (event, subject = instance) => new Promise((resolve) => subject.on(event, resolve));
    remove = async (params) => {
      const res = await manager.delete({ keepData: false, ...params });
      await waitForEvent(BlockletEvents.removed);
      await sleep(500);
      return res;
    };
  });

  beforeEach(async () => {
    // Clear locks before each test but don't delete blocklets
    // since each test uses unique DIDs and cleanup interference
    // with async restart operations causes issues
    await manager?.clearAllLocks?.();
  });

  afterEach(async () => {
    // Allow any pending async operations to settle
    await sleep(300);

    if (manager) {
      try {
        const result = await manager.list({ includeRuntimeInfo: false }, context);
        const blocklets = result.blocklets || [];
        await Promise.all(
          blocklets.map((blocklet) =>
            manager.delete({ did: blocklet.meta.did, keepData: false }, context).catch(() => {})
          )
        );
        // Note: Don't call tearDownInstance here - it deletes the data directory
        // which would break subsequent tests. Only call it in afterAll.
        await manager.clearAllLocks?.();
      } catch {
        // Ignore cleanup errors
      }
    }
    instance?.states.node.deleteCache();
  });

  afterAll(async () => {
    process.env.ABT_NODE_TEST_MIN_CONSECUTIVE_TIME = undefined;

    if (manager) {
      const result = await manager.list({ includeRuntimeInfo: false }, context);
      const blocklets = result.blocklets || [];
      await Promise.all(
        blocklets.map((blocklet) => {
          return manager.delete({ did: blocklet.meta.did, keepData: false }, context);
        })
      );

      await tearDownInstance(instance);

      await manager.clearAllLocks?.();
    }
    mock.restore();
  });

  const demo1 = `file://${path.join(__dirname, '../../assets/api/blocklets/demo-1/blocklet.json')}`;
  const demo1Did = 'z2qaEPwMmdyyqNELquoF5TyNxi3qqNqmnXW95';
  const demo2 = `file://${path.join(__dirname, '../../assets/api/blocklets/demo-2/blocklet.json')}`;
  const demo2Did = 'z2qa9iB3cvQGgEkhdfNx3bnYrny4cdv3rhd6m';

  const restartAllBlocklets = async () => {
    const result = await manager.list({ includeRuntimeInfo: false }, context);
    const blocklets = result.blocklets || [];
    const needRestartStatus = new Set([BlockletStatus.running, BlockletStatus.error]);
    const tasks = blocklets
      .filter((blocklet) => {
        if (!blocklet || !blocklet.children || !blocklet.meta) {
          return false;
        }
        return blocklet.children.some(
          (child) => needRestartStatus.has(child.status) || needRestartStatus.has(child.greenStatus)
        );
      })
      .map((blocklet) => {
        const componentDids = blocklet.children
          .filter((child) => needRestartStatus.has(child.status) || needRestartStatus.has(child.greenStatus))
          .map((child) => child.meta.did);
        return manager.restart({ did: blocklet.meta.did, componentDids }, context);
      });
    await Promise.all(tasks);
  };

  describe('blue green restart or update', () => {
    test('install start and restart - should switch from blue to green', async () => {
      const wallet = createAppWallet();
      const ownerWallet = createUserWallet();

      const appDid = wallet.address;
      const appSk = wallet.secretKey;
      const owner = { did: ownerWallet.address, pk: ownerWallet.publicKey };

      // Install blocklet
      await manager.install({ url: demo1, appSk }, context);
      await waitStatus(appDid, demo1Did, BlockletStatus.installed);
      let b = await getThinBlocklet(appDid);
      await manager.setInitialized({ did: appDid, owner });
      expect(b.children.length).toBe(1);
      const componentDids = [demo1Did];

      // Start blocklet - should be blue running
      await manager.start(
        {
          did: appDid,
          componentDids,
          checkHealthImmediately: true,
        },
        context
      );
      await waitStatus(appDid, demo1Did, BlockletStatus.running);
      b = await getThinBlocklet(appDid);
      const child = b.children.find((x) => x.meta.did === demo1Did);
      expect(child.status).toBe(BlockletStatus.running);
      expect(child.greenStatus).toBe(BlockletStatus.stopped);
      const bluePort = child.ports.BLOCKLET_PORT;
      expect(bluePort).toBeTruthy();
      expect(child.greenPorts).toBeFalsy();

      // Restart - should switch to green running, blue stopped
      await manager.restart({ did: appDid, componentDids }, context);
      await waitStatus(appDid, demo1Did, BlockletStatus.running, true);
      await waitStatus(appDid, demo1Did, BlockletStatus.stopped, false);
      b = await getThinBlocklet(appDid);
      const childAfterRestart = b.children.find((x) => x.meta.did === demo1Did);
      expect(childAfterRestart.status).toBe(BlockletStatus.stopped);
      expect(childAfterRestart.greenStatus).toBe(BlockletStatus.running);
      expect(childAfterRestart.ports.BLOCKLET_PORT).toBe(bluePort);
      expect(childAfterRestart.greenPorts.BLOCKLET_PORT).toBeTruthy();

      await remove({ did: appDid });
    }, 60_000);

    test('restart all blocklets - two blocklets should become green running', async () => {
      const wallet1 = createAppWallet();
      const wallet2 = createAppWallet();
      const ownerWallet1 = createUserWallet();
      const ownerWallet2 = createUserWallet();

      const appDid1 = wallet1.address;
      const appSk1 = wallet1.secretKey;
      const owner1 = { did: ownerWallet1.address, pk: ownerWallet1.publicKey };

      const appDid2 = wallet2.address;
      const appSk2 = wallet2.secretKey;
      const owner2 = { did: ownerWallet2.address, pk: ownerWallet2.publicKey };

      // Install and start first blocklet
      await manager.install({ url: demo1, appSk: appSk1 }, context);
      await waitStatus(appDid1, demo1Did, BlockletStatus.installed);
      await manager.setInitialized({ did: appDid1, owner: owner1 });
      const componentDids1 = [demo1Did];
      await manager.start(
        {
          did: appDid1,
          componentDids: componentDids1,
          checkHealthImmediately: true,
        },
        context
      );
      await waitStatus(appDid1, demo1Did, BlockletStatus.running);

      // Install and start second blocklet
      await manager.install({ url: demo2, appSk: appSk2 }, context);
      await waitStatus(appDid2, demo2Did, BlockletStatus.installed);
      await manager.setInitialized({ did: appDid2, owner: owner2 });
      const componentDids2 = [demo2Did];
      await manager.start(
        {
          did: appDid2,
          componentDids: componentDids2,
          checkHealthImmediately: true,
        },
        context
      );
      await waitStatus(appDid2, demo2Did, BlockletStatus.running);

      // Both should be blue running
      let b1 = await getThinBlocklet(appDid1);
      let b2 = await getThinBlocklet(appDid2);
      let child1 = b1.children.find((x) => x.meta.did === demo1Did);
      let child2 = b2.children.find((x) => x.meta.did === demo2Did);
      expect(child1.status).toBe(BlockletStatus.running);
      expect(child1.greenStatus).toBe(BlockletStatus.stopped);
      expect(child2.status).toBe(BlockletStatus.running);
      expect(child2.greenStatus).toBe(BlockletStatus.stopped);

      // Restart all blocklets
      await restartAllBlocklets();

      // Both should become green running
      await waitStatus(appDid1, demo1Did, BlockletStatus.running, true);
      await waitStatus(appDid1, demo1Did, BlockletStatus.stopped, false);
      await waitStatus(appDid2, demo2Did, BlockletStatus.running, true);
      await waitStatus(appDid2, demo2Did, BlockletStatus.stopped, false);

      b1 = await getThinBlocklet(appDid1);
      b2 = await getThinBlocklet(appDid2);
      child1 = b1.children.find((x) => x.meta.did === demo1Did);
      child2 = b2.children.find((x) => x.meta.did === demo2Did);
      expect(child1.status).toBe(BlockletStatus.stopped);
      expect(child1.greenStatus).toBe(BlockletStatus.running);
      expect(child2.status).toBe(BlockletStatus.stopped);
      expect(child2.greenStatus).toBe(BlockletStatus.running);

      await remove({ did: appDid1 });
      await remove({ did: appDid2 });
    }, 60_000);

    test('restart single blocklet - only that blocklet should switch, others unchanged', async () => {
      const wallet1 = createAppWallet();
      const wallet2 = createAppWallet();
      const ownerWallet1 = createUserWallet();
      const ownerWallet2 = createUserWallet();

      const appDid1 = wallet1.address;
      const appSk1 = wallet1.secretKey;
      const owner1 = { did: ownerWallet1.address, pk: ownerWallet1.publicKey };

      const appDid2 = wallet2.address;
      const appSk2 = wallet2.secretKey;
      const owner2 = { did: ownerWallet2.address, pk: ownerWallet2.publicKey };

      // Install and start both blocklets
      await manager.install({ url: demo1, appSk: appSk1 }, context);
      await waitStatus(appDid1, demo1Did, BlockletStatus.installed);
      await manager.setInitialized({ did: appDid1, owner: owner1 });
      const componentDids1 = [demo1Did];
      await manager.start(
        {
          did: appDid1,
          componentDids: componentDids1,
          checkHealthImmediately: true,
        },
        context
      );
      await waitStatus(appDid1, demo1Did, BlockletStatus.running);

      await manager.install({ url: demo2, appSk: appSk2 }, context);
      await waitStatus(appDid2, demo2Did, BlockletStatus.installed);
      await manager.setInitialized({ did: appDid2, owner: owner2 });
      const componentDids2 = [demo2Did];
      await manager.start(
        {
          did: appDid2,
          componentDids: componentDids2,
          checkHealthImmediately: true,
        },
        context
      );
      await waitStatus(appDid2, demo2Did, BlockletStatus.running);

      // Both should be blue running
      let b1 = await getThinBlocklet(appDid1);
      let b2 = await getThinBlocklet(appDid2);
      let child1 = b1.children.find((x) => x.meta.did === demo1Did);
      let child2 = b2.children.find((x) => x.meta.did === demo2Did);
      expect(child1.status).toBe(BlockletStatus.running);
      expect(child1.greenStatus).toBe(BlockletStatus.stopped);
      expect(child2.status).toBe(BlockletStatus.running);
      expect(child2.greenStatus).toBe(BlockletStatus.stopped);

      // Restart only first blocklet
      await manager.restart({ did: appDid1, componentDids: componentDids1 }, context);

      // First blocklet should switch to green, second should remain blue
      await waitStatus(appDid1, demo1Did, BlockletStatus.running, true);
      await waitStatus(appDid1, demo1Did, BlockletStatus.stopped, false);

      b1 = await getThinBlocklet(appDid1);
      b2 = await getThinBlocklet(appDid2);
      child1 = b1.children.find((x) => x.meta.did === demo1Did);
      child2 = b2.children.find((x) => x.meta.did === demo2Did);
      expect(child1.status).toBe(BlockletStatus.stopped);
      expect(child1.greenStatus).toBe(BlockletStatus.running);
      expect(child2.status).toBe(BlockletStatus.running);
      expect(child2.greenStatus).toBe(BlockletStatus.stopped);

      await remove({ did: appDid1 });
      await remove({ did: appDid2 });
    }, 60_000);

    test('stop all and start all - all should become blue', async () => {
      const wallet1 = createAppWallet();
      const wallet2 = createAppWallet();
      const ownerWallet1 = createUserWallet();
      const ownerWallet2 = createUserWallet();

      const appDid1 = wallet1.address;
      const appSk1 = wallet1.secretKey;
      const owner1 = { did: ownerWallet1.address, pk: ownerWallet1.publicKey };

      const appDid2 = wallet2.address;
      const appSk2 = wallet2.secretKey;
      const owner2 = { did: ownerWallet2.address, pk: ownerWallet2.publicKey };

      // Install and start both blocklets
      await manager.install({ url: demo1, appSk: appSk1 }, context);
      await waitStatus(appDid1, demo1Did, BlockletStatus.installed);
      await manager.setInitialized({ did: appDid1, owner: owner1 });
      const componentDids1 = [demo1Did];
      await manager.start(
        {
          did: appDid1,
          componentDids: componentDids1,
          checkHealthImmediately: true,
        },
        context
      );
      await waitStatus(appDid1, demo1Did, BlockletStatus.running);

      await manager.install({ url: demo2, appSk: appSk2 }, context);
      await waitStatus(appDid2, demo2Did, BlockletStatus.installed);
      await manager.setInitialized({ did: appDid2, owner: owner2 });
      const componentDids2 = [demo2Did];
      await manager.start(
        {
          did: appDid2,
          componentDids: componentDids2,
          checkHealthImmediately: true,
        },
        context
      );
      await waitStatus(appDid2, demo2Did, BlockletStatus.running);

      // Restart all to make them green
      await restartAllBlocklets();
      await waitStatus(appDid1, demo1Did, BlockletStatus.running, true);
      await waitStatus(appDid1, demo1Did, BlockletStatus.stopped, false);
      await waitStatus(appDid2, demo2Did, BlockletStatus.running, true);
      await waitStatus(appDid2, demo2Did, BlockletStatus.stopped, false);

      let b1 = await getThinBlocklet(appDid1);
      let b2 = await getThinBlocklet(appDid2);
      let child1 = b1.children.find((x) => x.meta.did === demo1Did);
      let child2 = b2.children.find((x) => x.meta.did === demo2Did);
      expect(child1.status).toBe(BlockletStatus.stopped);
      expect(child1.greenStatus).toBe(BlockletStatus.running);
      expect(child2.status).toBe(BlockletStatus.stopped);
      expect(child2.greenStatus).toBe(BlockletStatus.running);

      // Stop all blocklets
      await manager.stop({ did: appDid1, componentDids: componentDids1 }, context);
      await manager.stop({ did: appDid2, componentDids: componentDids2 }, context);
      await waitStatus(appDid1, demo1Did, BlockletStatus.stopped);
      await waitStatus(appDid2, demo2Did, BlockletStatus.stopped);

      // Start all blocklets
      await manager.start(
        {
          did: appDid1,
          componentDids: componentDids1,
          checkHealthImmediately: true,
        },
        context
      );
      await manager.start(
        {
          did: appDid2,
          componentDids: componentDids2,
          checkHealthImmediately: true,
        },
        context
      );
      await waitStatus(appDid1, demo1Did, BlockletStatus.running);
      await waitStatus(appDid2, demo2Did, BlockletStatus.running);

      // All should be blue running
      b1 = await getThinBlocklet(appDid1);
      b2 = await getThinBlocklet(appDid2);
      child1 = b1.children.find((x) => x.meta.did === demo1Did);
      child2 = b2.children.find((x) => x.meta.did === demo2Did);
      expect(child1.status).toBe(BlockletStatus.running);
      expect(child1.greenStatus).toBe(BlockletStatus.stopped);
      expect(child2.status).toBe(BlockletStatus.running);
      expect(child2.greenStatus).toBe(BlockletStatus.stopped);

      await remove({ did: appDid1 });
      await remove({ did: appDid2 });
    }, 60_000);
  });
});
