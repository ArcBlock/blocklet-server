const { test, describe, expect, beforeEach, mock } = require('bun:test');
const { getDefaultServiceConfig } = require('@blocklet/meta/lib/service');
const { fromRandom } = require('@ocap/wallet');

const attachSharedUtils = require('../../api/util/attach-shared-utils');
const cache = require('../../api/cache');

const blocklet1 = fromRandom();
const blocklet2 = fromRandom();
const blocklet3 = fromRandom();
const blocklet4 = fromRandom();
const blocklet5 = fromRandom();
const blocklet6 = fromRandom();
const component61 = fromRandom();
const component62 = fromRandom();
const blocklet7 = fromRandom();
const component71 = fromRandom();
const options = {};

const getInterfaces = (did) => {
  if (did === blocklet3.address) {
    return [];
  }

  let services = null;
  if ([blocklet1.address, blocklet5.address].includes(did)) {
    services = [
      {
        name: 'auth',
        config: {
          whoCanAccess: 'invited',
        },
      },
    ];
  } else if (did === blocklet6.address) {
    services = [
      {
        name: 'auth',
        config: {
          whoCanAccess: 'invited',
          ignoreUrls: ['/api/blocklet6/**'],
        },
      },
    ];
  } else if ([component62.address].includes(did)) {
    services = [
      {
        name: 'auth',
        config: {
          ignoreUrls: ['/api/component61/**'],
        },
      },
    ];
  } else if (did === blocklet7.address) {
    services = [
      {
        name: 'auth',
        config: {
          allowSwitchProfile: false,
        },
      },
    ];
  } else if ([component71.address].includes(did)) {
    services = [
      {
        name: 'auth',
        config: {
          ignoreUrls: ['/api/component71/**'],
        },
      },
    ];
  }

  return [
    {
      name: 'publicUrl',
      type: 'web',
      services,
    },
  ];
};

const getChildren = (did) => {
  if (did === blocklet6.address) {
    return [
      {
        meta: {
          did: component61.address,
          title: 'title',
          description: 'desc',
          interfaces: getInterfaces(component61.address),
        },
        configs: [{ key: 'COMPONENT_ACCESS_WHO', value: 'roles:owner,admin' }],
      },
      {
        meta: {
          did: component62.address,
          interfaces: getInterfaces(component62.address),
        },
        configs: [{ key: 'COMPONENT_ACCESS_WHO', value: 'owner' }],
      },
    ];
  }

  if (did === blocklet7.address) {
    return [
      {
        meta: {
          did: component71.address,
          title: 'title',
          description: 'desc',
          interfaces: getInterfaces(component71.address),
        },
      },
    ];
  }

  return [];
};

const nodeWallet = fromRandom();
const node = {
  getNodeInfo: () => ({ sk: nodeWallet.secretKey, mock: 'mock' }),
  getBlocklet: ({ did }) => ({
    did,
    meta: {
      did,
      title: 'title',
      description: 'desc',
      interfaces: getInterfaces(did),
    },
    environments: [],
    settings: [blocklet4.address, blocklet5.address].includes(did) ? { whoCanAccess: 'owner' } : {},
    children: getChildren(did),
  }),
  getRoutingRuleById: (id) => ({
    id,
    to: {
      type: 'blocklet',
      interfaceName: 'publicUrl',
    },
    services: [{ name: 'dummy', config: '{"name":"dummy"}' }],
  }),
};

const headers = {
  'x-real-hostname': 'www.example.com',
  'x-real-port': 80,
  'x-real-protocol': 'https:',
  'x-blocklet-did': blocklet1.address,
  'x-blocklet-real-did': blocklet1.address,
  'x-routing-rule-id': 'b',
};

beforeEach(async () => {
  await cache.flushAll();
});

