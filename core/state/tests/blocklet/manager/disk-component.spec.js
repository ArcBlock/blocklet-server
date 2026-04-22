/* eslint-disable no-await-in-loop */
/* eslint-disable no-shadow */
/**
 * BlockletManager Component Tests
 * Tests for component installation, dynamic components, and composite blocklets
 */

const { test, expect, describe, beforeEach, beforeAll, afterAll, afterEach } = require('bun:test');
const { BlockletStatus } = require('@blocklet/constant');
const { BLOCKLET_SITE_GROUP_SUFFIX } = require('@abtnode/constant');

const {
  createTestContext,
  createAppWallet,
  states,
  DEFAULT_SERVER,
  staticDemoDid,
  staticDemoUrl,
  dappDemoUrl,
  mainBlockletDid,
  mainBlockletUrl,
  subBlockletDid,
  deepNestAppDid,
  deepNestAppUrl,
  demo2Url,
  fs,
  path,
  sleep,
} = require('./disk-test-setup');

const { findInterfacePortByName } = require('../../../lib/util');

describe('BlockletManager - Component', () => {
  const testCtx = createTestContext();
  let manager;
  let context;
  let waitForRemoved;
  let waitForStatus;
  let remove;
  let routerManager;

  beforeAll(async () => {
    const result = await testCtx.setup();
    manager = result.manager;
    context = result.context;
    waitForRemoved = result.waitForRemoved;
    waitForStatus = result.waitForStatus;
    remove = result.remove;
    routerManager = result.routerManager;
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

  describe('Component Installation', () => {
    test('Should install composite blocklet', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${mainBlockletDid}/blocklet.json`;
      await manager.install({ url, appSk, sync: true }, context);

      const b = await states.blocklet.getBlocklet(appDid);
      expect(b.children.length).toBeGreaterThan(1);
      expect(b.children.some((c) => c.meta.did === mainBlockletDid)).toBe(true);
      expect(b.children.some((c) => c.meta.did === subBlockletDid)).toBe(true);

      await remove({ did: appDid });
    }, 20_000);

    test('Should install deeply nested blocklet', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: deepNestAppUrl, appSk, sync: true }, context);

      const b = await states.blocklet.getBlocklet(appDid);
      expect(b.children.length).toBeGreaterThan(0);

      await remove({ did: appDid });
    }, 20_000);

    test('Should upgrade composite blocklet successfully', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      // Install with older version
      await manager.install(
        {
          url: `${DEFAULT_SERVER}/api/blocklets/${staticDemoDid}/1.1.4/blocklet.json`,
          appSk,
          sync: true,
        },
        context
      );

      const b1 = await states.blocklet.getBlocklet(appDid);
      expect(b1.children[0].meta.version).toEqual('1.1.4');

      // Upgrade via installComponent
      await manager.installComponent(
        {
          rootDid: appDid,
          url: staticDemoUrl,
          sync: true,
        },
        context
      );

      const b2 = await states.blocklet.getBlocklet(appDid);
      expect(b2.children[0].meta.version).toEqual('1.1.5');

      await remove({ did: appDid });
    }, 20_000);

    test('Should upgrade composite blocklet from upload', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = staticDemoUrl;
      await manager.install({ url, appSk, sync: true }, context);
      const b1 = await states.blocklet.getBlocklet(appDid);

      expect(b1.children.length).toBe(1);
      expect(b1.children[0].meta.did).toBe(staticDemoDid);
      expect(b1.status).toBe(BlockletStatus.installed);

      // Install component from upload
      const b2 = await manager.installComponent(
        {
          rootDid: appDid,
          file: {
            filename: 'main-blocklet-1.0.0.tgz',
            createReadStream: () =>
              fs.createReadStream(
                path.join(__dirname, `../../assets/api/blocklets/${mainBlockletDid}/main-blocklet-1.0.0.tgz`)
              ),
          },
        },
        context
      );
      expect(b2.meta.did).toBe(appDid);
      expect(b2.children.length).toBe(3);
      expect(b2.children[1].meta.did).toBe(mainBlockletDid);
      expect(b2.children[1].meta.version).toBe('1.0.0');

      await remove({ did: appDid });
    }, 20_000);

    test('blocklet bundle should be removed after blocklet is removed', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: mainBlockletUrl, appSk, sync: true }, context);

      const b = await states.blocklet.getBlocklet(appDid);
      expect(b.children.length).toBeGreaterThan(1);

      await manager.delete({ did: appDid, keepData: false }, context);
      await waitForRemoved(appDid);

      const b2 = await states.blocklet.getBlocklet(appDid);
      expect(b2).toBeNull();
    }, 20_000);
  });

  describe('Dynamic Component', () => {
    test('should add dynamic component as expected', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const did = appDid;
      await manager.install({ url: dappDemoUrl, appSk, sync: true }, context);

      // Add dynamic component
      await manager.installComponent({ url: staticDemoUrl, mountPoint: '/a', rootDid: did, sync: true }, context);
      await waitForStatus(appDid, BlockletStatus.stopped, staticDemoDid);
      const b1 = await states.blocklet.getBlocklet(did);
      expect(b1.status).toBe(BlockletStatus.stopped);
      expect(b1.children.length).toBe(2);
      expect(b1.children[1].status).toBe(BlockletStatus.stopped);

      // Add another dynamic component
      await manager.installComponent({ url: mainBlockletUrl, mountPoint: '/b', rootDid: did, sync: true }, context);
      await waitForStatus(appDid, BlockletStatus.stopped, mainBlockletDid);
      const b2 = await states.blocklet.getBlocklet(did);
      expect(b2.status).toBe(BlockletStatus.stopped);
      expect(b2.children.length).toBe(4);
      expect(b2.children[2].mountPoint).toBe('/b');

      // Update dynamic component mountPoint
      const savedDid = b2.children[2].meta.did;
      await manager.updateComponentMountPoint({ did: savedDid, rootDid: did, mountPoint: '/c-abc' });
      const b3 = await states.blocklet.getBlocklet(did);
      expect(b3.children[2].mountPoint).toBe('/c-abc');

      // Update dynamic component title
      await manager.updateComponentTitle({ did: savedDid, rootDid: did, title: 'main2-abc' });
      const b4 = await states.blocklet.getBlocklet(did);
      expect(b4.children[2].meta.title).toBe('main2-abc');

      // Delete dynamic component
      await manager.deleteComponent({ did: savedDid, rootDid: did }, context);
      await waitForStatus(appDid, BlockletStatus.stopped);
      const b5 = await states.blocklet.getBlocklet(did);
      expect(b5.children.length).toBe(3);

      await remove({ did });
    }, 20_000);

    test('should throw error when updating non-existent component', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: dappDemoUrl, appSk, sync: true }, context);

      await expect(manager.updateComponentTitle({ did: 'no-exist', rootDid: appDid, title: 'test' })).rejects.toThrow(
        'component does not exist'
      );

      await expect(
        manager.updateComponentMountPoint({ did: 'no-exist', rootDid: appDid, mountPoint: '/test' })
      ).rejects.toThrow('component does not exist');

      await remove({ did: appDid });
    }, 20_000);
  });

  describe('Nested Composite Blocklet', () => {
    test('Should install and config nested composite blocklet successfully', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ url: demo2Url, appSk, sync: true }, context);

      const b1 = await manager.ensureBlocklet(appDid);
      expect(b1.status).toEqual(BlockletStatus.installed);
      expect(b1.children.length).toBe(2);

      // Verify environment directories structure
      expect(b1.env.logsDir).toMatch(new RegExp(`logs/${appDid}$`));
      expect(b1.children[0].env.logsDir).toMatch(new RegExp(`logs/${appDid}/${b1.children[0].meta.name}$`));
      expect(b1.env.dataDir).toMatch(new RegExp(`data/${appDid}$`));
      expect(b1.env.cacheDir).toMatch(new RegExp(`cache/${appDid}$`));

      // Config nested component
      const childDid = b1.children[0].meta.did;
      await manager.config({
        did: [appDid, childDid],
        configs: [{ key: 'TEST_NESTED', value: 'nested_value', custom: true }],
      });

      const b2 = await manager.ensureBlocklet(appDid);
      expect(b2.children[0].configObj.TEST_NESTED).toBe('nested_value');

      await remove({ did: appDid });
    }, 20_000);

    test('Should upgrade nested composite blocklet successfully', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url1 = deepNestAppUrl;
      const url2 = `${DEFAULT_SERVER}/deep-nest-app-1.0.1.json`;
      await manager.install({ url: url1, appSk, sync: true }, context);
      const b1 = await states.blocklet.getBlocklet(appDid);
      expect(b1.children[0].meta.version).toEqual('1.0.0');
      const componentDid = b1.children[0].meta.did;

      await manager.installComponent({ rootDid: appDid, url: url2, sync: true }, context);

      await waitForStatus(appDid, BlockletStatus.stopped, componentDid, 30_000);
      const b2 = await states.blocklet.getBlocklet(appDid);
      expect(b2.status).toEqual(BlockletStatus.stopped);
      expect(b2.children[0].meta.version).toEqual('1.0.1');

      await remove({ did: appDid });
    }, 30_000);

    test('Should install nested composite blocklet from upload', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      await manager.install({ title: 'abc', description: 'abc', appSk, sync: true });

      const b2 = await manager.installComponent(
        {
          rootDid: appDid,
          file: {
            filename: 'deep-nest-app-1.0.0.tgz',
            createReadStream: () => fs.createReadStream(path.join(__dirname, '../../assets/deep-nest-app-1.0.0.tgz')),
          },
        },
        context
      );

      expect(b2.ports).toBeTruthy();
      expect(b2.meta.did).toEqual(appDid);
      expect(b2.children[0].meta.did).toEqual(deepNestAppDid);
      expect(b2.children.length).toBe(3);

      await remove({ did: appDid });
    }, 20_000);
  });

  describe('Runtime Environment', () => {
    test('Should blocklet runtime environment work as expected', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const url = `${DEFAULT_SERVER}/api/blocklets/${mainBlockletDid}/blocklet.json`;
      await manager.install({ url, appSk, sync: true }, context);

      const b1 = await manager.ensureBlocklet(appDid);
      expect(b1.children[0].configObj.TEST_ENV).toBe(undefined);
      expect(b1.children[1].configObj.TEST_ENV).toBe(undefined);

      // Config child component
      await manager.config({
        did: [appDid, subBlockletDid],
        configs: [{ key: 'TEST_ENV', value: 'child', custom: true }],
      });

      const b2 = await manager.ensureBlocklet(appDid);
      expect(b2.children[0].configObj.TEST_ENV).toBe(undefined);
      expect(b2.children[1].configObj.TEST_ENV).toBe('child');

      // Config parent component
      await manager.config({
        did: [appDid, mainBlockletDid],
        configs: [{ key: 'TEST_ENV', value: 'parent', custom: true }],
      });

      const b3 = await manager.ensureBlocklet(appDid);
      expect(b3.children[0].configObj.TEST_ENV).toBe('parent');
      expect(b3.children[1].configObj.TEST_ENV).toBe('child');

      await remove({ did: appDid });
    }, 20_000);
  });

  describe('Blocklet Routing', () => {
    test('Should composite blocklet routing work as expected', async () => {
      const wallet = createAppWallet();
      const appDid = wallet.address;
      const appSk = wallet.secretKey;

      const did = appDid;
      const url1 = `${DEFAULT_SERVER}/api/blocklets/${mainBlockletDid}/blocklet.json`;
      const url2 = `${DEFAULT_SERVER}/main-blocklet-1.0.1.json`;

      const expectedRules = () =>
        expect.arrayContaining([
          expect.objectContaining({
            from: expect.objectContaining({ pathPrefix: '/' }),
            to: expect.objectContaining({
              did,
              componentId: `${did}/${mainBlockletDid}`,
            }),
          }),
          expect.objectContaining({
            from: expect.objectContaining({ pathPrefix: '/sub/' }),
            to: expect.objectContaining({
              did,
              componentId: `${did}/${subBlockletDid}`,
            }),
            isProtected: true,
          }),
        ]);

      const checkDefaultSite = (sites) => {
        const site = sites.find((x) => x.domain === `${did}${BLOCKLET_SITE_GROUP_SUFFIX}`);
        expect(site.rules.length).toBe(2);
        expect(site.rules).toEqual(expectedRules('default'));
      };

      const checkASite = (sites) => {
        const site = sites.find((x) => x.domain === 'a.com');
        expect(site.rules.length).toBe(2);
        expect(site.rules).toEqual(expectedRules());
      };

      const addASite = async () => {
        const blocklet = await states.blocklet.getBlocklet(did);
        let port = findInterfacePortByName(blocklet, 'publicUrl');
        if (!port && blocklet.ports?.BLOCKLET_PORT) {
          port = blocklet.ports.BLOCKLET_PORT;
        }
        if (!port) {
          port = 8080;
        }

        await routerManager.addRoutingSite({
          site: {
            domain: 'a.com',
            rules: [
              {
                from: { pathPrefix: '/' },
                to: {
                  type: 'blocklet',
                  port: Number(port),
                  did,
                  interfaceName: 'publicUrl',
                },
              },
            ],
          },
        });
      };

      await sleep(500);
      const sites0 = await states.site.getSites();
      const { length } = sites0;

      await manager.install({ url: url1, appSk, sync: true }, context);

      await sleep(500);
      const sites1 = await states.site.getSites();
      expect(sites1.length).toBe(length + 1);
      checkDefaultSite(sites1);

      await addASite();

      await sleep(500);
      const sites2 = await states.site.getSites();
      expect(sites2.length).toBe(length + 2);
      checkDefaultSite(sites2);
      checkASite(sites2);

      const b1BeforeUpgrade = await states.blocklet.getBlocklet(did);
      const componentDid = b1BeforeUpgrade.children[0].meta.did;
      await manager.installComponent({ rootDid: did, url: url2, sync: true }, context);
      await waitForStatus(appDid, BlockletStatus.stopped, componentDid);

      await sleep(500);
      const sites3 = await states.site.getSites();
      expect(sites3.length).toBe(length + 2);
      checkDefaultSite(sites3);
      checkASite(sites3);

      await remove({ did });

      await sleep(500);
      const sites4 = await states.site.getSites();
      expect(sites4.length).toBe(length + 1);
      expect(sites4.find((x) => x.domain === 'a.com').rules.length).toBe(0);
    }, 30_000);
  });
});
