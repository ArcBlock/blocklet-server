/* eslint-disable global-require */
const { describe, test, expect, mock } = require('bun:test');
const {
  DOMAIN_FOR_DEFAULT_SITE,
  DOMAIN_FOR_IP_SITE_REGEXP,
  DOMAIN_FOR_IP_SITE,
  ROUTING_RULE_TYPES,
  WELLKNOWN_PATH_PREFIX,
  BLOCKLET_SITE_GROUP_SUFFIX,
} = require('@abtnode/constant');

const Router = require('../../lib/router/index');

const daemonSite = {
  domain: '~^\\d+.\\d+.\\d+.\\d+$',
  rules: [
    {
      from: {
        pathPrefix: '/admin/',
      },
      to: {
        port: 8089,
        did: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
        type: 'daemon',
        cacheGroup: '',
      },
      isProtected: true,
      services: [],
      id: '64f0c9b8-6b6b-4fef-81e5-008e5a977c63',
    },
  ],
  createdAt: '2023-04-13T04:21:40.144Z',
  domainAliases: [
    {
      value: '*.ip.abtnet.io',
      isProtected: true,
    },
    {
      value: 'bbqavpmxczfxw2vcgmmzttgmzf5whwhc5ubla6ptkjm.did.abtnet.io',
      isProtected: true,
    },
  ],
  id: 'QUobtDZeyTQfHzBm',
  blockletDid: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
};

const blockletRule = {
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
};

const blockletSiteWithRule = {
  domain: 'zNKdNAAqHciupd7huyNdvam6jjKaVynD6abS.blocklet-domain-group',
  domainAliases: [
    {
      value: 'bbqautxq25zf26yvixoyaxpqglkm5re2cmyuikxehde.did.abtnet.io',
      isProtected: true,
    },
    {
      value: 'bbqautxq25zf26yvixoyaxpqglkm5re2cmyuikxehde-888-888-888-888.ip.abtnet.io',
      isProtected: true,
    },
  ],
  isProtected: true,
  rules: [blockletRule],
  createdAt: '2023-04-13T04:23:35.324Z',
  id: 'Zbn0gn8yJF8zj096',
  blockletDid: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
  mode: 'production',
};

const blockletSiteWithoutRule = {
  ...blockletSiteWithRule,
  rules: [],
};

const site = {
  domain: '192.168.1.2',
  rules: [
    {
      from: { pathPrefix: '/admin/' },
      to: { port: 8089, did: 'zNKcEG9uVeU4SoUPS21B6YhZVCdUMTLe5WMF', type: ROUTING_RULE_TYPES.DAEMON },
      isProtected: true,
    },
    {
      from: { pathPrefix: '/super/blockchain-boarding-gate/' },
      to: {
        port: 8094,
        did: 'z8ia1C4xp1vVwH2VpAhkyknR4gSZBfXemJBZn',
        type: ROUTING_RULE_TYPES.BLOCKLET,
        interfaceName: 'publicUrl',
      },
      isProtected: true,
    },
    {
      from: { pathPrefix: '/super/static-demo-blocklet/' },
      to: {
        port: 8090,
        did: 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV',
        type: ROUTING_RULE_TYPES.BLOCKLET,
        interfaceName: 'publicUrl',
      },
      isProtected: true,
    },
    {
      from: { pathPrefix: WELLKNOWN_PATH_PREFIX },
      to: { port: 8090, type: ROUTING_RULE_TYPES.GENERAL_PROXY },
      isProtected: true,
    },
  ],
};

