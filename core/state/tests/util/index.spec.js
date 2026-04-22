/* eslint-disable no-console */
const { test, expect, describe, beforeEach, mock, spyOn, afterEach } = require('bun:test');
const os = require('os');
const v8 = require('v8');
const axios = require('@abtnode/util/lib/axios');
const { fromRandom } = require('@ocap/wallet');
const {
  DOMAIN_FOR_DEFAULT_SITE,
  DOMAIN_FOR_IP_SITE,
  DOMAIN_FOR_IP_SITE_REGEXP,
  NODE_MODES,
} = require('@abtnode/constant');
const { encode: encodeBase32 } = require('@abtnode/util/lib/base32');

const util = require('../../lib/util');
const NodeState = require('../../lib/states/node');

const {
  validateOwner,
  isRoutingEnabled,
  getBaseUrls,
  formatEnvironments,
  getBlockletHost,
  memoizeAsync,
  templateReplace,
  isGatewayCacheEnabled,
  toCamelCase,
} = util;

const { mergeConfigs } = require('../../lib/blocklet/extras');
const { fromStatus, getSafeEnv, getNFTState, getServerDidDomain, prettyURL } = require('../../lib/util');
const { setupInMemoryModels } = require('../../tools/fixture');

beforeEach(() => {
  mock.clearAllMocks();
});

describe('validateOwner', () => {
  test('should validate valid owner', () => {
    const wallet = fromRandom();
    const owner = {
      did: wallet.address,
      pk: wallet.publicKey,
    };

    expect(validateOwner(owner)).toBeTruthy();
  });

  test('should identify invalid owner', () => {
    const wallet = fromRandom();
    const owner = {
      did: wallet.address,
      pk: 1234,
    };

    expect(validateOwner(owner)).toBeFalsy();
  });
});

describe('templateReplace', () => {
  test('should handle none string as expected', () => {
    expect(templateReplace(null)).toEqual(null);
    expect(templateReplace(123)).toEqual(123);
    expect(templateReplace([])).toEqual([]);
  });

  test('should handle string as expected', () => {
    expect(templateReplace('abc')).toEqual('abc');
    expect(templateReplace('hello {name}', { name: 'world' })).toEqual('hello world');
    expect(templateReplace('hello {name}', {})).toEqual('hello undefined');
    expect(templateReplace('hello {name}', { key: 'some' })).toEqual('hello undefined');
    expect(templateReplace('hello {sub.name}', { sub: { name: 'world' } })).toEqual('hello world');
  });
});

describe('fromStatus', () => {
  test('should return status name if is valid status number', () => {
    expect(fromStatus(0)).toEqual('ok');
  });

  test('should return "unknown" if is invalid valid status number', () => {
    expect(fromStatus(10001212)).toEqual('unknown');
  });
});

describe('isRoutingEnabled', () => {
  test('should true when routing.provider is a valid engine provider', () => {
    expect(isRoutingEnabled({ provider: 'nginx' })).toBe(true);
  });

  test('should false when routing is empty', () => {
    expect(isRoutingEnabled()).toBe(false);
    expect(isRoutingEnabled(null)).toBe(false);
    expect(isRoutingEnabled('')).toBe(false);
    expect(isRoutingEnabled()).toBe(false);
  });

  test('should false when routing.provider is empty', () => {
    expect(isRoutingEnabled({})).toBe(false);
    expect(isRoutingEnabled({ provider: undefined })).toBe(false);
    expect(isRoutingEnabled({ provider: null })).toBe(false);
    expect(isRoutingEnabled({ provider: '' })).toBe(false);
  });
});

