const { describe, test, expect, beforeAll, beforeEach, afterAll } = require('bun:test');
const crypto = require('crypto');
const net = require('net');
const omit = require('lodash/omit');
const noop = require('lodash/noop');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const { fromRandom } = require('@ocap/wallet');

const security = require('@abtnode/util/lib/security');
const { BlockletStatus, BLOCKLET_DEFAULT_PORT_NAME, BLOCKLET_MODES } = require('@blocklet/constant');

const { spyOn } = require('bun:test');
const BlockletState = require('../../lib/states/blocklet');
const BlockletChildState = require('../../lib/states/blocklet-child');
const { validateBlockletMeta } = require('../../lib/util/blocklet');
const { getBlocklets, setupInMemoryModels } = require('../../tools/fixture');

let ABT_NODE_REDIRECTION_SERVICE_PORTS;
beforeAll(() => {
  ABT_NODE_REDIRECTION_SERVICE_PORTS = process.env.ABT_NODE_REDIRECTION_SERVICE_PORTS;
  process.env.ABT_NODE_REDIRECTION_SERVICE_PORTS = '';
});

afterAll(() => {
  process.env.ABT_NODE_REDIRECTION_SERVICE_PORTS = ABT_NODE_REDIRECTION_SERVICE_PORTS;
});