describe('Router', () => {
  describe('flattenSitesToRules', () => {
    test('should formatSites without extra aliases correctly', () => {
      const rules = Router.flattenSitesToRules([site]);
      expect(rules.length).toEqual(4);

      expect(rules[0].from.domain).toEqual(site.domain);
      expect(rules[0].from.pathPrefix).toEqual('/admin/');
      expect(rules[0].to.port).toEqual(8089);
      expect(rules[0].to.did).toEqual('zNKcEG9uVeU4SoUPS21B6YhZVCdUMTLe5WMF');
      expect(rules[0].to.type).toEqual(ROUTING_RULE_TYPES.DAEMON);
    });

    test('should formatSites with extra aliases correctly #1', () => {
      const rules = Router.flattenSitesToRules([{ ...site, domainAliases: ['abtnode.com'] }]);
      expect(rules.length).toEqual(8);

      expect(rules[1].from.domain).toEqual('abtnode.com');
      expect(rules[1].from.pathPrefix).toEqual('/admin/');
      expect(rules[1].to.port).toEqual(8089);
      expect(rules[1].to.did).toEqual('zNKcEG9uVeU4SoUPS21B6YhZVCdUMTLe5WMF');
      expect(rules[1].to.type).toEqual(ROUTING_RULE_TYPES.DAEMON);
    });

    test('should formatSites with extra aliases correctly #2', () => {
      const rules = Router.flattenSitesToRules([{ ...site, domainAliases: [{ value: 'abtnode.com' }] }]);
      expect(rules.length).toEqual(8);

      expect(rules[1].from.domain).toEqual('abtnode.com');
      expect(rules[1].from.pathPrefix).toEqual('/admin/');
      expect(rules[1].to.port).toEqual(8089);
      expect(rules[1].to.did).toEqual('zNKcEG9uVeU4SoUPS21B6YhZVCdUMTLe5WMF');
      expect(rules[1].to.type).toEqual(ROUTING_RULE_TYPES.DAEMON);
    });
  });

  describe('formatSites', () => {
    test('should formatSites with blocklet site correctly', () => {
      const results = Router.formatSites([blockletSiteWithRule], { port: 8089 });
      expect(results.length).toEqual(1);
      expect(results[0].rules.length).toBeGreaterThan(1);
      // Should add dynamic rules for robots.txt, favicon.ico, __blocklet__.js, and proxy
      expect(results[0].rules.filter((r) => r.dynamic).length).toBeGreaterThan(0);
    });

    test('should formatSites with only daemon correctly', () => {
      const results = Router.formatSites([daemonSite]);
      expect(results).toEqual([daemonSite]);
    });

    test('should formatSites with blocklet rules correctly', () => {
      const results = Router.formatSites([daemonSite, blockletSiteWithRule], { port: 8089 });
      expect(results).toEqual([
        {
          domain: '~^\\d+.\\d+.\\d+.\\d+$',
          rules: [
            {
              from: {
                pathPrefix: '/admin/',
              },
              to: {
                port: 8089,
                did: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
                type: 'daemon',
                cacheGroup: '',
              },
              isProtected: true,
              services: [],
              id: '64f0c9b8-6b6b-4fef-81e5-008e5a977c63',
            },
          ],
          createdAt: '2023-04-13T04:21:40.144Z',
          domainAliases: [
            {
              value: '*.ip.abtnet.io',
              isProtected: true,
            },
            {
              value: 'bbqavpmxczfxw2vcgmmzttgmzf5whwhc5ubla6ptkjm.did.abtnet.io',
              isProtected: true,
            },
          ],
          id: 'QUobtDZeyTQfHzBm',
          blockletDid: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
        },
        {
          domain: 'zNKdNAAqHciupd7huyNdvam6jjKaVynD6abS.blocklet-domain-group',
          domainAliases: [
            {
              value: 'bbqautxq25zf26yvixoyaxpqglkm5re2cmyuikxehde.did.abtnet.io',
              isProtected: true,
            },
            {
              value: 'bbqautxq25zf26yvixoyaxpqglkm5re2cmyuikxehde-888-888-888-888.ip.abtnet.io',
              isProtected: true,
            },
          ],
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
            {
              dynamic: true,
              from: {
                pathPrefix: '/',
                groupPathPrefix: '/',
                pathSuffix: '/(robots.txt|sitemap.xml)',
                root: true,
              },
              to: {
                type: 'daemon',
                port: 8089,
                did: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
              },
            },
            {
              dynamic: true,
              from: { root: true, pathPrefix: '/', groupPathPrefix: '/', pathSuffix: '/favicon.ico' },
              to: {
                type: ROUTING_RULE_TYPES.SERVICE,
                port: process.env.ABT_NODE_SERVICE_PORT,
                did: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
              },
            },
            {
              dynamic: true,
              from: {
                pathPrefix: '/',
                groupPathPrefix: '/',
                pathSuffix: '/__(meta|blocklet)__.js',
              },
              to: {
                type: 'daemon',
                port: 8089,
                did: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
                componentId: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk/z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9',
                pageGroup: undefined,
              },
            },
            {
              dynamic: true,
              from: {
                pathPrefix: '/.blocklet/proxy',
              },
              to: {
                port: 8089,
                type: 'daemon',
                target: '/.blocklet/proxy',
                cacheGroup: 'blockletProxy',
                did: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
                pageGroup: undefined,
              },
            },
          ],
          createdAt: '2023-04-13T04:23:35.324Z',
          id: 'Zbn0gn8yJF8zj096',
          blockletDid: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
          mode: 'production',
        },
      ]);
    });

    test('should formatSites with empty components correctly', () => {
      const results = Router.formatSites([daemonSite, blockletSiteWithoutRule], { port: 8089 });
      expect(results).toEqual([
        {
          domain: '~^\\d+.\\d+.\\d+.\\d+$',
          rules: [
            {
              from: {
                pathPrefix: '/admin/',
              },
              to: {
                port: 8089,
                did: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
                type: 'daemon',
                cacheGroup: '',
              },
              isProtected: true,
              services: [],
              id: '64f0c9b8-6b6b-4fef-81e5-008e5a977c63',
            },
          ],
          createdAt: '2023-04-13T04:21:40.144Z',
          domainAliases: [
            {
              value: '*.ip.abtnet.io',
              isProtected: true,
            },
            {
              value: 'bbqavpmxczfxw2vcgmmzttgmzf5whwhc5ubla6ptkjm.did.abtnet.io',
              isProtected: true,
            },
          ],
          id: 'QUobtDZeyTQfHzBm',
          blockletDid: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
        },
        {
          domain: 'zNKdNAAqHciupd7huyNdvam6jjKaVynD6abS.blocklet-domain-group',
          domainAliases: [
            {
              value: 'bbqautxq25zf26yvixoyaxpqglkm5re2cmyuikxehde.did.abtnet.io',
              isProtected: true,
            },
            {
              value: 'bbqautxq25zf26yvixoyaxpqglkm5re2cmyuikxehde-888-888-888-888.ip.abtnet.io',
              isProtected: true,
            },
          ],
          isProtected: true,
          rules: [
            {
              dynamic: true,
              from: {
                pathPrefix: '/',
                groupPathPrefix: '/',
                pathSuffix: '/(robots.txt|sitemap.xml)',
                root: true,
              },
              to: {
                type: 'daemon',
                port: 8089,
                did: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
              },
            },
            {
              dynamic: true,
              from: { root: true, pathPrefix: '/', groupPathPrefix: '/', pathSuffix: '/favicon.ico' },
              to: {
                type: ROUTING_RULE_TYPES.SERVICE,
                port: process.env.ABT_NODE_SERVICE_PORT,
                did: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
              },
            },
            {
              dynamic: true,
              from: {
                pathPrefix: '/',
                groupPathPrefix: '/',
                pathSuffix: '/__(meta|blocklet)__.js',
              },
              to: {
                type: 'daemon',
                port: 8089,
                did: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
                pageGroup: undefined,
              },
            },
            {
              dynamic: true,
              from: {
                pathPrefix: '/.blocklet/proxy',
              },
              to: {
                port: 8089,
                type: 'daemon',
                target: '/.blocklet/proxy',
                cacheGroup: 'blockletProxy',
                did: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
                pageGroup: undefined,
              },
            },
          ],
          createdAt: '2023-04-13T04:23:35.324Z',
          id: 'Zbn0gn8yJF8zj096',
          blockletDid: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
          mode: 'production',
        },
      ]);
    });

    test('should format wellknown site', () => {
      const results = Router.formatSites([site], { port: 8089 });
      const { rules } = results[0];

      expect(rules.filter((x) => x.from.pathPrefix.startsWith(WELLKNOWN_PATH_PREFIX)).length).toEqual(1);
    });
  });

  describe('filterSites', () => {
    const { _filterSites: filterSites } = Router;

    const defaultSite = {
      domain: DOMAIN_FOR_DEFAULT_SITE,
      rules: [
        {
          from: {
            pathPrefix: '/admin/',
          },
          to: {
            port: 8089,
            did: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
            type: 'daemon',
            cacheGroup: '',
          },
          isProtected: true,
          services: [],
          id: '64f0c9b8-6b6b-4fef-81e5-008e5a977c63',
        },
      ],
      createdAt: '2023-04-13T04:21:40.144Z',
      domainAliases: [],
      id: 'QUobtDZeyTQfHzBm',
      blockletDid: 'zNKedHrb5wzvAJ7rpQLWnytZLx2nLAHRQLfk',
    };

    test('should not contain default site if enableDefaultServer is false', () => {
      const results = filterSites({
        sites: [defaultSite, daemonSite],
        enableDefaultServer: false,
        enableIpServer: true,
      });
      expect(results).toEqual([daemonSite]);
    });

    test('should not contain ip site if enableIpServer is false', () => {
      const results = filterSites({
        sites: [defaultSite, daemonSite],
        enableDefaultServer: true,
        enableIpServer: false,
      });

      expect(results).toEqual([defaultSite]);
    });

    test('should contain default and ip site if enableDefaultServer and enableIpServer are true', () => {
      const results = filterSites({
        sites: [defaultSite, daemonSite],
        enableDefaultServer: true,
        enableIpServer: true,
      });

      expect(results).toEqual([defaultSite, daemonSite]);
    });
  });

  describe('expandSites', () => {
    const { _expandSites: expandSites } = Router;
    test('should return original sites when there is no alias', () => {
      const sites = [
        {
          domain: 'abtnode.com',
          rules: [
            {
              from: {
                pathPrefix: '/demo',
                pathSuffix: '/__blocklet__.js',
              },
              to: {
                port: 8089,
                did: 'zNKcEG9uVeU4SoUPS21B6YhZVCdUMTLe5WMF',
                type: ROUTING_RULE_TYPES.DAEMON,
              },
            },
          ],
        },
      ];

      expect(expandSites(sites)).toEqual(sites);
    });

    test('should expand the domain alias', () => {
      const sites = [
        {
          domain: 'abtnode.com',
          domainAliases: ['test.abtnode.com'],
          rules: [
            {
              from: {
                pathPrefix: '/demo',
                pathSuffix: '/__blocklet__.js',
              },
              to: {
                port: 8089,
                did: 'zNKcEG9uVeU4SoUPS21B6YhZVCdUMTLe5WMF',
                type: ROUTING_RULE_TYPES.DAEMON,
              },
            },
          ],
        },
      ];

      const expandedSites = expandSites(sites);
      expect(expandedSites.length).toEqual(2);

      delete expandedSites[0].domain;
      delete expandedSites[1].domain;
      expect(expandedSites[0]).toEqual(expandedSites[1]);
    });

    test('should clone the IP site rules to default site', () => {
      const sites = [
        {
          domain: DOMAIN_FOR_IP_SITE_REGEXP,
          rules: [
            {
              from: {
                pathPrefix: '/demo',
                pathSuffix: '/__blocklet__.js',
              },
              to: {
                port: 8089,
                did: 'zNKcEG9uVeU4SoUPS21B6YhZVCdUMTLe5WMF',
                type: ROUTING_RULE_TYPES.DAEMON,
              },
            },
          ],
        },
        { domain: DOMAIN_FOR_DEFAULT_SITE },
      ];

      const expandedSites = expandSites(sites);
      expect(expandedSites[0].rules).toEqual(expandedSites[1].rules);
    });

    test('should exclude domain of blocklet group', () => {
      const _site = {
        domain: `did${BLOCKLET_SITE_GROUP_SUFFIX}`,
        rules: [
          {
            from: {
              pathPrefix: '/demo',
              pathSuffix: '/__blocklet__.js',
            },
            to: {
              port: 8089,
              did: 'zNKcEG9uVeU4SoUPS21B6YhZVCdUMTLe5WMF',
              type: ROUTING_RULE_TYPES.BLOCKLET,
            },
          },
        ],
      };
      const sites = [_site];

      const site2 = [{ ..._site, domainAliases: [{ value: 'a.com' }] }];

      const expandedSites = expandSites(sites);
      expect(expandedSites.length).toBe(0);

      const expandedSites2 = expandSites(site2);
      expect(expandedSites2[0]).toEqual({
        domain: 'a.com',
        serviceType: 'blocklet',
        rules: _site.rules,
      });
    });
  });

  describe('getRoutingTable', () => {
    const { _getRoutingTable: getRoutingTable } = Router;

    test('should expand the domain alias', () => {
      const sites = [
        {
          domain: 'a.com',
          domainAliases: ['*.ip.abtnet.io'],
          rules: [
            {
              from: {
                pathPrefix: '/demo',
              },
              to: {
                port: 8089,
                did: 'zNKcEG9uVeU4SoUPS21B6YhZVCdUMTLe5WMF',
                type: ROUTING_RULE_TYPES.DAEMON,
              },
            },
          ],
        },
        {
          domain: 'b.com',
          rules: [
            {
              from: {
                pathPrefix: '/demo',
              },
              to: {
                port: 8089,
                did: 'zNKcEG9uVeU4SoUPS21B6YhZVCdUMTLe5WMF',
                type: ROUTING_RULE_TYPES.DAEMON,
              },
            },
          ],
        },
      ];
      const nodeInfo = {
        routing: {
          ipWildcardDomain: '*.ip.abtnet.io',
        },
      };

      const routingTable = getRoutingTable({ sites, nodeInfo });
      expect(routingTable.length).toEqual(3);
      const last = routingTable.slice(-1)[0];

      expect(last.domain).toEqual('*.ip.abtnet.io');
    });
  });

  describe('Router class', () => {
    const createMockProvider = () => ({
      update: mock().mockResolvedValue(),
      reload: mock().mockResolvedValue(),
      start: mock().mockResolvedValue(),
      restart: mock().mockResolvedValue(),
      stop: mock().mockResolvedValue(),
      validateConfig: mock().mockResolvedValue(),
      rotateLogs: mock().mockResolvedValue(),
      getLogFilesForToday: mock().mockReturnValue(['/logs/access.log', '/logs/error.log']),
      getLogDir: mock().mockReturnValue('/logs'),
      searchCache: mock().mockResolvedValue([]),
      clearCache: mock().mockResolvedValue(),
      hasHashFile: mock().mockReturnValue(false),
      getStatus: mock().mockResolvedValue({ running: true }),
      updateSingleBlocklet: mock().mockResolvedValue(),
      _removeBlockletConfig: mock(),
      capabilities: { modsecurity: true },
    });

    const createMockGetAllRoutingParams = () =>
      mock().mockResolvedValue({
        sites: [
          {
            domain: 'test.com',
            rules: [
              {
                from: { pathPrefix: '/api' },
                to: { port: 8080, type: ROUTING_RULE_TYPES.DAEMON },
              },
            ],
          },
        ],
        certificates: [],
        headers: {},
        services: [],
        nodeInfo: {
          name: 'test-node',
          version: '1.0.0',
          port: 8089,
          routing: {
            enableDefaultServer: true,
            enableIpServer: true,
          },
        },
        wafDisabledBlocklets: [],
      });

    describe('constructor', () => {
      test('should throw error when provider is not provided', () => {
        expect(() => new Router({ getAllRoutingParams: mock() })).toThrow(
          'Must provide valid router when create new router'
        );
      });

      test('should throw error when getAllRoutingParams is not a function', () => {
        expect(() => new Router({ provider: createMockProvider() })).toThrow(
          'Must provide a valid getAllRoutingParams function when create new router'
        );
      });

      test('should create router instance successfully', () => {
        const provider = createMockProvider();
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        expect(router.provider).toBe(provider);
        expect(router.getAllRoutingParams).toBe(getAllRoutingParams);
        expect(router.routingTable).toEqual([]);
      });

      test('should accept optional getBlockletRoutingParams and getSystemRoutingParams', () => {
        const provider = createMockProvider();
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const getBlockletRoutingParams = mock();
        const getSystemRoutingParams = mock();

        const router = new Router({
          provider,
          getAllRoutingParams,
          getBlockletRoutingParams,
          getSystemRoutingParams,
        });

        expect(router.getBlockletRoutingParams).toBe(getBlockletRoutingParams);
        expect(router.getSystemRoutingParams).toBe(getSystemRoutingParams);
      });
    });

    describe('updateRoutingTable', () => {
      test('should call provider.update with params', async () => {
        const provider = createMockProvider();
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        await router.updateRoutingTable();

        expect(getAllRoutingParams).toHaveBeenCalled();
        expect(provider.update).toHaveBeenCalled();
      });

      test('should not call provider.update when params are null', async () => {
        const provider = createMockProvider();
        const getAllRoutingParams = mock().mockResolvedValue(null);
        const router = new Router({ provider, getAllRoutingParams });

        await router.updateRoutingTable();

        expect(provider.update).not.toHaveBeenCalled();
      });
    });

    describe('update', () => {
      test('should call updateRoutingTable and provider.reload', async () => {
        const provider = createMockProvider();
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        await router.update();

        expect(getAllRoutingParams).toHaveBeenCalled();
        expect(provider.update).toHaveBeenCalled();
        expect(provider.reload).toHaveBeenCalled();
      });
    });

    describe('start', () => {
      test('should call updateRoutingTable and provider.start', async () => {
        const provider = createMockProvider();
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        await router.start();

        expect(getAllRoutingParams).toHaveBeenCalled();
        expect(provider.update).toHaveBeenCalled();
        expect(provider.start).toHaveBeenCalled();
      });
    });

    describe('restart', () => {
      test('should call updateRoutingTable and provider.restart', async () => {
        const provider = createMockProvider();
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        await router.restart();

        expect(provider.update).toHaveBeenCalled();
        expect(provider.restart).toHaveBeenCalled();
      });
    });

    describe('reload', () => {
      test('should call updateRoutingTable and provider.reload', async () => {
        const provider = createMockProvider();
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        await router.reload();

        expect(provider.update).toHaveBeenCalled();
        expect(provider.reload).toHaveBeenCalled();
      });
    });

    describe('stop', () => {
      test('should call provider.stop', () => {
        const provider = createMockProvider();
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        router.stop();

        expect(provider.stop).toHaveBeenCalled();
      });
    });

    describe('validateConfig', () => {
      test('should call provider.validateConfig', async () => {
        const provider = createMockProvider();
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        await router.validateConfig();

        expect(provider.validateConfig).toHaveBeenCalled();
      });
    });

    describe('rotateLogs', () => {
      test('should call provider.rotateLogs', async () => {
        const provider = createMockProvider();
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        await router.rotateLogs();

        expect(provider.rotateLogs).toHaveBeenCalled();
      });
    });

    describe('getLogFilesForToday', () => {
      test('should return log files from provider', () => {
        const provider = createMockProvider();
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        const files = router.getLogFilesForToday();

        expect(files).toEqual(['/logs/access.log', '/logs/error.log']);
      });
    });

    describe('getLogDir', () => {
      test('should return log directory from provider', () => {
        const provider = createMockProvider();
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        const dir = router.getLogDir();

        expect(dir).toEqual('/logs');
      });
    });

    describe('searchCache', () => {
      test('should call provider.searchCache with pattern and group', () => {
        const provider = createMockProvider();
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        router.searchCache('*.js', 'static');

        expect(provider.searchCache).toHaveBeenCalledWith('*.js', 'static');
      });
    });

    describe('clearCache', () => {
      test('should call provider.clearCache with group', () => {
        const provider = createMockProvider();
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        router.clearCache('static');

        expect(provider.clearCache).toHaveBeenCalledWith('static');
      });
    });

    describe('supportsModSecurity', () => {
      test('should return true when provider has modsecurity capability', () => {
        const provider = createMockProvider();
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        expect(router.supportsModSecurity()).toBe(true);
      });

      test('should return false when provider does not have modsecurity capability', () => {
        const provider = createMockProvider();
        provider.capabilities = {};
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        expect(router.supportsModSecurity()).toBe(false);
      });

      test('should return false when provider has no capabilities', () => {
        const provider = createMockProvider();
        delete provider.capabilities;
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        expect(router.supportsModSecurity()).toBe(false);
      });
    });

    describe('queueChange', () => {
      test('should queue global change', () => {
        const provider = createMockProvider();
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        router.queueChange('global');

        expect(router.pendingChanges.global).toBe(true);
      });

      test('should queue blocklet change', () => {
        const provider = createMockProvider();
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        router.queueChange('blocklet', 'test-did');

        expect(router.pendingChanges.blocklets.has('test-did')).toBe(true);
      });

      test('should queue blocklet removal', () => {
        const provider = createMockProvider();
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        router.queueChange('blocklet-remove', 'test-did');

        expect(router.pendingChanges.blockletsRemoved.has('test-did')).toBe(true);
      });

      test('should remove blocklet from remove list when updating', () => {
        const provider = createMockProvider();
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        router.queueChange('blocklet-remove', 'test-did');
        router.queueChange('blocklet', 'test-did');

        expect(router.pendingChanges.blocklets.has('test-did')).toBe(true);
        expect(router.pendingChanges.blockletsRemoved.has('test-did')).toBe(false);
      });

      test('should remove blocklet from update list when removing', () => {
        const provider = createMockProvider();
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        router.queueChange('blocklet', 'test-did');
        router.queueChange('blocklet-remove', 'test-did');

        expect(router.pendingChanges.blocklets.has('test-did')).toBe(false);
        expect(router.pendingChanges.blockletsRemoved.has('test-did')).toBe(true);
      });
    });

    describe('regenerateAll', () => {
      test('should call provider.update and reload', async () => {
        const provider = createMockProvider();
        const getAllRoutingParams = createMockGetAllRoutingParams();
        const router = new Router({ provider, getAllRoutingParams });

        await router.regenerateAll({ message: 'test regeneration' });

        expect(getAllRoutingParams).toHaveBeenCalled();
        expect(provider.update).toHaveBeenCalled();
        expect(provider.reload).toHaveBeenCalled();
      });

      test('should not call provider.update when params are null', async () => {
        const provider = createMockProvider();
        const getAllRoutingParams = mock().mockResolvedValue(null);
        const router = new Router({ provider, getAllRoutingParams });

        await router.regenerateAll();

        expect(provider.update).not.toHaveBeenCalled();
      });
    });
  });

  describe('filterSites edge cases', () => {
    const { _filterSites: filterSites } = Router;

    test('should handle DOMAIN_FOR_IP_SITE', () => {
      const ipSite = {
        domain: DOMAIN_FOR_IP_SITE,
        rules: [],
      };
      const results = filterSites({
        sites: [ipSite],
        enableDefaultServer: true,
        enableIpServer: false,
      });
      expect(results.length).toBe(0);
    });

    test('should handle empty sites array', () => {
      const results = filterSites({
        sites: [],
        enableDefaultServer: true,
        enableIpServer: true,
      });
      expect(results).toEqual([]);
    });
  });

  describe('flattenSitesToRules edge cases', () => {
    test('should handle sites with empty rules', () => {
      const sites = [{ domain: 'test.com', rules: [] }];
      const rules = Router.flattenSitesToRules(sites);
      expect(rules).toEqual([]);
    });

    test('should handle sites without rules array', () => {
      const sites = [{ domain: 'test.com' }];
      const rules = Router.flattenSitesToRules(sites);
      expect(rules).toEqual([]);
    });

    test('should filter out ipWildcardDomain from aliases', () => {
      const sites = [
        {
          domain: 'test.com',
          domainAliases: ['*.ip.abtnet.io', 'alias.com'],
          rules: [
            {
              from: { pathPrefix: '/api' },
              to: { port: 8080, type: ROUTING_RULE_TYPES.DAEMON },
            },
          ],
        },
      ];
      const rules = Router.flattenSitesToRules(sites, { routing: { ipWildcardDomain: '*.ip.abtnet.io' } });
      // Should have 2 rules: one for test.com, one for alias.com (ipWildcardDomain filtered)
      expect(rules.length).toBe(2);
      expect(rules.map((r) => r.from.domain)).toEqual(['test.com', 'alias.com']);
    });
  });

  describe('formatSites edge cases', () => {
    test('should not add robots.txt rule if already exists', () => {
      const siteWithRobotsRule = {
        domain: 'test.blocklet-domain-group',
        blockletDid: 'test-did',
        rules: [
          {
            from: { pathPrefix: '/robots.txt' },
            to: { port: 8080, type: ROUTING_RULE_TYPES.DAEMON },
          },
        ],
      };
      const results = Router.formatSites([siteWithRobotsRule], { port: 8089 });
      const robotsRules = results[0].rules.filter((r) => r.from.pathPrefix === '/robots.txt');
      expect(robotsRules.length).toBe(1);
    });

    test('should not add favicon rule if already exists', () => {
      const siteWithFaviconRule = {
        domain: 'test.blocklet-domain-group',
        blockletDid: 'test-did',
        rules: [
          {
            from: { pathPrefix: '/favicon.ico' },
            to: { port: 8080, type: ROUTING_RULE_TYPES.DAEMON },
          },
        ],
      };
      const results = Router.formatSites([siteWithFaviconRule], { port: 8089 });
      const faviconRules = results[0].rules.filter((r) => r.from.pathPrefix === '/favicon.ico');
      expect(faviconRules.length).toBe(1);
    });

    test('should handle empty sites array', () => {
      const results = Router.formatSites([], { port: 8089 });
      expect(results).toEqual([]);
    });

    test('should handle undefined sites', () => {
      const results = Router.formatSites(undefined, { port: 8089 });
      expect(results).toEqual([]);
    });

    test('should skip dynamic rules when adding blocklet.js rules', () => {
      const siteWithDynamicRule = {
        domain: 'test.blocklet-domain-group',
        blockletDid: 'test-did',
        rules: [
          {
            dynamic: true,
            from: { pathPrefix: '/', groupPathPrefix: '/' },
            to: {
              type: ROUTING_RULE_TYPES.BLOCKLET,
              port: 8080,
              interfaceName: 'publicUrl',
              did: 'test-did',
            },
          },
        ],
      };
      const results = Router.formatSites([siteWithDynamicRule], { port: 8089 });
      // Should add default blocklet.js rules since the existing rule is dynamic
      expect(results[0].rules.length).toBeGreaterThan(1);
    });

    test('should skip non-UI interface rules', () => {
      const siteWithNonUiRule = {
        domain: 'test.blocklet-domain-group',
        blockletDid: 'test-did',
        rules: [
          {
            from: { pathPrefix: '/api', groupPathPrefix: '/api' },
            to: {
              type: ROUTING_RULE_TYPES.BLOCKLET,
              port: 8080,
              interfaceName: 'apiUrl', // not a UI interface
              did: 'test-did',
            },
          },
        ],
      };
      const results = Router.formatSites([siteWithNonUiRule], { port: 8089 });
      // Should not add __blocklet__.js for non-UI interfaces
      const blockletJsRules = results[0].rules.filter(
        (r) => r.from.pathSuffix === '/__(meta|blocklet)__.js' && r.from.pathPrefix === '/api'
      );
      expect(blockletJsRules.length).toBe(0);
    });
  });

  describe('expandSites edge cases', () => {
    const { _expandSites: expandSites } = Router;

    test('should handle empty sites array', () => {
      const result = expandSites([]);
      expect(result).toEqual([]);
    });

    test('should set serviceType based on domain', () => {
      const sites = [
        {
          domain: 'test.blocklet-domain-group',
          domainAliases: ['alias.com'],
          rules: [],
        },
      ];
      const result = expandSites(sites);
      expect(result[0].serviceType).toBe('blocklet');
    });

    test('should set serviceType to daemon for non-blocklet sites', () => {
      const sites = [
        {
          domain: 'test.com',
          rules: [],
        },
      ];
      const result = expandSites(sites);
      expect(result[0].serviceType).toBe('daemon');
    });

    test('should handle sites without rules property', () => {
      const sites = [{ domain: DOMAIN_FOR_DEFAULT_SITE }];
      const result = expandSites(sites);
      expect(result[0].domain).toBe(DOMAIN_FOR_DEFAULT_SITE);
    });
  });
});