describe('getBlockletHost', () => {
  test('should return empty string if the domain is default site domain', () => {
    expect(getBlockletHost({ domain: DOMAIN_FOR_DEFAULT_SITE })).toEqual('');
  });

  test('should return hostname in context if domain is empty', () => {
    expect(getBlockletHost({ domain: '', context: { hostname: 'context-hostname.com' } })).toEqual(
      'context-hostname.com'
    );
  });

  test('should return hostname in context if domain is DOMAIN_FOR_IP_SITE', () => {
    expect(getBlockletHost({ domain: DOMAIN_FOR_IP_SITE, context: { hostname: 'context-hostname.com' } })).toEqual(
      'context-hostname.com'
    );
  });

  test('should return hostname in context if domain is DOMAIN_FOR_IP_SITE', () => {
    expect(
      getBlockletHost({ domain: DOMAIN_FOR_IP_SITE_REGEXP, context: { hostname: 'context-hostname.com' } })
    ).toEqual('context-hostname.com');
  });

  test('should not return empty if the protocol is https and port exists but not 443', () => {
    expect(getBlockletHost({ domain: 'abtnode.com', context: { protocol: 'https', port: '80' } })).not.toEqual('');
  });

  test('should return domain pattern host if the protocol is https and port empty', () => {
    expect(getBlockletHost({ domain: 'abtnode.com', context: { protocol: 'https' } })).toEqual('abtnode.com');
  });

  test('should return domain pattern host if the protocol is https and port is 443', () => {
    expect(getBlockletHost({ domain: 'abtnode.com', context: { protocol: 'https', port: 443 } })).toEqual(
      'abtnode.com'
    );
  });

  test('should return domain pattern host if the protocol is http and port is 80', () => {
    expect(getBlockletHost({ domain: 'abtnode.com', context: { protocol: 'http', port: 80 } })).toEqual('abtnode.com');
  });

  test('should return domain pattern host:port if the protocol is http and port is 8000', () => {
    expect(getBlockletHost({ domain: 'abtnode.com', context: { protocol: 'http', port: 8000 } })).toEqual(
      'abtnode.com:8000'
    );
  });
});

