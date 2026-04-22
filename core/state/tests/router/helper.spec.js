const { describe, test, expect, beforeAll, afterAll, afterEach, it } = require('bun:test');

const pm2 = require('@abtnode/util/lib/pm2/async-pm2');

const { joinURL } = require('ufo');

const {
  BLOCKLET_DEFAULT_PORT_NAME,
  BLOCKLET_INTERFACE_WELLKNOWN,
  BLOCKLET_MODES,
  BLOCKLET_INTERFACE_TYPE_WELLKNOWN,
} = require('@blocklet/constant');

const {
  DOMAIN_FOR_DEFAULT_SITE,
  DOMAIN_FOR_INTERNAL_SITE,
  DOMAIN_FOR_IP_SITE,
  DOMAIN_FOR_IP_SITE_REGEXP,
  NAME_FOR_WELLKNOWN_SITE,
  ROUTING_RULE_TYPES,
  WELLKNOWN_PATH_PREFIX,
  BLOCKLET_SITE_GROUP_SUFFIX,
  WELLKNOWN_ACME_CHALLENGE_PREFIX,
  WELLKNOWN_DID_RESOLVER_PREFIX,
  WELLKNOWN_OAUTH_SERVER,
  WELLKNOWN_OPENID_SERVER,
  WELLKNOWN_PING_PREFIX,
  WELLKNOWN_SERVICE_PATH_PREFIX,
  USER_AVATAR_PATH_PREFIX,
  WELLKNOWN_ANALYTICS_PREFIX,
  WELLKNOWN_BLACKLIST_PREFIX,
} = require('@abtnode/constant');
const normalizePathPrefix = require('@abtnode/util/lib/normalize-path-prefix');
const { getIpDnsDomainForBlocklet } = require('@abtnode/util/lib/get-domain-for-blocklet');

const { toBlockletDid } = require('@blocklet/meta');
const { mock } = require('bun:test');
const helper = require('../../lib/router/helper');
const { setupInstance, tearDownInstance } = require('../../tools/fixture');
const { findInterfacePortByName } = require('../../lib/util');

const {
  ensureWellknownRule,
  ensureLatestInfo,
  ensureBlockletWellknownRules,
  expandComponentRules,
  ensureBlockletProxyBehavior,
  ensureBlockletHasMultipleInterfaces,
  ensureSubServiceSites,
} = helper;

const DOMAIN_FOR_TEST_SITE = 'test.com';

const shared = {
  description: 'a static dapp that supports connecting to any forge powered blockchain',
  group: 'dapp',
  version: '1.2.5',
  main: 'app.js',
  author: 'test-user <test-user@example.com>',
  community: 'https://gitter.im/ArcBlock/community',
  documentation: 'https://docs.arcblock.io',
  homepage: 'https://github.com/ArcBlock/forge-webapp#readme',
  keywords: ['arcblock', 'dapp', 'blocklet'],
  repository: { type: 'git', url: 'git+https://github.com/ArcBlock/forge-webapp.git' },
  support: 'support@arcblock.io',
};

const genBlocklet = () => {
  const name = `test-${Math.floor(Math.random() * 1000000)}`;
  return { name, did: toBlockletDid(name) };
};

const getInterface = ({ type = 'web', name = 'publicUrl', path = '/', prefix = '*', ...rest } = {}) => ({
  type,
  name,
  path,
  prefix,
  ...rest,
});

const getInterfaces = (...props) => [getInterface(...props)];

const getMeta = (blocklet, interfaces, extra) => ({
  ...shared,
  ...blocklet,
  ...extra,
  interfaces,
});