test('should attachSharedUtils work', async () => {
  const req = {
    originalUrl: 'https://www.example.com/path',
    user: { avatar: 'xxx', did: '123' },
    headers,
  };

  attachSharedUtils({ node, req, options });

  expect(typeof req.getBlocklet).toEqual('function');
  expect(typeof req.getComponent).toEqual('function');
  expect(typeof req.getBlockletDid).toEqual('function');
  expect(typeof req.getRoutingRuleId).toEqual('function');
  expect(typeof req.getServiceContext).toEqual('function');
  expect(typeof req.getServiceConfig).toEqual('function');
  expect(typeof req.getBlockletInfo).toEqual('function');
  expect(typeof req.getNodeInfo).toEqual('function');
  expect(typeof req.getRoutingRule).toEqual('function');

  expect(req.getBlockletDid()).toEqual(blocklet1.address);
  expect(req.getRoutingRuleId()).toEqual('b');

  expect(req.getServiceContext()).toEqual({
    user: { did: '123' },
    protocol: 'https',
    url: 'https://www.example.com/path',
    query: undefined,
    hostname: 'www.example.com',
    port: 0,
  });

  const blocklet = await req.getBlocklet();
  expect(blocklet).toEqual(expect.objectContaining({ did: blocklet1.address }));

  const info = await req.getNodeInfo();
  expect(info.sk).toEqual(nodeWallet.secretKey);

  const rule = await req.getRoutingRule();
  expect(rule).toEqual({
    id: 'b',
    to: {
      type: 'blocklet',
      interfaceName: 'publicUrl',
    },
    services: [{ name: 'dummy', config: '{"name":"dummy"}' }],
  });

  const blockletInfo = await req.getBlockletInfo();
  expect(blockletInfo.did === blocklet1.address);
  expect(blockletInfo.name === 'title');
  expect(blockletInfo.description === 'desc');

  req.headers = {};
  const emptyBlocklet = await req.getBlocklet();
  expect(emptyBlocklet?.did).toBe('');
});

test('should req.getComponent work', async () => {
  const req1 = {
    headers: { ...headers, 'x-blocklet-did': blocklet1.address, 'x-blocklet-component-id': component61.address },
  };

  const req2 = {
    headers: { ...headers, 'x-blocklet-did': blocklet6.address, 'x-blocklet-component-id': component61.address },
  };

  attachSharedUtils({ node, req: req1, options });
  attachSharedUtils({ node, req: req2, options });

  expect(typeof req1.getComponent).toEqual('function');
  expect(typeof req2.getComponent).toEqual('function');

  const component1 = await req1.getComponent();
  expect(component1).toBeFalsy();

  const component2 = await req2.getComponent();
  expect(component2.meta.did).toBe(component61.address);
});

