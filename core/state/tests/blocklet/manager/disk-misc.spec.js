/* eslint-disable no-await-in-loop */
/* eslint-disable no-shadow */
/**
 * BlockletManager Miscellaneous Tests
 * Tests for Space Gateway, controller status, crons, registry, and expired blocklets
 */

const { test, expect, describe, beforeEach, beforeAll, afterAll, afterEach, spyOn } = require('bun:test');
const { BlockletStatus, BLOCKLET_CONTROLLER_STATUS, SUSPENDED_REASON } = require('@blocklet/constant');
const { NODE_MODES, LAUNCH_SESSION_STATUS } = require('@abtnode/constant');
const os = require('os');
const { v4: UUID } = require('uuid');
const dayjs = require('dayjs');
const { EventEmitter } = require('events');

const {
  createTestContext,
  createAppWallet,
  states,
  DEFAULT_SERVER,
  staticDemoUrl,
  mainBlockletDid,
  fs,
  path,
  sleep,
} = require('./disk-test-setup');

const launcher = require('../../../lib/util/launcher');
const BlockletManager = require('../../../lib/blocklet/manager/disk');

describe('BlockletManager - Misc', () => {
  const testCtx = createTestContext();
  let manager;
  let context;
  let instance;
  let remove;

  beforeAll(async () => {
    const result = await testCtx.setup();
    manager = result.manager;
    context = result.context;
    instance = testCtx.getInstance();
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

  describe('Space Gateway', () => {
    test('should add space gateway', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: staticDemoUrl, appSk, sync: true }, context);

      await manager.addBlockletSpaceGateway({
        did: appDid,
        spaceGateway: { name: 'test-gateway', url: 'https://gateway.example.com' },
      });

      const gateways = await manager.getBlockletSpaceGateways({ did: appDid });
      expect(gateways.some((g) => g.name === 'test-gateway')).toBe(true);

      await remove({ did: appDid });
    }, 20_000);

    test('throw error when spaceGateway.name is empty', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: staticDemoUrl, appSk, sync: true }, context);

      await expect(
        manager.addBlockletSpaceGateway({
          did: appDid,
          spaceGateway: { name: '', url: 'https://gateway.example.com' },
        })
      ).rejects.toThrow();

      await remove({ did: appDid });
    }, 20_000);

    test('throw error when spaceGateway.url is empty', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: staticDemoUrl, appSk, sync: true }, context);

      await expect(
        manager.addBlockletSpaceGateway({
          did: appDid,
          spaceGateway: { name: 'test-gateway', url: '' },
        })
      ).rejects.toThrow();

      await remove({ did: appDid });
    }, 20_000);

    test('should delete space gateway', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: staticDemoUrl, appSk, sync: true }, context);

      await manager.addBlockletSpaceGateway({
        did: appDid,
        spaceGateway: { name: 'test-gateway', url: 'https://gateway.example.com' },
      });

      await manager.deleteBlockletSpaceGateway({
        did: appDid,
        name: 'test-gateway',
      });

      const gateways = await manager.getBlockletSpaceGateways({ did: appDid });
      expect(gateways.some((g) => g.name === 'test-gateway')).toBe(false);

      await remove({ did: appDid });
    }, 20_000);

    test('should update space gateway', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: staticDemoUrl, appSk, sync: true }, context);

      await manager.addBlockletSpaceGateway({
        did: appDid,
        spaceGateway: { name: 'test-gateway', url: 'https://gateway.example.com' },
      });

      await manager.updateBlockletSpaceGateway({
        did: appDid,
        name: 'test-gateway',
        spaceGateway: { name: 'test-gateway', url: 'https://new-gateway.example.com' },
      });

      const gateways = await manager.getBlockletSpaceGateways({ did: appDid });
      expect(gateways.find((g) => g.name === 'test-gateway')?.url).toBe('https://new-gateway.example.com');

      await remove({ did: appDid });
    }, 20_000);
  });

  describe('checkControllerStatus', () => {
    test('should do nothing if blocklet.controller is empty', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: staticDemoUrl, appSk, sync: true }, context);

      // Should not throw when controller is empty
      const result = await manager.checkControllerStatus({ did: appDid });
      expect(result).toBeUndefined();

      await remove({ did: appDid });
    }, 20_000);

    test('should throw error if the nft already expired', async () => {
      const mockIsBlockletExpired = spyOn(launcher, 'isBlockletExpired').mockResolvedValue(true);

      try {
        await expect(
          manager.checkControllerStatus(
            {
              meta: { did: 'test-did' },
              controller: {
                nftId: 'test-nft-id',
                chainHost: 'https://beta.abtnetwork.io/api',
                nftOwner: 'test-owner',
                launcherSessionId: 'test-session-id',
              },
            },
            'start'
          )
        ).rejects.toThrow(/expired/i);

        expect(mockIsBlockletExpired).toHaveBeenCalled();
      } finally {
        mockIsBlockletExpired.mockRestore();
      }
    }, 20_000);

    test('should update controller status if nft not expired and was previously suspended', async () => {
      const did = 'zNKagKrhPaQp79zffNngHYKkBEp7sWz72gp6';
      const mockIsBlockletExpired = spyOn(launcher, 'isBlockletExpired').mockResolvedValue(false);
      const mockUpdateByDid = spyOn(states.blockletExtras, 'updateByDid').mockResolvedValue();

      try {
        const blocklet = {
          meta: { did },
          controller: {
            status: {
              value: BLOCKLET_CONTROLLER_STATUS.suspended,
              reason: SUSPENDED_REASON.expired,
            },
            nftId: 'zNKagKrhPaQp79zffNngHYKkBEp7sWz72gp6',
            chainHost: 'https://beta.abtnetwork.io/api',
          },
        };

        await manager.checkControllerStatus(blocklet, 'start');

        expect(mockUpdateByDid).toHaveBeenCalled();
        expect(mockIsBlockletExpired).toHaveBeenCalled();
      } finally {
        mockUpdateByDid.mockRestore();
        mockIsBlockletExpired.mockRestore();
      }
    }, 20_000);
  });

  describe('getCrons', () => {
    test('should return crons in production mode', async () => {
      const mockRead = spyOn(states.node, 'read').mockResolvedValue({ mode: NODE_MODES.PRODUCTION });

      try {
        const crons = await manager.getCrons();
        expect(Array.isArray(crons)).toBe(true);
        expect(crons.length).toBeGreaterThan(0);
      } finally {
        mockRead.mockRestore();
      }
    }, 20_000);

    test('should return serverless crons in serverless mode', async () => {
      const mockRead = spyOn(states.node, 'read').mockResolvedValue({ mode: NODE_MODES.SERVERLESS });

      try {
        const crons = await manager.getCrons();
        expect(Array.isArray(crons)).toBe(true);
        expect(crons.length).toBeGreaterThan(0);
      } finally {
        mockRead.mockRestore();
      }
    }, 20_000);
  });

  describe('Blocklet Registry', () => {
    test('should blocklet storeList work as expected', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const info1 = await instance.states.node.read();
      expect(info1.blockletRegistryList.length).toBe(3);

      await manager.install({ url: staticDemoUrl, appSk, sync: true }, context);

      const b1 = await manager.detail({ did: appDid });
      expect(b1.settings.storeList.length).toBeGreaterThanOrEqual(3);

      await remove({ did: appDid });
    }, 20_000);

    test('should server storeList work as expected', async () => {
      const teamDid = instance.options.nodeDid;
      const info1 = await instance.states.node.read();
      const initialCount = info1.blockletRegistryList.length;

      // Check if store already exists
      const existsDefaultStore = await instance.teamAPI.existsStore({ teamDid, url: DEFAULT_SERVER });
      if (!existsDefaultStore) {
        await instance.teamAPI.addStore({ teamDid, url: DEFAULT_SERVER });

        const info2 = await instance.states.node.read();
        expect(info2.blockletRegistryList.length).toBe(initialCount + 1);

        // Adding same store again should throw
        await expect(instance.teamAPI.addStore({ teamDid, url: DEFAULT_SERVER })).rejects.toThrow(
          'Blocklet Store already exist'
        );

        await instance.teamAPI.deleteStore({ teamDid, url: DEFAULT_SERVER });

        const info3 = await instance.states.node.read();
        expect(info3.blockletRegistryList.length).toBe(initialCount);
      } else {
        // Store already exists, just verify it
        expect(info1.blockletRegistryList.some((s) => s.url === DEFAULT_SERVER)).toBe(true);
      }
    }, 20_000);
  });

  describe('stopExpiredBlocklets', () => {
    test('should stop the expired blocklet', async () => {
      const mockIsBlockletExpired = spyOn(launcher, 'isBlockletExpired').mockResolvedValue(true);
      const mockNotify = spyOn(launcher, 'notifyBlockletStopped').mockImplementation(() => {});

      try {
        const wallet = createAppWallet();
        const appSk = wallet.secretKey;
        const appDid = wallet.address;

        const url = `${DEFAULT_SERVER}/api/blocklets/${mainBlockletDid}/blocklet.json`;

        await manager.install(
          {
            url,
            controller: {
              launcherUrl: 'https://mock-launcher.arcblock.io',
              nftId: 'zjdryeESVc4Z4MgLcmJ9veNYeiXqq8tXSEZh',
              nftOwner: 'z1TedPoao5PN1A65zh7Mo8g55xgfjTma34i',
              chainHost: 'https://beta.abtnetwork.io/api/',
              launcherSessionId: 'test-session-id',
            },
            appSk,
            sync: true,
          },
          context
        );

        const blocklet = await states.blocklet.getBlocklet(appDid);
        expect(blocklet).toBeTruthy();
        expect(blocklet.status).toBe(BlockletStatus.installed);

        await manager.stopExpiredBlocklets();

        const updated = await states.blocklet.getBlocklet(appDid);
        expect(updated.status).toBe(BlockletStatus.stopped);

        const blockletExtra = await states.blockletExtras.findOne({ 'meta.did': appDid });
        expect(blockletExtra.controller.status).toEqual({
          value: BLOCKLET_CONTROLLER_STATUS.suspended,
          reason: SUSPENDED_REASON.expired,
        });

        expect(mockNotify).toHaveBeenCalled();

        await remove({ did: appDid });
      } finally {
        mockIsBlockletExpired.mockRestore();
        mockNotify.mockRestore();
      }
    }, 20_000);
  });

  describe('cleanExpiredBlocklets', () => {
    test('should do nothing if no expired blocklet data', async () => {
      const mockFind = spyOn(states.blockletExtras, 'find').mockResolvedValue([]);

      try {
        await manager.cleanExpiredBlocklets();
        expect(mockFind).toHaveBeenCalled();
      } finally {
        mockFind.mockRestore();
      }
    }, 20_000);

    test('should not clean the non-expired blocklet data', async () => {
      const wallet = createAppWallet();
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${mainBlockletDid}/blocklet.json`;

      const tempBlocklet = await manager.install(
        {
          url,
          controller: {
            nftId: 'zjdryeESVc4Z4MgLcmJ9veNYeiXqq8tXSEZh',
            nftOwner: 'z1TedPoao5PN1A65zh7Mo8g55xgfjTma34i',
            chainHost: 'https://beta.abtnetwork.io/api/',
            launcherSessionId: UUID(),
            status: {
              value: BLOCKLET_CONTROLLER_STATUS.suspended,
              reason: SUSPENDED_REASON.expired,
            },
          },
          appSk,
          sync: true,
        },
        context
      );

      const blocklet = await states.blocklet.getBlocklet(tempBlocklet.meta.did);
      expect(blocklet).toBeTruthy();

      let blockletExtra = await states.blockletExtras.findOne({ 'meta.did': tempBlocklet.meta.did });
      expect(blockletExtra).toBeTruthy();

      const mockIsTerminated = spyOn(launcher, 'isBlockletTerminated').mockResolvedValue(false);
      const mockGetSession = spyOn(launcher, 'getLauncherSession').mockResolvedValue({
        terminatedAt: dayjs().subtract(30, 'day').toISOString(),
      });

      try {
        await manager.cleanExpiredBlocklets();

        expect(mockGetSession).toHaveBeenCalled();

        const tmpBlocklet = await states.blocklet.getBlocklet(tempBlocklet.meta.did);
        expect(tmpBlocklet).toBeTruthy();

        blockletExtra = await states.blockletExtras.findOne({ 'meta.did': tempBlocklet.meta.did });
        expect(blockletExtra).toBeTruthy();

        await manager.delete({ did: tempBlocklet.meta.did, keepData: false }, context).catch(() => {});
      } finally {
        mockIsTerminated.mockRestore();
        mockGetSession.mockRestore();
      }
    }, 30_000);

    test('should delete expired blocklet and do not keep the data', async () => {
      const url = `${DEFAULT_SERVER}/api/blocklets/${mainBlockletDid}/blocklet.json`;

      const wallet = createAppWallet();
      const appSk = wallet.secretKey;

      const tempBlocklet = await manager.install(
        {
          url,
          controller: {
            nftId: 'zjdryeESVc4Z4MgLcmJ9veNYeiXqq8tXSEZh',
            nftOwner: 'z1TedPoao5PN1A65zh7Mo8g55xgfjTma34i',
            chainHost: 'https://beta.abtnetwork.io/api/',
            launcherSessionId: UUID(),
            status: {
              value: BLOCKLET_CONTROLLER_STATUS.suspended,
              reason: SUSPENDED_REASON.expired,
            },
          },
          appSk,
          sync: true,
        },
        context
      );

      const blocklet = await states.blocklet.getBlocklet(tempBlocklet.meta.did);
      expect(blocklet).toBeTruthy();

      let blockletExtra = await states.blockletExtras.findOne({ 'meta.did': tempBlocklet.meta.did });
      expect(blockletExtra).toBeTruthy();

      const mockGetSession = spyOn(launcher, 'getLauncherSession').mockResolvedValue({
        launcherSession: {
          status: LAUNCH_SESSION_STATUS.terminated,
          terminatedAt: dayjs().subtract(31, 'day').toISOString(),
        },
      });

      try {
        await manager.cleanExpiredBlocklets();

        expect(mockGetSession).toHaveBeenCalled();

        await sleep(500);
        const tmpBlocklet = await states.blocklet.getBlocklet(tempBlocklet.meta.did);
        expect(tmpBlocklet).toBeFalsy();

        blockletExtra = await states.blockletExtras.findOne({ 'meta.did': tempBlocklet.meta.did });
        expect(blockletExtra).toBeFalsy();
      } finally {
        mockGetSession.mockRestore();
      }
    }, 30_000);
  });

  describe('_cleanBlockletData', () => {
    let testManager = null;
    const did = 'test-did';
    const blocklet = { did, meta: { did, name: 'test-blocklet' } };
    const dataDirs = {
      data: path.join(os.tmpdir(), 'data', 'blocklet-manager-test', 'data'),
      logs: path.join(os.tmpdir(), 'logs', 'blocklet-manager-test', 'logs'),
      cache: path.join(os.tmpdir(), 'cache', 'blocklet-manager-test', 'cache'),
    };

    const blockletDataDir = path.join(dataDirs.data, blocklet.meta.name);
    const blockletLogDir = path.join(dataDirs.logs, blocklet.meta.name);
    const blockletCacheDir = path.join(dataDirs.cache, blocklet.meta.name);

    beforeEach(() => {
      fs.mkdirSync(blockletDataDir, { recursive: true });
      fs.mkdirSync(blockletLogDir, { recursive: true });
      fs.mkdirSync(blockletCacheDir, { recursive: true });

      testManager = new BlockletManager({ dataDirs, backupQueue: new EventEmitter() });
    });

    afterEach(() => {
      if (fs.existsSync(blockletDataDir)) {
        fs.rmSync(blockletDataDir, { recursive: true });
      }
      if (fs.existsSync(blockletLogDir)) {
        fs.rmSync(blockletLogDir, { recursive: true });
      }
      if (fs.existsSync(blockletCacheDir)) {
        fs.rmSync(blockletCacheDir, { recursive: true });
      }
    });

    test('should remove data dir and log dir if keepData===false', async () => {
      const mockRemove = spyOn(states.blockletExtras, 'remove').mockImplementation();

      try {
        expect(fs.existsSync(blockletDataDir)).toBe(true);
        expect(fs.existsSync(blockletLogDir)).toBe(true);
        expect(fs.existsSync(blockletCacheDir)).toBe(true);

        await testManager._cleanBlockletData({
          blocklet,
          keepData: false,
        });

        expect(fs.existsSync(blockletDataDir)).toBe(false);
        expect(fs.existsSync(blockletLogDir)).toBe(false);
        expect(fs.existsSync(blockletCacheDir)).toBe(false);
        expect(mockRemove).toHaveBeenCalled();
      } finally {
        mockRemove.mockRestore();
      }
    });

    test('should remove log dir if keepData===true and keepLogsDir===false', async () => {
      const mockRemove = spyOn(states.blockletExtras, 'remove').mockImplementation();

      try {
        expect(fs.existsSync(blockletDataDir)).toBe(true);
        expect(fs.existsSync(blockletLogDir)).toBe(true);
        expect(fs.existsSync(blockletCacheDir)).toBe(true);

        await testManager._cleanBlockletData({
          blocklet,
          keepData: true,
          keepLogsDir: false,
          keepConfigs: true,
        });

        expect(fs.existsSync(blockletDataDir)).toBe(true);
        expect(fs.existsSync(blockletLogDir)).toBe(false);
        expect(fs.existsSync(blockletCacheDir)).toBe(true);
        expect(mockRemove).not.toHaveBeenCalled();
      } finally {
        mockRemove.mockRestore();
      }
    });

    test('should remove blocklet extras if keepData===true and keepLogsDir===true and keepConfigs===false', async () => {
      const mockRemove = spyOn(states.blockletExtras, 'remove').mockImplementation();

      try {
        expect(fs.existsSync(blockletDataDir)).toBe(true);
        expect(fs.existsSync(blockletLogDir)).toBe(true);
        expect(fs.existsSync(blockletCacheDir)).toBe(true);

        await testManager._cleanBlockletData({
          blocklet,
          keepData: true,
          keepLogsDir: true,
          keepConfigs: false,
        });

        expect(fs.existsSync(blockletDataDir)).toBe(true);
        expect(fs.existsSync(blockletLogDir)).toBe(true);
        expect(fs.existsSync(blockletCacheDir)).toBe(true);
        expect(mockRemove).toHaveBeenCalled();
      } finally {
        mockRemove.mockRestore();
      }
    });
  });

  describe('install blocklet from backup', () => {
    function ensureRoutingRule(dir, did) {
      fs.writeJsonSync(path.join(dir, 'routing_rule.json'), {
        id: '418f9401-f17a-4ae6-a7b8-4cf95f875c26',
        domain: `${did}.blocklet-domain-group`,
        domainAliases: [],
        name: null,
        isProtected: true,
        rules: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        corsAllowedOrigins: [],
        port: null,
      });
    }

    test('install blocklet from backup', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const dir = path.join(os.tmpdir(), 'tmp-backup-data');
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true });
      }

      try {
        await manager.install({ url: staticDemoUrl, appSk, sync: true }, context);
        const b = await manager.ensureBlocklet(appDid);

        fs.mkdirSync(dir);

        const appDir = path.join(dir, 'blocklets', b.meta.bundleName, b.meta.version);
        fs.mkdirSync(appDir, { recursive: true });
        fs.copySync(b.env.appDir, appDir);
        const dataDir = path.join(dir, 'data');
        fs.mkdirSync(dataDir);
        fs.writeFileSync(path.join(dataDir, 'test.md'), 'test');
        fs.writeJsonSync(path.join(dir, 'blocklet.json'), b);
        const extra = await states.blockletExtras.findOne({ did: appDid });
        fs.writeJsonSync(path.join(dir, 'blocklet-extras.json'), extra);
        ensureRoutingRule(dir, appDid);

        await manager.delete({ did: appDid, keepData: false }, context);
        await sleep(1000);

        expect(fs.existsSync(b.env.dataDir)).toBeFalsy();

        await manager.install({ type: 'restore', url: `file://${dir}`, appSk, sync: true });

        const b2 = await manager.ensureBlocklet(appDid);
        expect(b2.appDid).toBe(b.appDid);
        const txt2 = fs.readFileSync(path.join(b2.env.dataDir, 'test.md')).toString();
        expect(txt2).toBe('test');

        await manager.delete({ did: appDid, keepData: false }, context).catch(() => {});
      } finally {
        if (fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true });
        }
      }
    }, 30_000);

    test('install blocklet from backup by queue', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const dir = path.join(os.tmpdir(), 'tmp-backup-data-queue');
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true });
      }

      try {
        await manager.install({ url: staticDemoUrl, appSk, sync: true }, context);
        const b = await manager.ensureBlocklet(appDid);

        fs.mkdirSync(dir);

        const appDir = path.join(dir, 'blocklets', b.meta.bundleName, b.meta.version);
        fs.mkdirSync(appDir, { recursive: true });
        fs.copySync(b.env.appDir, appDir);
        const dataDir = path.join(dir, 'data');
        fs.mkdirSync(dataDir);
        fs.writeFileSync(path.join(dataDir, 'test.md'), 'test-queue');
        fs.writeJsonSync(path.join(dir, 'blocklet.json'), b);
        const extra = await states.blockletExtras.findOne({ did: appDid });
        fs.writeJsonSync(path.join(dir, 'blocklet-extras.json'), extra);
        ensureRoutingRule(dir, appDid);

        await manager.delete({ did: appDid, keepData: false }, context);
        await sleep(1000);

        expect(fs.existsSync(b.env.dataDir)).toBeFalsy();

        // Install with sync: false to use queue
        manager.install({ type: 'restore', url: `file://${dir}`, appSk, sync: false });

        // Wait for installation to complete
        let installed = false;
        for (let i = 0; i < 50; i++) {
          const blocklet = await states.blocklet.getBlocklet(appDid);
          if (blocklet && blocklet.status === BlockletStatus.installed) {
            installed = true;
            break;
          }
          await sleep(200);
        }
        expect(installed).toBe(true);

        const b2 = await manager.ensureBlocklet(appDid);
        expect(b2.appDid).toBe(b.appDid);
        const txt2 = fs.readFileSync(path.join(b2.env.dataDir, 'test.md')).toString();
        expect(txt2).toBe('test-queue');

        await manager.delete({ did: appDid, keepData: false }, context).catch(() => {});
      } finally {
        if (fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true });
        }
      }
    }, 30_000);
  });
});