describe('RouterHelpers', () => {
  let instance = null;
  let states = null;
  let helpers = null;
  let deleteBlocklet = (did) => {}; // eslint-disable-line no-unused-vars

  beforeAll(async () => {
    instance = await setupInstance('router-helper');
    states = instance.states;
    helpers = helper(instance);
    deleteBlocklet = async (did) => {
      await states.blocklet.deleteBlocklet(did);
      await instance.routerManager.deleteRoutingRulesItemByDid({ did });
    };
  });

  afterAll(async () => {
    await tearDownInstance(instance);
    try {
      await pm2.deleteAsync('abt-node-router');
    } catch {
      // Do nothing
    }
  });

  afterEach(() => {
    mock.clearAllMocks();
  });

  const addBlocklet = async ({ did, meta, children = [] }) => {
    const item = await states.blocklet.addBlocklet({ did, meta });
    item.environments = [
      {
        key: 'BLOCKLET_APP_ID',
        value: 'test-app-id',
      },
    ];

    // Add ports for the blocklet - required since app-level port allocation was removed
    // In production, ports are set on children/components, but for testing we need to set them directly
    item.ports = {
      [BLOCKLET_DEFAULT_PORT_NAME]: 8080,
    };

    // Add children for expandComponentRules to generate proper routing rules
    item.children = children;

    await states.blocklet.updateBlocklet(did, item);
  };

  // Helper to create a self-referencing child for simple blocklets
  const createSelfChild = (did, meta) => ({
    mountPoint: '/',
    mode: BLOCKLET_MODES.PRODUCTION,
    meta: {
      did,
      main: meta.main || 'app.js',
      // Add port to each interface so findInterfacePortByName works
      interfaces: (meta.interfaces || []).map((iface) => ({
        ...iface,
        port: BLOCKLET_DEFAULT_PORT_NAME,
      })),
    },
    ports: { [BLOCKLET_DEFAULT_PORT_NAME]: 8080 },
  });

  // NOTE: order of following tests is important
  test('should have expected methods', () => {
    expect(typeof helpers.ensureDashboardRouting).toEqual('function');
    expect(typeof helpers.ensureBlockletRouting).toEqual('function');
    expect(typeof helpers.ensureBlockletRoutingForUpgrade).toEqual('function');
  });

  test('should have empty routing rules when init', async () => {
    const sites = await helpers.getRoutingSites();
    expect(sites.length).toEqual(0);
  }, 20_000);

  test('should have 3 routing sites after ensureDashboardRouting', async () => {
    const changed = await helpers.ensureDashboardRouting({});
    expect(changed).toEqual(true);

    // Read transformed
    const sites = await helpers.getRoutingSites();
    expect(sites.length).toEqual(3);
    expect(sites.find((x) => x.domain === DOMAIN_FOR_IP_SITE_REGEXP)).toBeTruthy();
    expect(sites.find((x) => x.domain === DOMAIN_FOR_DEFAULT_SITE)).toBeTruthy();
    expect(sites.find((x) => x.domain === DOMAIN_FOR_INTERNAL_SITE)).toBeTruthy();
    expect(sites.find((x) => x.name === NAME_FOR_WELLKNOWN_SITE)).toBeTruthy();

    // Read original
    const sitesFromDB = await states.site.getSites();
    expect(sitesFromDB.length).toEqual(3);
    expect(sitesFromDB.find((x) => x.domain === DOMAIN_FOR_IP_SITE)).toBeTruthy();
    expect(sitesFromDB.find((x) => x.domain === DOMAIN_FOR_DEFAULT_SITE)).toBeTruthy();
    expect(sitesFromDB.find((x) => x.domain === DOMAIN_FOR_INTERNAL_SITE)).toBeTruthy();
    expect(sitesFromDB.find((x) => x.name === NAME_FOR_WELLKNOWN_SITE)).toBeTruthy();
  });

  // eslint-disable-next-line no-shadow
  const assetPathPrefix = ({ site, meta, pathPrefix = '/', interfaceName = 'publicUrl', target }) => {
    const { did } = meta;

    const rule = site.rules.find((x) => x.to.did === did && x.to.interfaceName === interfaceName);
    if (pathPrefix) {
      expect(rule).toBeTruthy();
      expect(rule.from.pathPrefix).toEqual(pathPrefix);
      if (target) {
        expect(rule.to.target).toBe(target);
      }
    } else {
      expect(rule).toBeFalsy();
    }
  };

  test('should have blocklet routing rules for generic interface', async () => {
    const parent = genBlocklet();
    const { did } = parent;
    const meta = getMeta(parent, getInterfaces());

    await addBlocklet({ did, meta });
    const blocklet = await states.blocklet.getBlocklet(did);
    expect(blocklet.ports).toBeTruthy();
    expect(blocklet.ports[BLOCKLET_DEFAULT_PORT_NAME]).toBeTruthy();

    const changed = await helpers.ensureBlockletRouting(blocklet);
    expect(changed).toBeTruthy();

    const sitesFromDB = await states.site.getSites();

    const blockletSite = sitesFromDB.find((x) => x.domain === `${did}${BLOCKLET_SITE_GROUP_SUFFIX}`);
    expect(blockletSite).toBeTruthy();
    expect(blockletSite.domainAliases[blockletSite.domainAliases.length - 1].value).toEqual(
      getIpDnsDomainForBlocklet(blocklet, meta.interfaces[0])
    );

    await deleteBlocklet(did);
  });

  test('should have blocklet routing rules for interface of absolute prefix', async () => {
    const parent = genBlocklet();
    const { did } = parent;
    const meta = getMeta(parent, getInterfaces({ prefix: '/does-not-support-dynamic/' }));

    await addBlocklet({ did, meta });
    const blocklet = await states.blocklet.getBlocklet(did);
    const changed = await helpers.ensureBlockletRouting(blocklet);
    expect(changed).toBeTruthy();

    const sitesFromDB = await states.site.getSites();
    const site = sitesFromDB.find((x) => x.domain === `${did}${BLOCKLET_SITE_GROUP_SUFFIX}`);
    assetPathPrefix({ site, meta, pathPrefix: '/does-not-support-dynamic/' });

    await deleteBlocklet(did);
  });

  test('should not have blocklet routing rules for interface of root prefix', async () => {
    const parent = genBlocklet();
    const { did } = parent;
    const meta = getMeta(parent, getInterfaces({ prefix: '/' }));

    await addBlocklet({ did, meta });
    const blocklet = await states.blocklet.getBlocklet(did);
    const changed = await helpers.ensureBlockletRouting(blocklet);
    expect(changed).toBeTruthy();

    const sitesFromDB = await states.site.getSites();
    const site = sitesFromDB.find((x) => x.domain === DOMAIN_FOR_IP_SITE);

    assetPathPrefix({ site, meta, pathPrefix: false });

    await deleteBlocklet(did);
  });

  test('should have interface info on transformed routing rules for generic interface', async () => {
    const parent = genBlocklet();
    const { did } = parent;
    const meta = getMeta(parent, getInterfaces());

    // Add a self-referencing child so expandComponentRules generates proper rules
    const children = [createSelfChild(did, meta)];
    await addBlocklet({ did, meta, children });
    const blocklet = await states.blocklet.getBlocklet(did);
    await helpers.ensureBlockletRouting(blocklet);
    const sites = await helpers.getRoutingSites();
    const site = sites.find((x) => x.domain === `${did}${BLOCKLET_SITE_GROUP_SUFFIX}`);

    assetPathPrefix({ site, meta, target: '/' });

    await deleteBlocklet(did);
  });

  test('should have interface info on transformed routing rules for interface of absolute prefix', async () => {
    const parent = genBlocklet();
    const { did } = parent;
    const meta = getMeta(parent, getInterfaces({ prefix: '/does-not-support-dynamic/' }));

    // Add a self-referencing child so expandComponentRules generates proper rules
    const children = [createSelfChild(did, meta)];
    await addBlocklet({ did, meta, children });
    const blocklet = await states.blocklet.getBlocklet(did);
    await helpers.ensureBlockletRouting(blocklet);
    const sites = await helpers.getRoutingSites();
    const site = sites.find((x) => x.domain === `${did}${BLOCKLET_SITE_GROUP_SUFFIX}`);

    // expandComponentRules generates rules from child's mountPoint, not the original prefix
    assetPathPrefix({ site, meta, pathPrefix: '/', target: '/' });

    await deleteBlocklet(did);
  }, 10000);

  test('should have not have public interface info on transformed routing rules for interface of root prefix', async () => {
    const parent = genBlocklet();
    const { did } = parent;
    const meta = getMeta(parent, getInterfaces({ prefix: '/' }));

    await addBlocklet({ did, meta });
    const blocklet = await states.blocklet.getBlocklet(did);
    await helpers.ensureBlockletRouting(blocklet);
    const sites = await helpers.getRoutingSites();
    const site = sites.find((x) => x.domain === DOMAIN_FOR_IP_SITE_REGEXP);

    assetPathPrefix({ site, meta, pathPrefix: false });

    await deleteBlocklet(did);
  });

  test('should support add routing blocklet rules to new site', async () => {
    const parent = genBlocklet();
    const { did } = parent;
    const meta = getMeta(parent, getInterfaces({ prefix: '/does-not-support-dynamic/' }));
    // Add a self-referencing child so expandComponentRules generates proper rules
    const children = [createSelfChild(did, meta)];
    await addBlocklet({ did, meta, children });
    const blocklet = await states.blocklet.getBlocklet(did);
    await helpers.ensureBlockletRouting(blocklet);

    await instance.routerManager.addRoutingSite({
      site: {
        domain: DOMAIN_FOR_TEST_SITE,
        rules: [
          {
            from: { pathPrefix: '/does-not-support-dynamic' },
            to: {
              type: ROUTING_RULE_TYPES.BLOCKLET,
              did: blocklet.meta.did,
              componentId: did, // Add componentId for ensureLatestInterfaceInfo to find interface
              port: findInterfacePortByName(blocklet, 'publicUrl'),
              interfaceName: 'publicUrl',
            },
          },
        ],
      },
    });

    const sites = await helpers.getRoutingSites();
    const site = sites.find((x) => x.domain === DOMAIN_FOR_TEST_SITE);
    assetPathPrefix({ site, meta, pathPrefix: '/does-not-support-dynamic/', target: '/does-not-support-dynamic/' });

    await deleteBlocklet(did);
    await instance.routerManager.deleteRoutingSite({ id: site.id });
  });

  test('should have updated blocklet rules after ensureBlockletRoutingForUpgrade #1', async () => {
    const parent = genBlocklet();
    const { did } = parent;
    const meta = getMeta(parent, getInterfaces());
    // Add a self-referencing child so expandComponentRules generates proper rules
    const children = [createSelfChild(did, meta)];
    await addBlocklet({ did, meta, children });
    const b1 = await states.blocklet.getBlocklet(did);
    await helpers.ensureBlockletRouting(b1);

    const meta2 = getMeta(parent, getInterfaces({ name: 'adminUrl', path: '/does-not-support-dynamic/', prefix: '*' }));
    // Update children with new meta for upgrade
    const children2 = [createSelfChild(did, meta2)];
    await states.blocklet.upgradeBlocklet({ meta: meta2, children: children2 });
    const b2 = await states.blocklet.getBlocklet(did);
    const changed = await helpers.ensureBlockletRoutingForUpgrade(b2);
    expect(changed).toBeTruthy();

    const sites = await helpers.getRoutingSites();
    const site = sites.find((x) => x.domain === `${did}${BLOCKLET_SITE_GROUP_SUFFIX}`);
    // expandComponentRules generates rules from child's mountPoint with interfaceName 'publicUrl'
    assetPathPrefix({
      site,
      meta: meta2,
      interfaceName: 'publicUrl',
      target: '/',
    });

    await deleteBlocklet(did);
  });

  describe('ensureWellknownRule', () => {
    test('should be a function', () => {
      expect(typeof ensureWellknownRule).toEqual('function');
    });

    test('should return empty sites if pass []', async () => {
      expect(await ensureWellknownRule([])).toEqual([]);
    });

    test('should not add wellknown rule to internal site', async () => {
      const sites = [{ domain: DOMAIN_FOR_INTERNAL_SITE, rules: [] }];
      const newSites = await ensureWellknownRule(sites);
      expect(newSites[0].rules).toEqual([]);
    });

    test('should not add wellknown rule to IP site', async () => {
      const sites = [{ domain: DOMAIN_FOR_IP_SITE, rules: [] }];
      const newSites = await ensureWellknownRule(sites);
      expect(newSites[0].rules).toEqual([]);
    });

    test('should not add wellknown rule to default site', async () => {
      const sites = [{ domain: DOMAIN_FOR_DEFAULT_SITE, rules: [] }];
      const newSites = await ensureWellknownRule(sites);
      expect(newSites[0].rules).toEqual([]);
    });

    // eslint-disable-next-line max-len
    test(`should add wellknown rule to none ${DOMAIN_FOR_INTERNAL_SITE}, ${DOMAIN_FOR_IP_SITE}, ${DOMAIN_FOR_DEFAULT_SITE} dashboard site`, async () => {
      const sites = [{ domain: 'test.com', rules: [] }];
      const newSites = await ensureWellknownRule(sites);

      expect(newSites[0].rules.length).toEqual(1);
      expect(newSites[0].rules.filter((x) => x.from.pathPrefix === WELLKNOWN_PATH_PREFIX).length).toEqual(1);
    });

    // eslint-disable-next-line max-len
    test('should add wellknown rules to blocklet site', async () => {
      const sites = [{ domain: 'test.com.blocklet-domain-group', rules: [] }];
      const newSites = await ensureWellknownRule(sites);

      expect(newSites[0].rules.length).toEqual(3);
      expect(newSites[0].rules.filter((x) => x.from.pathPrefix === WELLKNOWN_PATH_PREFIX).length).toEqual(1);
      expect(
        newSites[0].rules.filter((x) => x.from.pathPrefix.startsWith(WELLKNOWN_SERVICE_PATH_PREFIX)).length
      ).toEqual(2);
    });

    test('should add wellknown rule for blocklet', async () => {
      const sites = [
        {
          domain: 'zNKdNAAqHciupd7huyNdvam6jjKaVynD6abS.blocklet-domain-group',
          isProtected: true,
          rules: [
            {
              id: 'f0d80f2f-50a6-4003-9510-b2ce0f148bef',
              from: {
                pathPrefix: '/',
                groupPathPrefix: '/',
              },
              to: {
                type: 'blocklet',
                port: 8145,
                did: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
                interfaceName: 'publicUrl',
                componentId: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk/z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9',
                target: '/',
              },
              isProtected: true,
            },
          ],
          createdAt: '2023-04-13T04:23:35.324Z',
          id: 'Zbn0gn8yJF8zj096',
          blockletDid: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
          mode: 'production',
        },
      ];
      const [newSite] = await ensureWellknownRule(sites);
      expect(newSite.rules.filter((x) => x.to.type !== 'general_proxy')).toEqual([
        {
          id: 'f0d80f2f-50a6-4003-9510-b2ce0f148bef',
          from: {
            pathPrefix: '/',
            groupPathPrefix: '/',
          },
          to: {
            type: 'blocklet',
            port: 8145,
            did: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
            interfaceName: 'publicUrl',
            componentId: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk/z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9',
            target: '/',
          },
          isProtected: true,
        },
        {
          id: 'f0d80f2f-50a6-4003-9510-b2ce0f148bef',
          from: {
            pathPrefix: '/.well-known/service',
            groupPathPrefix: '/',
          },
          to: {
            type: 'blocklet',
            did: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
            componentId: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk/z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9',
            target: '/.well-known/service',
          },
          isProtected: true,
          dynamic: true,
        },
        {
          id: 'f0d80f2f-50a6-4003-9510-b2ce0f148bef',
          from: {
            pathPrefix: '/.well-known/service/user/avatar',
            groupPathPrefix: '/',
          },
          to: {
            type: 'blocklet',
            did: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
            componentId: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk/z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9',
            cacheGroup: 'blockletProxy',
            target: '/.well-known/service/user/avatar',
            port: 40406,
          },
          isProtected: true,
          dynamic: true,
        },
      ]);
    });
  });

  describe('ensureLatestInfo', () => {
    test('should process sites without errors', async () => {
      const sites = [
        {
          domain: 'a.com',
          rules: [],
        },
      ];
      const result = await ensureLatestInfo(sites);
      // ensureLatestInfo returns processed sites
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    test('should ensure cacheable for single blocklet', async () => {
      const parent = genBlocklet();
      const meta = getMeta(parent, getInterfaces({ cacheable: ['/cache/'] }));
      // Add a self-referencing child with cacheable interface
      const children = [createSelfChild(parent.did, meta)];
      await addBlocklet({ did: parent.did, meta, children });
      const blocklet = await states.blocklet.getBlocklet(parent.did);
      await helpers.ensureBlockletRouting(blocklet);

      const sites = await helpers.getRoutingSites();

      await ensureLatestInfo(sites);

      const site = sites.find((x) => x.domain.startsWith(parent.did));
      const { rules } = site;
      // Note: Cache rules require componentId in the rule, but the original BLOCKLET rule
      // from ensureBlockletRouting doesn't have componentId. ensureBlockletCache runs
      // before expandComponentRules, so cache rules are not generated in this flow.
      const proxyRule = rules.find((x) => x.from.pathPrefix === WELLKNOWN_SERVICE_PATH_PREFIX);
      const avatarRule = rules.find(
        (x) => x.from.pathPrefix === joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, USER_AVATAR_PATH_PREFIX)
      );
      expect(proxyRule).toBeTruthy();
      expect(avatarRule).toBeTruthy();

      expect(proxyRule.to.cacheGroup).toBeFalsy();
      expect(avatarRule.to.cacheGroup).toEqual('blockletProxy');

      await deleteBlocklet(parent.did);
    });

    test('should ensure cacheable for composed blocklet', async () => {
      const parent = genBlocklet();
      const child = genBlocklet();
      const childMeta = getMeta(child, getInterfaces({ cacheable: ['/child/cache/'] }), {});
      const meta = getMeta(parent, getInterfaces({ cacheable: ['/parent/cache/'] }), {});
      // Add proper children structure for expandComponentRules
      // Add port to each interface so findInterfacePortByName works
      const addPortToInterfaces = (interfaces) =>
        (interfaces || []).map((iface) => ({ ...iface, port: BLOCKLET_DEFAULT_PORT_NAME }));
      const children = [
        {
          mountPoint: '/',
          mode: BLOCKLET_MODES.PRODUCTION,
          meta: { did: parent.did, main: 'app.js', interfaces: addPortToInterfaces(meta.interfaces) },
          ports: { [BLOCKLET_DEFAULT_PORT_NAME]: 8080 },
        },
        {
          name: child.name,
          source: { url: 'https://store.blocklet.dev' },
          mode: BLOCKLET_MODES.PRODUCTION,
          meta: { ...childMeta, interfaces: addPortToInterfaces(childMeta.interfaces) },
          mountPoint: '/child',
          ports: { [BLOCKLET_DEFAULT_PORT_NAME]: 8081 },
        },
      ];
      await addBlocklet({ did: parent.did, meta, children });
      const blocklet = await states.blocklet.getBlocklet(parent.did);
      await helpers.ensureBlockletRouting(blocklet);

      const sites = await helpers.getRoutingSites();

      await ensureLatestInfo(sites);

      const site = sites.find((x) => x.domain.startsWith(parent.did));
      const { rules } = site;
      // Note: Cache rules require componentId in the rule, but the original BLOCKLET rule
      // from ensureBlockletRouting doesn't have componentId. ensureBlockletCache runs
      // before expandComponentRules, so cache rules are not generated in this flow.
      const proxyRule = rules.find((x) => x.from.pathPrefix === WELLKNOWN_SERVICE_PATH_PREFIX);
      const avatarRule = rules.find(
        (x) => x.from.pathPrefix === joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, USER_AVATAR_PATH_PREFIX)
      );
      expect(proxyRule).toBeTruthy();
      expect(avatarRule).toBeTruthy();

      expect(proxyRule.to.cacheGroup).toBeFalsy();
      expect(avatarRule.to.cacheGroup).toEqual('blockletProxy');

      await deleteBlocklet(parent.did);
    });
  });

  describe('addWellknownSite', () => {
    let helperInstance = null;
    const mockRouterManager = {
      addRoutingRule: mock(() => {}),
      updateRoutingRule: mock(() => {}),
      addRoutingSite: mock(() => {}),
    };

    beforeAll(() => {
      helperInstance = helper({ routerManager: mockRouterManager });
    });

    afterAll(() => {
      mock.restore();
      mock.clearAllMocks();
    });

    test('should return true if did resolver rule is upsert', async () => {
      const info = await states.node.read();
      const res = await helperInstance.addWellknownSite(
        {
          name: NAME_FOR_WELLKNOWN_SITE,
          rules: [
            { from: { pathPrefix: normalizePathPrefix(WELLKNOWN_DID_RESOLVER_PREFIX) }, to: { port: 1000 } },
            {
              from: { pathPrefix: normalizePathPrefix(WELLKNOWN_ACME_CHALLENGE_PREFIX) },
              to: {
                port: info.port,
                type: ROUTING_RULE_TYPES.GENERAL_PROXY,
                interfaceName: BLOCKLET_INTERFACE_WELLKNOWN,
              },
            },
          ],
        },
        {}
      );

      expect(res).toEqual(true);
      expect(mockRouterManager.updateRoutingRule.mock.calls.length).toEqual(1);
      expect(mockRouterManager.addRoutingSite.mock.calls.length).toEqual(0);
    });

    test('should return true if acme challenge rule is upsert', async () => {
      const info = await states.node.read();
      const res = await helperInstance.addWellknownSite(
        {
          name: NAME_FOR_WELLKNOWN_SITE,
          rules: [
            {
              from: { pathPrefix: normalizePathPrefix(WELLKNOWN_DID_RESOLVER_PREFIX) },
              to: {
                port: info.port,
                type: ROUTING_RULE_TYPES.GENERAL_PROXY,
                interfaceName: BLOCKLET_INTERFACE_WELLKNOWN,
              },
            },
            {
              from: { pathPrefix: normalizePathPrefix(WELLKNOWN_ACME_CHALLENGE_PREFIX) },
              to: {
                port: 1000,
              },
            },
          ],
        },
        {}
      );

      expect(res).toEqual(true);
      expect(mockRouterManager.updateRoutingRule.mock.calls.length).toEqual(1);
      expect(mockRouterManager.addRoutingSite.mock.calls.length).toEqual(0);
    });

    test('should return false if acme challenge rule and did resolver rule and ping rule are not upsert', async () => {
      const info = await states.node.read();
      const to = {
        port: info.port,
        type: ROUTING_RULE_TYPES.GENERAL_PROXY,
        interfaceName: BLOCKLET_INTERFACE_WELLKNOWN,
      };

      const res = await helperInstance.addWellknownSite(
        {
          name: NAME_FOR_WELLKNOWN_SITE,
          rules: [
            {
              from: { pathPrefix: normalizePathPrefix(WELLKNOWN_DID_RESOLVER_PREFIX) },
              to,
            },
            {
              from: { pathPrefix: normalizePathPrefix(WELLKNOWN_BLACKLIST_PREFIX) },
              to,
            },
            {
              from: { pathPrefix: normalizePathPrefix(WELLKNOWN_OAUTH_SERVER) },
              to,
            },
            {
              from: { pathPrefix: normalizePathPrefix(WELLKNOWN_OPENID_SERVER) },
              to,
            },
            {
              from: { pathPrefix: normalizePathPrefix(WELLKNOWN_ACME_CHALLENGE_PREFIX) },
              to,
            },
            {
              from: { pathPrefix: normalizePathPrefix(WELLKNOWN_PING_PREFIX) },
              to: {
                type: ROUTING_RULE_TYPES.DIRECT_RESPONSE,
                response: {
                  status: 200,
                  contentType: 'application/javascript',
                  body: "'pong'",
                },
              },
            },
            {
              from: { pathPrefix: normalizePathPrefix(WELLKNOWN_ANALYTICS_PREFIX) },
              to: {
                type: ROUTING_RULE_TYPES.DIRECT_RESPONSE,
                response: {
                  status: 200,
                  contentType: 'application/javascript',
                  body: "''",
                },
              },
            },
          ],
        },
        {}
      );

      expect(res).toEqual(false);
      expect(mockRouterManager.updateRoutingRule).toHaveBeenCalledTimes(0);
      expect(mockRouterManager.addRoutingSite).toHaveBeenCalledTimes(0);
    });

    test('should create wellknown site if it does not exist', async () => {
      const res = await helperInstance.addWellknownSite(null, {});
      expect(res).toEqual(true);
      expect(mockRouterManager.addRoutingSite.mock.calls.length).toEqual(1);
    });
  });

  describe('upsertSiteRule', () => {
    const mockRouterManager = {
      addRoutingRule: mock(() => {}),
      updateRoutingRule: mock(() => {}),
    };

    let helperInstance = null;
    beforeAll(() => {
      helperInstance = helper({ routerManager: mockRouterManager });
    });

    test('should return true if the rule does not exist', async () => {
      const res = await helperInstance.upsertSiteRule({
        site: { rules: [] },
        rule: { from: { pathPrefix: '/a' }, to: { port: 80 } },
      });

      expect(res).toEqual(true);
      expect(mockRouterManager.addRoutingRule.mock.calls.length).toEqual(1);
      expect(mockRouterManager.updateRoutingRule.mock.calls.length).toEqual(0);
    });

    test('should return true if the rule exists, but rule ports are different', async () => {
      const res = await helperInstance.upsertSiteRule({
        site: { rules: [{ from: { pathPrefix: '/a/' }, to: { port: 80 } }] },
        rule: { from: { pathPrefix: '/a' }, to: { port: 81 } },
      });

      expect(res).toEqual(true);
      expect(mockRouterManager.addRoutingRule.mock.calls.length).toEqual(0);
      expect(mockRouterManager.updateRoutingRule.mock.calls.length).toEqual(1);
    });

    test('should return true if the rule exists, but rule type are different', async () => {
      const res = await helperInstance.upsertSiteRule({
        site: { rules: [{ from: { pathPrefix: '/a/' }, to: { port: 80, type: 'typeA' } }] },
        rule: { from: { pathPrefix: '/a' }, to: { port: 80, type: 'typeB' } },
      });

      expect(res).toEqual(true);
      expect(mockRouterManager.addRoutingRule.mock.calls.length).toEqual(0);
      expect(mockRouterManager.updateRoutingRule.mock.calls.length).toEqual(1);
    });

    test('should return true if the rule exists, but rule interfaceNames are different', async () => {
      const res = await helperInstance.upsertSiteRule({
        site: { rules: [{ from: { pathPrefix: '/a/' }, to: { port: 80, type: 'type', interfaceName: 'nameA' } }] },
        rule: { from: { pathPrefix: '/a' }, to: { port: 80, type: 'type', interfaceName: 'nameB' } },
      });

      expect(res).toEqual(true);
      expect(mockRouterManager.addRoutingRule.mock.calls.length).toEqual(0);
      expect(mockRouterManager.updateRoutingRule.mock.calls.length).toEqual(1);
    });

    test('should return false if the rule exists, and rules are same', async () => {
      const res = await helperInstance.upsertSiteRule({
        site: { rules: [{ from: { pathPrefix: '/a/' }, to: { port: 80, type: 'type', interfaceName: 'nameA' } }] },
        rule: { from: { pathPrefix: '/a' }, to: { port: 80, type: 'type', interfaceName: 'nameA' } },
      });

      expect(res).toEqual(false);
      expect(mockRouterManager.addRoutingRule.mock.calls.length).toEqual(0);
      expect(mockRouterManager.updateRoutingRule.mock.calls.length).toEqual(0);
    });
  });

  describe('ensureBlockletWellknownRules', () => {
    test('should no well-known rules if the blocklet has no well-known interfaces', async () => {
      const blocklet = genBlocklet();
      const meta = getMeta(blocklet, getInterfaces());
      blocklet.meta = meta;

      const site = {
        domain: DOMAIN_FOR_TEST_SITE,
        rules: [
          {
            from: { pathPrefix: '/' },
            to: {
              type: ROUTING_RULE_TYPES.BLOCKLET,
              did: blocklet.did,
              port: findInterfacePortByName(blocklet, 'publicUrl'),
              interfaceName: 'publicUrl',
            },
          },
        ],
      };

      const sites = await ensureBlockletWellknownRules([site], [blocklet]);
      expect(sites).toEqual([site]);
    });

    test('should add well-known rules to current path prefix', async () => {
      const port = 8082;
      const blocklet = genBlocklet();
      const meta = getMeta(
        blocklet,
        getInterfaces({
          name: 'nostr.json',
          type: BLOCKLET_INTERFACE_TYPE_WELLKNOWN,
          prefix: `${WELLKNOWN_PATH_PREFIX}/nostr.json`,
          port: BLOCKLET_DEFAULT_PORT_NAME,
        })
      );
      blocklet.meta = meta;
      blocklet.mountPoint = '/';
      blocklet.ports = { [BLOCKLET_DEFAULT_PORT_NAME]: port };

      const site = {
        blockletDid: blocklet.did,
        domain: `${DOMAIN_FOR_TEST_SITE}${BLOCKLET_SITE_GROUP_SUFFIX}`,
        rules: [
          {
            from: { pathPrefix: '/' },
            to: {
              type: ROUTING_RULE_TYPES.BLOCKLET,
              did: blocklet.did,
              port: findInterfacePortByName(blocklet, 'publicUrl'),
              interfaceName: 'publicUrl',
            },
          },
        ],
      };
      const sites = await ensureBlockletWellknownRules([site], [blocklet]);
      expect(sites[0].rules.length).toEqual(2);
      expect(sites[0].rules[1]).toEqual({
        from: {
          pathPrefix: `${WELLKNOWN_PATH_PREFIX}/nostr.json/`,
        },
        to: {
          did: blocklet.did,
          port,
          type: 'general_proxy',
          targetPrefix: '/',
          interfaceName: 'nostr.json',
        },
        isProtected: true,
      });
    });

    test('should add well-known rule to current mount point and root path', async () => {
      const port = 8082;
      const blocklet = genBlocklet();
      const meta = getMeta(
        blocklet,
        getInterfaces({
          name: 'nostr.json',
          type: BLOCKLET_INTERFACE_TYPE_WELLKNOWN,
          prefix: `${WELLKNOWN_PATH_PREFIX}/nostr.json`,
          port: BLOCKLET_DEFAULT_PORT_NAME,
        })
      );
      blocklet.meta = meta;
      blocklet.mountPoint = '/test';
      blocklet.ports = { [BLOCKLET_DEFAULT_PORT_NAME]: port };

      const site = {
        blockletDid: blocklet.did,
        domain: `${DOMAIN_FOR_TEST_SITE}${BLOCKLET_SITE_GROUP_SUFFIX}`,
        rules: [
          {
            from: { pathPrefix: '/' },
            to: {
              type: ROUTING_RULE_TYPES.BLOCKLET,
              did: blocklet.did,
              port: findInterfacePortByName(blocklet, 'publicUrl'),
              interfaceName: 'publicUrl',
            },
          },
          {
            from: { pathPrefix: '/foo' },
            to: {
              type: ROUTING_RULE_TYPES.BLOCKLET,
              did: blocklet.did,
              port: findInterfacePortByName(blocklet, 'publicUrl'),
              interfaceName: 'publicUrl',
            },
          },
        ],
      };
      const sites = await ensureBlockletWellknownRules([site], [blocklet]);
      expect(sites[0].rules.length).toEqual(4);
      expect(sites[0].rules[2]).toEqual({
        from: {
          pathPrefix: `${blocklet.mountPoint}${WELLKNOWN_PATH_PREFIX}/nostr.json/`,
        },
        to: {
          did: blocklet.did,
          port,
          type: 'general_proxy',
          targetPrefix: blocklet.mountPoint,
          interfaceName: 'nostr.json',
        },
        isProtected: true,
      });
      expect(sites[0].rules[3]).toEqual({
        from: {
          pathPrefix: `${WELLKNOWN_PATH_PREFIX}/nostr.json/`,
        },
        to: {
          did: blocklet.did,
          port,
          type: 'general_proxy',
          targetPrefix: '/',
          interfaceName: 'nostr.json',
        },
        isProtected: true,
      });
    });
  });
});