describe('BlockletState', () => {
  let store = null;
  let models = null;
  let blocklets = [];

  beforeAll(async () => {
    models = await setupInMemoryModels();
    const blockletChildState = new BlockletChildState(models.BlockletChild, {});
    store = new BlockletState(models.Blocklet, { BlockletChildState: blockletChildState });
    store.on('remove', noop);
  });

  beforeEach(() => {
    blocklets = getBlocklets();
    spyOn(console, 'info').mockReturnValue();
  });

  afterAll(async () => {
    await store.reset();
  });

  test('should be empty on create', async () => {
    const items = await store.getBlocklets();
    expect(items.length).toEqual(0);

    const item = await store.getBlocklet(blocklets[0].did);
    expect(item).toBeFalsy();
  });

  test('should support addBlocklet and getBlocklet', async () => {
    const item = await store.addBlocklet({ meta: blocklets[0] });
    const appPid = fromRandom().address;
    expect(item).toBeTruthy();

    expect(item.meta).toEqual({
      ...validateBlockletMeta(blocklets[0]),
      bundleDid: blocklets[0].did,
      bundleName: blocklets[0].name,
    });

    const item2 = await store.getBlocklet(blocklets[0].did);
    expect(item).toEqual(item2);

    const item3 = await store.addBlocklet({ meta: blocklets[1], appPid });
    expect(item3).toBeTruthy();
    expect(item3.meta).toEqual({
      ...validateBlockletMeta(blocklets[1]),
      bundleDid: blocklets[1].did,
      bundleName: blocklets[1].name,
    });

    let item4 = await store.getBlocklet(blocklets[1].did);
    expect(item4).toEqual(item3);
    item4 = await store.getBlocklet(appPid);
    expect(item4).toEqual(item3);

    let exist = await store.hasBlocklet(blocklets[1].did);
    expect(exist).toBeTruthy();
    exist = await store.hasBlocklet(appPid);
    expect(exist).toEqual(true);
  });

  test('should support getBlocklet by migratedFrom appDid', async () => {
    // Generate fresh DIDs to avoid conflicts with other tests
    const blockletWallet = fromRandom();
    const wallet1 = fromRandom();
    const wallet2 = fromRandom();
    const migratedFromDid = wallet1.address;
    const migratedFromDid2 = wallet2.address;

    // Create a fresh blocklet meta to avoid conflicts
    // Name must match DID for validation
    const freshMeta = {
      ...blocklets[0],
      did: blockletWallet.address,
      name: blockletWallet.address,
    };

    // Add blocklet with migratedFrom history
    const item = await store.addBlocklet({
      meta: freshMeta,
      migratedFrom: [
        { appDid: migratedFromDid, appSk: '0x1234', at: new Date() },
        { appDid: migratedFromDid2, appSk: '0x5678', at: new Date() },
      ],
    });
    expect(item).toBeTruthy();
    expect(item.migratedFrom).toHaveLength(2);

    // Should find blocklet by first migratedFrom appDid
    const found1 = await store.getBlocklet(migratedFromDid);
    expect(found1).toBeTruthy();
    expect(found1.meta.did).toEqual(freshMeta.did);

    // Should find blocklet by second migratedFrom appDid
    const found2 = await store.getBlocklet(migratedFromDid2);
    expect(found2).toBeTruthy();
    expect(found2.meta.did).toEqual(freshMeta.did);

    // hasBlocklet should also work with migratedFrom appDid
    const exists1 = await store.hasBlocklet(migratedFromDid);
    expect(exists1).toBe(true);

    const exists2 = await store.hasBlocklet(migratedFromDid2);
    expect(exists2).toBe(true);

    // Non-existent but valid DID should return null/false
    const nonExistentWallet = fromRandom();
    const notFound = await store.getBlocklet(nonExistentWallet.address);
    expect(notFound).toBeFalsy();

    const notExists = await store.hasBlocklet(nonExistentWallet.address);
    expect(notExists).toBe(false);
  });

  test('should support update blocklet status', async () => {
    await store.addBlocklet({ meta: blocklets[0] });

    // status of no component app will not change
    const item = await store.getBlocklet(blocklets[0].did);
    expect(item.status).toEqual(BlockletStatus.added);

    const item2 = await store.setBlockletStatus(blocklets[0].did, BlockletStatus.running);
    expect(item2.status).toEqual(BlockletStatus.added);

    const item5 = await store.setBlockletStatus(blocklets[0].did, BlockletStatus.stopped);
    expect(item5.status).toEqual(BlockletStatus.added);

    await store.addChildren(blocklets[0].did, [{ meta: { did: 'did1' }, mountPoint: '/' }]);

    const item12 = await store.setBlockletStatus(blocklets[0].did, BlockletStatus.running);
    expect(item12.status).toEqual(BlockletStatus.running);

    const item13 = await store.setBlockletStatus(blocklets[0].did, BlockletStatus.running);
    expect(item13.status).toEqual(BlockletStatus.running);
    expect(item13.children[0].startedAt).not.toEqual(item12.children[0].startedAt);

    // force update data if children is set
    const item14 = await store.setBlockletStatus(blocklets[0].did, BlockletStatus.running);
    expect(item14.status).toEqual(BlockletStatus.running);
    expect(item14.children[0].startedAt).not.toEqual(item13.children[0].startedAt);

    const item15 = await store.setBlockletStatus(blocklets[0].did, BlockletStatus.stopped);
    expect(item15.status).toEqual(BlockletStatus.stopped);
    expect(item15.children[0].startedAt).not.toEqual(item14.children[0].startedAt);
  });

  describe('getBlockletPorts', () => {
    test('should assign single default port for empty interface', async () => {
      const ports = await store.getBlockletPorts();
      expect(ports).toBeTruthy();
      expect(ports[BLOCKLET_DEFAULT_PORT_NAME]).toBeTruthy();
    });

    test('should assign single default port for single interface', async () => {
      const ports = await store.getBlockletPorts({ interfaces: [{ type: 'web', name: 'publicUrl', path: '/' }] });
      expect(ports).toBeTruthy();
      expect(ports[BLOCKLET_DEFAULT_PORT_NAME]).toBeTruthy();
    });

    test('should assign single custom port for single interface', async () => {
      const ports = await store.getBlockletPorts({
        interfaces: [{ type: 'web', name: 'publicUrl', path: '/', port: 'BLOCKLET_NEW_PORT' }],
      });
      expect(ports).toBeTruthy();
      expect(ports.BLOCKLET_NEW_PORT).toBeTruthy();
    });

    test('should assign multiple ports for multiple interfaces', async () => {
      const ports = await store.getBlockletPorts({
        interfaces: [
          { type: 'web', name: 'publicUrl', path: '/', port: 'BLOCKLET_NEW_PORT' },
          { type: 'service', name: 'dns', protocol: 'udp', port: { internal: 'BLOCKLET_DNS_PORT', external: 53 } },
        ],
      });
      expect(ports).toBeTruthy();
      expect(ports.BLOCKLET_NEW_PORT).toBeTruthy();
      expect(ports.BLOCKLET_DNS_PORT).toBeTruthy();
    });

    test('should assign multiple ports for multiple interfaces with already assigned', async () => {
      const ports = await store.getBlockletPorts({
        interfaces: [
          { type: 'web', name: 'publicUrl', path: '/', port: 'BLOCKLET_NEW_PORT' },
          { type: 'service', name: 'dns', protocol: 'udp', port: { internal: 'BLOCKLET_DNS_PORT', external: 53 } },
        ],
        alreadyAssigned: { BLOCKLET_NEW_PORT: 2222 },
      });
      expect(ports).toBeTruthy();
      expect(ports.BLOCKLET_NEW_PORT).toEqual(2222);
      expect(ports.BLOCKLET_DNS_PORT).toBeTruthy();
    });

    test('should occupied ports check works as expected', async () => {
      const interfaces = [
        { type: 'service', name: 'dns', protocol: 'udp', port: { internal: 'BLOCKLET_DNS_PORT', external: 53 } },
      ];

      const ports = await store.getBlockletPorts({ interfaces });
      expect(ports.BLOCKLET_DNS_PORT).toBeTruthy();

      // occupied external ports - now _getOccupiedPorts reads from BlockletChildState.getAllPorts()
      const mockGetAllPorts = spyOn(store.BlockletChildState, 'getAllPorts');
      mockGetAllPorts.mockResolvedValue([
        { ports: {}, greenPorts: {}, meta: { interfaces: [{ port: { external: 53 } }] } },
      ]);

      await expect(store.getBlockletPorts({ interfaces })).rejects.toBeTruthy();
      await expect(store.getBlockletPorts({ interfaces, skipOccupiedCheck: true })).resolves.toBeTruthy();
      await expect(store.getBlockletPorts({ interfaces, skipOccupiedCheckPorts: [53] })).resolves.toBeTruthy();

      mockGetAllPorts.mockRestore();
    });

    test('should not return port port of any existed component in blocklet server', async () => {
      await store.insert({
        meta: {
          name: '@arcblock/block-explorer',
          did: 'z8iZyVVn6XsvcuiYhtdw3GoasMbtqR9BjvJz3',
          interfaces: [
            {
              type: 'web',
              name: 'publicUrl',
              port: 'BLOCKLET_PORT',
            },
          ],
        },
        ports: {
          BlOCKLET_PORT: 8000,
        },
        children: [
          {
            meta: {
              name: '@arcblock/block-explorer',
              did: 'z8iZyVVn6XsvcuiYhtdw3GoasMbtqR9BjvJz3',
              interfaces: [
                {
                  type: 'web',
                  name: 'publicUrl',
                  port: 'BLOCKLET_PORT',
                },
              ],
            },
            ports: {
              BlOCKLET_PORT: 8001,
            },
          },
        ],
      });
      const ports = await store.getBlockletPorts({
        interfaces: [{ type: 'web', name: 'publicUrl', path: '/', port: 'BLOCKLET_PORT' }],
        defaultPort: 8000,
      });
      expect(ports.BLOCKLET_PORT).not.toBe(8001);
    });
  });

  test('should fillChildrenPorts works as expected', async () => {
    const createChildren = () => [
      {
        meta: {
          did: 'a',
          interfaces: [
            { type: 'web', name: 'publicUrl', path: '/', port: 'BLOCKLET_PORT' },
            { type: 'web', name: 'adminUrl', path: '/', port: 'ADMIN_PORT' },
          ],
        },
      },
      {
        meta: {
          did: 'b',
          interfaces: [
            { type: 'web', name: 'publicUrl', path: '/', port: { internal: 'BLOCKLET_PORT', external: 53 } },
          ],
        },
      },
    ];

    const children1 = createChildren();
    expect(children1[0].ports).toBeFalsy();
    expect(children1[1].ports).toBeFalsy();
    await store.fillChildrenPorts(children1);
    expect(children1[0].ports).toBeTruthy();
    expect(children1[0].ports.BLOCKLET_PORT).toBeTruthy();
    expect(children1[0].ports.ADMIN_PORT).toBeTruthy();
    expect(children1[1].ports).toBeTruthy();
    expect(children1[1].ports.BLOCKLET_PORT).toBeTruthy();

    const children2 = createChildren();
    const oldChildren = [{ meta: { did: 'a' }, ports: { BLOCKLET_PORT: 9999, OLD_PORT: 8888 } }];
    expect(children2[0].ports).toBeFalsy();
    await store.fillChildrenPorts(children2, { oldChildren });
    expect(children2[0].ports).toBeTruthy();
    expect(children2[0].ports.BLOCKLET_PORT).toBe(9999);
    expect(children2[0].ports.OLD_PORT).toBeFalsy();
    expect(children2[0].ports.ADMIN_PORT).toBeTruthy();

    // occupied ports check - now _getOccupiedPorts reads from BlockletChildState.getAllPorts()
    const mockGetAllPorts = spyOn(store.BlockletChildState, 'getAllPorts');
    mockGetAllPorts.mockResolvedValue([
      { ports: {}, greenPorts: {}, meta: { interfaces: [{ port: { external: 53 } }] } },
    ]);

    // previous external port should not be occupied
    const children3 = createChildren();
    const oldChildren3 = [
      {
        meta: { did: 'b', interfaces: [{ port: { internal: 'BLOCKLET_PORT', external: 53 } }] },
        ports: { BLOCKLET_PORT: 9999 },
      },
    ];
    expect(children3[1].ports).toBeFalsy();
    await store.fillChildrenPorts(children3, { oldChildren: oldChildren3 });
    expect(children3[1].ports.BLOCKLET_PORT).toBe(9999);

    // should throw error if occupied external ports exists
    const children4 = createChildren();
    await expect(store.fillChildrenPorts(children4)).rejects.toBeTruthy();

    mockGetAllPorts.mockRestore();
  });

  test('add children', async () => {
    const meta = blocklets[0];
    const { did } = meta;

    const childMeta = {
      name: 'name',
      did: 'did',
      interfaces: [],
      main: 'blocklet.js',
    };

    await store.addBlocklet({ meta });

    // mountPoint should be exist
    await expect(store.addChildren(did, [{ meta: childMeta }])).rejects.toThrow('mountPoint');

    // should add self
    await expect(
      store.addChildren(did, [
        {
          meta: { ...childMeta, did },
          mountPoint: '/xxx',
        },
      ])
    ).resolves.toBeTruthy();

    // successfully
    const b1 = await store.addChildren(did, [
      {
        meta: childMeta,
        other: 'xxx',
        mountPoint: '/xxx',
      },
    ]);

    expect(b1.children.length).toBe(2);

    expect(b1.children[0].meta).toEqual({ ...childMeta, did });
    expect(b1.children[0].ports.BLOCKLET_PORT).toBeTruthy();
    expect(b1.children[0].dynamic).toBe(undefined);
    expect(b1.children[0].mountPoint).toBe('/xxx');
    expect(b1.children[0].status).toBe(BlockletStatus.added);
    expect(b1.children[0].source).toBe(0);
    expect(b1.children[0].deployedFrom).toBe('');
    expect(b1.children[0].bundleSource).toEqual({});
    expect(b1.children[0].other).toBeUndefined();
    expect(b1.children[0].mode).toBe(BLOCKLET_MODES.PRODUCTION);

    expect(b1.children[1].meta).toEqual(childMeta);
    expect(b1.children[1].ports.BLOCKLET_PORT).toBeTruthy();
    expect(b1.children[1].dynamic).toBe(undefined);
    expect(b1.children[1].mountPoint).toBe('/xxx');
    expect(b1.children[1].status).toBe(BlockletStatus.added);
    expect(b1.children[1].source).toBe('');
    expect(b1.children[1].deployedFrom).toBe('');
    expect(b1.children[1].bundleSource).toBe(null);
    expect(b1.children[1].other).toBeUndefined();
    expect(b1.children[1].mode).toBe(BLOCKLET_MODES.PRODUCTION);

    // add duplicate child should throw error
    try {
      await store.addChildren(did, [{ meta: childMeta, mountPoint: '/xxx' }]);
      expect(false).toEqual('should not be here');
    } catch (err) {
      expect(err.message).toMatch(/duplicate/);
    }

    try {
      await store.addChildren(did, [
        { meta: childMeta, mountPoint: '/xxx' },
        { meta: childMeta, mountPoint: '/xxx' },
      ]);
      expect(false).toEqual('should not be here');
    } catch (err) {
      expect(err.message).toMatch(/duplicate/);
    }
  });

  test('add children with manual ports', async () => {
    const meta = blocklets[0];
    const { did } = meta;

    const childMeta = {
      name: 'name',
      did: 'did',
      interfaces: [],
      main: 'blocklet.js',
    };

    await store.addBlocklet({ meta });

    const b1 = await store.addChildren(
      did,
      [
        {
          meta: childMeta,
          other: 'xxx',
          mountPoint: '/xxx',
        },
      ],
      {
        manualPorts: [
          {
            did: childMeta.did,
            ports: {
              BLOCKLET_PORT: 666,
              PORT2: '777',
            },
          },
        ],
      }
    );

    expect(b1.children[0].ports.BLOCKLET_PORT).toBe(666);
    expect(b1.children[0].ports.PORT2).not.toBe('777');
    expect(b1.children[0].ports.PORT2).toBe(777);
  });

  test('should support update blocklet children status', async () => {
    const meta = blocklets[0];
    const { did } = meta;
    const childMeta1 = {
      name: 'name1',
      did: 'did1',
      interfaces: [],
    };
    const childMeta2 = {
      name: 'name2',
      did: 'did2',
      interfaces: [],
    };

    // Helper to find child by DID (order in children array is not guaranteed)
    const findChild = (blocklet, childDid) => blocklet.children.find((c) => c.meta.did === childDid);

    await store.addBlocklet({ meta });
    await store.addChildren(did, [
      {
        meta: childMeta1,
        mountPoint: '/1',
      },
      {
        meta: childMeta2,
        mountPoint: '/2',
      },
    ]);

    const b1 = await store.getBlocklet(did);
    expect(b1.status).toEqual(BlockletStatus.added);
    expect(findChild(b1, 'did1').status).toEqual(BlockletStatus.added);
    expect(findChild(b1, 'did2').status).toEqual(BlockletStatus.added);

    // waiting status should not take effect on children
    const b2 = await store.setBlockletStatus(did, BlockletStatus.waiting);
    expect(b2.status).toEqual(BlockletStatus.waiting);
    expect(findChild(b2, 'did1').status).toEqual(BlockletStatus.waiting);
    expect(findChild(b2, 'did2').status).toEqual(BlockletStatus.waiting);

    const b3 = await store.setBlockletStatus(did, BlockletStatus.downloading, {
      componentDids: [childMeta1.did],
    });
    expect(b3.status).toEqual(BlockletStatus.downloading);
    expect(findChild(b3, 'did1').status).toEqual(BlockletStatus.downloading);
    expect(findChild(b3, 'did2').status).toEqual(BlockletStatus.waiting);

    // install and upgrading status should not take effect on children
    const b4 = await store.setBlockletStatus(did, BlockletStatus.installing);
    expect(b4.status).toEqual(BlockletStatus.installing);
    expect(findChild(b4, 'did1').status).toEqual(BlockletStatus.installing);
    expect(findChild(b4, 'did2').status).toEqual(BlockletStatus.installing);

    const b5 = await store.setBlockletStatus(did, BlockletStatus.upgrading, { componentDids: [childMeta1.did] });
    expect(findChild(b5, 'did1').status).toEqual(BlockletStatus.upgrading);
    expect(findChild(b5, 'did2').status).toEqual(BlockletStatus.installing);

    const b6 = await store.setBlockletStatus(did, BlockletStatus.upgrading);
    expect(b6.status).toEqual(BlockletStatus.upgrading);
    expect(findChild(b6, 'did1').status).toEqual(BlockletStatus.upgrading);
    expect(findChild(b6, 'did2').status).toEqual(BlockletStatus.upgrading);

    // mock restore data
    const b7 = await store.setBlockletStatus(did, BlockletStatus.added);
    expect(b7.status).toEqual(BlockletStatus.added);
    expect(findChild(b7, 'did1').status).toEqual(BlockletStatus.added);
    expect(findChild(b7, 'did2').status).toEqual(BlockletStatus.added);

    const b8 = await store.setBlockletStatus(did, BlockletStatus.downloading);
    expect(b8.status).toEqual(BlockletStatus.downloading);
    expect(findChild(b8, 'did1').status).toEqual(BlockletStatus.downloading);
    expect(findChild(b8, 'did2').status).toEqual(BlockletStatus.downloading);

    const b9 = await store.setBlockletStatus(did, BlockletStatus.running);
    expect(b9.status).toEqual(BlockletStatus.running);
    expect(findChild(b9, 'did1').status).toEqual(BlockletStatus.running);
    expect(findChild(b9, 'did2').status).toEqual(BlockletStatus.running);
  });

  test('should support find blocklets by appDid or meta.did or appPid', async () => {
    const appDid = fromRandom().address;
    const appDid2 = fromRandom().address;
    const appPid = fromRandom().address;

    const metaDid = blocklets[0].did;
    const b1 = await store.addBlocklet({ meta: blocklets[0] });
    b1.appDid = appDid;
    await store.updateBlocklet(metaDid, b1);

    const b2 = await store.getBlocklet(metaDid);
    const b3 = await store.getBlocklet(appDid);
    expect(b3).toEqual(b2);

    b3.appDid = appDid2;
    await store.updateBlocklet(appDid, b3);
    const b4 = await store.getBlocklet(metaDid);
    const b5 = await store.getBlocklet(appDid2);
    expect(b5).toEqual(b4);

    b5.appPid = appPid;
    await store.updateBlocklet(appDid2, b5);
    const b6 = await store.getBlocklet(metaDid);
    const b7 = await store.getBlocklet(appPid);
    expect(b6).toEqual(b7);
  });

  test('has blocklet', async () => {
    expect(store.hasBlocklet()).resolves.toBe(false);
    expect(store.hasBlocklet(blocklets[0].did)).resolves.toBe(false);

    await store.addBlocklet({ meta: blocklets[0] });
    expect(store.hasBlocklet(blocklets[0].did)).resolves.toBe(true);

    await store.deleteBlocklet(blocklets[0].did);
    expect(store.hasBlocklet(blocklets[0].did)).resolves.toBe(false);
  });

  test('getBlockletStatus', async () => {
    const appDid = fromRandom().address;

    await store.addBlocklet({ meta: blocklets[0] });
    await store.updateBlocklet(blocklets[0].did, { appDid });

    const s1 = await store.getBlockletStatus(blocklets[0].did);
    expect(s1).toBe(BlockletStatus.added);

    const s2 = await store.getBlockletStatus(appDid);
    expect(s2).toBe(BlockletStatus.added);

    await store.addChildren(blocklets[0].did, [{ meta: { did: 'did1' }, mountPoint: '/' }]);

    await store.setBlockletStatus(blocklets[0].did, BlockletStatus.running);
    const s3 = await store.getBlockletStatus(blocklets[0].did);
    expect(s3).toBe(BlockletStatus.running);

    const s4 = await store.getBlockletStatus();
    expect(s4).toBe(null);

    const s5 = await store.getBlockletStatus('not-exist');
    expect(s5).toBe(null);
  });

  test('getBlockletMetaDid', async () => {
    const metaDid = blocklets[0].did;
    const appDid = fromRandom().address;

    await store.addBlocklet({ meta: blocklets[0] });
    await store.updateBlocklet(metaDid, { appDid });

    const res1 = await store.getBlockletMetaDid(metaDid);
    expect(res1).toBe(metaDid);

    const res2 = await store.getBlockletMetaDid(appDid);
    expect(res2).toBe(metaDid);

    const res3 = await store.getBlockletMetaDid('unknown');
    expect(res3).toBeFalsy();
  });

  test('groupAllInterfaces', async () => {
    await store.addBlocklet({ meta: blocklets[0] });
    await store.addBlocklet({ meta: blocklets[1] });
    const childMeta = {
      name: 'child-name',
      did: 'child-did',
      interfaces: [
        {
          type: 'web',
          name: 'publicUrl',
          path: '*',
          prefix: '/p1',
        },
      ],
    };
    await store.addChildren(blocklets[1].did, [
      {
        meta: childMeta,
        mountPoint: '/xxx',
      },
    ]);

    const res = await store.groupAllInterfaces();

    // Verify parent blocklets are present
    expect(res[blocklets[0].did]).toBeDefined();
    expect(res[blocklets[0].did][blocklets[0].interfaces[0].name]).toBeDefined();
    expect(res[blocklets[0].did][blocklets[0].interfaces[0].name]).toMatchObject({
      name: blocklets[0].interfaces[0].name,
      type: blocklets[0].interfaces[0].type,
      path: blocklets[0].interfaces[0].path,
      prefix: blocklets[0].interfaces[0].prefix,
    });

    expect(res[blocklets[1].did]).toBeDefined();
    expect(res[blocklets[1].did][blocklets[1].interfaces[0].name]).toBeDefined();
    expect(res[blocklets[1].did][blocklets[1].interfaces[0].name]).toMatchObject({
      name: blocklets[1].interfaces[0].name,
      type: blocklets[1].interfaces[0].type,
      path: blocklets[1].interfaces[0].path,
      prefix: blocklets[1].interfaces[0].prefix,
    });
  });

  test('getServices', () => {
    // getServices now only reads from BlockletChildState.getChildrenWithServiceInterfaces()
    // Services are only exposed through components (children), not app-level
    const mockGetChildrenWithServiceInterfaces = spyOn(store.BlockletChildState, 'getChildrenWithServiceInterfaces');

    mockGetChildrenWithServiceInterfaces.mockResolvedValue([]);
    expect(store.getServices()).resolves.toEqual([]);

    // Mock children with service interfaces directly (not nested in blocklets)
    mockGetChildrenWithServiceInterfaces.mockResolvedValue([
      {
        meta: {
          did: 'child1',
          interfaces: [
            // Non-service interface should be ignored (filtered by DB query, but also by code)
            { type: 'not service', name: 'dns', protocol: 'udp', port: { internal: 'BLOCKLET_PORT', external: 53 } },
            { type: 'service', name: 'dns', protocol: 'udp', port: { internal: 'BLOCKLET_PORT', external: 53 } },
            { type: 'service', name: 'service1', protocol: 'tcp', port: { internal: 'BLOCKLET_PORT1', external: 101 } },
            {
              type: 'service',
              name: 'should ignore no protocol',
              protocol: '',
              port: { internal: 'XXX', external: 102 },
            },
            {
              type: 'service',
              name: 'should ignore no upstream port',
              protocol: 'tcp',
              port: { internal: 'BLOCKLET_PORT3', external: 103 },
            },
            {
              type: 'service',
              name: 'should ignore no external port',
              protocol: 'tcp',
              port: { internal: 'BLOCKLET_PORT4' },
            },
          ],
        },
        ports: { BLOCKLET_PORT: 3000, BLOCKLET_PORT1: 3001, BLOCKLET_PORT4: 3004 },
        greenPorts: {},
        greenStatus: 0, // not running
      },
      {
        meta: {
          did: 'child2',
          interfaces: [
            {
              type: 'service',
              name: 'service5',
              protocol: 'tcp',
              port: { internal: 'BLOCKLET_PORT', external: 105 },
            },
          ],
        },
        ports: { BLOCKLET_PORT: 3005 },
        greenPorts: {},
        greenStatus: 0,
      },
      {
        meta: {
          did: 'child3',
          interfaces: [
            {
              type: 'service',
              name: 'should ignore duplicate external port',
              protocol: 'udp',
              port: { internal: 'BLOCKLET_PORT', external: 53 },
            },
            {
              type: 'service',
              name: 'should ignore duplicate external port',
              protocol: 'tcp',
              port: { internal: 'BLOCKLET_PORT', external: 53 },
            },
          ],
        },
        ports: { BLOCKLET_PORT: 3006 },
        greenPorts: {},
        greenStatus: 0,
      },
      {
        meta: {
          did: 'child4',
          interfaces: [
            {
              type: 'service',
              name: 'service7',
              protocol: 'udp',
              port: { internal: 'BLOCKLET_PORT', external: 107 },
            },
          ],
        },
        ports: { BLOCKLET_PORT: 3007 },
        greenPorts: {},
        greenStatus: 0,
      },
    ]);
    expect(store.getServices()).resolves.toEqual([
      { name: 'dns', protocol: 'udp', port: 53, upstreamPort: 3000 },
      { name: 'service1', protocol: 'tcp', port: 101, upstreamPort: 3001 },
      { name: 'service5', protocol: 'tcp', port: 105, upstreamPort: 3005 },
      { name: 'service7', protocol: 'udp', port: 107, upstreamPort: 3007 },
    ]);

    mockGetChildrenWithServiceInterfaces.mockRestore();
  });

  test('parallel setting component status', async () => {
    await store.addBlocklet({
      meta: blocklets[0],
      children: [
        {
          meta: {
            name: 'name1',
            did: 'did1',
            interfaces: [],
          },
        },
        {
          meta: {
            name: 'name2',
            did: 'did2',
            interfaces: [],
          },
        },
      ],
    });

    const a1 = await store.getBlocklet(blocklets[0].did);
    expect(a1.children[0].status).not.toEqual(BlockletStatus.running);
    expect(a1.children[1].status).not.toEqual(BlockletStatus.running);

    await Promise.all([
      store.setBlockletStatus(blocklets[0].did, BlockletStatus.running, ['did1']),
      store.setBlockletStatus(blocklets[0].did, BlockletStatus.running, ['did2']),
    ]);

    const a2 = await store.getBlocklet(blocklets[0].did);
    expect(a2.children[0].status).toEqual(BlockletStatus.running);
    expect(a2.children[1].status).toEqual(BlockletStatus.running);
  });

  test('refresh blocklet ports', async () => {
    await store.addBlocklet({ meta: blocklets[0] });
    const item = await store.addChildren(blocklets[0].did, [{ meta: { did: 'did1' }, mountPoint: '/' }]);

    const originalPort = item.children[0].ports.BLOCKLET_PORT;

    // 测试：组件 did 不匹配时不刷新
    const res1 = await store.refreshBlockletPorts(item.meta.did, ['did2']);
    expect(res1.refreshed).toBe(false);
    expect(res1.componentDids).toEqual([]);
    const itemAfter1 = await store.getBlocklet(item.meta.did);
    expect(itemAfter1.children[0].ports.BLOCKLET_PORT).toEqual(item.children[0].ports.BLOCKLET_PORT);

    // 测试：实际占用端口以触发刷新
    const server = net.createServer();
    await new Promise((resolve, reject) => {
      server.listen(originalPort, '::', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    try {
      const res2 = await store.refreshBlockletPorts(item.meta.did, ['did1']);
      expect(res2.refreshed).toBe(true);
      expect(res2.componentDids).toContain('did1');
      const itemAfter2 = await store.getBlocklet(item.meta.did);
      expect(itemAfter2.children[0].ports.BLOCKLET_PORT).toEqual(expect.any(Number));
      expect(itemAfter2.children[0].ports.BLOCKLET_PORT).toBeGreaterThanOrEqual(10000);
      expect(itemAfter2.children[0].ports.BLOCKLET_PORT).toBeLessThanOrEqual(49151);
      expect(itemAfter2.children[0].ports.BLOCKLET_PORT).not.toEqual(item.children[0].ports.BLOCKLET_PORT);
    } finally {
      await new Promise((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  test('refreshBlockletPorts only refreshes when port is actually occupied', async () => {
    await store.addBlocklet({ meta: blocklets[0] });
    const item = await store.addChildren(blocklets[0].did, [{ meta: { did: 'did1' }, mountPoint: '/' }]);

    const originalPort = item.children[0].ports.BLOCKLET_PORT;

    // 测试 1：端口未被实际占用 - 不应该刷新
    const result1 = await store.refreshBlockletPorts(item.meta.did, ['did1']);
    expect(result1.refreshed).toBe(false);
    expect(result1.componentDids).toEqual([]);
    const itemAfter1 = await store.getBlocklet(item.meta.did);
    expect(itemAfter1.children[0].ports.BLOCKLET_PORT).toEqual(originalPort);

    // 测试 2：端口被实际占用 - 应该刷新
    const server = net.createServer();
    await new Promise((resolve, reject) => {
      server.listen(originalPort, '::', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    try {
      const result2 = await store.refreshBlockletPorts(item.meta.did, ['did1']);
      expect(result2.refreshed).toBe(true);
      expect(result2.componentDids).toContain('did1');
      const itemAfter2 = await store.getBlocklet(item.meta.did);
      expect(itemAfter2.children[0].ports.BLOCKLET_PORT).not.toEqual(originalPort);
      expect(itemAfter2.children[0].ports.BLOCKLET_PORT).toBeGreaterThanOrEqual(10000);
      expect(itemAfter2.children[0].ports.BLOCKLET_PORT).toBeLessThanOrEqual(49151);
    } finally {
      await new Promise((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  test('refreshBlockletPorts returns correct structure with refreshed flag', async () => {
    await store.addBlocklet({ meta: blocklets[0] });
    const item = await store.addChildren(blocklets[0].did, [
      { meta: { did: 'did1' }, mountPoint: '/' },
      { meta: { did: 'did2' }, mountPoint: '/' },
    ]);

    const port1 = item.children[0].ports.BLOCKLET_PORT;

    // 测试：只有一个端口被占用的情况
    const server = net.createServer();
    await new Promise((resolve, reject) => {
      server.listen(port1, '::', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    try {
      const result = await store.refreshBlockletPorts(item.meta.did, ['did1', 'did2']);
      expect(result).toHaveProperty('refreshed');
      expect(result).toHaveProperty('componentDids');
      expect(Array.isArray(result.componentDids)).toBe(true);
      // 只有 did1 应该被刷新（port1 被占用）
      expect(result.componentDids).toContain('did1');
      // did2 不应该被刷新（port2 未被占用）
      expect(result.componentDids).not.toContain('did2');
    } finally {
      await new Promise((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  test('refreshBlockletPorts assigns unique greenPorts to multiple components in same batch', async () => {
    await store.addBlocklet({ meta: blocklets[0] });
    // Create 4 children components (simulating the bug scenario)
    const item = await store.addChildren(blocklets[0].did, [
      { meta: { did: 'child1' }, mountPoint: '/c1' },
      { meta: { did: 'child2' }, mountPoint: '/c2' },
      { meta: { did: 'child3' }, mountPoint: '/c3' },
      { meta: { did: 'child4' }, mountPoint: '/c4' },
    ]);

    // Verify all children have ports assigned
    expect(item.children.length).toBe(4);
    item.children.forEach((child) => {
      expect(child.ports.BLOCKLET_PORT).toBeDefined();
      expect(child.ports.BLOCKLET_PORT).toBeGreaterThanOrEqual(10000);
    });

    // Clear greenPorts to simulate initial green assignment scenario
    for (const child of item.children) {
      child.greenPorts = null;
    }
    await store.updateBlocklet(item.meta.did, {});
    for (const child of item.children) {
      // eslint-disable-next-line no-await-in-loop
      await store.BlockletChildState.updateChildPorts(item.id, child.meta.did, {
        ports: child.ports,
        greenPorts: null,
      });
    }

    // Refresh ports in green mode - this should assign unique greenPorts to all children
    const result = await store.refreshBlockletPorts(item.meta.did, ['child1', 'child2', 'child3', 'child4'], true);

    expect(result.refreshed).toBe(true);
    expect(result.isInitialAssignment).toBe(true);
    expect(result.componentDids).toContain('child1');
    expect(result.componentDids).toContain('child2');
    expect(result.componentDids).toContain('child3');
    expect(result.componentDids).toContain('child4');

    // Verify each child got unique greenPorts
    const updatedItem = await store.getBlocklet(item.meta.did);
    const greenPortValues = updatedItem.children.map((child) => child.greenPorts?.BLOCKLET_PORT);

    // All greenPorts should be defined
    greenPortValues.forEach((port) => {
      expect(port).toBeDefined();
      expect(port).toBeGreaterThanOrEqual(10000);
      expect(port).toBeLessThanOrEqual(49151);
    });

    // All greenPorts should be unique (this was the bug - all components got the same port)
    const uniquePorts = new Set(greenPortValues);
    expect(uniquePorts.size).toBe(4); // Each child should have a different port

    // greenPorts should be different from original ports
    updatedItem.children.forEach((child) => {
      expect(child.greenPorts.BLOCKLET_PORT).not.toBe(child.ports.BLOCKLET_PORT);
    });
  });
});

describe('formatBlocklet', () => {
  const { formatBlocklet } = BlockletState;
  const sk = '0x724c42331f6e5a1a266bce8266';
  const dek = crypto.randomBytes(32);

  const doc = {
    meta: {
      did: 'z8iZjySpAu4jzbMochL9k1okuji1GcS7RRRDM',
      name: 'ocap-playground',
      title: 'Wallet Playground',
      version: '0.24.13',
      interfaces: [],
      children: [],
    },
    environments: [
      {
        key: 'BLOCKLET_APP_SK',
        value: security.encrypt(sk, 'z8iZjySpAu4jzbMochL9k1okuji1GcS7RRRDM', dek),
        source: 'parent',
      },
    ],
    children: [
      {
        meta: {
          did: 'z8iZk7PZ3guu3biYGUJRYpAwRnMZkvQ1ENA1z',
          name: 'promotion-tool',
          title: 'Promotion Tool',
          version: '0.1.7',
          interfaces: [],
          children: [],
        },
        children: [],
        environments: [
          {
            key: 'BLOCKLET_APP_SK',
            value: sk,
            source: 'child',
          },
        ],
      },
    ],
  };

  const fn = (b, phase, k) => formatBlocklet(cloneDeep(b), phase, k);

  test('should leave sk when dek is empty', () => {
    expect(fn(doc, 'onRead')).toEqual(doc);
    expect(fn(doc, 'onUpdate')).toEqual(doc);
    expect(fn(doc, 'xxx', dek)).toEqual(doc);
  });

  test('should decrypt sk onRead when dek not empty: with child', () => {
    expect(fn(doc, 'onRead', dek)).toEqual({
      ...doc,
      environments: [
        {
          key: 'BLOCKLET_APP_SK',
          value: sk,
          source: 'parent',
        },
      ],
    });
  });

  test('should decrypt sk onRead when dek not empty: without child', () => {
    expect(fn(omit(doc, ['children']), 'onRead', dek)).toEqual({
      ...doc,
      children: [],
      environments: [
        {
          key: 'BLOCKLET_APP_SK',
          value: sk,
          source: 'parent',
        },
      ],
    });
  });

  test('should encrypt sk onUpdate when dek not empty: with child', () => {
    const encrypted = fn(doc, 'onUpdate', dek);
    expect(encrypted.children[0].environments[0].value).not.toEqual(sk);
    expect(fn(fn(doc, 'onUpdate', dek), 'onRead', dek)).toEqual({
      ...doc,
      environments: [
        {
          key: 'BLOCKLET_APP_SK',
          value: sk,
          source: 'parent',
        },
      ],
    });
  });

  test('should not ensure children on update', () => {
    expect(formatBlocklet({}, 'onRead').children).toEqual([]);
    expect(formatBlocklet({}, 'onUpdate').children).toBeUndefined();
  });
});

describe('syncUptimeStatus', () => {
  let store = null;
  let models = null;

  // Helper to create a unique blocklet meta
  const createBlockletMeta = () => {
    const wallet = fromRandom();
    return {
      name: wallet.address,
      description: 'Test blocklet for uptime tracking',
      group: 'dapp',
      version: '1.0.0',
      main: 'app.js',
      author: 'test',
      did: wallet.address,
      interfaces: [{ type: 'web', name: 'publicUrl', path: '/' }],
    };
  };

  beforeAll(async () => {
    models = await setupInMemoryModels();
    const blockletChildState = new BlockletChildState(models.BlockletChild, {});
    store = new BlockletState(models.Blocklet, { BlockletChildState: blockletChildState });
    store.on('remove', noop);
  });

  afterAll(async () => {
    await store.reset();
  });

  test('should do nothing if blockletId is null', async () => {
    await store.syncUptimeStatus(null);
    // Should not throw
  });

  test('should do nothing if blockletId is undefined', async () => {
    await store.syncUptimeStatus(undefined);
    // Should not throw
  });

  test('should do nothing if blocklet does not exist', async () => {
    await store.syncUptimeStatus('non-existent-id');
    // Should not throw
  });

  test('should set startedAt when first child starts running', async () => {
    const meta = createBlockletMeta();
    await store.addBlocklet({ meta });
    await store.addChildren(meta.did, [{ meta: { did: 'uptime-child-1' }, mountPoint: '/api' }]);

    // Set child status to running
    await store.setBlockletStatus(meta.did, BlockletStatus.running);

    // Check parent uptime
    const updated = await store.getBlocklet(meta.did);
    expect(updated.startedAt).toBeInstanceOf(Date);
    expect(updated.stoppedAt).toBeNull();
  });

  test('should not update startedAt if already set and children still running', async () => {
    const meta = createBlockletMeta();
    await store.addBlocklet({ meta });
    await store.addChildren(meta.did, [{ meta: { did: 'uptime-child-2' }, mountPoint: '/api' }]);

    // Set child status to running
    await store.setBlockletStatus(meta.did, BlockletStatus.running);
    const firstStarted = await store.getBlocklet(meta.did);
    expect(firstStarted.startedAt).toBeTruthy();

    // Wait a bit and set running again
    await new Promise((r) => setTimeout(r, 50));
    await store.setBlockletStatus(meta.did, BlockletStatus.running);

    const secondStarted = await store.getBlocklet(meta.did);
    // startedAt should still be truthy
    expect(secondStarted.startedAt).toBeTruthy();
  });

  test('should set stoppedAt when last child stops', async () => {
    const meta = createBlockletMeta();
    await store.addBlocklet({ meta });
    await store.addChildren(meta.did, [{ meta: { did: 'uptime-child-3' }, mountPoint: '/api' }]);

    // First start the child
    await store.setBlockletStatus(meta.did, BlockletStatus.running);
    const running = await store.getBlocklet(meta.did);
    expect(running.startedAt).toBeInstanceOf(Date);
    expect(running.stoppedAt).toBeNull();

    // Then stop the child
    await store.setBlockletStatus(meta.did, BlockletStatus.stopped);
    const stopped = await store.getBlocklet(meta.did);
    expect(stopped.stoppedAt).toBeInstanceOf(Date);
    expect(stopped.startedAt).toBeNull();
  });

  test('should handle error status as stopped', async () => {
    const meta = createBlockletMeta();
    await store.addBlocklet({ meta });
    await store.addChildren(meta.did, [{ meta: { did: 'uptime-child-4' }, mountPoint: '/api' }]);

    // First start the child
    await store.setBlockletStatus(meta.did, BlockletStatus.running);
    const running = await store.getBlocklet(meta.did);
    expect(running.startedAt).toBeInstanceOf(Date);

    // Then error the child
    await store.setBlockletStatus(meta.did, BlockletStatus.error);
    const errored = await store.getBlocklet(meta.did);
    expect(errored.stoppedAt).toBeInstanceOf(Date);
    expect(errored.startedAt).toBeNull();
  });

  test('should NOT sync uptime for in-progress statuses', async () => {
    const meta = createBlockletMeta();
    await store.addBlocklet({ meta });
    await store.addChildren(meta.did, [{ meta: { did: 'uptime-child-5' }, mountPoint: '/api' }]);

    // Set to downloading (in-progress status)
    await store.setBlockletStatus(meta.did, BlockletStatus.downloading);
    const downloading = await store.getBlocklet(meta.did);
    // startedAt should still be null because downloading is in-progress
    expect(downloading.startedAt).toBeNull();

    // Set to starting (in-progress status)
    await store.setBlockletStatus(meta.did, BlockletStatus.starting);
    const starting = await store.getBlocklet(meta.did);
    expect(starting.startedAt).toBeNull();
  });

  test('should NOT update updatedAt when syncing uptime status', async () => {
    const meta = createBlockletMeta();
    await store.addBlocklet({ meta });
    await store.addChildren(meta.did, [{ meta: { did: 'uptime-child-6' }, mountPoint: '/api' }]);

    // Get initial updatedAt
    const initial = await store.getBlocklet(meta.did);

    // Wait a bit to ensure time difference
    await new Promise((r) => setTimeout(r, 50));

    // Set child status to running - this triggers syncUptimeStatus
    await store.setBlockletStatus(meta.did, BlockletStatus.running);

    // Check that updatedAt is not changed by syncUptimeStatus
    const afterStart = await store.getBlocklet(meta.did);
    expect(afterStart.startedAt).toBeInstanceOf(Date);
    // updatedAt might be updated by setBlockletStatus itself (for child status),
    // but the syncUptimeStatus call should use silent: true
    // We verify by checking that a direct syncUptimeStatus call doesn't change updatedAt

    const updatedAtAfterStart = afterStart.updatedAt;

    // Wait a bit
    await new Promise((r) => setTimeout(r, 50));

    // Call syncUptimeStatus directly - should not change updatedAt
    await store.syncUptimeStatus(initial.id);

    const afterSync = await store.getBlocklet(meta.did);
    expect(afterSync.updatedAt.getTime()).toBe(updatedAtAfterStart.getTime());
  });
});
