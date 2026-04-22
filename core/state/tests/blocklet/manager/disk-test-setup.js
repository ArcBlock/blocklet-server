/* eslint-disable no-await-in-loop */
/* eslint-disable no-shadow */
/* eslint-disable no-console */
/**
 * Shared test setup for BlockletManager unit tests
 * This module provides common setup, teardown, and helper functions for all disk-*.spec.js files
 */

const { mock, spyOn } = require('bun:test');
const path = require('node:path');
const net = require('node:net');
const fs = require('fs-extra');
const { fromRandom } = require('@ocap/wallet');
const { types } = require('@ocap/mcrypto');
const { BlockletStatus } = require('@blocklet/constant');
const sleep = require('@abtnode/util/lib/sleep');

const { setupInstance, tearDownInstance } = require('../../../tools/fixture');
const staticServer = require('../../../tools/static-server');
const states = require('../../../lib/states');

// Import modules that need to be mocked (property replacement approach for CJS compatibility)
const utilBlocklet = require('../../../lib/util/blocklet');
const installExternalDependencies = require('../../../lib/util/install-external-dependencies');

// Save original functions for restore
const _originalStartBlockletProcess = utilBlocklet.startBlockletProcess;
const _originalCheckBlockletProcessHealthy = utilBlocklet.checkBlockletProcessHealthy;
const _originalInstallExternalDependencies = installExternalDependencies.installExternalDependencies;

const { DEFAULT_SERVER } = staticServer;
const DEFAULT_PORT = 9090;

// Module-level tracking for shared static server
// Multiple test files can share one server instance

/**
 * Check if a port is already in use
 * @param {number} port - Port to check
 * @returns {Promise<boolean>} - true if port is in use, false otherwise
 */
const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const client = new net.Socket();
    client.setTimeout(200);

    client.on('connect', () => {
      client.destroy();
      resolve(true);
    });

    client.on('timeout', () => {
      client.destroy();
      resolve(false);
    });

    client.on('error', () => {
      client.destroy();
      resolve(false);
    });

    client.connect(port, '127.0.0.1');
  });
};

// Test data - these must match the assets in core/state/tests/assets/api/blocklets/
const staticDemoDid = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
const staticDemoUrl = `${DEFAULT_SERVER}/static-demo-1.1.5.json`;

const dappDemoDid = 'z8iZy93odZT125AQ6dCSmZJHuZEsUdbk5kVak';
const dappDemoUrl = `${DEFAULT_SERVER}/api/blocklets/${dappDemoDid}/blocklet.json`;
const dappDemoLongTimeUrl = `${DEFAULT_SERVER}/dapp-demo-1.0.1-install-long-time.json`;

const mainBlockletDid = 'z8iZs8cRSb13jCVgSLFkqXvDTgqsAYPq3Y5gb';
const mainBlockletUrl = `${DEFAULT_SERVER}/api/blocklets/${mainBlockletDid}/blocklet.json`;
const subBlockletDid = 'z8iZvFHnQXK6JrL7jfxmFbFNUMHWFj9ufSB41';

const deepNestAppDid = 'z8iZiuMNmZmDUqCYCaECzbCiwnJmCFENHcFBq';
const deepNestAppUrl = `${DEFAULT_SERVER}/deep-nest-app-1.0.0.json`;

// Error and special test URLs
const demoErrorUrl = `file://${path.join(__dirname, '../../assets/api/blocklets/demo-error/blocklet.json')}`;
const staticDemoRequiredConfigUrl = `${DEFAULT_SERVER}/static-demo-1.1.6-required-config.json`;

// File protocol URLs for local testing
const assetsDir = path.join(__dirname, '../../assets');
const demo1Url = `file://${path.join(assetsDir, 'api/blocklets/demo-1/blocklet.json')}`;
const demo1bUrl = `file://${path.join(assetsDir, 'api/blocklets/demo-1b/blocklet.json')}`;
const demo2Did = 'z2qa9iB3cvQGgEkhdfNx3bnYrny4cdv3rhd6m';
const demo2Url = `file://${path.join(assetsDir, 'api/blocklets/demo-2/blocklet.json')}`;
const demo2bUrl = `file://${path.join(assetsDir, 'api/blocklets/demo-2b/blocklet.json')}`;

// Wallet helpers
const createAppWallet = () => fromRandom({ role: types.RoleType.ROLE_APPLICATION });
const createUserWallet = () => fromRandom({ role: types.RoleType.ROLE_ACCOUNT });