describe('mergeConfigs', () => {
  // 模拟环境变量数据
  const metaConfigs = [
    {
      name: 'AWS_ACCESS_KEY_ID',
      description: 'AWS Access Key ID',
      required: false,
      default: '',
    },
    {
      name: 'AWS_SECRET_ACCESS_KEY',
      description: 'AWS Access Secret',
      required: true,
      default: '',
    },
  ];

  // 模拟数据库数据
  const oldConfigs = [
    {
      key: 'AWS_ACCESS_KEY_ID',
      description: 'AWS Access Key ID',
      required: true,
      value: '12345',
      secure: false,
      validation: '',
      custom: false,
    },
    {
      key: 'AWS_SECRET_ACCESS_KEY',
      description: 'AWS Access Secret',
      required: true,
      value: '54321',
      secure: false,
      validation: '',
      custom: false,
    },
  ];

  test('simulate a new installation of Blocklet', () => {
    const result = mergeConfigs({ old: [], cur: metaConfigs });
    expect(result).toEqual([
      {
        key: 'AWS_ACCESS_KEY_ID',
        description: 'AWS Access Key ID',
        required: false,
        value: '',
        secure: false,
        validation: '',
        custom: false,
      },
      {
        key: 'AWS_SECRET_ACCESS_KEY',
        description: 'AWS Access Secret',
        required: true,
        value: '',
        secure: false,
        validation: '',
        custom: false,
      },
    ]);
  });

  test('simulate add custom configs', () => {
    const result = mergeConfigs({
      old: oldConfigs,
      cur: [
        {
          key: 'Key1',
          value: 'Value1',
          custom: true,
        },
      ],
    });

    expect(result).toEqual([
      {
        key: 'AWS_ACCESS_KEY_ID',
        description: 'AWS Access Key ID',
        required: true,
        value: '12345',
        secure: false,
        validation: '',
        custom: false,
        shared: undefined,
      },
      {
        key: 'AWS_SECRET_ACCESS_KEY',
        description: 'AWS Access Secret',
        required: true,
        value: '54321',
        secure: false,
        validation: '',
        custom: false,
        shared: undefined,
      },
      {
        key: 'Key1',
        description: '',
        required: false,
        value: 'Value1',
        secure: false,
        validation: '',
        custom: true,
        shared: undefined,
      },
    ]);
  });

  test('simulate reinstall blocklet', () => {
    const newMeta = [
      {
        name: 'AWS_ACCESS_KEY_ID1',
        description: 'AWS Access Key ID',
        required: false,
        default: '',
      },
      {
        name: 'AWS_SECRET_ACCESS_KEY',
        description: 'AWS Access Secret',
        required: true,
        default: '',
      },
    ];

    const result = mergeConfigs({
      old: [
        {
          key: 'AWS_ACCESS_KEY_ID',
          description: 'AWS Access Key ID',
          required: false,
          value: '12345',
          secure: false,
          validation: '',
          custom: false,
        },
        {
          key: 'AWS_SECRET_ACCESS_KEY',
          description: 'AWS Access Secret',
          required: true,
          value: '54321',
          secure: false,
          validation: '',
          custom: false,
        },
      ],
      cur: newMeta,
    });

    expect(result).toEqual([
      {
        key: 'AWS_SECRET_ACCESS_KEY',
        description: 'AWS Access Secret',
        required: true,
        value: '54321',
        secure: false,
        validation: '',
        custom: false,
      },
      {
        key: 'AWS_ACCESS_KEY_ID1',
        description: 'AWS Access Key ID',
        required: false,
        value: '',
        secure: false,
        validation: '',
        custom: false,
      },
    ]);
  });

  test('simulate remove config', () => {
    const result = mergeConfigs({
      old: [
        {
          key: 'AWS_ACCESS_KEY_ID1',
          description: 'AWS Access Secret',
          required: false,
          value: '1234',
          secure: false,
          validation: '',
          custom: false,
        },
        {
          key: 'AWS_SECRET_ACCESS_KEY',
          description: 'AWS Access Secret',
          required: true,
          value: '54321',
          secure: false,
          validation: '',
          custom: false,
        },
        {
          key: 'Key1',
          description: '',
          required: false,
          value: 'Value1',
          secure: false,
          validation: '',
          custom: true,
        },
      ],
      cur: [{ key: 'Key1' }],
    });

    expect(result).toEqual([
      {
        key: 'AWS_ACCESS_KEY_ID1',
        description: 'AWS Access Secret',
        required: false,
        value: '1234',
        secure: false,
        validation: '',
        custom: false,
      },
      {
        key: 'AWS_SECRET_ACCESS_KEY',
        description: 'AWS Access Secret',
        required: true,
        value: '54321',
        secure: false,
        validation: '',
        custom: false,
      },
    ]);
  });

  test('simulate edit config', () => {
    const result = mergeConfigs({
      old: [
        {
          key: 'AWS_ACCESS_KEY_ID1',
          description: 'AWS Access Secret',
          required: false,
          value: '1234',
          secure: false,
          validation: '',
          custom: false,
          shared: false,
        },
        {
          key: 'AWS_SECRET_ACCESS_KEY',
          description: 'AWS Access Secret',
          required: true,
          value: '54321',
          secure: false,
          validation: '',
          custom: false,
          shared: false,
        },
        {
          key: 'Key1',
          description: '',
          required: false,
          value: 'Value1',
          secure: false,
          validation: '',
          custom: true,
          shared: false,
        },
      ],
      cur: [{ key: 'Key1', value: 'Value2', custom: true }],
    });

    expect(result).toEqual([
      {
        key: 'AWS_ACCESS_KEY_ID1',
        description: 'AWS Access Secret',
        required: false,
        value: '1234',
        secure: false,
        validation: '',
        custom: false,
        shared: false,
      },
      {
        key: 'AWS_SECRET_ACCESS_KEY',
        description: 'AWS Access Secret',
        required: true,
        value: '54321',
        secure: false,
        validation: '',
        custom: false,
        shared: false,
      },
      {
        key: 'Key1',
        description: '',
        required: false,
        value: 'Value2',
        secure: false,
        validation: '',
        custom: true,
        shared: false,
      },
    ]);
  });

  test('simulate update preferences', () => {
    const result = mergeConfigs({
      old: [
        {
          key: 'prefs.pass',
          description: 'password',
          required: false,
          value: '',
          secure: true,
          validation: '',
          custom: false,
          shared: false,
        },
      ],
      cur: [{ key: 'prefs.pass', value: '1234' }],
    });

    expect(result).toEqual([
      {
        key: 'prefs.pass',
        description: 'password',
        required: false,
        value: '1234',
        secure: true,
        validation: '',
        custom: false,
        shared: false,
      },
    ]);
  });
});

describe('getBaseUrls', () => {
  test('get local base urls', async () => {
    const models = await setupInMemoryModels();
    const node = fromRandom();
    const owner = fromRandom();

    const state = new NodeState(models.Server, {
      nodeSk: node.secretKey,
      nodePk: node.publicKey,
      nodeDid: node.address,
      nodeOwner: {
        did: owner.address,
        pk: owner.publicKey,
      },
      mode: 'production',
      routing: {
        https: true,
        provider: 'nginx',
        adminPath: '/admin',
        enableIpServer: true,
      },
    });

    const ips = ['192.168.1.2', '123.123.135.41', ''];

    const baseUrls = await getBaseUrls({ getNodeInfo: () => state.read(), getSitesFromState: () => [] }, ips);

    expect(baseUrls.length).toEqual(2);

    const ip1 = baseUrls.find(({ url }) => url.startsWith('http://192.168.1.2'));
    const ip2 = baseUrls.find(({ url }) => url.startsWith('http://123.123.135.41'));
    expect(ip1).toBeTruthy();
    expect(ip2).toBeTruthy();
  });
});