describe('getServiceConfig', () => {
  const req = {};
  attachSharedUtils({ node, req, options });

  describe('auth', () => {
    test('static config in meta', async () => {
      req.headers = {
        'x-blocklet-did': blocklet1.address,
        'x-blocklet-component-id': blocklet1.address,
        'x-routing-rule-id': 'b',
      };
      expect(await req.getServiceConfig('auth')).toEqual({
        ...getDefaultServiceConfig('auth'),
      });
    });

    test('default config: no service', async () => {
      req.headers = {
        'x-blocklet-did': blocklet2.address,
        'x-blocklet-real-did': blocklet2.address,
        'x-routing-rule-id': 'b',
      };
      expect(await req.getServiceConfig('auth')).toEqual(getDefaultServiceConfig('auth'));
    });

    test('default config: no interface', async () => {
      req.headers = {
        'x-blocklet-did': blocklet3.address,
        'x-blocklet-real-did': blocklet3.address,
        'x-routing-rule-id': 'b',
      };
      expect(await req.getServiceConfig('auth')).toEqual(getDefaultServiceConfig('auth'));
    });

    test('default config: blocklet does not exist', async () => {
      req.headers = {
        'x-routing-rule-id': 'b',
      };
      expect(await req.getServiceConfig('auth')).toEqual(getDefaultServiceConfig('auth'));
    });

    test('default config: component', async () => {
      req.headers = {
        'x-blocklet-did': blocklet3.address,
        'x-blocklet-real-did': blocklet2.address,
        'x-routing-rule-id': 'b',
      };
      expect(await req.getServiceConfig('auth')).toEqual(getDefaultServiceConfig('auth'));
    });

    test('null', async () => {
      req.headers = {
        'x-blocklet-did': blocklet2.address,
        'x-blocklet-real-did': blocklet2.address,
        'x-routing-rule-id': null,
      };
      expect(await req.getServiceConfig('auth')).toEqual(null);
    });

    test('invalid service name', () => {
      req.headers = {
        'x-routing-rule-id': 'b',
      };
      expect(req.getServiceConfig('dummy')).rejects.toBeTruthy();
    });

    test('dynamic config', async () => {
      req.headers = {
        'x-blocklet-did': blocklet4.address,
        'x-blocklet-real-did': blocklet4.address,
        'x-routing-rule-id': 'b',
      };
      expect(await req.getServiceConfig('auth')).toEqual({
        ...getDefaultServiceConfig('auth'),
      });
    });

    test('dynamic config should override static config', async () => {
      req.headers = {
        'x-blocklet-did': blocklet5.address,
        'x-blocklet-real-did': blocklet5.address,
        'x-routing-rule-id': 'b',
      };
      expect(await req.getServiceConfig('auth')).toEqual({
        ...getDefaultServiceConfig('auth'),
      });
    });
  });

  describe('component auth', () => {
    test('should work as expected', async () => {
      req.headers = {
        'x-blocklet-did': blocklet6.address,
        'x-blocklet-component-id': blocklet6.address,
        'x-routing-rule-id': 'random-id-component-auth-1',
      };
      expect(await req.getServiceConfig('auth')).toEqual({
        ...getDefaultServiceConfig('auth'),
        ignoreUrls: ['/api/blocklet6/**'],
      });

      const component1Id = `${blocklet6.address}/${component61.address}`;
      const component2Id = `${blocklet6.address}/${component62.address}`;

      req.headers = {
        'x-blocklet-did': blocklet6.address,
        'x-blocklet-component-id': component1Id,
        'x-routing-rule-id': 'random-id-component-auth-2',
      };
      expect(await req.getServiceConfig('auth')).toEqual({
        ...getDefaultServiceConfig('auth'),
      });

      // getServiceConfig by componentId in params
      // component ignoreUrls should independent
      req.headers = {
        'x-blocklet-did': blocklet6.address,
      };
      expect(await req.getServiceConfig('auth', { componentId: component2Id })).toEqual({
        ...getDefaultServiceConfig('auth'),
        ignoreUrls: ['/api/component61/**'],
      });
    });

    test("should use app's config if component does not found", async () => {
      const componentId = `${blocklet6.address}/unknownComponentId`;

      req.headers = {
        'x-blocklet-did': blocklet6.address,
        'x-blocklet-component-id': componentId,
        'x-routing-rule-id': `${Math.random()}`,
      };
      expect(await req.getServiceConfig('auth')).toEqual({
        ...getDefaultServiceConfig('auth'),
        ignoreUrls: ['/api/blocklet6/**'],
      });
    });

    test('allowSwitchProfile should be same in each component', async () => {
      const componentId = `${blocklet7.address}/${component71.address}`;

      req.headers = {
        'x-blocklet-did': blocklet7.address,
        'x-blocklet-component-id': blocklet7.address,
        'x-routing-rule-id': `${Math.random()}`,
      };
      expect(await req.getServiceConfig('auth')).toEqual({
        ...getDefaultServiceConfig('auth'),
        allowSwitchProfile: false,
      });

      req.headers = {
        'x-blocklet-did': blocklet7.address,
        'x-blocklet-component-id': componentId,
        'x-routing-rule-id': `${Math.random()}`,
      };
      expect(await req.getServiceConfig('auth')).toEqual({
        ...getDefaultServiceConfig('auth'),
        allowSwitchProfile: false,
        ignoreUrls: ['/api/component71/**'],
      });

      req.headers = {
        'x-blocklet-did': blocklet7.address,
        'x-blocklet-component-id': 'unknownComponentId',
        'x-routing-rule-id': `${Math.random()}`,
      };
      expect(await req.getServiceConfig('auth')).toEqual({
        ...getDefaultServiceConfig('auth'),
        allowSwitchProfile: false,
      });
    });
  });
});

describe('attachSetupToken', () => {
  test('should write setupToken in cookie', async () => {
    const req = {};

    attachSharedUtils({ node, req, options });
    req.ensureUser = () => {
      req.user = { role: 'owner' };
    };

    const token = '123';
    const res = { cookie: mock() };

    await req.attachSetupToken({ res, token });
    expect(res.cookie).toBeCalledWith('login_token', token, {
      maxAge: 24 * 60 * 60 * 1000,
      secure: true,
      sameSite: 'lax',
    });
  });

  test('should not write setupToken if the token not valid', async () => {
    const req = {};

    attachSharedUtils({ node, req, options });
    req.ensureUser = () => {
      req.user = null;
    };

    const token = '123';
    const res = { cookie: mock() };

    await req.attachSetupToken({ res, token });
    expect(res.cookie).not.toHaveBeenCalled();
  });
});