// Owner wallet for tests that need initialization
const ownerWallet = createUserWallet();
const owner = { did: ownerWallet.address, pk: ownerWallet.publicKey };

/**
 * Create test context with shared state
 * @returns {Object} Test context object
 */
const createTestContext = () => {
  let server = null;
  let instance = null;
  let manager = null;
  let routerManager = null;
  let context = {};

  // Helper functions
  const waitForInstalled = async (appDid, blockletDid = null, timeout = 10_000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const blocklet = await states.blocklet.getBlocklet(appDid);
      if (!blocklet) {
        await sleep(20);
        continue;
      }
      if (blockletDid) {
        const child = blocklet.children?.find((c) => c.meta?.did === blockletDid);
        if (child && child.status === BlockletStatus.installed) {
          return blocklet;
        }
      } else if (blocklet.status === BlockletStatus.installed) {
        return blocklet;
      }
      await sleep(20);
    }
    const blocklet = await states.blocklet.getBlocklet(appDid);
    throw new Error(
      `waitForInstalled timeout: ${appDid} after ${timeout}ms, current status: ${blocklet?.status || 'not found'}`
    );
  };

  const waitForRemoved = async (did, timeout = 5_000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const blocklet = await states.blocklet.getBlocklet(did);
      if (!blocklet) {
        return;
      }
      await sleep(20);
    }
    throw new Error(`waitForRemoved timeout: ${did} after ${timeout}ms`);
  };

  const waitForStatus = async (appDid, expectedStatus, blockletDid = null, timeout = 8_000, isGreen = false) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const blocklet = await states.blocklet.getBlocklet(appDid);
      if (!blocklet) {
        await sleep(20);
        continue;
      }
      if (blockletDid) {
        const child = blocklet.children?.find((c) => c.meta?.did === blockletDid);
        if (child && child[isGreen ? 'greenStatus' : 'status'] === expectedStatus) {
          return blocklet;
        }
      } else if (blocklet.status === expectedStatus) {
        return blocklet;
      }
      await sleep(20);
    }
    const blocklet = await states.blocklet.getBlocklet(appDid);
    throw new Error(
      `waitForStatus timeout: ${appDid} expected ${expectedStatus} after ${timeout}ms, current status: ${blocklet?.status || 'not found'}`
    );
  };

  const remove = async (params) => {
    const res = await manager.delete({ keepData: false, ...params });
    await waitForRemoved(params.did);
    return res;
  };

  // Setup function to be called in beforeAll
  const setup = async () => {
    delete process.env.TEST_UPDATE_ALL_BLOCKLET;

    // Mock process-related functions to avoid real process operations
    // Use direct property replacement instead of mock.module() because:
    // - mock.module() inside functions is NOT hoisted by bun
    // - Production code destructures at module load time (before mock.module runs)
    // - Direct property replacement works because production code now accesses via module object
    utilBlocklet.startBlockletProcess = mock(() => Promise.resolve({ pid: 12345 }));
    utilBlocklet.checkBlockletProcessHealthy = mock(() => Promise.resolve(true));
    installExternalDependencies.installExternalDependencies = mock(() => Promise.resolve());

    spyOn(console, 'info').mockReturnValue();

    process.env.ABT_NODE_TEST_MIN_CONSECUTIVE_TIME = '100';

    // Check if static server is already running (shared by parallel test files)
    // Add a small random delay to reduce race conditions when tests start simultaneously
    await sleep(Math.random() * 100);

    const portInUse = await isPortInUse(DEFAULT_PORT);
    if (portInUse) {
      // Another test file already started the server, reuse it
      server = null;
    } else {
      // Try to start the static server
      try {
        server = staticServer({ root: path.join(__dirname, '../../assets') });

        await new Promise((res, rej) => {
          server.on('listen', res);
          server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
              // Port was taken by another test file between check and bind
              server = null;
              res(); // Resolve anyway, we'll use the existing server
            } else {
              rej(err);
            }
          });
        });
      } catch (err) {
        if (err.code === 'EADDRINUSE') {
          // Port was taken by another test file
          server = null;
        } else {
          throw err;
        }
      }
    }

    // Wait for the server to be available (handles race conditions in parallel test runs)
    const maxWaitTime = 5000;
    const startWait = Date.now();
    while (Date.now() - startWait < maxWaitTime) {
      if (await isPortInUse(DEFAULT_PORT)) {
        break;
      }
      await sleep(100);
    }
    if (!(await isPortInUse(DEFAULT_PORT))) {
      throw new Error(`Static server not available on port ${DEFAULT_PORT} after ${maxWaitTime}ms`);
    }

    instance = await setupInstance();
    manager = instance.blockletManager;
    routerManager = instance.routerManager;
    await manager.clearAllLocks?.();
    context = {
      hostname: 'test.abtnode.com',
      user: {
        did: fromRandom().address,
      },
    };

    return {
      server,
      instance,
      manager,
      routerManager,
      context,
      waitForInstalled,
      waitForRemoved,
      waitForStatus,
      remove,
    };
  };

  // Cleanup before each test
  const beforeEachCleanup = async () => {
    if (manager) {
      const result = await manager.list({ includeRuntimeInfo: false }, context);
      const blocklets = result.blocklets || [];

      const blockletsToDelete = blocklets.filter(
        (b) =>
          ![BlockletStatus.downloading, BlockletStatus.waiting, BlockletStatus.installing].includes(b.status) &&
          ![BlockletStatus.downloading, BlockletStatus.waiting, BlockletStatus.installing].includes(b.greenStatus)
      );
      const blockletsToCancel = blocklets.filter(
        (b) =>
          [BlockletStatus.downloading, BlockletStatus.waiting].includes(b.status) ||
          [BlockletStatus.downloading, BlockletStatus.waiting].includes(b.greenStatus)
      );

      if (blockletsToDelete.length > 0) {
        const deletePromises = blockletsToDelete.map((blocklet) =>
          manager.delete({ did: blocklet.meta.did, keepData: false }, context).catch(() => {})
        );
        await Promise.all(deletePromises);
        await sleep(100);
      }

      if (blockletsToCancel.length > 0) {
        const cancelPromises = blockletsToCancel.map((blocklet) =>
          manager.cancelDownload({ did: blocklet.meta.did }).catch(() => {})
        );
        await Promise.all(cancelPromises);
        await sleep(100);
      }
      await manager.clearAllLocks?.();
    }
  };

  // Cleanup after each test
  const afterEachCleanup = async () => {
    await Promise.all([manager?.clearAllLocks?.(), instance?.states.node.deleteCache()]);
    mock.restore();

    // Re-apply mocks for next test (direct property replacement)
    utilBlocklet.startBlockletProcess = mock(() => Promise.resolve({ pid: 12345 }));
    utilBlocklet.checkBlockletProcessHealthy = mock(() => Promise.resolve(true));
    installExternalDependencies.installExternalDependencies = mock(() => Promise.resolve());
  };

  // Teardown function to be called in afterAll
  const teardown = async () => {
    process.env.ABT_NODE_TEST_MIN_CONSECUTIVE_TIME = undefined;

    if (manager) {
      const result = await manager.list({ includeRuntimeInfo: false }, context);
      const blocklets = result.blocklets || [];
      await Promise.all(
        blocklets.map((blocklet) =>
          manager.delete({ did: blocklet.meta.did, keepData: false }, context).catch(() => {})
        )
      );

      await tearDownInstance(instance);
      await manager.clearAllLocks?.();
    }

    // Restore original functions
    utilBlocklet.startBlockletProcess = _originalStartBlockletProcess;
    utilBlocklet.checkBlockletProcessHealthy = _originalCheckBlockletProcessHealthy;
    installExternalDependencies.installExternalDependencies = _originalInstallExternalDependencies;

    // Don't close the shared server in teardown - let it close naturally when process exits.
    // This prevents race conditions when multiple test files run in parallel and share the same server.
    // The server will be cleaned up automatically when the test process terminates.
    server = null;
  };

  return {
    setup,
    teardown,
    beforeEachCleanup,
    afterEachCleanup,
    getManager: () => manager,
    getInstance: () => instance,
    getContext: () => context,
    getRouterManager: () => routerManager,
    getServer: () => server,
    waitForInstalled,
    waitForRemoved,
    waitForStatus,
    remove,
  };
};

module.exports = {
  createTestContext,
  createAppWallet,
  createUserWallet,
  owner,
  ownerWallet,
  states,
  DEFAULT_SERVER,
  // Test data exports
  staticDemoDid,
  staticDemoUrl,
  dappDemoDid,
  dappDemoUrl,
  dappDemoLongTimeUrl,
  mainBlockletDid,
  mainBlockletUrl,
  subBlockletDid,
  deepNestAppDid,
  deepNestAppUrl,
  demoErrorUrl,
  staticDemoRequiredConfigUrl,
  demo1Url,
  demo1bUrl,
  demo2Did,
  demo2Url,
  demo2bUrl,
  assetsDir,
  // Re-exports
  fs,
  path,
  sleep,
};