describe('transformIPToDomain', () => {
  test('should return 1-1-1-1 if pass 1.1.1.1', () => {
    expect(util.transformIPToDomain('1.1.1.1')).toEqual('1-1-1-1');
  });
});

describe('findInterfaceByName', () => {
  test('should return null if interfaces is a non-array and not undefined', () => {
    expect(util.findInterfaceByName({ meta: { interfaces: null } })).toEqual(null);
    expect(util.findInterfaceByName({ meta: { interfaces: '' } })).toEqual(null);
    expect(util.findInterfaceByName({ meta: { interfaces: 3 } })).toEqual(null);
    expect(util.findInterfaceByName({ meta: { interfaces: {} } })).toEqual(null);
  });

  test('should return the interface whose name is specified', () => {
    const res = util.findInterfaceByName({ meta: { interfaces: [{ name: 'test1' }, { name: 'test2' }] } }, 'test1');
    expect(res.name).toEqual('test1');
  });
});

describe('formatEnvironments', () => {
  test('should return key->map Array', () => {
    expect(formatEnvironments({ A: 1, B: 2 })).toEqual([
      { key: 'A', value: 1 },
      { key: 'B', value: 2 },
    ]);
  });
});

describe('getQueueConcurrencyByMem', () => {
  beforeEach(() => {
    spyOn(os, 'totalmem').mockImplementation(() => 10);
  });

  afterEach(() => {
    mock.restore();
  });

  test('should return 4 if the ratio of v8 heap size to total memory less than 0.2', () => {
    spyOn(v8, 'getHeapStatistics').mockImplementation(() => ({
      heap_size_limit: 1,
    }));

    expect(util.getQueueConcurrencyByMem()).toEqual(4);
    expect(os.totalmem.mock.calls.length).toEqual(1);
    expect(v8.getHeapStatistics.mock.calls.length).toEqual(1);
  });

  test('should return 4 if the ratio of v8 heap size to total memory equal 0.2', () => {
    spyOn(v8, 'getHeapStatistics').mockImplementation(() => ({
      heap_size_limit: 2,
    }));

    expect(util.getQueueConcurrencyByMem()).toEqual(4);
    expect(os.totalmem.mock.calls.length).toEqual(1);
    expect(v8.getHeapStatistics.mock.calls.length).toEqual(1);
  });

  test('should return 3 if the ratio of v8 heap size to total memory less than 0.3', () => {
    spyOn(v8, 'getHeapStatistics').mockImplementation(() => ({
      heap_size_limit: 2.5,
    }));

    expect(util.getQueueConcurrencyByMem()).toEqual(3);
    expect(os.totalmem.mock.calls.length).toEqual(1);
    expect(v8.getHeapStatistics.mock.calls.length).toEqual(1);
  });

  test('should return 3 if the ratio of v8 heap size to total memory equal 0.3', () => {
    spyOn(v8, 'getHeapStatistics').mockImplementation(() => ({
      heap_size_limit: 3,
    }));

    expect(util.getQueueConcurrencyByMem()).toEqual(3);
    expect(os.totalmem.mock.calls.length).toEqual(1);
    expect(v8.getHeapStatistics.mock.calls.length).toEqual(1);
  });

  test('should return 2 if the ratio of v8 heap size to total memory less than 0.6', () => {
    spyOn(v8, 'getHeapStatistics').mockImplementation(() => ({
      heap_size_limit: 5.5,
    }));

    expect(util.getQueueConcurrencyByMem()).toEqual(2);
    expect(os.totalmem.mock.calls.length).toEqual(1);
    expect(v8.getHeapStatistics.mock.calls.length).toEqual(1);
  });

  test('should return 2 if the ratio of v8 heap size to total memory equal 0.6', () => {
    spyOn(v8, 'getHeapStatistics').mockImplementation(() => ({
      heap_size_limit: 6,
    }));

    expect(util.getQueueConcurrencyByMem()).toEqual(2);
    expect(os.totalmem.mock.calls.length).toEqual(1);
    expect(v8.getHeapStatistics.mock.calls.length).toEqual(1);
  });

  test('should return 1 if the ratio of v8 heap size to total memory greater than 0.6', () => {
    spyOn(v8, 'getHeapStatistics').mockImplementation(() => ({
      heap_size_limit: 6.01,
    }));

    expect(util.getQueueConcurrencyByMem()).toEqual(1);
    expect(os.totalmem.mock.calls.length).toEqual(1);
    expect(v8.getHeapStatistics.mock.calls.length).toEqual(1);
  });
});