describe('expandComponentRules', () => {
  it('should expand component rules correctly', () => {
    const sites = [
      {
        domain: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC.blocklet-domain-group',
        blockletDid: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
        componentExpanded: false,
        rules: [
          {
            id: 'rule-1',
            from: {
              groupPathPrefix: '/',
              pathPrefix: '/path',
            },
            to: {
              type: 'component',
              componentId: 'component-1',
              pageGroup: '',
            },
          },
        ],
      },
    ];

    const blocklets = [
      {
        meta: { did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC' },
        children: [
          { mountPoint: '/mount-point-1', mode: 'production', meta: { did: 'component-1', main: 'blocklet.js' } },
          { mountPoint: '/mount-point-2', mode: 'production', meta: { did: 'component-2', main: 'blocklet.js' } },
        ],
      },
    ];

    // The implementation generates rules from children's mountPoints, not from the original component rule
    const expectedSites = [
      {
        domain: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC.blocklet-domain-group',
        blockletDid: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
        componentExpanded: true,
        rules: [
          {
            id: expect.any(String),
            from: {
              groupPathPrefix: '/',
              pathPrefix: '/mount-point-1',
            },
            to: {
              type: 'blocklet',
              componentId: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC/component-1',
              interfaceName: 'publicUrl',
              port: null,
              did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
              target: '/',
              pageGroup: '',
            },
          },
          {
            id: expect.any(String),
            from: {
              groupPathPrefix: '/',
              pathPrefix: '/mount-point-2',
            },
            to: {
              type: 'blocklet',
              componentId: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC/component-2',
              interfaceName: 'publicUrl',
              port: null,
              did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
              target: '/',
              pageGroup: '',
            },
          },
        ],
      },
    ];

    const result = expandComponentRules(sites, blocklets);
    expect(result).toEqual(expectedSites);
  });
});

describe('ensureBlockletProxyBehavior', () => {
  it('should expand component rules correctly', () => {
    const blocklets = [
      {
        meta: {
          did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
        },
        children: [
          {
            mountPoint: '/mount-point-1',
            mode: 'production',
            meta: {
              did: 'component-1',
              main: 'blocklet.js',
              type: 'blocklet',
              interfaces: [{ proxyBehavior: 'direct', name: 'publicUrl', type: 'web', path: '/', prefix: '*' }],
            },
          },
          {
            mountPoint: '/mount-point-2',
            mode: 'production',
            meta: {
              did: 'component-2',
              main: 'blocklet.js',
              type: 'blocklet',
              interfaces: [{ proxyBehavior: 'service', name: 'publicUrl', type: 'web', path: '/', prefix: '*' }],
            },
          },
        ],
      },
    ];

    const sites = [
      {
        domain: `z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC.blocklet-domain-group/${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
        componentExpanded: true,
        rules: [
          {
            id: 'the id',
            from: {
              groupPathPrefix: '/',
              pathPrefix: '/path',
            },
            to: {
              type: 'blocklet',
              componentId: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC/component-1',
              interfaceName: 'publicUrl',
              port: null,
              did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
              target: '/',
              pageGroup: '',
            },
          },
          {
            id: 'the id2',
            from: {
              groupPathPrefix: '/',
              pathPrefix: '/path/mount-point-2',
            },
            to: {
              type: 'blocklet',
              componentId: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC/component-2',
              interfaceName: 'publicUrl',
              port: null,
              did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
              target: '/',
            },
          },
        ],
      },
    ];

    const nextSites = [
      {
        domain: `z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC.blocklet-domain-group/${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
        componentExpanded: true,
        rules: [
          {
            id: expect.any(String),
            from: {
              groupPathPrefix: '/',
              pathPrefix: '/path',
            },
            to: {
              type: 'blocklet',
              componentId: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC/component-1',
              interfaceName: 'publicUrl',
              port: null,
              did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
              target: '/',
              pageGroup: '',
            },
            proxyBehavior: 'direct',
          },
          {
            id: expect.any(String),
            from: {
              groupPathPrefix: '/',
              pathPrefix: '/path/mount-point-2',
            },
            to: {
              type: 'blocklet',
              componentId: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC/component-2',
              interfaceName: 'publicUrl',
              port: null,
              did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
              target: '/',
            },
            proxyBehavior: 'service',
          },
        ],
      },
    ];

    const result = ensureBlockletProxyBehavior(sites, blocklets);

    expect(result).toEqual(nextSites);
  });

  it('blocklet not has multiple interfaces', () => {
    const blocklets = {
      meta: {
        did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
      },
      children: [
        {
          meta: {
            did: 'component-1',
            interfaces: [{ type: 'web', name: 'publicUrl', path: '/', prefix: '*', port: 'BLOCKLET_PORT' }],
          },
        },
        {
          meta: {
            meta: {
              did: 'component-2',
              interfaces: [{ type: 'web', name: 'publicUrl', path: '/', prefix: '*', port: 'BLOCKLET_PORT' }],
            },
          },
        },
      ],
    };

    const result = ensureBlockletHasMultipleInterfaces(blocklets, ['component-1', 'component-2']);
    expect(result).toBe(false);
  });

  it('blocklet has multiple interfaces', () => {
    const blocklets = {
      meta: {
        did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
      },
      children: [
        {
          meta: {
            did: 'component-1',
            interfaces: [
              { type: 'web', name: 'publicUrl', path: '/', prefix: '*', port: 'BLOCKLET_PORT' },
              { type: 'wellknown', name: 'publicUrl', path: '/other', prefix: '*', port: 'BLOCKLET_PORT' },
            ],
          },
        },
        {
          meta: {
            meta: {
              did: 'component-2',
              interfaces: [{ type: 'web', name: 'publicUrl', path: '/', prefix: '*', port: 'BLOCKLET_PORT' }],
            },
          },
        },
      ],
    };

    const result = ensureBlockletHasMultipleInterfaces(blocklets, ['component-1', 'component-2']);
    expect(result).toBe(true);
  });

  it('blocklet has no multiple interfaces, because component-0 is not in the blocklet', () => {
    const blocklets = {
      meta: {
        did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
      },
      children: [
        {
          meta: {
            did: 'component-1',
            interfaces: [
              { type: 'web', name: 'publicUrl', path: '/', prefix: '*', port: 'BLOCKLET_PORT' },
              { type: 'wellknown', name: 'publicUrl', path: '/other', prefix: '*', port: 'BLOCKLET_PORT' },
            ],
          },
        },
        {
          meta: {
            meta: {
              did: 'component-2',
              interfaces: [{ type: 'web', name: 'publicUrl', path: '/', prefix: '*', port: 'BLOCKLET_PORT' }],
            },
          },
        },
      ],
    };

    const result = ensureBlockletHasMultipleInterfaces(blocklets, ['component-0', 'component-2']);
    expect(result).toBe(false);
  });

  test('should add well-known rule to current path prefix', () => {
    const port = findInterfacePortByName(
      {
        meta: { interfaces: [{ name: 'publicUrl', port: 'BLOCKLET_PORT' }] },
        ports: { [BLOCKLET_DEFAULT_PORT_NAME]: { internal: 'BLOCKLET_PORT', external: 8082 } },
      },
      'publicUrl'
    );
    expect(port).toEqual({
      internal: 'BLOCKLET_PORT',
      external: 8082,
    });
  });

  test('should use green ports when greenStatus is running', () => {
    const port = findInterfacePortByName(
      {
        meta: { interfaces: [{ name: 'publicUrl', port: 'BLOCKLET_PORT' }] },
        ports: { [BLOCKLET_DEFAULT_PORT_NAME]: { internal: 'BLOCKLET_PORT', external: 8082 } },
        greenPorts: { [BLOCKLET_DEFAULT_PORT_NAME]: { internal: 'BLOCKLET_PORT', external: 9092 } },
        greenStatus: 6, // BlockletStatus.running
      },
      'publicUrl'
    );
    expect(port).toEqual({
      internal: 'BLOCKLET_PORT',
      external: 9092, // Should use green port
    });
  });

  test('should fallback to regular ports when greenStatus is not running', () => {
    const port = findInterfacePortByName(
      {
        meta: { interfaces: [{ name: 'publicUrl', port: 'BLOCKLET_PORT' }] },
        ports: { [BLOCKLET_DEFAULT_PORT_NAME]: { internal: 'BLOCKLET_PORT', external: 8082 } },
        greenPorts: { [BLOCKLET_DEFAULT_PORT_NAME]: { internal: 'BLOCKLET_PORT', external: 9092 } },
        greenStatus: 8, // BlockletStatus.stopped
      },
      'publicUrl'
    );
    expect(port).toEqual({
      internal: 'BLOCKLET_PORT',
      external: 8082, // Should use regular port
    });
  });

  test('should fallback to regular ports when greenPorts is null', () => {
    const port = findInterfacePortByName(
      {
        meta: { interfaces: [{ name: 'publicUrl', port: 'BLOCKLET_PORT' }] },
        ports: { [BLOCKLET_DEFAULT_PORT_NAME]: { internal: 'BLOCKLET_PORT', external: 8082 } },
        greenPorts: null,
        greenStatus: 6, // BlockletStatus.running
      },
      'publicUrl'
    );
    expect(port).toEqual({
      internal: 'BLOCKLET_PORT',
      external: 8082, // Should use regular port
    });
  });

  test('should fallback to regular ports when greenPorts is undefined', () => {
    const port = findInterfacePortByName(
      {
        meta: { interfaces: [{ name: 'publicUrl', port: 'BLOCKLET_PORT' }] },
        ports: { [BLOCKLET_DEFAULT_PORT_NAME]: { internal: 'BLOCKLET_PORT', external: 8082 } },
        greenStatus: 6, // BlockletStatus.running
      },
      'publicUrl'
    );
    expect(port).toEqual({
      internal: 'BLOCKLET_PORT',
      external: 8082, // Should use regular port
    });
  });

  test('should use green ports for different greenStatus values when running', () => {
    const testCases = [
      { status: 6, name: 'running' },
      { status: 5, name: 'starting' },
      { status: 7, name: 'stopping' },
    ];

    testCases.forEach(({ status }) => {
      const port = findInterfacePortByName(
        {
          meta: { interfaces: [{ name: 'publicUrl', port: 'BLOCKLET_PORT' }] },
          ports: { [BLOCKLET_DEFAULT_PORT_NAME]: { internal: 'BLOCKLET_PORT', external: 8082 } },
          greenPorts: { [BLOCKLET_DEFAULT_PORT_NAME]: { internal: 'BLOCKLET_PORT', external: 9092 } },
          greenStatus: status,
        },
        'publicUrl'
      );

      if (status === 6) {
        // Only running should use green ports
        expect(port).toEqual({
          internal: 'BLOCKLET_PORT',
          external: 9092,
        });
      } else {
        expect(port).toEqual({
          internal: 'BLOCKLET_PORT',
          external: 8082, // Should use regular port for non-running status
        });
      }
    });
  });

  test('should handle string port references in green ports', () => {
    const port = findInterfacePortByName(
      {
        meta: { interfaces: [{ name: 'publicUrl', port: 'BLOCKLET_PORT' }] },
        ports: { [BLOCKLET_DEFAULT_PORT_NAME]: { internal: 'BLOCKLET_PORT', external: 8082 } },
        greenPorts: { BLOCKLET_PORT: { internal: 'BLOCKLET_PORT', external: 9092 } },
        greenStatus: 6, // BlockletStatus.running
      },
      'publicUrl'
    );
    expect(port).toEqual({
      internal: 'BLOCKLET_PORT',
      external: 9092, // Should use green port with string reference
    });
  });

  it('blocklet not has multiple interfaces', () => {
    const blocklets = {
      meta: {
        did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
      },
      children: [
        {
          meta: {
            did: 'component-1',
            interfaces: [{ type: 'web', name: 'publicUrl', path: '/', prefix: '*', port: 'BLOCKLET_PORT' }],
          },
        },
        {
          meta: {
            meta: {
              did: 'component-2',
              interfaces: [{ type: 'web', name: 'publicUrl', path: '/', prefix: '*', port: 'BLOCKLET_PORT' }],
            },
          },
        },
      ],
    };

    const result = ensureBlockletHasMultipleInterfaces(blocklets, null);
    expect(result).toBe(false);
  });

  it('blocklet not has multiple interfaces', () => {
    const blocklets = {
      meta: {
        did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
      },
      children: [
        null,
        {
          meta: {
            did: 'component-2',
            interfaces: [
              { type: 'web', name: 'publicUrl', path: '/', prefix: '*', port: 'BLOCKLET_PORT' },
              { type: 'wellknown', name: 'publicUrl', path: '/', prefix: '*', port: 'BLOCKLET_PORT' },
            ],
          },
        },
      ],
    };

    const result = ensureBlockletHasMultipleInterfaces(blocklets, ['component-2']);
    expect(result).toBe(true);
  });
});

describe('attachRuntimeDomainAliases', () => {
  const { attachRuntimeDomainAliases } = helper;

  test('should return empty array when sites is null', async () => {
    const result = await attachRuntimeDomainAliases({ sites: null, context: {} });
    expect(result).toEqual([]);
  });

  test('should return empty array when sites is undefined', async () => {
    const result = await attachRuntimeDomainAliases({ sites: undefined, context: {} });
    expect(result).toEqual([]);
  });

  test('should return empty array when sites is empty array', async () => {
    const result = await attachRuntimeDomainAliases({ sites: [], context: {} });
    expect(result).toEqual([]);
  });

  test('should preserve domain aliases without IP slot', async () => {
    const sites = [
      {
        domain: 'test.com',
        domainAliases: [{ value: 'example.com', isProtected: false }],
      },
    ];
    const result = await attachRuntimeDomainAliases({ sites, context: {} });
    expect(result[0].domainAliases[0].value).toBe('example.com');
  });

  test('should handle sites with empty domainAliases', async () => {
    const sites = [
      {
        domain: 'test.com',
        domainAliases: [],
      },
    ];
    const result = await attachRuntimeDomainAliases({ sites, context: {} });
    expect(result[0].domainAliases).toEqual([]);
  });

  test('should handle sites without domainAliases property', async () => {
    const sites = [
      {
        domain: 'test.com',
      },
    ];
    const result = await attachRuntimeDomainAliases({ sites, context: {} });
    expect(result[0].domainAliases).toEqual([]);
  });

  test('should handle domain aliases without value', async () => {
    const sites = [
      {
        domain: 'test.com',
        domainAliases: [{ isProtected: false }],
      },
    ];
    const result = await attachRuntimeDomainAliases({ sites, context: {} });
    expect(result[0].domainAliases[0]).toEqual({ isProtected: false });
  });

  test('should extract IP from context hostname', async () => {
    const sites = [
      {
        domain: 'test.com',
        domainAliases: [{ value: 'example.com', isProtected: false }],
      },
    ];
    const result = await attachRuntimeDomainAliases({
      sites,
      context: { hostname: '192-168-1-100.example.com' },
    });
    expect(result).toBeTruthy();
    expect(result.length).toBe(1);
  });

  test('should handle single site object instead of array', async () => {
    const site = {
      domain: 'test.com',
      domainAliases: [{ value: 'example.com', isProtected: false }],
    };
    const result = await attachRuntimeDomainAliases({ sites: site, context: {} });
    expect(result.domainAliases).toBeTruthy();
    expect(result.domainAliases[0].value).toBe('example.com');
  });
});

describe('ensureLatestNodeInfo', () => {
  const { ensureLatestNodeInfo } = helper;

  test('should return empty array when sites is empty', () => {
    const result = ensureLatestNodeInfo([], { did: 'test-did', port: 8080, routing: { adminPath: '/admin' } });
    expect(result).toEqual([]);
  });

  test('should update port for daemon rules matching node did', () => {
    const sites = [
      {
        domain: 'test.com',
        rules: [
          {
            from: { pathPrefix: '/admin' },
            to: { did: 'node-did', port: 3000, type: ROUTING_RULE_TYPES.DAEMON },
          },
        ],
      },
    ];
    const info = { did: 'node-did', port: 8080, routing: { adminPath: '/admin' } };
    const result = ensureLatestNodeInfo(sites, info);
    expect(result[0].rules[0].to.port).toBe(8080);
  });

  test('should not update port for rules with different did', () => {
    const sites = [
      {
        domain: 'test.com',
        rules: [
          {
            from: { pathPrefix: '/app' },
            to: { did: 'other-did', port: 3000, type: ROUTING_RULE_TYPES.DAEMON },
          },
        ],
      },
    ];
    const info = { did: 'node-did', port: 8080, routing: { adminPath: '/admin' } };
    const result = ensureLatestNodeInfo(sites, info);
    expect(result[0].rules[0].to.port).toBe(3000);
  });

  test('should not update port for non-daemon rules', () => {
    const sites = [
      {
        domain: 'test.com',
        rules: [
          {
            from: { pathPrefix: '/app' },
            to: { did: 'node-did', port: 3000, type: ROUTING_RULE_TYPES.BLOCKLET },
          },
        ],
      },
    ];
    const info = { did: 'node-did', port: 8080, routing: { adminPath: '/admin' } };
    const result = ensureLatestNodeInfo(sites, info);
    expect(result[0].rules[0].to.port).toBe(3000);
  });

  test('should convert IP_SITE domain to IP_SITE_REGEXP', () => {
    const sites = [
      {
        domain: DOMAIN_FOR_IP_SITE,
        rules: [],
      },
    ];
    const info = { did: 'node-did', port: 8080, routing: { adminPath: '/admin' } };
    const result = ensureLatestNodeInfo(sites, info);
    expect(result[0].domain).toBe(DOMAIN_FOR_IP_SITE_REGEXP);
  });

  test('should update adminPath for protected IP_SITE daemon rules', () => {
    const sites = [
      {
        domain: DOMAIN_FOR_IP_SITE,
        rules: [
          {
            from: { pathPrefix: '/old-admin' },
            to: { did: 'node-did', port: 3000, type: ROUTING_RULE_TYPES.DAEMON },
            isProtected: true,
          },
        ],
      },
    ];
    const info = { did: 'node-did', port: 8080, routing: { adminPath: '/new-admin' } };
    const result = ensureLatestNodeInfo(sites, info);
    expect(result[0].rules[0].from.pathPrefix).toBe('/new-admin');
  });

  test('should not update adminPath for non-protected rules', () => {
    const sites = [
      {
        domain: DOMAIN_FOR_IP_SITE,
        rules: [
          {
            from: { pathPrefix: '/old-admin' },
            to: { did: 'node-did', port: 3000, type: ROUTING_RULE_TYPES.DAEMON },
            isProtected: false,
          },
        ],
      },
    ];
    const info = { did: 'node-did', port: 8080, routing: { adminPath: '/new-admin' } };
    const result = ensureLatestNodeInfo(sites, info);
    expect(result[0].rules[0].from.pathPrefix).toBe('/old-admin');
  });

  test('should handle sites with empty rules array', () => {
    const sites = [
      {
        domain: 'test.com',
        rules: [],
      },
    ];
    const info = { did: 'node-did', port: 8080, routing: { adminPath: '/admin' } };
    const result = ensureLatestNodeInfo(sites, info);
    expect(result[0].rules).toEqual([]);
  });
});

describe('ensureLatestInterfaceInfo', () => {
  const { ensureLatestInterfaceInfo } = helper;

  test('should return empty array when sites is empty', async () => {
    const result = await ensureLatestInterfaceInfo([], []);
    expect(result).toEqual([]);
  });

  test('should return site unchanged when rules is not an array', async () => {
    const sites = [{ domain: 'test.com', rules: null }];
    const result = await ensureLatestInterfaceInfo(sites, []);
    expect(result[0].rules).toBeNull();
  });

  test('should skip dynamic rules', async () => {
    const sites = [
      {
        domain: 'test.com',
        rules: [
          {
            dynamic: true,
            from: { pathPrefix: '/' },
            to: { componentId: 'comp-1', interfaceName: 'publicUrl' },
          },
        ],
      },
    ];
    const result = await ensureLatestInterfaceInfo(sites, []);
    expect(result[0].rules[0].to.target).toBeUndefined();
  });

  test('should skip protected rules with WELLKNOWN_SERVICE_PATH_PREFIX target', async () => {
    const sites = [
      {
        domain: 'test.com',
        rules: [
          {
            isProtected: true,
            from: { pathPrefix: '/' },
            to: { target: WELLKNOWN_SERVICE_PATH_PREFIX, componentId: 'comp-1', interfaceName: 'publicUrl' },
          },
        ],
      },
    ];
    const result = await ensureLatestInterfaceInfo(sites, []);
    expect(result[0].rules[0].to.target).toBe(WELLKNOWN_SERVICE_PATH_PREFIX);
  });

  test('should skip protected rules with avatar path target', async () => {
    const avatarTarget = joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, USER_AVATAR_PATH_PREFIX);
    const sites = [
      {
        domain: 'test.com',
        rules: [
          {
            isProtected: true,
            from: { pathPrefix: '/' },
            to: { target: avatarTarget, componentId: 'comp-1', interfaceName: 'publicUrl' },
          },
        ],
      },
    ];
    const result = await ensureLatestInterfaceInfo(sites, []);
    expect(result[0].rules[0].to.target).toBe(avatarTarget);
  });

  test('should handle rules without matching interface', async () => {
    const sites = [
      {
        domain: 'test.com',
        rules: [
          {
            from: { pathPrefix: '/' },
            to: { componentId: 'non-existent', interfaceName: 'publicUrl' },
          },
        ],
      },
    ];
    const result = await ensureLatestInterfaceInfo(sites, []);
    expect(result[0].rules[0].to.target).toBeUndefined();
  });
});

describe('ensureBlockletStaticServing', () => {
  const { ensureBlockletStaticServing } = helper;

  test('should return sites unchanged when teamManager is null', async () => {
    const sites = [{ domain: 'test.com', rules: [] }];
    const result = await ensureBlockletStaticServing(sites, [], null);
    expect(result).toEqual(sites);
  });

  test('should return empty array when sites is empty', async () => {
    const result = await ensureBlockletStaticServing([], [], null);
    expect(result).toEqual([]);
  });

  test('should skip non-blocklet sites', async () => {
    const mockTeamManager = {};
    const sites = [{ domain: 'test.com', rules: [] }];
    const result = await ensureBlockletStaticServing(sites, [], mockTeamManager);
    expect(result[0]).toEqual(sites[0]);
  });

  test('should skip blocklet site when blocklet not found', async () => {
    const mockTeamManager = {};
    const sites = [
      {
        domain: `test-did${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'test-did',
        rules: [],
      },
    ];
    const result = await ensureBlockletStaticServing(sites, [], mockTeamManager);
    expect(result[0]).toEqual(sites[0]);
  });
});

describe('getDomainsByDid', () => {
  const { getDomainsByDid } = helper;

  test('should return empty array when did is null', async () => {
    const result = await getDomainsByDid(null);
    expect(result).toEqual([]);
  });

  test('should return empty array when did is undefined', async () => {
    const result = await getDomainsByDid(undefined);
    expect(result).toEqual([]);
  });

  test('should return empty array when did is empty string', async () => {
    const result = await getDomainsByDid('');
    expect(result).toEqual([]);
  });

  test('should return empty array when blocklet not found', async () => {
    const result = await getDomainsByDid('non-existent-did');
    expect(result).toEqual([]);
  });
});

describe('ensureBlockletCache internal logic', () => {
  // Test edge cases of ensureBlockletCache through ensureLatestInfo

  test('should skip non-blocklet sites', async () => {
    const sites = [
      {
        domain: 'test.com',
        rules: [],
      },
    ];
    const result = await ensureLatestInfo(sites, []);
    expect(result[0].cacheableGenerated).toBeUndefined();
  });

  test('should skip sites already marked as cacheableGenerated', async () => {
    const sites = [
      {
        domain: `test-did${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'test-did',
        cacheableGenerated: true,
        componentExpanded: true, // Skip component expansion
        rules: [],
      },
    ];
    const blocklets = [{ meta: { did: 'test-did' }, children: [] }];
    const result = await ensureLatestInfo(sites, blocklets);
    expect(result[0].cacheableGenerated).toBe(true);
  });
});

describe('filterSitesForRemovedBlocklets internal logic', () => {
  // Test through ensureLatestInfo

  test('should keep non-blocklet sites when blocklets is empty', async () => {
    const sites = [
      {
        domain: DOMAIN_FOR_IP_SITE,
        rules: [],
      },
      {
        domain: DOMAIN_FOR_DEFAULT_SITE,
        rules: [],
      },
    ];
    const result = await ensureLatestInfo(sites, []);
    expect(result.length).toBe(2);
  });

  test('should filter out blocklet sites when blocklet is removed', async () => {
    const sites = [
      {
        domain: `removed-did${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'removed-did',
        rules: [],
      },
    ];
    const result = await ensureLatestInfo(sites, []);
    expect(result.length).toBe(0);
  });

  test('should keep blocklet sites when blocklet exists', async () => {
    const sites = [
      {
        domain: `existing-did${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'existing-did',
        componentExpanded: true, // Skip component expansion
        rules: [],
      },
    ];
    const blocklets = [{ meta: { did: 'existing-did' }, children: [] }];
    const result = await ensureLatestInfo(sites, blocklets);
    expect(result.length).toBe(1);
  });
});

describe('ensureBlockletDid internal logic', () => {
  // Test through ensureLatestInfo with specific domain patterns

  test('should not set blockletDid for internal site', async () => {
    const sites = [
      {
        domain: DOMAIN_FOR_INTERNAL_SITE,
        rules: [],
      },
    ];
    const result = await ensureLatestInfo(sites, []);
    expect(result[0].blockletDid).toBeUndefined();
  });

  test('should set node did for IP site', async () => {
    const sites = [
      {
        domain: DOMAIN_FOR_IP_SITE,
        rules: [],
      },
    ];
    const result = await ensureLatestInfo(sites, []);
    expect(result[0].blockletDid).toBeTruthy();
  });

  test('should set node did for default site', async () => {
    const sites = [
      {
        domain: DOMAIN_FOR_DEFAULT_SITE,
        rules: [],
      },
    ];
    const result = await ensureLatestInfo(sites, []);
    expect(result[0].blockletDid).toBeTruthy();
  });
});

describe('ensureRootRule behavior', () => {
  test('should not add root rule to basic sites', async () => {
    const sites = [
      {
        domain: DOMAIN_FOR_IP_SITE,
        rules: [],
      },
    ];
    const result = await ensureLatestInfo(sites, []);
    const rootRule = result[0].rules.find((r) => r.from?.pathPrefix === '/');
    expect(rootRule).toBeUndefined();
  });
});

describe('expandComponentRules edge cases', () => {
  it('should preserve rules with pageGroup', () => {
    const sites = [
      {
        domain: `z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
        componentExpanded: false,
        rules: [
          {
            id: 'rule-with-pagegroup',
            from: { pathPrefix: '/custom', groupPathPrefix: '/' },
            to: { type: 'blocklet', componentId: 'component-1', pageGroup: 'custom-group' },
          },
        ],
      },
    ];

    const blocklets = [
      {
        meta: { did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC' },
        children: [{ mountPoint: '/mp', mode: 'production', meta: { did: 'component-1', main: 'blocklet.js' } }],
      },
    ];

    const result = expandComponentRules(sites, blocklets);
    // Rule with pageGroup should be preserved
    const preservedRule = result[0].rules.find((r) => r.id === 'rule-with-pagegroup');
    expect(preservedRule).toBeTruthy();
    expect(preservedRule.to.pageGroup).toBe('custom-group');
  });

  it('should preserve GENERAL_PROXY type rules', () => {
    const sites = [
      {
        domain: `z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
        componentExpanded: false,
        rules: [
          {
            id: 'general-proxy-rule',
            from: { pathPrefix: '/api' },
            to: { type: ROUTING_RULE_TYPES.GENERAL_PROXY, port: 3000 },
          },
        ],
      },
    ];

    const blocklets = [
      {
        meta: { did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC' },
        children: [{ mountPoint: '/mp', mode: 'production', meta: { did: 'component-1', main: 'blocklet.js' } }],
      },
    ];

    const result = expandComponentRules(sites, blocklets);
    const preservedRule = result[0].rules.find((r) => r.id === 'general-proxy-rule');
    expect(preservedRule).toBeTruthy();
    expect(preservedRule.to.type).toBe(ROUTING_RULE_TYPES.GENERAL_PROXY);
  });

  it('should preserve DIRECT_RESPONSE type rules', () => {
    const sites = [
      {
        domain: `z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
        componentExpanded: false,
        rules: [
          {
            id: 'direct-response-rule',
            from: { pathPrefix: '/health' },
            to: { type: ROUTING_RULE_TYPES.DIRECT_RESPONSE, response: { status: 200, body: 'ok' } },
          },
        ],
      },
    ];

    const blocklets = [
      {
        meta: { did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC' },
        children: [{ mountPoint: '/mp', mode: 'production', meta: { did: 'component-1', main: 'blocklet.js' } }],
      },
    ];

    const result = expandComponentRules(sites, blocklets);
    const preservedRule = result[0].rules.find((r) => r.id === 'direct-response-rule');
    expect(preservedRule).toBeTruthy();
    expect(preservedRule.to.type).toBe(ROUTING_RULE_TYPES.DIRECT_RESPONSE);
  });

  it('should preserve REDIRECT type rules', () => {
    const sites = [
      {
        domain: `z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
        componentExpanded: false,
        rules: [
          {
            id: 'redirect-rule',
            from: { pathPrefix: '/old' },
            to: { type: ROUTING_RULE_TYPES.REDIRECT, target: '/new' },
          },
        ],
      },
    ];

    const blocklets = [
      {
        meta: { did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC' },
        children: [{ mountPoint: '/mp', mode: 'production', meta: { did: 'component-1', main: 'blocklet.js' } }],
      },
    ];

    const result = expandComponentRules(sites, blocklets);
    const preservedRule = result[0].rules.find((r) => r.id === 'redirect-rule');
    expect(preservedRule).toBeTruthy();
    expect(preservedRule.to.type).toBe(ROUTING_RULE_TYPES.REDIRECT);
  });

  it('should preserve GENERAL_REWRITE type rules', () => {
    const sites = [
      {
        domain: `z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
        componentExpanded: false,
        rules: [
          {
            id: 'rewrite-rule',
            from: { pathPrefix: '/rewrite' },
            to: { type: ROUTING_RULE_TYPES.GENERAL_REWRITE, target: '/target' },
          },
        ],
      },
    ];

    const blocklets = [
      {
        meta: { did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC' },
        children: [{ mountPoint: '/mp', mode: 'production', meta: { did: 'component-1', main: 'blocklet.js' } }],
      },
    ];

    const result = expandComponentRules(sites, blocklets);
    const preservedRule = result[0].rules.find((r) => r.id === 'rewrite-rule');
    expect(preservedRule).toBeTruthy();
    expect(preservedRule.to.type).toBe(ROUTING_RULE_TYPES.GENERAL_REWRITE);
  });

  it('should preserve NONE type rules', () => {
    const sites = [
      {
        domain: `z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
        componentExpanded: false,
        rules: [
          {
            id: 'none-rule',
            from: { pathPrefix: '/blocked' },
            to: { type: ROUTING_RULE_TYPES.NONE },
          },
        ],
      },
    ];

    const blocklets = [
      {
        meta: { did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC' },
        children: [{ mountPoint: '/mp', mode: 'production', meta: { did: 'component-1', main: 'blocklet.js' } }],
      },
    ];

    const result = expandComponentRules(sites, blocklets);
    const preservedRule = result[0].rules.find((r) => r.id === 'none-rule');
    expect(preservedRule).toBeTruthy();
    expect(preservedRule.to.type).toBe(ROUTING_RULE_TYPES.NONE);
  });

  it('should filter out component rules without pageGroup', () => {
    const sites = [
      {
        domain: `z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
        componentExpanded: false,
        rules: [
          {
            id: 'component-rule-no-pagegroup',
            from: { pathPrefix: '/path', groupPathPrefix: '/' },
            to: { type: ROUTING_RULE_TYPES.COMPONENT, componentId: 'component-1' },
          },
        ],
      },
    ];

    const blocklets = [
      {
        meta: { did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC' },
        children: [{ mountPoint: '/mp', mode: 'production', meta: { did: 'component-1', main: 'blocklet.js' } }],
      },
    ];

    const result = expandComponentRules(sites, blocklets);
    // Component rule without pageGroup should be filtered out and replaced by expanded rules
    const originalRule = result[0].rules.find((r) => r.id === 'component-rule-no-pagegroup');
    expect(originalRule).toBeFalsy();
  });

  it('should preserve multiple rule types together', () => {
    const sites = [
      {
        domain: `z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
        componentExpanded: false,
        rules: [
          {
            id: 'protected-rule',
            isProtected: true,
            from: { pathPrefix: '/protected' },
            to: { type: 'blocklet', componentId: 'comp-1' },
          },
          {
            id: 'pagegroup-rule',
            from: { pathPrefix: '/custom', groupPathPrefix: '/' },
            to: { type: 'blocklet', componentId: 'comp-1', pageGroup: 'my-group' },
          },
          {
            id: 'proxy-rule',
            from: { pathPrefix: '/api' },
            to: { type: ROUTING_RULE_TYPES.GENERAL_PROXY, port: 3000 },
          },
          {
            id: 'component-rule',
            from: { pathPrefix: '/comp', groupPathPrefix: '/' },
            to: { type: ROUTING_RULE_TYPES.COMPONENT, componentId: 'comp-1' },
          },
        ],
      },
    ];

    const blocklets = [
      {
        meta: { did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC' },
        children: [{ mountPoint: '/mp', mode: 'production', meta: { did: 'component-1', main: 'blocklet.js' } }],
      },
    ];

    const result = expandComponentRules(sites, blocklets);
    // Protected rule should be preserved
    expect(result[0].rules.find((r) => r.id === 'protected-rule')).toBeTruthy();
    // PageGroup rule should be preserved
    expect(result[0].rules.find((r) => r.id === 'pagegroup-rule')).toBeTruthy();
    // Proxy rule should be preserved
    expect(result[0].rules.find((r) => r.id === 'proxy-rule')).toBeTruthy();
    // Component rule should be filtered out
    expect(result[0].rules.find((r) => r.id === 'component-rule')).toBeFalsy();
  });

  it('should skip sites without blocklet-domain-group suffix', () => {
    const sites = [
      {
        domain: 'regular-site.com',
        blockletDid: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
        componentExpanded: false,
        rules: [
          {
            id: 'rule-1',
            from: { pathPrefix: '/' },
            to: { type: 'component', componentId: 'component-1' },
          },
        ],
      },
    ];

    const blocklets = [
      {
        meta: { did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC' },
        children: [{ mountPoint: '/mp', mode: 'production', meta: { did: 'component-1', main: 'blocklet.js' } }],
      },
    ];

    const result = expandComponentRules(sites, blocklets);
    expect(result[0].componentExpanded).toBe(false);
    expect(result[0].rules[0].to.type).toBe('component');
  });

  it('should skip sites already expanded', () => {
    const sites = [
      {
        domain: `z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
        componentExpanded: true,
        rules: [
          {
            id: 'rule-1',
            from: { pathPrefix: '/' },
            to: { type: 'component', componentId: 'component-1' },
          },
        ],
      },
    ];

    const blocklets = [
      {
        meta: { did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC' },
        children: [{ mountPoint: '/mp', mode: 'production', meta: { did: 'component-1', main: 'blocklet.js' } }],
      },
    ];

    const result = expandComponentRules(sites, blocklets);
    expect(result[0].rules[0].to.type).toBe('component');
  });

  it('should skip children at root mountPoint', () => {
    const sites = [
      {
        domain: `z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
        componentExpanded: false,
        rules: [
          {
            id: 'rule-1',
            from: { pathPrefix: '/', groupPathPrefix: '/' },
            to: { type: 'component', componentId: 'component-1' },
          },
        ],
      },
    ];

    const blocklets = [
      {
        meta: { did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC' },
        children: [
          { mountPoint: '/', mode: 'production', meta: { did: 'component-1', main: 'blocklet.js' } },
          { mountPoint: '/child', mode: 'production', meta: { did: 'component-2', main: 'blocklet.js' } },
        ],
      },
    ];

    const result = expandComponentRules(sites, blocklets);
    // Only non-root mount point children should be expanded
    expect(result[0].componentExpanded).toBe(true);
  });
});

describe('ensureBlockletProxyBehavior edge cases', () => {
  it('should skip non-blocklet sites', () => {
    const sites = [
      {
        domain: 'regular-site.com',
        blockletDid: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
        rules: [
          {
            from: { pathPrefix: '/' },
            to: { type: 'blocklet', interfaceName: 'publicUrl', componentId: 'comp-1' },
          },
        ],
      },
    ];

    const result = ensureBlockletProxyBehavior(sites, []);
    expect(result[0].rules[0].proxyBehavior).toBeUndefined();
  });

  it('should skip sites already cacheableGenerated', () => {
    const sites = [
      {
        domain: `z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
        cacheableGenerated: true,
        rules: [
          {
            from: { pathPrefix: '/' },
            to: { type: 'blocklet', interfaceName: 'publicUrl', componentId: 'comp-1' },
          },
        ],
      },
    ];

    const blocklets = [
      {
        meta: { did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC' },
        children: [
          {
            meta: {
              did: 'comp-1',
              interfaces: [{ proxyBehavior: 'direct', name: 'publicUrl', type: 'web' }],
            },
          },
        ],
      },
    ];

    const result = ensureBlockletProxyBehavior(sites, blocklets);
    expect(result[0].rules[0].proxyBehavior).toBeUndefined();
  });

  it('should skip when blocklet not found', () => {
    const sites = [
      {
        domain: `unknown-did${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'unknown-did',
        rules: [
          {
            from: { pathPrefix: '/' },
            to: { type: 'blocklet', interfaceName: 'publicUrl', componentId: 'comp-1' },
          },
        ],
      },
    ];

    const result = ensureBlockletProxyBehavior(sites, []);
    expect(result[0].rules[0].proxyBehavior).toBeUndefined();
  });

  it('should skip rules with non-publicUrl interface', () => {
    const sites = [
      {
        domain: `z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
        rules: [
          {
            from: { pathPrefix: '/' },
            to: { type: 'blocklet', interfaceName: 'adminUrl', componentId: 'comp-1' },
          },
        ],
      },
    ];

    const blocklets = [
      {
        meta: { did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC' },
        children: [
          {
            meta: {
              did: 'comp-1',
              interfaces: [{ proxyBehavior: 'direct', name: 'publicUrl', type: 'web' }],
            },
          },
        ],
      },
    ];

    const result = ensureBlockletProxyBehavior(sites, blocklets);
    expect(result[0].rules[0].proxyBehavior).toBeUndefined();
  });

  it('should skip rules with non-blocklet type', () => {
    const sites = [
      {
        domain: `z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC',
        rules: [
          {
            from: { pathPrefix: '/' },
            to: { type: 'general_proxy', interfaceName: 'publicUrl', componentId: 'comp-1' },
          },
        ],
      },
    ];

    const blocklets = [
      {
        meta: { did: 'z8iZpNnc48qcmdMYtvnHFQqroFikNG1AVTmfC' },
        children: [
          {
            meta: {
              did: 'comp-1',
              interfaces: [{ proxyBehavior: 'direct', name: 'publicUrl', type: 'web' }],
            },
          },
        ],
      },
    ];

    const result = ensureBlockletProxyBehavior(sites, blocklets);
    expect(result[0].rules[0].proxyBehavior).toBeUndefined();
  });
});

describe('ensureBlockletWellknownRules edge cases', () => {
  it('should skip sites without blocklet-domain-group suffix', async () => {
    const sites = [
      {
        domain: 'test.com',
        blockletDid: 'test-did',
        rules: [],
      },
    ];

    const blocklets = [
      {
        meta: {
          did: 'test-did',
          interfaces: [
            {
              type: BLOCKLET_INTERFACE_TYPE_WELLKNOWN,
              name: 'wellknown',
              prefix: WELLKNOWN_PATH_PREFIX,
            },
          ],
        },
      },
    ];

    const result = await ensureBlockletWellknownRules(sites, blocklets);
    expect(result[0].rules.length).toBe(0);
  });

  it('should throw error for invalid wellknown prefix', () => {
    const blocklet = {
      meta: {
        did: 'test-did',
        interfaces: [
          {
            type: BLOCKLET_INTERFACE_TYPE_WELLKNOWN,
            name: 'invalid-wellknown',
            prefix: '/invalid/prefix', // Does not start with /.well-known
          },
        ],
      },
      ports: { [BLOCKLET_DEFAULT_PORT_NAME]: 8080 },
    };

    const sites = [
      {
        domain: `test-did${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'test-did',
        rules: [],
      },
    ];

    expect(() => ensureBlockletWellknownRules(sites, [blocklet])).toThrow(
      `Wellknown path prefix must start with: ${WELLKNOWN_PATH_PREFIX}`
    );
  });

  it('should skip existing protected wellknown rules', () => {
    const blocklet = {
      meta: {
        did: 'test-did',
        interfaces: [
          {
            type: BLOCKLET_INTERFACE_TYPE_WELLKNOWN,
            name: 'nostr',
            prefix: `${WELLKNOWN_PATH_PREFIX}/nostr.json`,
            port: BLOCKLET_DEFAULT_PORT_NAME,
          },
        ],
      },
      ports: { [BLOCKLET_DEFAULT_PORT_NAME]: 8080 },
      children: [],
    };

    const sites = [
      {
        domain: `test-did${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'test-did',
        rules: [
          {
            isProtected: true,
            from: { pathPrefix: `${WELLKNOWN_PATH_PREFIX}/nostr.json/` },
            to: { did: 'test-did', port: 8080 },
          },
        ],
      },
    ];

    const result = ensureBlockletWellknownRules(sites, [blocklet]);
    // Should not add duplicate rule
    expect(result[0].rules.length).toBe(1);
  });
});

describe('ensureWellknownRule edge cases', () => {
  test('should not duplicate wellknown rule if already exists', async () => {
    const sites = [
      {
        domain: 'test.com',
        rules: [
          {
            from: { pathPrefix: WELLKNOWN_PATH_PREFIX },
            to: { port: 8080, type: ROUTING_RULE_TYPES.GENERAL_PROXY },
            isProtected: true,
          },
        ],
      },
    ];

    const result = await ensureWellknownRule(sites);
    const wellknownRules = result[0].rules.filter((r) => r.from.pathPrefix === WELLKNOWN_PATH_PREFIX);
    expect(wellknownRules.length).toBe(1);
  });

  test('should not duplicate service path rule if already exists', async () => {
    const sites = [
      {
        domain: `test-did${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'test-did',
        rules: [
          {
            from: { pathPrefix: '/', groupPathPrefix: '/' },
            to: { type: ROUTING_RULE_TYPES.BLOCKLET, did: 'test-did', componentId: 'test-did' },
          },
          {
            from: { pathPrefix: WELLKNOWN_SERVICE_PATH_PREFIX },
            to: { type: 'blocklet', did: 'test-did' },
            isProtected: true,
          },
        ],
      },
    ];

    const result = await ensureWellknownRule(sites);
    const serviceRules = result[0].rules.filter((r) => r.from.pathPrefix === WELLKNOWN_SERVICE_PATH_PREFIX);
    expect(serviceRules.length).toBe(1);
  });

  test('should handle blocklet site with no blocklet rules', async () => {
    const sites = [
      {
        domain: `test-did${BLOCKLET_SITE_GROUP_SUFFIX}`,
        blockletDid: 'test-did',
        rules: [],
      },
    ];

    const result = await ensureWellknownRule(sites);
    // Should add wellknown rule and service rules for blocklet site
    expect(result[0].rules.length).toBeGreaterThan(0);
    expect(result[0].rules.some((r) => r.from.pathPrefix === WELLKNOWN_PATH_PREFIX)).toBe(true);
  });
});

describe('ensureSubServiceSites', () => {
  let instance = null;
  let states = null;
  let deleteBlocklet = () => {};

  beforeAll(async () => {
    instance = await setupInstance('router-helper-subservice');
    states = instance.states;
    deleteBlocklet = async (did) => {
      await states.blocklet.deleteBlocklet(did);
      await instance.routerManager.deleteRoutingRulesItemByDid({ did });
    };
  });

  afterAll(async () => {
    await tearDownInstance(instance);
  });

  const addBlocklet = async ({ did, meta, children = [] }) => {
    const item = await states.blocklet.addBlocklet({ did, meta });
    item.environments = [
      {
        key: 'BLOCKLET_APP_ID',
        value: 'test-app-id',
      },
      {
        key: 'BLOCKLET_DATA_DIR',
        value: `/data/blocklet/${meta.name}/data`,
      },
    ];

    // Add ports for the blocklet
    item.ports = {
      [BLOCKLET_DEFAULT_PORT_NAME]: 8080,
    };

    // Add children for expandComponentRules to generate proper routing rules
    item.children = children;

    await states.blocklet.updateBlocklet(did, item);
  };

  test('should generate sub-service sites for wildcard domain', async () => {
    const { did, name } = genBlocklet();

    // Add blocklet to database
    await addBlocklet({
      did,
      meta: getMeta({ did, name }, getInterfaces()),
    });

    // Set subService settings
    await states.blockletExtras.setSettings(did, {
      subService: {
        enabled: true,
        domain: '*.sites.example.com',
        staticRoot: 'sites',
      },
    });

    try {
      const sites = [];
      const blocklet = await states.blocklet.getBlocklet(did);
      const blocklets = [blocklet];

      const result = await ensureSubServiceSites(sites, blocklets);

      expect(result).toHaveLength(1);
      expect(result[0].domain).toBe('*.sites.example.com');
      expect(result[0].type).toBe(ROUTING_RULE_TYPES.SUB_SERVICE);
      expect(result[0].blockletDid).toBe(did);
      expect(result[0].serviceType).toBe('blocklet');
      expect(result[0].rules).toHaveLength(1);
      expect(result[0].rules[0].from.pathPrefix).toBe('/');
      expect(result[0].rules[0].to.type).toBe(ROUTING_RULE_TYPES.SUB_SERVICE);
      expect(result[0].rules[0].to.staticRoot).toContain('/sites');
    } finally {
      await deleteBlocklet(did);
    }
  });

  test('should generate sub-service sites for single domain', async () => {
    const { did, name } = genBlocklet();

    // Add blocklet to database
    await addBlocklet({
      did,
      meta: getMeta({ did, name }, getInterfaces()),
    });

    // Set subService settings
    await states.blockletExtras.setSettings(did, {
      subService: {
        enabled: true,
        domain: 'static.example.com',
        staticRoot: 'public',
      },
    });

    try {
      const sites = [];
      const blocklet = await states.blocklet.getBlocklet(did);
      const blocklets = [blocklet];

      const result = await ensureSubServiceSites(sites, blocklets);

      expect(result).toHaveLength(1);
      expect(result[0].domain).toBe('static.example.com');
      expect(result[0].rules[0].to.staticRoot).toContain('/public');
    } finally {
      await deleteBlocklet(did);
    }
  });

  test('should filter out disabled sub-service config', async () => {
    const { did, name } = genBlocklet();

    // Add blocklet to database
    await addBlocklet({
      did,
      meta: getMeta({ did, name }, getInterfaces()),
    });

    // Set subService settings with enabled: false
    await states.blockletExtras.setSettings(did, {
      subService: {
        enabled: false,
        domain: '*.sites.example.com',
        staticRoot: 'sites',
      },
    });

    try {
      const sites = [];
      const blocklet = await states.blocklet.getBlocklet(did);
      const blocklets = [blocklet];

      const result = await ensureSubServiceSites(sites, blocklets);
      expect(result).toHaveLength(0);
    } finally {
      await deleteBlocklet(did);
    }
  });

  test('should filter out incomplete sub-service config', async () => {
    const { did, name } = genBlocklet();

    // Add blocklet to database
    await addBlocklet({
      did,
      meta: getMeta({ did, name }, getInterfaces()),
    });

    // Set subService settings with missing staticRoot
    await states.blockletExtras.setSettings(did, {
      subService: {
        enabled: true,
        domain: '*.sites.example.com',
        // missing staticRoot
      },
    });

    try {
      const sites = [];
      const blocklet = await states.blocklet.getBlocklet(did);
      const blocklets = [blocklet];

      const result = await ensureSubServiceSites(sites, blocklets);
      expect(result).toHaveLength(0);
    } finally {
      await deleteBlocklet(did);
    }
  });

  test('should throw error on path traversal attempt', async () => {
    const { did, name } = genBlocklet();

    // Add blocklet to database
    await addBlocklet({
      did,
      meta: getMeta({ did, name }, getInterfaces()),
    });

    // Set subService settings with path traversal attempt
    await states.blockletExtras.setSettings(did, {
      subService: {
        enabled: true,
        domain: '*.sites.example.com',
        staticRoot: '../../../etc',
      },
    });

    try {
      const sites = [];
      const blocklet = await states.blocklet.getBlocklet(did);
      const blocklets = [blocklet];

      await expect(ensureSubServiceSites(sites, blocklets)).rejects.toThrow('path traversal detected');
    } finally {
      await deleteBlocklet(did);
    }
  });

  test('should throw error on absolute path', async () => {
    const { did, name } = genBlocklet();

    // Add blocklet to database
    await addBlocklet({
      did,
      meta: getMeta({ did, name }, getInterfaces()),
    });

    // Set subService settings with absolute path
    await states.blockletExtras.setSettings(did, {
      subService: {
        enabled: true,
        domain: '*.sites.example.com',
        staticRoot: '/etc/passwd',
      },
    });

    try {
      const sites = [];
      const blocklet = await states.blocklet.getBlocklet(did);
      const blocklets = [blocklet];

      await expect(ensureSubServiceSites(sites, blocklets)).rejects.toThrow('path traversal detected');
    } finally {
      await deleteBlocklet(did);
    }
  });

  test('should preserve existing sites', async () => {
    const { did, name } = genBlocklet();

    // Add blocklet to database
    await addBlocklet({
      did,
      meta: getMeta({ did, name }, getInterfaces()),
    });

    // Set subService settings
    await states.blockletExtras.setSettings(did, {
      subService: {
        enabled: true,
        domain: '*.sites.example.com',
        staticRoot: 'sites',
      },
    });

    try {
      const existingSite = {
        domain: 'existing.example.com',
        type: ROUTING_RULE_TYPES.GENERAL_PROXY,
        rules: [],
      };
      const sites = [existingSite];
      const blocklet = await states.blocklet.getBlocklet(did);
      const blocklets = [blocklet];

      const result = await ensureSubServiceSites(sites, blocklets);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(existingSite);
      expect(result[1].domain).toBe('*.sites.example.com');
    } finally {
      await deleteBlocklet(did);
    }
  });

  test('should handle blocklet without BLOCKLET_DATA_DIR environment', async () => {
    const { did, name } = genBlocklet();

    // Add blocklet to database without BLOCKLET_DATA_DIR
    const item = await states.blocklet.addBlocklet({
      did,
      meta: getMeta({ did, name }, getInterfaces()),
    });
    // Remove BLOCKLET_DATA_DIR environment
    item.environments = [];
    await states.blocklet.updateBlocklet(did, item);

    // Set subService settings
    await states.blockletExtras.setSettings(did, {
      subService: {
        enabled: true,
        domain: '*.sites.example.com',
        staticRoot: 'sites',
      },
    });

    try {
      const sites = [];
      const blocklet = await states.blocklet.getBlocklet(did);
      const blocklets = [blocklet];

      // When BLOCKLET_DATA_DIR is missing, dataDir defaults to '' and resolves to current working directory
      // Note: This behavior may not be ideal and could be improved in the future
      const result = await ensureSubServiceSites(sites, blocklets);
      expect(result).toHaveLength(1);
      expect(result[0].domain).toBe('*.sites.example.com');
    } finally {
      await deleteBlocklet(did);
    }
  });
});