describe('getSaveEnv', () => {
  const processEnv = {
    SHELL: '/bin/bash',
    ABT_NODE_SECRET: 'secret',
    ABT_NODE_PUBLIC: 'public',
    BLOCKLET_STATUS: 'status',
    BLOCKLET_PUBLIC: 'public',
    BLOCKLET_SECRET: 'secret',
    NORMAL_ENV: 'normal',
  };
  const inputEnv = {
    ABT_NODE_INPUT_SECRET: 'secret',
    ABT_NODE_INPUT_PUBLIC: 'public',
    BLOCKLET_INPUT_STATUS: 'status',
    BLOCKLET_INPUT_MORE: 'more',
    NORMAL_INPUT_ENV: 'normal',
  };
  const safeEnv = getSafeEnv(inputEnv, processEnv);
  test('should return a safe env for child process', () => {
    expect(safeEnv).toEqual({
      SHELL: '/bin/bash',
      BLOCKLET_STATUS: 'status',
      BLOCKLET_PUBLIC: 'public',
      BLOCKLET_SECRET: 'secret',
      NORMAL_ENV: 'normal',
      ABT_NODE_SK: '',
      ABT_NODE_INPUT_SECRET: 'secret',
      ABT_NODE_INPUT_PUBLIC: 'public',
      BLOCKLET_INPUT_STATUS: 'status',
      BLOCKLET_INPUT_MORE: 'more',
      NORMAL_INPUT_ENV: 'normal',
    });
  });
});

describe('memoizeAsync', () => {
  test('should memoize result', async () => {
    const fn = mock(() => Promise.resolve('test'));
    const memoizedFn = memoizeAsync(fn);

    const result1 = await memoizedFn('a');
    const result2 = await memoizedFn('a');

    expect(result1).toEqual(result2);
    expect(fn).toBeCalledTimes(1);
  });
});

describe('getAssetState', () => {
  test('should return correct asset state', () => {
    // Test asset: https://main.abtnetwork.io/explorer/assets/zjdkJoBoWDpdaDvYSRRD8EPk7x8wTf1Gyzjh/txs
    const address = 'zjdkJoBoWDpdaDvYSRRD8EPk7x8wTf1Gyzjh';
    const state = {
      address: 'zjdkJoBoWDpdaDvYSRRD8EPk7x8wTf1Gyzjh',
      owner: 'z1edCnSmmwaiZ7zhr5izPSUN5s1BUbWJido',
      moniker: 'ThangGa',
      readonly: true,
      transferrable: true,
      ttl: 0,
      consumedTime: '',
      issuer: 'zNKhu67FqEfRcjNMkbb8ZuRBYf9pD8awBrA4',
      parent: 'z3CtQAF7uVRFRUCxqA3ND8D4WdMjqTHwEiJdS',
      data: {
        typeUrl: 'json',
        value: JSON.parse(
          '{"owner":"z1i6Yn7MedRuzgGQT3H7it4T9CWHRWzT33L","factoryOwner":"z1Z747gsyxAuDBKJo7K7PPnLKHSBo4efJxv","sn":"946","issuer":{"id":"zNKhu67FqEfRcjNMkbb8ZuRBYf9pD8awBrA4","pk":"z5YSN9EgXF1pAwUnMAdekmeeWsb1bQa3u5qWhsRg6gYkT","name":"nft-maker"}}'
        ),
      },
      display: {
        type: 'url',
        content: 'https://d2a5qf99t8jlm9.cloudfront.net/blender/api/assets/preview/a074fc0efc707342c0cd40d4b04416ae',
      },
      endpoint: null,
      tags: [],
    };

    axios.post = mock().mockResolvedValueOnce({ data: { data: { getAssetState: { state } } } });

    expect(state.address).toEqual(address);
    expect(state.data.typeUrl).toEqual('json');
    expect(typeof state.data.value).toEqual('object');
    expect(!!state.display).toBe(true);
    expect(!!state.issuer).toBe(true);
    expect(!!state.owner).toBe(true);
    expect(!!state.parent).toBe(true);
    expect(!!state.tags).toBe(true);
  });

  test('should not parse data.value if data.typeUrl is not "json"', async () => {
    const testData = {
      typeUrl: 'application/text',
      value: '{"value":"test message"}',
    };

    axios.post = mock().mockResolvedValueOnce({
      data: {
        data: {
          getAssetState: {
            state: { data: testData },
          },
        },
      },
    });

    const state = await getNFTState('https://main.abtnetwork.io/explorer/', 'test-address');
    expect(axios.post).toHaveBeenCalled();
    expect(state.data.value).toEqual(testData.value);
  });
});

describe('getServerDidDomain', () => {
  test('should return corrent server did domain', () => {
    const nodeInfo = { did: 'z1mV9pEZdHcSSmvBFirm9n6B3Dmy7izjBtg', didDomain: 'did.abtnet.io' };
    expect(getServerDidDomain(nodeInfo)).toEqual(`${encodeBase32(nodeInfo.did)}.${nodeInfo.didDomain}`);
  });
});

describe('prettyURL', () => {
  test('should return original value if it is not a string', () => {
    expect(prettyURL({})).toEqual({});
    expect(prettyURL(null)).toEqual(null);

    const date = new Date();
    expect(prettyURL(date)).toEqual(date);
  });

  test('should return original url if the url starts with http', () => {
    expect(prettyURL('http://arc.com')).toEqual('http://arc.com');
    expect(prettyURL('hTTP://arc.com')).toEqual('hTTP://arc.com');

    expect(prettyURL('https://arc.com')).toEqual('https://arc.com');
    expect(prettyURL('HTTPS://arc.com')).toEqual('HTTPS://arc.com');
  });

  test('should add http prefix if the url does not start with http', () => {
    expect(prettyURL('arc', false)).toEqual('http://arc');
    expect(prettyURL('arc.com', false)).toEqual('http://arc.com');
  });

  test('should add https prefix default if the url does not start with http', () => {
    expect(prettyURL('arc.com')).toEqual('https://arc.com');
    expect(prettyURL('arc.com', true)).toEqual('https://arc.com');
  });
});

describe('isGatewayCacheEnabled', () => {
  test('should isGatewayCacheEnabled work as expected', () => {
    expect(typeof isGatewayCacheEnabled).toEqual('function');
    expect(isGatewayCacheEnabled({ mode: NODE_MODES.DEBUG })).toEqual(true);
    expect(isGatewayCacheEnabled({ mode: NODE_MODES.PRODUCTION })).toEqual(true);
    expect(isGatewayCacheEnabled({ mode: NODE_MODES.PRODUCTION, routing: {} })).toEqual(true);
    expect(isGatewayCacheEnabled({ mode: NODE_MODES.PRODUCTION, routing: { cacheEnabled: null } })).toEqual(true);
    expect(isGatewayCacheEnabled({ mode: NODE_MODES.PRODUCTION, routing: { cacheEnabled: true } })).toEqual(true);
    expect(isGatewayCacheEnabled({ mode: NODE_MODES.PRODUCTION, routing: { cacheEnabled: false } })).toEqual(false);
  });
});

describe('toCamelCase', () => {
  test('converts object keys to camelCase', () => {
    const obj = {
      first_name: 'John',
      last_name: 'Doe',
      contact_info: {
        email_address: 'john.doe@example.com',
        phone_number: '1234567890',
      },
    };

    const convertedObj = toCamelCase(obj);

    expect(convertedObj).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      contactInfo: {
        emailAddress: 'john.doe@example.com',
        phoneNumber: '1234567890',
      },
    });
  });

  test('handles arrays', () => {
    const obj = [
      { first_name: 'John', last_name: 'Doe' },
      { first_name: 'Jane', last_name: 'Smith' },
    ];

    const convertedObj = toCamelCase(obj);

    expect(convertedObj).toEqual([
      { firstName: 'John', lastName: 'Doe' },
      { firstName: 'Jane', lastName: 'Smith' },
    ]);
  });

  test('returns the input if not an object', () => {
    const str = 'Hello, world!';
    const num = 42;
    const bool = true;

    expect(toCamelCase(str)).toBe(str);
    expect(toCamelCase(num)).toBe(num);
    expect(toCamelCase(bool)).toBe(bool);
    expect(toCamelCase(null)).toBeNull();
  });
});
