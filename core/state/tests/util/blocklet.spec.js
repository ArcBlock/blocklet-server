const { describe, test, expect, beforeEach, afterEach, mock, spyOn, it, afterAll } = require('bun:test');

mock.module('@blocklet/meta/lib/entry', () => {
  return () => {};
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const os = require('node:os');
const path = require('node:path');
const fs = require('fs-extra');
const cloneDeep = require('@abtnode/util/lib/deep-clone');

const { fromRandom, fromSecretKey } = require('@ocap/wallet');
const { toHex, toDid } = require('@ocap/util');
const { types } = require('@ocap/mcrypto');
const {
  BLOCKLET_MODES,
  BlockletSource,
  BlockletStatus,
  BlockletGroup,
  BLOCKLET_INTERFACE_TYPE_WEB,
  BLOCKLET_CONFIGURABLE_KEY,
} = require('@blocklet/constant');
const { BLOCKLET_THEME_LIGHT, BLOCKLET_THEME_DARK } = require('@blocklet/theme');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const didDocument = require('@abtnode/util/lib/did-document');
const { getDidDomainForBlocklet } = require('@abtnode/util/lib/get-domain-for-blocklet');
const { NODE_SERVICES, NODE_MODES, BLOCKLET_STORE, BLOCKLET_STORE_DEV } = require('@abtnode/constant');

const {
  getHealthyCheckTimeout,
  getAppOverwrittenEnvironments,
  stopBlockletProcess,
  deleteBlockletProcess,
  mergeMeta,
  getUpdateMetaList,
  getRuntimeEnvironments,
  needBlockletDownload,
  checkDuplicateComponents,
  getBlocklet,
  getConfigFromPreferences,
  getAppSystemEnvironments,
  validateAppConfig,
  checkDuplicateAppSk,
  checkDuplicateMountPoint,
  getTypeFromInstallParams,
  validateStore,
  validateInServerless,
  isRotatingAppSk,
  getFixedBundleSource,
  ensureAppLogo,
  validateBlockletChainInfo,
  getBlockletDidDomainList,
  getBlockletStatus,
  shouldSkipComponent,
  getSlpDid,
  shouldEnableSlpDomain,
  updateDidDocument,
  getAppConfigsFromComponent,
  getConfigsFromInput,
  removeAppConfigsFromComponent,
  getPackConfig,
  copyPackImages,
  getBlockletConfigObj,
  resolveMountPointConflict,
  getBlockletURLForLauncher,
} = require('../../lib/util/blocklet');
const { prettyURL } = require('../../lib/util');

beforeEach(() => {
  delete process.env.TEST_UPDATE_ALL_BLOCKLET;
  process.env.BLOCKLET_START_TIMEOUT_BAK = process.env.BLOCKLET_START_TIMEOUT;
  process.env.BLOCKLET_START_TIMEOUT = '';
  mock.clearAllMocks();
});

afterEach(() => {
  process.env.NODE_ENV = 'test';
  if (process.env.BLOCKLET_START_TIMEOUT_BAK) {
    process.env.BLOCKLET_START_TIMEOUT = process.env.BLOCKLET_START_TIMEOUT_BAK;
    delete process.env.BLOCKLET_START_TIMEOUT_BAK;
  }
});

describe('getHealthyCheckTimeout', () => {
  test('should work as expected', () => {
    const b1 = { mode: BLOCKLET_MODES.DEVELOPMENT };
    expect(getHealthyCheckTimeout(b1)).toEqual({
      startTimeout: 3600 * 1000,
      minConsecutiveTime: 3000,
    });

    process.env.NODE_ENV = 'production';
    expect(getHealthyCheckTimeout({})).toEqual({
      startTimeout: 60000,
      minConsecutiveTime: 3000,
    });

    process.env.NODE_ENV = 'test';
    expect(getHealthyCheckTimeout({})).toEqual({
      startTimeout: 10000,
      minConsecutiveTime: 3000,
    });

    process.env.NODE_ENV = 'test';
    process.env.BLOCKLET_START_TIMEOUT = 20;
    expect(getHealthyCheckTimeout({})).toEqual({
      startTimeout: 20000,
      minConsecutiveTime: 3000,
    });

    process.env.NODE_ENV = 'production';
    process.env.BLOCKLET_START_TIMEOUT = '';
    expect(getHealthyCheckTimeout({}, { checkHealthImmediately: true })).toEqual({
      startTimeout: 60000,
      minConsecutiveTime: 3000,
    });

    process.env.NODE_ENV = 'test';
  });
});

describe('stopBlockletProcess', () => {
  test('should work as expected', async () => {
    await stopBlockletProcess({ env: { processId: 'xxx' } });
  });
});

describe('deleteBlockletProcess', () => {
  test('should work as expected', async () => {
    await deleteBlockletProcess({ env: { processId: 'xxx' } });
  });
});

describe('mergeMeta', () => {
  test('should work as expected', () => {
    const parentMeta1 = {
      interfaces: [{ name: 'publicUrl' }],
      children: [
        {
          name: 'child',
          mountPoints: [
            {
              root: { interfaceName: 'publicUrl' },
              child: { interfaceName: 'publicUrl' },
            },
          ],
        },
      ],
    };
    const parentMeta2 = {
      interfaces: [
        {
          name: 'publicUrl',
          services: [{ name: NODE_SERVICES.AUTH, config: { flag: 'parent' } }],
        },
      ],
      children: [
        {
          name: 'child',
          mountPoints: [
            {
              root: { interfaceName: 'publicUrl' },
              child: { interfaceName: 'publicUrl' },
              services: [
                { name: NODE_SERVICES.AUTH, config: { flag: 'parent-to-child' } },
                { name: 'another-parent-service', config: { flag: 'parent-to-child' } },
              ],
            },
          ],
        },
      ],
    };
    const childrenMeta1 = [
      {
        name: 'child',
        interfaces: [
          {
            name: 'publicUrl',
            services: [{ name: NODE_SERVICES.AUTH, config: { flag: 'children' } }],
          },
        ],
      },
    ];

    const childrenMeta2 = cloneDeep(childrenMeta1);
    childrenMeta2[0].interfaces[0].services.push({ name: 'another-child-service', config: { flag: 'children' } });

    const childrenMeta3 = cloneDeep(childrenMeta2).map((x) => ({ meta: x }));

    // nothing changes
    mergeMeta(parentMeta1, childrenMeta1);
    expect(parentMeta1.interfaces[0].services).toEqual(undefined);
    expect(childrenMeta1[0].interfaces[0].services).toEqual([
      { name: NODE_SERVICES.AUTH, config: { flag: 'children' } },
    ]);

    // service of child interface will be covered by parent
    mergeMeta(parentMeta2, childrenMeta2);
    expect(parentMeta2.interfaces[0].services).toEqual([{ name: NODE_SERVICES.AUTH, config: { flag: 'parent' } }]);
    expect(childrenMeta2[0].interfaces[0].services).toEqual([
      { name: NODE_SERVICES.AUTH, config: { flag: 'parent-to-child' } },
      { name: 'another-child-service', config: { flag: 'children' } },
      { name: 'another-parent-service', config: { flag: 'parent-to-child' } },
    ]);

    // service of child interface will be covered by parent
    mergeMeta(parentMeta2, childrenMeta3);
    expect(childrenMeta3[0].meta.interfaces[0].services).toEqual([
      { name: NODE_SERVICES.AUTH, config: { flag: 'parent-to-child' } },
      { name: 'another-child-service', config: { flag: 'children' } },
      { name: 'another-parent-service', config: { flag: 'parent-to-child' } },
    ]);
  });

  test('should work as expected in new children meta', () => {
    const parentMeta1 = {
      interfaces: [{ name: 'publicUrl' }],
      children: [
        {
          name: 'child',
        },
      ],
    };
    const parentMeta2 = {
      interfaces: [
        {
          name: 'publicUrl',
          services: [{ name: NODE_SERVICES.AUTH, config: { flag: 'parent' } }],
        },
      ],
      children: [
        {
          name: 'child',
          services: [
            { name: NODE_SERVICES.AUTH, config: { flag: 'parent-to-child' } },
            { name: 'another-parent-service', config: { flag: 'parent-to-child' } },
          ],
        },
      ],
    };
    const childrenMeta1 = [
      {
        name: 'child',
        interfaces: [
          {
            type: 'web',
            services: [{ name: NODE_SERVICES.AUTH, config: { flag: 'children' } }],
          },
        ],
      },
    ];

    const childrenMeta2 = cloneDeep(childrenMeta1);
    childrenMeta2[0].interfaces[0].services.push({ name: 'another-child-service', config: { flag: 'children' } });

    // nothing changes
    mergeMeta(parentMeta1, childrenMeta1);
    expect(parentMeta1.interfaces[0].services).toEqual(undefined);
    expect(childrenMeta1[0].interfaces[0].services).toEqual([
      { name: NODE_SERVICES.AUTH, config: { flag: 'children' } },
    ]);

    // service of child interface will be covered by parent
    mergeMeta(parentMeta2, childrenMeta2);
    expect(parentMeta2.interfaces[0].services).toEqual([{ name: NODE_SERVICES.AUTH, config: { flag: 'parent' } }]);
    expect(childrenMeta2[0].interfaces[0].services).toEqual([
      { name: NODE_SERVICES.AUTH, config: { flag: 'parent-to-child' } },
      { name: 'another-child-service', config: { flag: 'children' } },
      { name: 'another-parent-service', config: { flag: 'parent-to-child' } },
    ]);
  });
});

describe('getUpdateMetaList', () => {
  test('should work as expected', () => {
    expect(getUpdateMetaList()).toEqual([]);
    expect(getUpdateMetaList({}, {})).toEqual([]);
    expect(
      getUpdateMetaList(
        { meta: { did: 'a' }, children: [{ meta: { did: 'b', version: '1.0.1' } }] },
        { meta: { did: 'a' }, children: [{ meta: { did: 'b', version: '1.0.1' } }] }
      )
    ).toEqual([]);
    expect(
      getUpdateMetaList(
        { meta: { did: 'a' }, children: [{ meta: { did: 'b', version: '1.0.1' } }] },
        { meta: { did: 'a' }, children: [{ meta: { did: 'b', version: '1.0.2' } }] }
      )
    ).toEqual([]);

    expect(
      getUpdateMetaList(
        { meta: { did: 'a' }, children: [{ meta: { did: 'b', version: '1.0.1' }, bundleSource: {} }] },
        { meta: { did: 'a' }, children: [{ meta: { did: 'b', version: '1.0.2' }, bundleSource: {} }] }
      )
    ).toEqual([{ id: 'a/b', meta: { did: 'b', version: '1.0.2' } }]);

    // do not update if version is lower
    const res = getUpdateMetaList(
      { meta: { did: 'a' }, children: [{ meta: { did: 'b', version: '1.0.1' }, bundleSource: {} }] },
      { meta: { did: 'a' }, children: [{ meta: { did: 'b', version: '1.0.0' }, bundleSource: {} }] }
    );
    expect(res).not.toEqual([{ id: 'a/b', meta: { did: 'b', version: '1.0.0' } }]);
    expect(res).toEqual([]);
  });
});

const sk =
  '0xa200a704bdfdbe84f39044455a04d7a027e7eb615791d2d20ff6ce66a312a3cf28a255053a69d8612107df0eea4a42d2905205b674fe8359020b9ad464c891ba';

describe('getAppOverwrittenEnvironments', () => {
  test('should work as expected', () => {
    expect(getAppOverwrittenEnvironments()).toEqual({});
    expect(getAppOverwrittenEnvironments({})).toEqual({});
    expect(getAppOverwrittenEnvironments({ key: 'value' })).toEqual({});

    const ethSk = '0x852bd56edf65cb07a55e3b5c5582173ca3522acdf14333b1880c2175c24943f6';
    const didEth = '0x36284c0cEf403Ea5Ad4C6D2a41b0D36383ed15Fc';

    const meta = { did: 'did', name: 'name', title: 'title', description: 'description' };
    const info = { sk };

    expect(
      getAppOverwrittenEnvironments({ meta, configObj: { BLOCKLET_APP_NAME: 'abc' }, environmentObj: {} }, info)
    ).toEqual({
      BLOCKLET_APP_NAME: 'abc',
    });

    expect(
      getAppOverwrittenEnvironments(
        {
          meta,
          configObj: {
            BLOCKLET_APP_SK: sk,
          },
          environmentObj: {},
        },
        info
      )
    ).toEqual({
      BLOCKLET_APP_SK: sk,
      BLOCKLET_APP_ID: 'zNKiB3Sn841GcUmufKicfGQuK4rRxBTLwd3K',
    });

    expect(
      getAppOverwrittenEnvironments(
        {
          meta,
          configObj: {
            BLOCKLET_APP_SK: sk,
            BLOCKLET_APP_CHAIN_TYPE: 'arcblock',
          },
          environmentObj: {},
        },
        info
      )
    ).toEqual({
      BLOCKLET_APP_SK: sk,
      BLOCKLET_APP_ID: 'zNKiB3Sn841GcUmufKicfGQuK4rRxBTLwd3K',
      BLOCKLET_APP_CHAIN_TYPE: 'arcblock',
    });

    expect(
      getAppOverwrittenEnvironments(
        {
          meta,
          configObj: {
            BLOCKLET_APP_SK: ethSk,
            BLOCKLET_APP_CHAIN_TYPE: 'ethereum',
          },
          environmentObj: {},
        },
        info
      )
    ).toEqual({
      BLOCKLET_APP_SK: ethSk,
      BLOCKLET_APP_ID: didEth,
      BLOCKLET_APP_CHAIN_TYPE: 'ethereum',
    });
  });
});

describe('getRuntimeEnvironments', () => {
  const protectedEnvs = {
    ABT_NODE_UPDATER_PORT: '',
    ABT_NODE_SESSION_TTL: '',
    ABT_NODE_ROUTER_PROVIDER: '',
    ABT_NODE_DATA_DIR: '',
    ABT_NODE_TOKEN_SECRET: '',
    ABT_NODE_SK: '',
    ABT_NODE_SESSION_SECRET: '',
    ABT_NODE_BASE_URL: '',
    ABT_NODE_LOG_LEVEL: '',
    ABT_NODE_LOG_DIR: '',
    ABT_NODE_CONFIG_FILE: '',
    ABT_NODE_HOME: '',
    CLI_MODE: '',
    PM2_HOME: '',
  };

  const ABT_NODE_SK =
    '0x7cd4fd4d4e13a25f5e46de30a61a4a70f5315db96ceeab30d0b12d93d380efb5d9d3cf4c287305104b5ec4269dc2cf03bcf7d934353c05ea45970d13d4307827';
  const did = 'z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB';

  const commonEnv = {
    BLOCKLET_COMPONENT_API_KEY: expect.stringMatching(/.*/),
    BLOCKLET_APP_EK: expect.stringMatching(/.*/),
    BLOCKLET_APP_ASK: expect.stringMatching(/.*/),
    BLOCKLET_SESSION_SECRET: expect.stringMatching(/.*/),
    BLOCKLET_APP_VERSION: undefined,
  };

  test('should ignore node private envs', () => {
    const parent = {
      environmentObj: { BLOCKLET_APP_SK: 'secret', BLOCKLET_APP_NAME: 'abc', BLOCKLET_APP_DATA_DIR: '/data' },
      configObj: {},
      environments: [],
      meta: { did, version: '1.0.0' },
      appPid: did,
    };
    const envs = {
      ABT_NODE: '1.6.8',
      ABT_NODE_TOKEN_SECRET: 'secret',
      ABT_NODE_SK,
      ABT_NODE_SESSION_SECRET: 'secret',
    };

    const result = getRuntimeEnvironments(parent, envs);
    expect(result).toMatchObject({
      // ...commonEnv,
      BLOCKLET_APP_SK: 'secret',
      BLOCKLET_APP_EK:
        '0x6870d77efa64ff66be4108a1c8fd8a30c064de479a3b9f85d967258931d1905c79c060392011908ae6c48e223d0e25fdea07f40d1400cfef62802afe87714e0f',
      BLOCKLET_APP_ASK:
        '0x9090a337f014ec5532c116a8b4dd493e7d9400d09716b83a25c106c37939ef47e1d92545b274da6e5db4525d790e9e5dc4075368dc08dc4589728d5fd3c86d2f',
      BLOCKLET_APP_NAME: 'abc',
      BLOCKLET_MODE: 'production',
      BLOCKLET_MOUNT_POINTS: '[]',
      BLOCKLET_APP_IDS: did,
      BLOCKLET_APP_VERSION: '1.0.0',
      BLOCKLET_APP_DATA_DIR: '/data',
      BLOCKLET_APP_SHARE_DIR: '/data/.share',
      BLOCKLET_SHARE_DIR: `/data/.share/${did}`,
      ABT_NODE: '1.6.8',
      ...protectedEnvs,
    });
    expect(result.BLOCKLET_COMPONENT_API_KEY).toBeTruthy();
    expect(result.BLOCKLET_SESSION_SECRET).toBeTruthy();
  });

  test('should not merge configs to envs', () => {
    const component = {
      environmentObj: { BLOCKLET_APP_SK: 'secret', BLOCKLET_APP_NAME: 'abc' },
      configs: [{ key: 'BLOCKLET_APP_NAME', value: 'bcd' }],
      environments: [],
      meta: { did },
      appPid: did,
    };
    const envs = { ABT_NODE: 'x.x.x', ABT_NODE_SK };

    expect(getRuntimeEnvironments(component, envs)).toMatchObject({
      ...commonEnv,
      BLOCKLET_APP_SK: 'secret',
      BLOCKLET_APP_NAME: 'abc',
      ABT_NODE: 'x.x.x',
      BLOCKLET_MODE: 'production',
      BLOCKLET_MOUNT_POINTS: '[]',
      BLOCKLET_APP_IDS: did,
      ...protectedEnvs,
    });
  });

  test('should merge configs from parent to child', () => {
    const child = {
      environmentObj: { BLOCKLET_APP_SK: 'sk-child', BLOCKLET_APP_NAME: 'abc' },
      configObj: {
        SECURE_BOTH: 'secure-child',
        INSECURE_BOTH: 'insecure-child',
        INSECURE_EMPTY_BOTH: '',
        INSECURE_CHILD_ONLY: 'child-only',
      },
      configs: [
        { key: 'SECURE_BOTH', secure: true, value: 'secure-child' },
        { key: 'INSECURE_BOTH', secure: false, value: 'insecure-child' },
        { key: 'INSECURE_EMPTY_BOTH', secure: false, value: '' },
        { key: 'INSECURE_CHILD_ONLY', secure: false, value: 'child-only' },
      ],
      environments: [],
      meta: { did },
    };
    const parent = {
      environmentObj: { BLOCKLET_APP_SK: 'sk-parent', BLOCKLET_APP_NAME: 'abc' },
      configObj: {
        SECURE_PARENT: 'secure-parent',
        SECURE_BOTH: 'secure-shared',
        INSECURE_BOTH: 'insecure-shared',
        INSECURE_EMPTY_BOTH: 'x',
        INSECURE_PARENT_ONLY: 'parent-only',
      },
      configs: [
        { key: 'SECURE_PARENT', secure: true, value: 'secure-parent' },
        { key: 'SECURE_BOTH', secure: true, value: 'secure-shared' },
        { key: 'INSECURE_BOTH', secure: false, value: 'insecure-shared' },
        { key: 'INSECURE_EMPTY_BOTH', secure: false, value: 'x' },
        { key: 'INSECURE_PARENT_ONLY', secure: false, value: 'parent-only' },
      ],
      environments: [],
      meta: { did: 'zNKbHjWJJJnsWwKnSpCxgo3twc6oeuWSoNLg' },
    };
    const envs = { ABT_NODE_SK };
    expect(getRuntimeEnvironments(child, envs, [parent])).toMatchObject({
      ...commonEnv,
      BLOCKLET_APP_SK: 'sk-child',
      BLOCKLET_APP_NAME: 'abc',
      INSECURE_CHILD_ONLY: 'child-only',
      INSECURE_EMPTY_BOTH: 'x',
      INSECURE_BOTH: 'insecure-child',
      SECURE_BOTH: 'secure-child',
      SECURE_PARENT: 'secure-parent',
      INSECURE_PARENT_ONLY: 'parent-only',
      BLOCKLET_MODE: 'production',
      BLOCKLET_MOUNT_POINTS: '[]',
      BLOCKLET_APP_IDS: '',
      BLOCKLET_APP_PPK: expect.stringMatching(/.*/),
      BLOCKLET_APP_PPK_ETH: expect.stringMatching(/.*/),
      BLOCKLET_APP_PK: expect.stringMatching(/.*/),
      BLOCKLET_APP_PK_ETH: expect.stringMatching(/.*/),
      ...protectedEnvs,
    });
  });

  test('should child NOT ignore NO shared parent envs', () => {
    const child = {
      environmentObj: { BLOCKLET_APP_SK: 'sk-child', BLOCKLET_APP_NAME: 'abc' },
      configObj: {
        BOTH: '',
        NO_SHARED_BOTH: '',
      },
      configs: [
        { key: 'BOTH', value: '' },
        { key: 'NO_SHARED_BOTH', value: '' },
      ],
      environments: [],
      meta: { did },
    };
    const parent = {
      environmentObj: { BLOCKLET_APP_SK: 'sk-parent', BLOCKLET_APP_NAME: 'abc' },
      configObj: {
        BOTH: 'both-parent',
        NO_SHARED_BOTH: 'no-shared-both-parent',
        SHARED_PARENT_ONLY: 'shared-parent-only',
      },
      configs: [
        { key: 'BOTH', secure: false, value: 'both-parent' },
        { key: 'NO_SHARED_BOTH', secure: false, shared: false, value: 'no-shared-both-parent' },
        { key: 'SHARED_PARENT_ONLY', secure: false, shared: true, value: 'shared-parent-only' },
      ],
      environments: [],
      meta: { did: 'zNKbHjWJJJnsWwKnSpCxgo3twc6oeuWSoNLg' },
    };
    const envs = { ABT_NODE_SK };
    expect(getRuntimeEnvironments(child, envs, [parent])).toMatchObject({
      ...commonEnv,
      BLOCKLET_APP_SK: 'sk-child',
      BLOCKLET_APP_NAME: 'abc',
      BOTH: 'both-parent',
      NO_SHARED_BOTH: 'no-shared-both-parent',
      SHARED_PARENT_ONLY: 'shared-parent-only',
      BLOCKLET_MODE: 'production',
      BLOCKLET_MOUNT_POINTS: '[]',
      BLOCKLET_APP_IDS: '',
      BLOCKLET_APP_PPK: expect.stringMatching(/.*/),
      BLOCKLET_APP_PPK_ETH: expect.stringMatching(/.*/),
      BLOCKLET_APP_PK: expect.stringMatching(/.*/),
      BLOCKLET_APP_PK_ETH: expect.stringMatching(/.*/),
      ...protectedEnvs,
    });
  });

  test('BLOCKLET_MOUNT_POINTS', () => {
    expect(
      getRuntimeEnvironments(
        {
          environmentObj: {},
          environments: [],
          meta: { did },
        },
        { ABT_NODE_SK }
      )
    ).toMatchObject({
      ...commonEnv,
      BLOCKLET_MODE: 'production',
      BLOCKLET_MOUNT_POINTS: '[]',
      BLOCKLET_APP_IDS: '',
      ...protectedEnvs,
    });

    expect(
      getRuntimeEnvironments(
        {
          environmentObj: {},
          environments: [],
          meta: { did },
          children: [
            {
              mountPoint: '/abc',
              environmentObj: {},
              environments: [],
              meta: {
                title: 'title1',
                bundleName: 'name',
                bundleDid: 'did',
                name: 'name',
                did: 'did',
                otherProps: '...',
              },
            },
          ],
        },
        { ABT_NODE_SK }
      )
    ).toMatchObject({
      ...commonEnv,
      BLOCKLET_MODE: 'production',
      BLOCKLET_MOUNT_POINTS:
        '[{"title":"title1","did":"did","name":"name","mountPoint":"/abc","port":0,"containerPort":"","resources":[],"resourcesV2":[],"isGreen":false}]',
      BLOCKLET_APP_IDS: '',
      ...protectedEnvs,
    });
  });

  test('BLOCKLET_MODE', () => {
    const envBak = cloneDeep(process.env);
    process.env.BLOCKLET_DEV_PORT = '1234';

    expect(
      getRuntimeEnvironments(
        {
          environmentObj: {},
          configObj: {},
          environments: [],
          meta: { did },
        },
        { ABT_NODE_SK }
      )
    ).toMatchObject({
      ...commonEnv,
      BLOCKLET_MODE: 'production',
      BLOCKLET_MOUNT_POINTS: '[]',
      BLOCKLET_DEV_PORT: '',
      BLOCKLET_APP_IDS: '',
      ...protectedEnvs,
    });

    expect(
      getRuntimeEnvironments(
        {
          mode: 'development',
          mountPoint: '/abc',
          environmentObj: {},
          configObj: {},
          environments: [],
          meta: { did },
        },
        { ABT_NODE_SK }
      )
    ).toMatchObject({
      ...commonEnv,
      BLOCKLET_MODE: 'development',
      BLOCKLET_DEV_MOUNT_POINT: '/abc',
      BLOCKLET_MOUNT_POINTS: '[]',
      BLOCKLET_DEV_PORT: '1234',
      BLOCKLET_APP_IDS: '',
      ...protectedEnvs,
    });

    process.env = envBak;
  });

  test('BLOCKLET_APP_VERSION', () => {
    expect(
      getRuntimeEnvironments(
        {
          environmentObj: {},
          configObj: {},
          environments: [],
          meta: { did, version: '8.8.8' },
        },
        { ABT_NODE_SK }
      )
    ).toMatchObject({
      ...commonEnv,
      BLOCKLET_MODE: 'production',
      BLOCKLET_MOUNT_POINTS: '[]',
      BLOCKLET_APP_VERSION: '8.8.8',
      BLOCKLET_APP_IDS: '',
      ...protectedEnvs,
    });

    expect(
      getRuntimeEnvironments(
        {
          environmentObj: {},
          configObj: {},
          environments: [],
          meta: { did, version: '8.8.8' },
        },
        { ABT_NODE_SK },
        [
          {
            environmentObj: {},
            configObj: {},
            environments: [],
            meta: { did: 'zNKbHjWJJJnsWwKnSpCxgo3twc6oeuWSoNLg', version: '9.9.9' },
          },
        ]
      )
    ).toMatchObject({
      ...commonEnv,
      BLOCKLET_MODE: 'production',
      BLOCKLET_MOUNT_POINTS: '[]',
      BLOCKLET_APP_VERSION: '9.9.9',
      BLOCKLET_APP_IDS: '',
      ...protectedEnvs,
    });
  });

  test('BLOCKLET_APP_IDS', () => {
    expect(
      getRuntimeEnvironments(
        {
          environments: [],
          meta: { did },
          appDid: 'z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB',
          appPid: 'z8iZtA8vKTD8W4gMijoTshxi2B8ULciqUgsFB',
          migratedFrom: [
            { appDid: 'z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB', appSk: ABT_NODE_SK },
            { appDid: 'z8iZtA8vKTD8W4gMijoTshxi2B8ULciqUgsFB' },
            { appDid: 'z8iZxYwou7hXhKEnL1qvdsmGRNikh4JhFvz3X' },
            { appDid: 'zNKbHjWJJJnsWwKnSpCxgo3twc6oeuWSoNLg' },
          ],
        },
        { ABT_NODE_SK }
      )
    ).toMatchObject({
      ...commonEnv,
      BLOCKLET_MODE: 'production',
      BLOCKLET_MOUNT_POINTS: '[]',
      BLOCKLET_APP_IDS:
        'z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB,z8iZtA8vKTD8W4gMijoTshxi2B8ULciqUgsFB,z8iZxYwou7hXhKEnL1qvdsmGRNikh4JhFvz3X,zNKbHjWJJJnsWwKnSpCxgo3twc6oeuWSoNLg',
      ...protectedEnvs,
    });
  });

  test('should use unified chain info', () => {
    const envs = { ABT_NODE: 'x.x.x', ABT_NODE_SK };
    const commonEnvs = {
      ABT_NODE: 'x.x.x',
      BLOCKLET_MODE: 'production',
      BLOCKLET_MOUNT_POINTS: '[]',
      BLOCKLET_APP_IDS: '',
      ...protectedEnvs,
    };
    expect(
      getRuntimeEnvironments(
        {
          configObj: { CHAIN_HOST: 'custom config' },
          configs: [{ key: 'CHAIN_HOST', value: 'custom config' }],
          environments: [],
          meta: { did },
        },
        envs,
        [
          {
            configObj: { BLOCKLET_APP_CHAIN_HOST: 'unified config' },
            configs: [{ key: 'BLOCKLET_APP_CHAIN_HOST', value: 'unified config' }],
            environments: [],
            meta: { did: 'zNKbHjWJJJnsWwKnSpCxgo3twc6oeuWSoNLg' },
          },
        ]
      )
    ).toMatchObject({
      ...commonEnv,
      CHAIN_HOST: 'unified config',
      ...commonEnvs,
    });

    expect(
      getRuntimeEnvironments(
        {
          configObj: { CHAIN_HOST: 'custom config' },
          configs: [{ key: 'CHAIN_HOST', value: 'custom config' }],
          environments: [],
          meta: { did },
        },
        envs,
        []
      )
    ).toMatchObject({
      ...commonEnv,
      CHAIN_HOST: 'custom config',
      ...commonEnvs,
    });
  });

  test('initialized', () => {
    expect(
      getRuntimeEnvironments(
        {
          environments: [],
          meta: { did },
          settings: { initialized: true },
        },
        { ABT_NODE_SK }
      )
    ).toMatchObject({
      ...commonEnv,
      BLOCKLET_MODE: 'production',
      BLOCKLET_MOUNT_POINTS: '[]',
      BLOCKLET_APP_IDS: '',
      ...protectedEnvs,
      initialized: true,
    });
  });
});

test('needBlockletDownload', () => {
  // none bundleSource blocklet should not download
  expect(needBlockletDownload({ source: BlockletSource.upload }, {})).toBe(false);
  expect(needBlockletDownload({ source: BlockletSource.custom }, {})).toBe(false);

  // old blocklet not exist
  expect(needBlockletDownload({})).toBe(true);

  // integrity
  expect(needBlockletDownload({ meta: { dist: { integrity: 'a' } } }, { meta: { dist: { integrity: 'a' } } })).toBe(
    false
  );
  expect(needBlockletDownload({ meta: { dist: { integrity: 'a' } } }, { meta: { dist: { integrity: 'b' } } })).toBe(
    true
  );
});

test('checkDuplicateComponents', () => {
  expect(() => checkDuplicateComponents()).not.toThrow();
  expect(() => checkDuplicateComponents([])).not.toThrow();
  expect(() =>
    checkDuplicateComponents([
      { meta: { did: 'a' }, mountPoint: '/a' },
      { meta: { did: 'b' }, mountPoint: '/b' },
    ])
  ).not.toThrow();

  expect(() =>
    checkDuplicateComponents([
      { meta: { did: 'a' }, mountPoint: '/a' },
      { meta: { did: 'a' }, mountPoint: '/b' },
    ])
  ).toThrowError('duplicate component');

  // not check mount point
  expect(() =>
    checkDuplicateComponents([
      { meta: { did: 'a' }, mountPoint: '/a' },
      { meta: { did: 'b' }, mountPoint: '/a/' },
    ])
  ).not.toThrowError('mount point must be unique');
});

describe('getBlocklet', () => {
  const nameA = 'a';
  const didA = 'z8iZtA8vKTD8W4gMijoTshxi2B8ULciqUgsFB';
  const nameB = 'b';
  const didB = 'z8iZxYwou7hXhKEnL1qvdsmGRNikh4JhFvz3X';
  const notExist = 'z8iZkXbBgiV7WvbJXMj18DRw985vyNpzLujyw';

  const dataDirs = {
    logs: '/path/to/logs',
    data: '/path/to/data',
    cache: '/path/to/cache',
    blocklets: '/path/to/blocklets',
  };

  const storeList = [
    { ...BLOCKLET_STORE, protected: true },
    { ...BLOCKLET_STORE_DEV, protected: true },
  ];

  const baseStates = {
    blocklet: {
      getBlocklet(did) {
        if (did === didA) {
          return {
            meta: {
              did: didA,
              name: nameA,
              bundleDid: didA,
              bundleName: nameA,
              version: '1.0.0',
              status: BlockletStatus.stopped,
              group: BlockletGroup.dapp,
              main: 'blocklet.js',
            },
          };
        }
        return null;
      },
    },
    blockletExtras: {
      getSettings() {},
      getConfigs() {},
      getMeta() {},
      getExtraByDid() {},
      getFromDoc() {},
    },
    site: {
      findOneByBlocklet: () => ({
        domain: `${didA}.blocklet-domain-group`,
      }),
    },
    node: {
      read: () => ({ blockletRegistryList: storeList }),
    },
  };

  test('base', async () => {
    const states = baseStates;
    const controller = {
      nftId: 'zjdxvr7Q6W9LrYR3pUcDcoNwgDbGKV3jk48y',
      nftOwner: 'z1TedPoao5PN1A65zh7Mo8g55xgfjTma34i',
      chainHost: 'https://beta.abtnetwork.io/',
    };

    expect(getBlocklet()).rejects.toThrow('did does not exist');
    expect(getBlocklet({})).rejects.toThrow('did does not exist');
    expect(getBlocklet({ did: 'a' })).rejects.toThrow('did is invalid');
    expect(getBlocklet({ did: didA })).rejects.toThrow('dataDirs does not exist');
    expect(getBlocklet({ did: didA, dataDirs })).rejects.toThrow('states does not exist');
    expect(getBlocklet({ did: notExist, dataDirs, states })).rejects.toThrow('can not find blocklet in database');
    expect(await getBlocklet({ did: notExist, dataDirs, states, throwOnNotExist: false })).toBe(null);

    const mockGetMeta = spyOn(states.blockletExtras, 'getExtraByDid').mockResolvedValue({ controller });
    const res = await getBlocklet({ did: didA, dataDirs, states, ensureDirs: false });
    expect(res.env).toEqual({
      id: didA,
      name: nameA,
      processId: nameA,
      dataDir: `/path/to/data/${nameA}`,
      logsDir: `/path/to/logs/${nameA}`,
      cacheDir: `/path/to/cache/${nameA}`,
      appDir: `/path/to/blocklets/${nameA}/1.0.0`,
    });

    expect(mockGetMeta).toHaveBeenCalled();
    expect(res.controller).toEqual(controller);
    expect(res.trustedPassports).toEqual([]);
    expect(res.enablePassportIssuance).toEqual(true);
    expect(res.settings).toEqual({
      storeList,
      theme: {
        light: { palette: BLOCKLET_THEME_LIGHT.palette },
        dark: { palette: BLOCKLET_THEME_DARK.palette },
        prefer: 'system',
      },
      languages: [],
    });
    expect(res.site).toBeTruthy();
    expect(res.configs).toEqual([]);
    expect(res.configObj).toEqual({});
    expect(res.environments).toEqual([]);
    // 这个现在提前插入 dir 环境变量了
    expect(res.environmentObj).toEqual({
      BLOCKLET_APP_DIR: '/path/to/blocklets/a/1.0.0',
      BLOCKLET_CACHE_DIR: '/path/to/cache/a',
      BLOCKLET_COMPONENT_DID: 'z8iZtA8vKTD8W4gMijoTshxi2B8ULciqUgsFB',
      BLOCKLET_COMPONENT_VERSION: '1.0.0',
      BLOCKLET_DATA_DIR: '/path/to/data/a',
      BLOCKLET_LOG_DIR: '/path/to/logs/a',
      BLOCKLET_REAL_DID: 'z8iZtA8vKTD8W4gMijoTshxi2B8ULciqUgsFB',
      BLOCKLET_REAL_NAME: 'a',
    });
    res.settings.storeList.forEach((x) => {
      expect(x.id.length).toEqual(36);
    });
  });

  test('composite blocklet', async () => {
    const states = {
      ...baseStates,
      blocklet: {
        getBlocklet(did) {
          if (did === didA) {
            return {
              meta: {
                did: didA,
                name: nameA,
                bundleDid: didA,
                bundleName: nameA,
                version: '1.0.0',
                status: BlockletStatus.stopped,
                group: BlockletGroup.dapp,
                main: 'blocklet.js',
              },
              children: [
                {
                  meta: {
                    did: didB,
                    name: nameB,
                    bundleDid: didB,
                    bundleName: nameB,
                    version: '1.0.0',
                    status: BlockletStatus.stopped,
                    group: BlockletGroup.dapp,
                    main: 'blocklet.js',
                  },
                },
              ],
            };
          }
          return null;
        },
      },
    };

    const res = await getBlocklet({ did: didA, dataDirs, states, ensureDirs: false });
    expect(res.env).toEqual({
      id: didA,
      name: nameA,
      processId: nameA,
      dataDir: `/path/to/data/${nameA}`,
      logsDir: `/path/to/logs/${nameA}`,
      cacheDir: `/path/to/cache/${nameA}`,
      appDir: `/path/to/blocklets/${nameA}/1.0.0`,
    });

    expect(res.children[0].env).toEqual({
      id: `${didA}/${didB}`,
      name: `${nameA}/${nameB}`,
      processId: `${nameA}/${nameB}`,
      dataDir: `/path/to/data/${nameA}/${nameB}`,
      logsDir: `/path/to/logs/${nameA}/${nameB}`,
      cacheDir: `/path/to/cache/${nameA}/${nameB}`,
      appDir: `/path/to/blocklets/${nameB}/1.0.0`,
    });
  });

  test('configs and environments blocklet', async () => {
    const states = {
      ...baseStates,
      blocklet: {
        getBlocklet(did) {
          if (did === didA) {
            return {
              meta: {
                did: didA,
                name: nameA,
                bundleDid: didA,
                bundleName: nameA,
                version: '1.0.0',
                status: BlockletStatus.stopped,
                group: BlockletGroup.dapp,
                main: 'blocklet.js',
              },
              environments: [
                {
                  key: 'env1',
                  value: 'env 1',
                },
                {
                  key: 'env2',
                  value: 'env 2',
                },
              ],
              children: [
                {
                  meta: {
                    did: didB,
                    name: nameB,
                    bundleDid: didB,
                    bundleName: nameB,
                    version: '1.0.0',
                    status: BlockletStatus.stopped,
                    group: BlockletGroup.dapp,
                    main: 'blocklet.js',
                  },
                  environments: [
                    {
                      key: 'env3',
                      value: 'env 3',
                    },
                    {
                      key: 'env4',
                      value: 'env 4',
                    },
                  ],
                },
              ],
            };
          }
          return null;
        },
      },
      blockletExtras: {
        getMeta: mock().mockResolvedValue(null),
        getSettings() {},
        getConfigs(did) {
          if (did[0] === didA && did.length === 1) {
            return [
              {
                key: 'c1',
                value: 'c1 value',
              },
              {
                key: 'c2',
                value: 'c2 value',
              },
            ];
          }
          if (did[0] === didA && did[1] === didB) {
            return [
              {
                key: 'c3',
                value: 'c3 value',
              },
              {
                key: 'c4',
                value: 'c4 value',
              },
            ];
          }
          return [];
        },
        getExtraByDid(did) {
          if (did === didA) {
            return {
              did: didA,
              configs: [
                { key: 'c1', value: 'c1 value' },
                { key: 'c2', value: 'c2 value' },
              ],
              children: [
                {
                  did: didB,
                  configs: [
                    { key: 'c3', value: 'c3 value' },
                    { key: 'c4', value: 'c4 value' },
                  ],
                },
              ],
            };
          }
          return null;
        },
        getFromDoc({ doc, dids, name }) {
          if (!doc || !name || !dids?.length) return null;
          const [, ...childDids] = dids;
          let item = doc;
          for (const did of childDids) {
            item = (item.children || []).find((x) => x.did === did);
            if (!item) return null;
          }
          return item?.[name] || null;
        },
      },
    };

    const res = await getBlocklet({ did: didA, dataDirs, states, ensureDirs: false, log: true });
    // getExtraByDid is called internally, verified by configs being populated correctly
    expect(res.controller).toBe(undefined);
    expect(res.environments).toEqual([
      {
        key: 'env1',
        value: 'env 1',
      },
      {
        key: 'env2',
        value: 'env 2',
      },
    ]);
    expect(res.environmentObj).toEqual({
      BLOCKLET_APP_DIR: '/path/to/blocklets/a/1.0.0',
      BLOCKLET_CACHE_DIR: '/path/to/cache/a',
      BLOCKLET_COMPONENT_DID: 'z8iZtA8vKTD8W4gMijoTshxi2B8ULciqUgsFB',
      BLOCKLET_COMPONENT_VERSION: '1.0.0',
      BLOCKLET_DATA_DIR: '/path/to/data/a',
      BLOCKLET_LOG_DIR: '/path/to/logs/a',
      BLOCKLET_REAL_DID: 'z8iZtA8vKTD8W4gMijoTshxi2B8ULciqUgsFB',
      BLOCKLET_REAL_NAME: 'a',
      env1: 'env 1',
      env2: 'env 2',
    });
    expect(res.configs).toEqual([
      {
        key: 'c1',
        value: 'c1 value',
      },
      {
        key: 'c2',
        value: 'c2 value',
      },
    ]);
    expect(res.configObj).toEqual({
      c1: 'c1 value',
      c2: 'c2 value',
    });

    expect(res.children[0].environments).toEqual([
      {
        key: 'env3',
        value: 'env 3',
      },
      {
        key: 'env4',
        value: 'env 4',
      },
    ]);
    expect(res.children[0].environmentObj).toEqual({
      BLOCKLET_APP_DIR: '/path/to/blocklets/b/1.0.0',
      BLOCKLET_CACHE_DIR: '/path/to/cache/a/b',
      BLOCKLET_COMPONENT_DID: 'z8iZxYwou7hXhKEnL1qvdsmGRNikh4JhFvz3X',
      BLOCKLET_COMPONENT_VERSION: '1.0.0',
      BLOCKLET_DATA_DIR: '/path/to/data/a/b',
      BLOCKLET_LOG_DIR: '/path/to/logs/a/b',
      BLOCKLET_REAL_DID: 'z8iZtA8vKTD8W4gMijoTshxi2B8ULciqUgsFB/z8iZxYwou7hXhKEnL1qvdsmGRNikh4JhFvz3X',
      BLOCKLET_REAL_NAME: 'a/b',
      env3: 'env 3',
      env4: 'env 4',
    });
    expect(res.children[0].configs).toEqual([
      {
        key: 'c3',
        value: 'c3 value',
      },
      {
        key: 'c4',
        value: 'c4 value',
      },
    ]);
    expect(res.children[0].configObj).toEqual({
      c3: 'c3 value',
      c4: 'c4 value',
    });
  });
});

describe('getConfigFromPreferences', () => {
  test('should parse file as expected', () => {
    const blocklet = { env: { appDir: path.resolve(__dirname, '../assets/') } };
    const result = getConfigFromPreferences(blocklet);
    expect(result).toEqual([
      {
        default: '',
        description: 'Your preferred relays',
        name: 'prefs.relays',
        required: true,
        secure: false,
        shared: true,
      },
      {
        default: '',
        description: '限长文本',
        name: 'prefs.input',
        required: true,
        secure: false,
        shared: false,
      },
      {
        default: '',
        description: '电子邮箱',
        name: 'prefs.email',
        required: true,
        secure: false,
        shared: false,
      },
      {
        default: '',
        description: '多行文本',
        name: 'prefs.text',
        required: true,
        secure: false,
        shared: true,
      },
      {
        default: '',
        description: '标签交互',
        name: 'prefs.tags',
        required: false,
        secure: false,
        shared: true,
      },
      {
        default: '',
        description: '日期范围',
        name: 'prefs.daterange',
        required: false,
        secure: false,
        shared: true,
      },
      {
        default: '',
        description: '时间',
        name: 'prefs.time',
        required: false,
        secure: false,
        shared: true,
      },
      {
        default: '',
        description: '密码',
        name: 'prefs.pass',
        required: false,
        secure: true,
        shared: false,
      },
      {
        default: '',
        description: '时间区间',
        name: 'prefs.timerange',
        required: false,
        secure: false,
        shared: true,
      },
      {
        default: '',
        description: '数字输入',
        name: 'prefs.number',
        required: false,
        secure: false,
        shared: true,
      },
      {
        default: '',
        description: '商品质量',
        name: 'prefs.quality',
        required: false,
        secure: false,
        shared: true,
      },
      {
        default: '',
        description: '服务态度',
        name: 'prefs.service',
        required: false,
        secure: false,
        shared: true,
      },
      {
        default: '',
        description: '物流速度',
        name: 'prefs.deliver',
        required: false,
        secure: false,
        shared: true,
      },
      {
        default: '',
        description: '密码',
        name: 'prefs.gridPass',
        required: false,
        secure: true,
        shared: false,
      },
    ]);
  });

  test('should parse empty file as expected', () => {
    const blocklet = { env: { appDir: path.resolve('/tmp/not-exist/') } };
    const result = getConfigFromPreferences(blocklet);
    expect(result).toEqual([]);
  });
});

describe('getAppSystemEnvironments', () => {
  const appSk = '0x852bd56edf65cb07a55e3b5c5582173ca3522acdf14333b1880c2175c24943f61dff49f5a063d67553e506bae8a53b7364d5ba3b8bb6be54fe7776aca390e433'; // prettier-ignore
  const blockletDid = 'z8iZqeUACK955YaBWqEd8aKg3tTki1GpvE2Wu';
  const nodeSk = '0x5473889cfcc25682745b7165f724e0c74a110a66ac4b74b646db88b1b351e05979bf6695b10e95a9ae2b1dd636ec6fd015b8764f78826b5c9d8d97027543b95d'; // prettier-ignore
  const dataDirs = { data: '/path/to/data' };

  test('should return appUrl if already exists in routing rule site', () => {
    const testAppUrl = 'payment-demo-blocklet-znkjt5vbgnezh4p6v4dsaye61e7pxxn3vk4j.did.abtnet.io';
    const blocklet = {
      meta: {
        did: blockletDid,
        name: 'test-blocklet',
        description: 'description',
      },
      environments: [{ key: 'BLOCKLET_APP_SK', value: appSk }],
      configObj: {},
      site: {
        domainAliases: [{ value: testAppUrl }],
      },
    };

    const nodeInfo = {
      sk: nodeSk,
      didDomain: 'did.abtnet.io',
    };

    const envs = getAppSystemEnvironments(blocklet, nodeInfo, dataDirs);
    expect(envs.BLOCKLET_APP_URL).toEqual(prettyURL(testAppUrl));
  });

  test('should compatible with did.staging.arcblock.io did domain', () => {
    const testAppUrl = 'payment-demo-blocklet-znkjt5vbgnezh4p6v4dsaye61e7pxxn3vk4j.did.staging.arcblock.io';
    const blocklet = {
      meta: {
        did: blockletDid,
        name: 'test-blocklet',
        description: 'description',
      },
      environments: [{ key: 'BLOCKLET_APP_SK', value: appSk }],
      configObj: {},
      site: {
        domainAliases: [{ value: testAppUrl }],
      },
    };

    const nodeInfo = {
      sk: nodeSk,
      didDomain: 'did.abtnet.io',
    };

    const envs = getAppSystemEnvironments(blocklet, nodeInfo, dataDirs);
    expect(envs.BLOCKLET_APP_URL).toEqual(prettyURL(testAppUrl));
  });

  test('should return the concat did domain if there is no site in db', () => {
    const testAppUrl = 'arcblock.io';
    const testDidDomain = 'did.abtnet.io';
    const blocklet = {
      meta: {
        did: blockletDid,
        name: 'test-blocklet',
        description: 'description',
      },
      environments: [{ key: 'BLOCKLET_APP_SK', value: appSk }],
      configObj: {},
      site: {
        domainAliases: [{ value: testAppUrl }],
      },
    };

    const nodeInfo = {
      sk: nodeSk,
      didDomain: testDidDomain,
    };

    const env1 = getAppSystemEnvironments(blocklet, nodeInfo, dataDirs);
    expect(env1.BLOCKLET_APP_URL).toEqual(`https://bbqawl75oiolsjx5drmymdi4mrdxtgrqppcy3xj4pru.${testDidDomain}`);
  });

  test('should return the concat did domain if there is no site', () => {
    const testDidDomain = 'did.abtnet.io';
    const blocklet = {
      meta: {
        did: blockletDid,
        name: 'test-blocklet',
        description: 'description',
      },
      environments: [{ key: 'BLOCKLET_APP_SK', value: appSk }],
      configObj: {},
    };

    const nodeInfo = {
      sk: nodeSk,
      didDomain: testDidDomain,
    };

    const env1 = getAppSystemEnvironments(blocklet, nodeInfo, dataDirs);
    expect(env1.BLOCKLET_APP_URL).toEqual(`https://bbqawl75oiolsjx5drmymdi4mrdxtgrqppcy3xj4pru.${testDidDomain}`);
  });

  test('BLOCKLET_APP_DATA_DIR', () => {
    const blocklet = {
      meta: {
        did: blockletDid,
        name: blockletDid,
      },
      environments: [],
      configObj: {},
    };

    const envs = getAppSystemEnvironments(blocklet, { sk }, dataDirs);
    expect(envs.BLOCKLET_APP_DATA_DIR).toBe(`/path/to/data/${blockletDid}`);
  });
});

// FIXME: @TEST validateAppConfig的其他测试依然需要持续完善
describe('validateAppConfig', () => {
  const sk1 = toHex(fromRandom().secretKey);
  const sk2 = toHex(fromRandom().secretKey);
  const sk1Address = fromSecretKey(sk1, { role: types.RoleType.ROLE_APPLICATION }).address;

  const states = {
    blocklet: {
      getBlocklets: () => [
        {
          meta: {
            did: 'mockDidA',
          },
          environments: [
            {
              key: 'BLOCKLET_APP_SK',
              value: sk1,
            },
          ],
          migratedFrom: [{ appSk: '0xabc' }],
        },
      ],
      hasBlocklet: (address) => (address === sk1Address ? { meta: { did: 'mockDidA' } } : null),
    },
  };

  test('app sk should work when not used by other in environments & migratedFrom', async () => {
    const c1 = { key: 'BLOCKLET_APP_SK', value: sk2 };
    expect(c1.secure).toBeUndefined();
    await validateAppConfig(c1, states);
    expect(c1).toBe(c1);
    expect(c1.secure).toBe(true);

    const c2 = { key: 'BLOCKLET_APP_SK', value: '' };
    await validateAppConfig(c2, states);
    expect(c2).not.toHaveProperty('value');
  });

  test('app sk should throw when used by other in environment', () => {
    const c3 = { key: 'BLOCKLET_APP_SK', value: sk1 };
    expect(validateAppConfig(c3, states)).rejects.toThrow('already used by existing blocklet');
  });

  test('app sk should throw when used by other in migratedFrom', () => {
    const c3 = { key: 'BLOCKLET_APP_SK', value: sk1 };
    expect(
      validateAppConfig(c3, {
        blocklet: {
          getBlocklets: () => [
            {
              meta: {
                did: 'mockDidA',
              },
              environments: [
                {
                  key: 'BLOCKLET_APP_SK',
                  value: '0xabc',
                },
              ],
              migratedFrom: [{ appSk: sk1 }],
            },
          ],
          hasBlocklet: (address) => (address === sk1Address ? { meta: { did: 'mockDidA' } } : null),
        },
      })
    ).rejects.toThrow('already used by existing blocklet');
  });

  // FIXME: should throw error, but fromSecretKey('invalid sk', 'ethereum') is not throw
  test('app sk should throw when invalid: arcblock', () => {
    const c4 = { key: 'BLOCKLET_APP_SK', value: 'invalid sk' };
    expect(validateAppConfig(c4, states)).rejects.toThrow('Invalid custom blocklet secret key');
  });

  test('app name', async () => {
    const c1 = { key: 'BLOCKLET_APP_NAME', value: 'Mock App Name' };
    expect(c1.secure).toBeUndefined();
    await validateAppConfig(c1, states);
    expect(c1).toBe(c1);
    expect(c1.secure).toBe(false);
  });

  describe('#BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPACE_ENDPOINT ', () => {
    test('BLOCKLET_APP_SPACE_ENDPOINT should work!', async () => {
      const config = { key: 'BLOCKLET_APP_SPACE_ENDPOINT', value: 'https://storage.staging.abtnet.io/' };
      await validateAppConfig(config, states);
      expect(config).toEqual(config);
    });

    test('BLOCKLET_APP_SPACE_ENDPOINT can be empty!', async () => {
      const emptyConfig1 = { key: 'BLOCKLET_APP_SPACE_ENDPOINT', value: undefined };
      await validateAppConfig(emptyConfig1, states);
      expect(emptyConfig1).toEqual(emptyConfig1);

      const emptyConfig2 = { key: 'BLOCKLET_APP_SPACE_ENDPOINT', value: '' };
      await validateAppConfig(emptyConfig2, states);
      expect(emptyConfig2).toEqual(emptyConfig2);
    });

    test('BLOCKLET_APP_SPACE_ENDPOINT is not a valid URL!', () => {
      expect(validateAppConfig({ key: 'BLOCKLET_APP_SPACE_ENDPOINT', value: '233' }, states)).rejects.toThrow(
        'BLOCKLET_APP_SPACE_ENDPOINT(233) is not a valid URL'
      );
      expect(validateAppConfig({ key: 'BLOCKLET_APP_SPACE_ENDPOINT', value: 'https://' }, states)).rejects.toThrow(
        'BLOCKLET_APP_SPACE_ENDPOINT(https://) is not a valid URL'
      );
    });
  });

  describe('#BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPACES_URL ', () => {
    test('BLOCKLET_APP_SPACES_URL should work!', async () => {
      const config = { key: 'BLOCKLET_APP_SPACES_URL', value: 'https://storage.staging.abtnet.io/' };
      await validateAppConfig(config, states);
      expect(config).toEqual(config);
    });

    test('BLOCKLET_APP_SPACES_URL can not be empty!', () => {
      expect(validateAppConfig({ key: 'BLOCKLET_APP_SPACES_URL', value: undefined }, states)).rejects.toThrow(
        'BLOCKLET_APP_SPACES_URL can not be empty'
      );
      expect(validateAppConfig({ key: 'BLOCKLET_APP_SPACES_URL', value: '' }, states)).rejects.toThrow(
        'BLOCKLET_APP_SPACES_URL can not be empty'
      );
    });

    test('BLOCKLET_APP_SPACES_URL is not a valid URL!', () => {
      expect(validateAppConfig({ key: 'BLOCKLET_APP_SPACES_URL', value: '233' }, states)).rejects.toThrow(
        'BLOCKLET_APP_SPACES_URL(233) is not a valid URL'
      );
      expect(validateAppConfig({ key: 'BLOCKLET_APP_SPACES_URL', value: 'https://' }, states)).rejects.toThrow(
        'BLOCKLET_APP_SPACES_URL(https://) is not a valid URL'
      );
    });
  });

  describe('#BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_BACKUP_ENDPOINT ', () => {
    test('BLOCKLET_APP_BACKUP_ENDPOINT should work!', async () => {
      const config = {
        key: 'BLOCKLET_APP_BACKUP_ENDPOINT',
        value:
          'https://storage.staging.abtnet.io/app/api/space/z3T6AJLRiug1Hz1tqiLK6mLwa38ZKZDSyc4ks/app/zNKe7gqW8PqjQG15YJhyYWCXfSQG5JcQY9Sw/object/',
      };
      await validateAppConfig(config, states);
      expect(config).toEqual(config);
    });

    test('BLOCKLET_APP_BACKUP_ENDPOINT can not be empty!', async () => {
      let config = { key: 'BLOCKLET_APP_BACKUP_ENDPOINT', value: undefined };
      await validateAppConfig(config, states);
      expect(config.value).toBe('');

      config = { key: 'BLOCKLET_APP_BACKUP_ENDPOINT', value: '' };
      await validateAppConfig(config, states);
      expect(config.value).toBe('');
    });

    test('BLOCKLET_APP_BACKUP_ENDPOINT is not a valid URL!', () => {
      expect(validateAppConfig({ key: 'BLOCKLET_APP_BACKUP_ENDPOINT', value: '233' }, states)).rejects.toThrow(
        'BLOCKLET_APP_BACKUP_ENDPOINT(233) is not a valid URL'
      );
      expect(validateAppConfig({ key: 'BLOCKLET_APP_BACKUP_ENDPOINT', value: 'https://' }, states)).rejects.toThrow(
        'BLOCKLET_APP_BACKUP_ENDPOINT(https://) is not a valid URL'
      );
    });
  });

  describe('#BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_URL', () => {
    test('BLOCKLET_APP_URL should work!', async () => {
      const config = { key: 'BLOCKLET_APP_URL', value: 'https://www.arcblock.io' };
      await validateAppConfig(config, states);
      expect(config).toEqual(config);
    });

    test('BLOCKLET_APP_URL can not be empty!', () => {
      expect(validateAppConfig({ key: 'BLOCKLET_APP_URL', value: undefined }, states)).rejects.toThrow(
        'BLOCKLET_APP_URL can not be empty'
      );
      expect(validateAppConfig({ key: 'BLOCKLET_APP_URL', value: '' }, states)).rejects.toThrow(
        'BLOCKLET_APP_URL can not be empty'
      );
    });

    test('BLOCKLET_APP_URL is not a valid URL!', () => {
      expect(validateAppConfig({ key: 'BLOCKLET_APP_URL', value: 'www.blocklet.io' }, states)).rejects.toThrow(
        'BLOCKLET_APP_URL(www.blocklet.io) is not a valid URL'
      );
      expect(validateAppConfig({ key: 'BLOCKLET_APP_URL', value: 'https://' }, states)).rejects.toThrow(
        'BLOCKLET_APP_URL(https://) is not a valid URL'
      );
    });
  });

  describe('#BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_CLUSTER_SIZE', () => {
    test('BLOCKLET_CLUSTER_SIZE should work!', async () => {
      const config = { key: 'BLOCKLET_CLUSTER_SIZE', value: '2' };
      await validateAppConfig(config, states);
      expect(config).toEqual(config);
    });

    test('BLOCKLET_CLUSTER_SIZE can not be empty!', () => {
      expect(validateAppConfig({ key: 'BLOCKLET_CLUSTER_SIZE', value: 'abc' }, states)).rejects.toThrow(
        'BLOCKLET_CLUSTER_SIZE must be number'
      );
      expect(validateAppConfig({ key: 'BLOCKLET_CLUSTER_SIZE', value: '1.23' }, states)).rejects.toThrow(
        'BLOCKLET_CLUSTER_SIZE must be integer'
      );
    });
  });
});

describe('checkDuplicateAppSk', () => {
  const nodeSk = fromRandom().secretKey;

  const blocklet0 = {
    meta: { did: fromRandom().address, title: 'blocklet0' },
    environments: [],
  };
  const { wallet: blocklet0Wallet } = getBlockletInfo(blocklet0, nodeSk);

  const blocklet1 = {
    meta: { did: fromRandom().address, title: 'blocklet1' },
    // 把 blocklet1 的 sk 修改为 blocklet0 的 sk
    environments: [
      {
        key: 'BLOCKLET_APP_SK',
        value: blocklet0Wallet.secretKey,
      },
    ],
  };

  const blocklet2 = {
    meta: { did: fromRandom().address, title: 'blocklet2' },
    environments: [],
  };

  const blocklets = [blocklet0, blocklet1, blocklet2];

  // Track which blocklet is being checked to exclude it from hasBlocklet results
  let currentlyCheckingDid = null;

  const states = {
    node: {
      read: () => ({
        sk: nodeSk,
      }),
    },
    blocklet: {
      getBlocklets: () => blocklets,
      getBlocklet: (did) => {
        currentlyCheckingDid = did;
        return blocklets.find((x) => x.meta.did === did);
      },
      // hasBlocklet returns the blocklet whose appDid matches the given address
      // blocklet1 uses blocklet0's sk, so blocklet1's appDid = blocklet0Wallet.address
      // Exclude the currently checking blocklet (for reinstall scenario)
      hasBlocklet: (address) => {
        if (address === blocklet0Wallet.address) {
          // Return blocklet1 only if we're NOT checking blocklet1 itself
          return currentlyCheckingDid !== blocklet1.meta.did ? blocklet1 : null;
        }
        return null;
      },
    },
    blockletExtras: {
      getConfigs: ([did]) => {
        if (did === blocklet1.meta.did) {
          return [
            {
              key: 'BLOCKLET_APP_SK',
              value: blocklet0Wallet.secretKey,
            },
          ];
        }
        return [];
      },
    },
  };

  test('should work as expected', () => {
    // 安装 blocklet0 失败
    expect(checkDuplicateAppSk({ did: blocklet0.meta.did, states: { ...states } })).rejects.toThrow(
      'blocklet secret key already used by blocklet1'
    );

    // 安装 blocklet1 成功 (相当与保留数据删除后重装)
    expect(checkDuplicateAppSk({ did: blocklet1.meta.did, states: { ...states } })).resolves.toBeUndefined();

    // 安装 blocklet2 成功
    expect(checkDuplicateAppSk({ did: blocklet2.meta.did, states: { ...states } })).resolves.toBeUndefined();
  });

  test('throw an error when did or sk is empty', () => {
    expect(checkDuplicateAppSk({ sk: undefined, did: '' })).rejects.toThrow('sk and did is empty');
  });
});

test('checkDuplicateMountPoint', () => {
  expect(() => checkDuplicateMountPoint({}, '/b')).not.toThrow();
  expect(() => checkDuplicateMountPoint({ children: [{ mountPoint: '/a' }] }, '/b')).not.toThrow();
  expect(() => checkDuplicateMountPoint({ mountPoint: '/', children: [{ mountPoint: '/a' }] }, '/b')).not.toThrow();
  expect(() => checkDuplicateMountPoint({ mountPoint: '/b' }, '/')).not.toThrow();

  expect(() => checkDuplicateMountPoint({}, undefined)).not.toThrow();
  expect(() => checkDuplicateMountPoint({ children: [{ mountPoint: '/a' }] }, undefined)).not.toThrow();
  expect(() => checkDuplicateMountPoint({}, '/')).not.toThrow();
  expect(() => checkDuplicateMountPoint({ children: [{ mountPoint: '/a' }] }, '/')).not.toThrow();
  expect(() => checkDuplicateMountPoint({ mountPoint: '/' }, '/')).not.toThrow();
  expect(() =>
    checkDuplicateMountPoint({ mountPoint: '/a', children: [{ meta: { main: 'blocklet.js' }, mountPoint: '/' }] }, '/')
  ).toThrow('/ already exist');

  expect(() =>
    checkDuplicateMountPoint({ mountPoint: '/', children: [{ meta: { main: 'blocklet.js' }, mountPoint: '/a/' }] }, 'a')
  ).toThrow('a already exist');

  expect(() =>
    checkDuplicateMountPoint({ mountPoint: '/', children: [{ meta: { main: undefined }, mountPoint: '/a/' }] }, 'a')
  ).not.toThrow();

  // should not check gateway(container)
  expect(() => checkDuplicateMountPoint({ meta: { group: 'gateway' } }, undefined)).not.toThrow('/ already exist');
  expect(() => checkDuplicateMountPoint({ meta: { group: 'gateway' } }, '/')).not.toThrow('/ already exist');
  expect(() => checkDuplicateMountPoint({ meta: { group: 'gateway' }, mountPoint: '/' }, '/')).not.toThrow(
    '/ already exist'
  );
});

test('getTypeFromInstallParams', () => {
  expect(getTypeFromInstallParams({ type: 'store' })).toBe('store');
  expect(getTypeFromInstallParams({ did: 'xxx' })).toBe('store');
  expect(getTypeFromInstallParams({ type: 'url' })).toBe('url');
  expect(getTypeFromInstallParams({ url: 'xxx' })).toBe('url');
  expect(() => getTypeFromInstallParams({ type: 'upload' })).toThrow('Can only install blocklet from store/url/'); // upload is not supported
  expect(() => getTypeFromInstallParams({ file: 'xxx', did: 'xxx' })).toThrow('install from upload is not supported'); // upload is not supported
  expect(getTypeFromInstallParams({ type: 'dev' })).toBe('dev');
  expect(getTypeFromInstallParams({ type: 'create' })).toBe('create');
  expect(getTypeFromInstallParams({ title: 'xxx', description: 'xxx' })).toBe('create');
  expect(getTypeFromInstallParams({ type: 'restore' })).toBe('restore');
  expect(() => getTypeFromInstallParams({ type: 'unknown' })).toThrow('Can only install blocklet from store/url/');
  expect(() => getTypeFromInstallParams({})).toThrow('Can only install blocklet from store/url/');
});

describe('validateStore', () => {
  // NOTE: ABT_NODE_TRUSTED_SOURCES accepts comma-separated URLs
  // It serves two purposes:
  // 1. Blocklet store validation (hostname extracted from URLs)
  // 2. Content Security Policy xFrameOptions (full URLs used)
  const originalEnv = process.env.ABT_NODE_TRUSTED_SOURCES;

  afterEach(() => {
    if (originalEnv) {
      process.env.ABT_NODE_TRUSTED_SOURCES = originalEnv;
    } else {
      delete process.env.ABT_NODE_TRUSTED_SOURCES;
    }
  });

  test('should do nothing if mode!==serverless', () => {
    validateStore({ mode: NODE_MODES.PRODUCTION });
    validateStore({ mode: NODE_MODES.MAINTENANCE });
    validateStore({ mode: NODE_MODES.DEBUG });
  });

  test("should do nothing if store url in server's store list", () => {
    const nodeInfo = {
      mode: NODE_MODES.SERVERLESS,
      registerUrl: 'https://launcher.blocklet.dev/',
      blockletRegistryList: [{ url: 'https://store.blocklet.dev/' }, { url: 'https://DEV.blocklet.dev:8082/' }],
    };

    validateStore(nodeInfo, 'https://dev.blOCKLET.dev:8082/');
  });

  test("should throw error if storeUrl not in server's store list", () => {
    const nodeInfo = {
      mode: NODE_MODES.SERVERLESS,
      registerUrl: 'https://launcher.blocklet.dev/',
      blockletRegistryList: [{ url: 'https://store.blocklet.dev/' }],
    };

    expect(() => validateStore(nodeInfo, 'https://test.store.blocklet.dev/')).toThrow(
      /Must be installed from the compliant blocklet store list/i
    );
  });

  test('should trust store from ABT_NODE_TRUSTED_SOURCES env', () => {
    process.env.ABT_NODE_TRUSTED_SOURCES = 'https://trusted.store.dev';

    const nodeInfo = {
      mode: NODE_MODES.SERVERLESS,
      registerUrl: 'https://launcher.blocklet.dev/',
      blockletRegistryList: [{ url: 'https://store.blocklet.dev/' }],
    };

    validateStore(nodeInfo, 'https://trusted.store.dev/');
  });

  test('should trust multiple stores from ABT_NODE_TRUSTED_SOURCES env', () => {
    process.env.ABT_NODE_TRUSTED_SOURCES = 'https://trusted1.dev,https://trusted2.dev,https://trusted3.dev';

    const nodeInfo = {
      mode: NODE_MODES.SERVERLESS,
      registerUrl: 'https://launcher.blocklet.dev/',
      blockletRegistryList: [{ url: 'https://store.blocklet.dev/' }],
    };

    validateStore(nodeInfo, 'https://trusted1.dev/');
    validateStore(nodeInfo, 'https://trusted2.dev/');
    validateStore(nodeInfo, 'https://trusted3.dev/');
  });

  test('should handle whitespace in ABT_NODE_TRUSTED_SOURCES env', () => {
    process.env.ABT_NODE_TRUSTED_SOURCES = ' https://trusted1.dev , https://trusted2.dev , ';

    const nodeInfo = {
      mode: NODE_MODES.SERVERLESS,
      registerUrl: 'https://launcher.blocklet.dev/',
      blockletRegistryList: [{ url: 'https://store.blocklet.dev/' }],
    };

    validateStore(nodeInfo, 'https://trusted1.dev/');
    validateStore(nodeInfo, 'https://trusted2.dev/');
  });

  test('should throw error if store not in trusted sources', () => {
    process.env.ABT_NODE_TRUSTED_SOURCES = 'https://trusted.store.dev';

    const nodeInfo = {
      mode: NODE_MODES.SERVERLESS,
      registerUrl: 'https://launcher.blocklet.dev/',
      blockletRegistryList: [{ url: 'https://store.blocklet.dev/' }],
    };

    expect(() => validateStore(nodeInfo, 'https://untrusted.store.dev/')).toThrow(
      /Must be installed from the compliant blocklet store list/i
    );
  });

  test('should work normally when ABT_NODE_TRUSTED_SOURCES is empty', () => {
    process.env.ABT_NODE_TRUSTED_SOURCES = '';

    const nodeInfo = {
      mode: NODE_MODES.SERVERLESS,
      registerUrl: 'https://launcher.blocklet.dev/',
      blockletRegistryList: [{ url: 'https://store.blocklet.dev/' }],
    };

    validateStore(nodeInfo, 'https://store.blocklet.dev/');
    expect(() => validateStore(nodeInfo, 'https://untrusted.store.dev/')).toThrow(
      /Must be installed from the compliant blocklet store list/i
    );
  });
});

describe('validateInServerless', () => {
  test('should do nothing if xx', () => {
    const blockletMeta = {
      interfaces: [
        {
          port: {
            internal: 8092,
          },
        },
      ],
    };

    validateInServerless({ blockletMeta });
  });

  test('should throw error', () => {
    const blockletMeta = {
      interfaces: [
        {
          port: {
            internal: 8092,
            external: 53,
          },
        },
      ],
    };

    expect(() => validateInServerless({ blockletMeta })).toThrow(/Blocklets with exposed ports cannot be installed/);
  });
});

describe('isRotatingAppSk', () => {
  test('should return false when no new sk provided', () => {
    expect(isRotatingAppSk([], [])).toEqual(false);
    expect(isRotatingAppSk([], [], true)).toEqual(false);
    expect(isRotatingAppSk([], [], false)).toEqual(false);
    expect(isRotatingAppSk([], [{ key: 'BLOCKLET_APP_SK', value: '0xa' }], true)).toEqual(false);
    expect(isRotatingAppSk([], [{ key: 'BLOCKLET_APP_SK', value: '0xa' }], false)).toEqual(false);
  });

  test('should return true when rotating old blocklet', () => {
    expect(isRotatingAppSk([{ key: 'BLOCKLET_APP_SK', value: '0xa' }], [], false)).toEqual(true);
  });

  test('should return false when init new blocklet', () => {
    expect(isRotatingAppSk([{ key: 'BLOCKLET_APP_SK', value: '0xa' }], [], true)).toEqual(false);
  });

  test('should return true when rotating new blocklet', () => {
    expect(
      isRotatingAppSk([{ key: 'BLOCKLET_APP_SK', value: '0xb' }], [{ key: 'BLOCKLET_APP_SK', value: '0xa' }], true)
    ).toEqual(true);
  });

  test('should return false when rotating to same appSk', () => {
    expect(
      isRotatingAppSk([{ key: 'BLOCKLET_APP_SK', value: '0xa' }], [{ key: 'BLOCKLET_APP_SK', value: '0xa' }], false)
    ).toEqual(false);
    expect(
      isRotatingAppSk([{ key: 'BLOCKLET_APP_SK', value: '0xa' }], [{ key: 'BLOCKLET_APP_SK', value: '0xa' }], false)
    ).toEqual(false);
    expect(
      isRotatingAppSk([{ key: 'BLOCKLET_APP_SK', value: '0xa' }], [{ key: 'BLOCKLET_APP_SK', value: '0xa' }], true)
    ).toEqual(false);
    expect(
      isRotatingAppSk([{ key: 'BLOCKLET_APP_SK', value: '0xa' }], [{ key: 'BLOCKLET_APP_SK', value: '0xa' }], true)
    ).toEqual(false);
  });
});

test('getFixedBundleSource', () => {
  expect(getFixedBundleSource()).toBe(null);
  expect(getFixedBundleSource({})).toBe(null);
  expect(getFixedBundleSource({ bundleSource: { anyProp: 'any value' } })).toEqual({ anyProp: 'any value' });
  expect(
    getFixedBundleSource({
      bundleSource: { anyProp: 'any value' },
      source: 0,
      deployedFrom: 'https://store.blocklet.dev',
      meta: { bundleName: 'componentA' },
    })
  ).toEqual({ anyProp: 'any value' });
  expect(getFixedBundleSource({ source: 0 })).toBe(null); // no deployedFrom
  expect(getFixedBundleSource({ source: 0, deployedFrom: 'https://store.blocklet.dev' })).toBe(null); // no deployedFrom
  expect(
    getFixedBundleSource({ source: 0, deployedFrom: 'https://store.blocklet.dev', meta: { bundleName: 'componentA' } })
  ).toEqual({ name: 'componentA', store: 'https://store.blocklet.dev', version: 'latest' });
  expect(
    getFixedBundleSource({ source: 1, deployedFrom: 'https://store.blocklet.dev', meta: { bundleName: 'componentA' } })
  ).toBe(null);
  expect(
    getFixedBundleSource({ source: 2, deployedFrom: 'https://store.blocklet.dev', meta: { bundleName: 'componentA' } })
  ).toBe(null);
  expect(
    getFixedBundleSource({ source: 3, deployedFrom: 'https://x.y.x', meta: { bundleName: 'componentA' } })
  ).toEqual({ url: 'https://x.y.x' });
  expect(
    getFixedBundleSource({ source: 4, deployedFrom: 'https://store.blocklet.dev', meta: { bundleName: 'componentA' } })
  ).toBe(null);
});

test('ensureAppLogo', async () => {
  const appName = 'abc';
  const appVersion = '1.0.0';

  const tmpDir = path.join(os.tmpdir(), 'ensureAppLogo');
  fs.removeSync(tmpDir);
  fs.ensureDirSync(tmpDir);
  const blockletsDir = path.join(tmpDir, 'blocklets');
  fs.ensureDirSync(blockletsDir);

  const appDir = path.join(blockletsDir, appName, appVersion);
  fs.ensureDirSync(appDir);

  const componentDir = path.join(blockletsDir, 'xxx', '1.0.0');
  fs.ensureDirSync(componentDir);
  fs.writeFileSync(path.join(componentDir, 'logo.png'), 'logo');

  expect(fs.existsSync(path.join(appDir, 'logo.png'))).toBe(false);
  await ensureAppLogo(
    {
      source: BlockletSource.custom,
      meta: { bundleName: appName, version: appVersion },
      children: [{ meta: { logo: 'logo.png' }, env: { appDir: componentDir } }],
    },
    blockletsDir
  );
  expect(fs.existsSync(path.join(appDir, 'logo.png'))).toBe(true);

  fs.removeSync(tmpDir);
});

test('validateBlockletChainInfo', () => {
  expect(validateBlockletChainInfo({ configObj: {} })).toEqual({ type: 'arcblock', id: 'none', host: 'none' });
  expect(
    validateBlockletChainInfo({ configObj: { BLOCKLET_APP_CHAIN_HOST: 'https://beta.abtnetwork.io/api' } })
  ).toEqual({ type: 'arcblock', id: 'none', host: 'https://beta.abtnetwork.io/api' });
  expect(validateBlockletChainInfo({ configObj: { BLOCKLET_APP_CHAIN_TYPE: 'ethereum' } })).toEqual({
    type: 'ethereum',
    id: '1',
    host: 'none',
  });
  expect(() =>
    validateBlockletChainInfo({ configObj: { BLOCKLET_APP_CHAIN_TYPE: 'ethereum', BLOCKLET_APP_CHAIN_ID: 'abc' } })
  ).toThrow('numbers');

  expect(() => validateBlockletChainInfo({ configObj: { BLOCKLET_APP_CHAIN_HOST: 'invalid uri' } })).toThrow();
});

describe('getBlockletDidDomainList', () => {
  test('should return empty array when no blocklet', () => {
    expect(getBlockletDidDomainList([], {})).toEqual([]);
  });

  test('should remove empty dids', () => {
    expect(
      getBlockletDidDomainList(
        {
          appDid: '',
          appPid: 'did:abt:zNKte9d4jWNhzCpYJ66yMxM2PoC1gSt3XSFb',
          migratedFrom: [{ appDid: '' }],
        },
        {
          didDomain: 'did.abtnet.io',
        }
      )
    ).toEqual([{ value: 'bbqa7c3rqvp7i3vqlldwk7lvsqfwwtv6fknaywqgrii.did.abtnet.io', isProtected: true }]);
  });

  test('should include alsoKnownAs did domain', () => {
    const expectedValue1 = 'bbqa7c3rqvp7i3vqlldwk7lvsqfwwtv6fknaywqgrii.did.abtnet.io';
    const expectedValue2 = 'bbqaxipoodaocex5trzskd5iennhbamhyaa5zcblun4.did.abtnet.io';
    const expectedValue3 = 'bbqarh4kac7slqbuev75rbwrz3nfcci72iqda3362kq.did.abtnet.io';

    const results = getBlockletDidDomainList(
      {
        appDid: 'did:abt:zNKhEDCETXYgYGtQXsKVB8Bi4ax84wSR5kWJ',
        appPid: 'did:abt:zNKte9d4jWNhzCpYJ66yMxM2PoC1gSt3XSFb',
        migratedFrom: [{ appDid: 'did:abt:zNKYT2chnMEK7TwYuyGMwHog6jumZoajxS7V' }],
      },
      {
        didDomain: 'did.abtnet.io',
      }
    );

    expect(!!results.find((item) => item.value === expectedValue1 && item.isProtected === true)).toEqual(true);
    expect(!!results.find((item) => item.value === expectedValue2 && item.isProtected === true)).toEqual(true);
    expect(!!results.find((item) => item.value === expectedValue3 && item.isProtected === true)).toEqual(true);
  });

  test('should return unique domain list', () => {
    const expectedValue1 = 'bbqa7c3rqvp7i3vqlldwk7lvsqfwwtv6fknaywqgrii.did.abtnet.io';
    const expectedValue2 = 'bbqaxipoodaocex5trzskd5iennhbamhyaa5zcblun4.did.abtnet.io';
    const results = getBlockletDidDomainList(
      {
        appDid: 'did:abt:zNKhEDCETXYgYGtQXsKVB8Bi4ax84wSR5kWJ',
        appPid: 'did:abt:zNKte9d4jWNhzCpYJ66yMxM2PoC1gSt3XSFb',
        migratedFrom: [{ appDid: 'did:abt:zNKte9d4jWNhzCpYJ66yMxM2PoC1gSt3XSFb' }],
      },
      {
        didDomain: 'did.abtnet.io',
      }
    );

    expect(!!results.find((item) => item.value === expectedValue1 && item.isProtected === true)).toEqual(true);
    expect(!!results.find((item) => item.value === expectedValue2 && item.isProtected === true)).toEqual(true);
  });
});

test('getBlockletStatus', () => {
  // fallback
  expect(getBlockletStatus()).toBe(BlockletStatus.stopped);
  expect(getBlockletStatus({ status: BlockletStatus.running })).toBe(BlockletStatus.running);
  expect(getBlockletStatus({ status: BlockletStatus.running, structVersion: '2' })).toBe(BlockletStatus.stopped);
  expect(getBlockletStatus({ status: BlockletStatus.added, structVersion: '2' })).toBe(BlockletStatus.added);
  expect(
    getBlockletStatus({ status: BlockletStatus.installed, structVersion: '2', meta: { group: BlockletGroup.gateway } })
  ).toBe(BlockletStatus.installed);

  // in progress status
  expect(
    getBlockletStatus({
      children: [
        { status: BlockletStatus.stopped },
        { status: BlockletStatus.running },
        { status: BlockletStatus.downloading },
      ],
    })
  ).toBe(BlockletStatus.downloading);
  expect(
    getBlockletStatus({
      children: [
        { status: BlockletStatus.stopped },
        { status: BlockletStatus.stopped },
        { status: BlockletStatus.stopped },
      ],
    })
  ).toBe(BlockletStatus.stopped);

  // running status
  expect(
    getBlockletStatus({ children: [{ status: BlockletStatus.stopped }, { status: BlockletStatus.running }] })
  ).toBe(BlockletStatus.running);
  expect(
    getBlockletStatus({ children: [{ status: BlockletStatus.running }, { status: BlockletStatus.stopped }] })
  ).toBe(BlockletStatus.running);

  // stopped
  expect(
    getBlockletStatus({
      children: [
        { status: BlockletStatus.stopping },
        { status: BlockletStatus.stopped },
        { status: BlockletStatus.stopped },
      ],
    })
  ).toBe(BlockletStatus.stopping);
});

test('shouldSkipComponent', () => {
  expect(shouldSkipComponent('did1')).toBe(false);
  expect(shouldSkipComponent('did1', [])).toBe(false);
  expect(shouldSkipComponent('did1', ['did1'])).toBe(false);
  expect(shouldSkipComponent('did1', ['did2'])).toBe(true);
});

describe('getBlockletURLForLauncher', () => {
  const blockletDid = 'zNKsL5GfnBX4YFZrWfprdc5vTSASKYNEdFXR';
  const serverDid = 'z1fPkpqSc2nhCVE6hC8cXS1pa5ffDA9BB7R';
  const blocklet = { appPid: blockletDid, meta: { did: blockletDid }, launcher: { test: 'just for test' } };
  const nodeInfoBase = { did: serverDid, didDomain: 'did.abtnet.io', slpDomain: 'slp.abtnet.io' };

  test('should return SLP URL when in serverless mode with launcher', () => {
    const nodeInfo = { ...nodeInfoBase, mode: NODE_MODES.SERVERLESS, launcher: { test: 'just for test' } };
    const slpDid = getSlpDid(nodeInfo.did, blocklet.appPid);
    const expectedDomain = getDidDomainForBlocklet({ did: slpDid, didDomain: nodeInfo.slpDomain });
    const url = getBlockletURLForLauncher({ blocklet, nodeInfo });
    expect(url).toEqual(`https://${expectedDomain}`);
  });

  test('should return regular DID domain URL when not in serverless mode', () => {
    const nodeInfo = { ...nodeInfoBase, mode: NODE_MODES.PRODUCTION, launcher: null }; // No launcher in production
    const expectedDomain = getDidDomainForBlocklet({ did: blocklet.appPid, didDomain: nodeInfo.didDomain });
    const url = getBlockletURLForLauncher({ blocklet, nodeInfo });
    expect(url).toEqual(`https://${expectedDomain}`);
  });

  test('should return regular DID domain URL when in serverless mode', () => {
    const nodeInfo = { ...nodeInfoBase, mode: NODE_MODES.SERVERLESS, launcher: null };
    const slpDid = getSlpDid(nodeInfo.did, blocklet.appPid);
    const expectedDomain = getDidDomainForBlocklet({ did: slpDid, didDomain: nodeInfo.slpDomain });
    const url = getBlockletURLForLauncher({ blocklet, nodeInfo });
    expect(url).toEqual(`https://${expectedDomain}`);
  });

  test('should respect ABT_NODE_ENABLE_SLP_DOMAIN=true', () => {
    const originalEnv = process.env.ABT_NODE_ENABLE_SLP_DOMAIN;
    process.env.ABT_NODE_ENABLE_SLP_DOMAIN = 'true';
    const nodeInfo = { ...nodeInfoBase, mode: NODE_MODES.PRODUCTION, launcher: null }; // Mode doesn't matter here
    const slpDid = getSlpDid(nodeInfo.did, blocklet.appPid);
    const expectedDomain = getDidDomainForBlocklet({ did: slpDid, didDomain: nodeInfo.slpDomain });
    const url = getBlockletURLForLauncher({ blocklet, nodeInfo });
    expect(url).toEqual(`https://${expectedDomain}`);
    process.env.ABT_NODE_ENABLE_SLP_DOMAIN = originalEnv;
  });

  test('should respect ABT_NODE_ENABLE_SLP_DOMAIN=false', () => {
    const originalEnv = process.env.ABT_NODE_ENABLE_SLP_DOMAIN;
    process.env.ABT_NODE_ENABLE_SLP_DOMAIN = 'false';
    const nodeInfo = { ...nodeInfoBase, mode: NODE_MODES.SERVERLESS, launcher: { test: 'just for test' } }; // Mode doesn't matter here
    const expectedDomain = getDidDomainForBlocklet({ did: blocklet.appPid, didDomain: nodeInfo.didDomain });
    const url = getBlockletURLForLauncher({ blocklet, nodeInfo });
    expect(url).toEqual(`https://${expectedDomain}`);
    process.env.ABT_NODE_ENABLE_SLP_DOMAIN = originalEnv;
  });
});

describe('shouldEnableSlpDomain', () => {
  test('should return true if server mode is serverless', () => {
    expect(shouldEnableSlpDomain(NODE_MODES.SERVERLESS)).toBe(true);
  });

  test('should return false if server mode is not serverless', () => {
    expect(shouldEnableSlpDomain(NODE_MODES.PRODUCTION)).toBe(false);
  });

  test('should return true if process.env.NODE_ENV is development and process.env.ABT_NODE_ENABLE_SLP_DOMAIN is truthy', () => {
    const oriNodeEnv = process.env.NODE_ENV;
    const oriAbtNodeEnableSlpDomain = process.env.ABT_NODE_ENABLE_SLP_DOMAIN;
    process.env.NODE_ENV = 'development';
    process.env.ABT_NODE_ENABLE_SLP_DOMAIN = 'true';

    expect(shouldEnableSlpDomain()).toBe(true);
    process.env.NODE_ENV = oriNodeEnv;
    process.env.ABT_NODE_ENABLE_SLP_DOMAIN = oriAbtNodeEnableSlpDomain;
  });
});

describe('updateDidDocument', () => {
  test('should add slp did to alsoKnownAs property when call with updateBlockletDocument', async () => {
    const blockletDid = 'z8iZqeUACK955YaBWqEd8aKg3tTki1GpvE2Wu';
    const nodeWallet = fromRandom();
    const blockletWallet = fromRandom();
    const ownerWallet = fromRandom();

    const nodeInfo = {
      sk: nodeWallet.secretKey,
      did: nodeWallet.address,
      didDomain: 'did.abtnet.io',
      slpDomain: 'slp.abtnet.io',
      mode: NODE_MODES.SERVERLESS,
      launcher: { did: nodeWallet.address, name: 'test-launcher', url: 'https://launcher.test' },
    };

    const blocklet = {
      appPid: blockletDid,
      status: BlockletStatus.running,
      meta: {
        did: blockletDid,
        name: 'test-blocklet',
        title: 'Test Blocklet',
        description: 'description',
      },
      environments: [
        { key: 'BLOCKLET_APP_SK', value: blockletWallet.secretKey },
        { key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_URL, value: 'https://test.example.com' },
      ],
    };

    const states = {
      blocklet: {
        getBlocklet: () => Promise.resolve(blocklet),
      },
      site: {
        findOneByBlocklet: () =>
          Promise.resolve({
            domainAliases: [{ value: 'test.example.com' }],
          }),
      },
      blockletExtras: {
        findOne: () =>
          Promise.resolve({
            did: blockletDid,
            controller: {
              did: nodeWallet.address,
              launcherName: 'test-launcher',
              launcherUrl: 'https://launcher.test',
              nftOwner: ownerWallet.address,
            },
          }),
        getSettings: () =>
          Promise.resolve({
            owner: { did: ownerWallet.address },
          }),
      },
    };

    const teamManager = {
      getUserState: () => ({
        getUser: () =>
          Promise.resolve({
            did: ownerWallet.address,
            fullName: 'Test Owner',
            avatar: 'https://avatar.test',
          }),
      }),
    };

    const mockUpdateBlockletDocument = spyOn(didDocument, 'updateBlockletDocument').mockImplementation(() =>
      Promise.resolve()
    );
    await updateDidDocument({ did: blockletDid, nodeInfo, teamManager, states });

    const slpDid = getSlpDid(nodeWallet.address, blockletDid);

    expect(mockUpdateBlockletDocument).toBeCalledWith(expect.objectContaining({ alsoKnownAs: [toDid(slpDid)] }));
    mockUpdateBlockletDocument.mockRestore();
  });

  test('should not add slp did to alsoKnownAs property if slp domain is not enabled', async () => {
    const nodeWallet = fromRandom();
    const blockletWallet = fromRandom();
    const ownerWallet = fromRandom();

    const blockletDid = blockletWallet.address;

    const nodeInfo = {
      sk: nodeWallet.secretKey,
      did: nodeWallet.address,
      didDomain: 'did.abtnet.io',
      slpDomain: 'slp.abtnet.io',
      mode: NODE_MODES.PRODUCTION,
      launcher: null,
    };

    const blocklet = {
      appPid: blockletDid,
      status: BlockletStatus.running,
      meta: {
        did: blockletDid,
        name: 'test-blocklet',
        title: 'Test Blocklet',
        description: 'description',
      },
      environments: [
        { key: 'BLOCKLET_APP_SK', value: blockletWallet.secretKey },
        { key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_URL, value: 'https://test.example.com' },
      ],
      controller: null,
    };

    const states = {
      blocklet: {
        getBlocklet: () => Promise.resolve(blocklet),
      },
      site: {
        findOneByBlocklet: () =>
          Promise.resolve({
            domainAliases: [{ value: 'test.example.com' }],
          }),
      },
      blockletExtras: {
        findOne: () =>
          Promise.resolve({
            did: blockletDid,
            controller: null,
          }),
        getSettings: () =>
          Promise.resolve({
            owner: { did: ownerWallet.address },
          }),
      },
    };

    const teamManager = {
      getUserState: () => ({
        getUser: () =>
          Promise.resolve({
            did: ownerWallet.address,
            fullName: 'Test Owner',
            avatar: 'https://avatar.test',
          }),
      }),
    };

    const mockUpdateBlockletDocument = spyOn(didDocument, 'updateBlockletDocument').mockImplementation(() =>
      Promise.resolve()
    );
    await updateDidDocument({ did: blockletDid, nodeInfo, teamManager, states });

    expect(mockUpdateBlockletDocument).toBeCalledWith(expect.objectContaining({ alsoKnownAs: [] }));
    mockUpdateBlockletDocument.mockRestore();
  });
});

describe('getSlpDid', () => {
  test('should throw error if serverDid or appPid is empty', () => {
    expect(() => getSlpDid()).toThrow('serverDid and appPid is required');
    expect(() => getSlpDid('test-server-did')).toThrow('serverDid and appPid is required');
    expect(() => getSlpDid(null, 'test-server-app-pid')).toThrow('serverDid and appPid is required');
  });

  test('should return expected slp did', () => {
    const nodeWallet = fromRandom();
    const blockletWallet = fromRandom();

    expect(typeof getSlpDid(nodeWallet.address, blockletWallet.address)).toBe('string');
  });
});

test('getAppConfigsFromComponent', () => {
  expect(getAppConfigsFromComponent()).toEqual([]);

  const config1 = {
    key: 'key1',
    value: 'value1',
    shared: true,
  };
  expect(
    getAppConfigsFromComponent(
      {
        environments: [{ name: 'key1', shared: true }],
      },
      [],
      [config1]
    )
  ).toEqual([config1]);

  // skip if app already have this config
  expect(
    getAppConfigsFromComponent(
      {
        environments: [{ name: 'key1', shared: true }],
      },
      [config1],
      [config1]
    )
  ).toEqual([]);
});

test('getConfigsFromInput', () => {
  expect(getConfigsFromInput()).toEqual({ sharedConfigs: [], selfConfigs: [] });

  expect(getConfigsFromInput([{ key: 'k', value: 'v2' }], [{ key: 'k', value: 'v1', shared: true }])).toEqual({
    sharedConfigs: [{ key: 'k', value: 'v2' }],
    selfConfigs: [],
  });
  expect(getConfigsFromInput([{ key: 'k', value: 'v2', shared: true }], [{ key: 'k', value: 'v1' }])).toEqual({
    sharedConfigs: [{ key: 'k', value: 'v2', shared: true }],
    selfConfigs: [],
  });
  expect(getConfigsFromInput([{ key: 'k', value: '' }], [{ key: 'k', value: 'v1', shared: true }])).toEqual({
    sharedConfigs: [{ key: 'k', value: '' }],
    selfConfigs: [],
  });

  expect(getConfigsFromInput([{ key: 'k', value: 'v2' }], [{ key: 'k', value: 'v1', secure: true }])).toEqual({
    sharedConfigs: [],
    selfConfigs: [{ key: 'k', value: 'v2' }],
  });
  expect(getConfigsFromInput([{ key: 'k', value: 'v2', secure: true }], [{ key: 'k', value: 'v1' }])).toEqual({
    sharedConfigs: [],
    selfConfigs: [{ key: 'k', value: 'v2', secure: true }],
  });
  expect(getConfigsFromInput([{ key: 'k', value: '' }], [{ key: 'k', value: 'v1', secure: true }])).toEqual({
    sharedConfigs: [],
    selfConfigs: [{ key: 'k', value: '' }],
  });
});

describe('removeAppConfigsFromComponent', () => {
  const state = {
    setConfigs: mock(),
  };

  test('should work as expected', async () => {
    // app has no matched configs
    await removeAppConfigsFromComponent(
      [{ key: 'k1', value: 'v1' }],
      { meta: { did: 'did1', environments: [] }, children: [] },
      state
    );
    expect(state.setConfigs).not.toBeCalled();

    await removeAppConfigsFromComponent(
      [{ key: 'k1', value: 'v1' }],
      { meta: { did: 'did1', environments: [] }, children: [], configs: [{ key: 'k2', value: 'v2' }] },
      state
    );
    expect(state.setConfigs).not.toBeCalled();

    // config is in app's meta.environments
    await removeAppConfigsFromComponent(
      [{ key: 'k1' }],
      { meta: { did: 'did1', environments: [{ name: 'k1' }] }, children: [], configs: [{ key: 'k1', value: 'v1' }] },
      state
    );
    expect(state.setConfigs).not.toBeCalled();

    // find shared config is in other component's meta.environments
    await removeAppConfigsFromComponent(
      [{ key: 'k1' }],
      {
        meta: { did: 'did1', environments: [] },
        configs: [{ key: 'k1', value: 'v1' }],
        children: [{ configs: [{ key: 'k1', shared: true }] }],
      },
      state
    );
    expect(state.setConfigs).not.toBeCalled();

    // app config should be removed if no component use it
    await removeAppConfigsFromComponent(
      [{ key: 'k1' }],
      { meta: { did: 'did1', environments: [] }, children: [], configs: [{ key: 'k1', value: 'v1' }] },
      state
    );
    expect(state.setConfigs).lastCalledWith('did1', [{ key: 'k1', value: undefined }]);

    // app config should be removed if no component use it as shared config
    await removeAppConfigsFromComponent(
      [{ key: 'k2' }],
      {
        meta: { did: 'did1', environments: [] },
        children: [{ configs: [{ key: 'k1', shared: false }] }],
        configs: [{ key: 'k2', value: 'v2' }],
      },
      state
    );
    expect(state.setConfigs).lastCalledWith('did1', [{ key: 'k2', value: undefined }]);
  });
});

test('getPackConfig', () => {
  expect(getPackConfig()).toBeFalsy();
  expect(getPackConfig({})).toBeFalsy();
  expect(getPackConfig({ children: [{ meta: { group: 'pack', did: 'did1' } }] })).toBeFalsy();
  expect(
    getPackConfig({ children: [{ meta: { group: 'pack', did: 'did1', resource: { bundles: [] } } }] })
  ).toBeFalsy();
  expect(
    getPackConfig({
      children: [{ meta: { group: 'pack', did: 'did1', resource: { bundles: [{ did: 'did2', type: 'config' }] } } }],
    })
  ).toBeFalsy();

  const app = {
    children: [
      {
        meta: {
          group: 'pack',
          did: 'did1',
          resource: { bundles: [{ did: 'did1', type: 'config' }] },
        },
        env: { appDir: '/path/to/dataDir' },
      },
    ],
  };

  const mock1 = spyOn(fs, 'existsSync').mockImplementation(() => true);
  const mock2 = spyOn(fs, 'readJSON').mockImplementation(() => ({ key1: 'value1' }));
  expect(getPackConfig(app)).toEqual({
    key1: 'value1',
  });

  mock1.mockRestore();
  mock2.mockRestore();

  expect(getPackConfig(app)).toBeFalsy();
});

test('getBlockletConfigObj', () => {
  expect(getBlockletConfigObj()).toEqual({});
  expect(getBlockletConfigObj({ configs: null })).toEqual({});
  expect(getBlockletConfigObj({ configs: [] })).toEqual({});
  expect(
    getBlockletConfigObj({
      configs: [
        {
          key: 'key1',
          value: 'value1',
        },
      ],
    })
  ).toEqual({ key1: 'value1' });
  expect(
    getBlockletConfigObj({
      configs: [
        {
          key: 'key1',
          value: 'value1',
          secure: true,
        },
      ],
    })
  ).toEqual({ key1: 'value1' });
  expect(
    getBlockletConfigObj(
      {
        configs: [
          {
            key: 'key1',
            value: 'value1',
            secure: true,
          },
        ],
      },
      { excludeSecure: true }
    )
  ).toEqual({});
  expect(
    getBlockletConfigObj({
      meta: { title: 'title1' },
      configs: [
        {
          key: 'key1',
          value: '{meta.title}',
        },
      ],
    })
  ).toEqual({ key1: 'title1' });
});

describe('resolveMountPointConflict', () => {
  it('should not modify component without mountPoint', () => {
    const comp = { meta: { did: '123', name: 'test' } };
    const blocklet = { children: [], meta: { group: 'other', interfaces: [{ type: BLOCKLET_INTERFACE_TYPE_WEB }] } };

    resolveMountPointConflict(comp, blocklet);
    expect(comp.mountPoint).toBeUndefined();
  });

  it('should not modify mountPoint if no conflict exists', () => {
    const comp = {
      mountPoint: '/test',
      meta: { did: '123', name: 'test' },
    };
    const blocklet = {
      children: [
        {
          mountPoint: '/other',
          meta: { did: '456', group: 'other', interfaces: [{ type: BLOCKLET_INTERFACE_TYPE_WEB }] },
        },
      ],
    };

    resolveMountPointConflict(comp, blocklet);
    expect(comp.mountPoint).toEqual('/test');
  });

  it('should not modify mountPoint if same component exists', () => {
    const comp = {
      mountPoint: '/test',
      meta: { did: '123', name: 'test' },
    };
    const blocklet = {
      children: [
        {
          mountPoint: '/test',
          meta: { did: '123', group: 'other', interfaces: [{ type: BLOCKLET_INTERFACE_TYPE_WEB }] },
        },
      ],
    };

    resolveMountPointConflict(comp, blocklet);
    expect(comp.mountPoint).toEqual('/test');
  });

  it('should use name for new mountPoint on conflict', () => {
    const comp = {
      mountPoint: '/conflict',
      meta: {
        did: '123',
        name: 'test-name',
        title: 'Test Title',
      },
    };
    const blocklet = {
      children: [
        {
          mountPoint: '/conflict',
          meta: { did: '456', group: 'other', interfaces: [{ type: BLOCKLET_INTERFACE_TYPE_WEB }] },
        },
      ],
    };

    resolveMountPointConflict(comp, blocklet);
    expect(comp.mountPoint).toEqual('test-name');
  });

  it('should use title for new mountPoint when name is missing', () => {
    const comp = {
      mountPoint: '/conflict',
      meta: {
        did: '123',
        title: 'Test Title',
      },
    };
    const blocklet = {
      children: [
        {
          mountPoint: '/conflict',
          meta: { did: '456', group: 'other', interfaces: [{ type: BLOCKLET_INTERFACE_TYPE_WEB }] },
        },
      ],
    };

    resolveMountPointConflict(comp, blocklet);
    expect(comp.mountPoint).toEqual('test-title');
  });

  it('should use did when suggested mountPoint also exists', () => {
    const comp = {
      mountPoint: '/conflict',
      meta: {
        did: '123',
        name: 'test',
      },
    };
    const blocklet = {
      children: [
        {
          mountPoint: '/conflict',
          meta: { did: '456', group: 'other', interfaces: [{ type: BLOCKLET_INTERFACE_TYPE_WEB }] },
        },
        {
          mountPoint: '/test',
          meta: { did: '789', group: 'other', interfaces: [{ type: BLOCKLET_INTERFACE_TYPE_WEB }] },
        },
      ],
    };

    resolveMountPointConflict(comp, blocklet);
    expect(comp.mountPoint).toEqual('123');
  });

  it('should handle empty blocklet children array', () => {
    const comp = {
      mountPoint: '/test',
      meta: { did: '123', name: 'test' },
    };
    const blocklet = {
      children: [],
      meta: {
        group: 'other',
        interfaces: [{ type: BLOCKLET_INTERFACE_TYPE_WEB }],
      },
    };

    resolveMountPointConflict(comp, blocklet);
    expect(comp.mountPoint).toEqual('/test');
  });

  it('should handle components without meta', () => {
    const comp = { mountPoint: '/test' };
    const blocklet = {
      children: [
        {
          mountPoint: '/test',
          meta: { did: '456', group: 'other', interfaces: [{ type: BLOCKLET_INTERFACE_TYPE_WEB }] },
        },
      ],
    };

    expect(() => resolveMountPointConflict(comp, blocklet)).not.toThrow();
  });

  it('should handle components without mountPoint', () => {
    const comp = { mountPoint: '/test' };
    const blocklet = {
      children: [
        {
          mountPoint: '/test',
          meta: { did: '456' },
        },
      ],
    };

    resolveMountPointConflict(comp, blocklet);
    expect(comp.mountPoint).toEqual('/test');
  });
});

describe('copyPackImages', () => {
  const mockAppDataDir = '/tmp/app-data';
  const mockPackDir = '/tmp/pack-dir';
  const mockMediaDir = path.join(mockAppDataDir, 'media', 'blocklet-service');

  beforeEach(() => {
    // 模拟文件系统
    spyOn(fs, 'ensureDir').mockImplementation(() => Promise.resolve());
    spyOn(fs, 'existsSync').mockImplementation(() => true);
    spyOn(fs, 'copy').mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    mock.clearAllMocks();
  });

  test('should handle empty packConfig', async () => {
    await copyPackImages({ appDataDir: mockAppDataDir, packDir: mockPackDir });
    expect(fs.ensureDir).toHaveBeenCalledWith(mockMediaDir);
    expect(fs.copy).not.toHaveBeenCalled();
  });

  test('should copy bottom navigation icons', async () => {
    const packConfig = {
      navigations: [
        { section: 'bottomNavigation', icon: 'home.png' },
        { section: ['bottomNavigation', 'dashboard'], icon: 'settings.png' },
        { section: 'dashboard', icon: 'profile.png' }, // 不应该复制这个
      ],
    };

    await copyPackImages({ appDataDir: mockAppDataDir, packDir: mockPackDir, packConfig });

    expect(fs.ensureDir).toHaveBeenCalledWith(mockMediaDir);
    expect(fs.copy).toHaveBeenCalledTimes(2);
    expect(fs.copy).toHaveBeenCalledWith(
      path.join(mockPackDir, 'images', 'home.png'),
      path.join(mockMediaDir, 'home.png')
    );
    expect(fs.copy).toHaveBeenCalledWith(
      path.join(mockPackDir, 'images', 'settings.png'),
      path.join(mockMediaDir, 'settings.png')
    );
  });

  test('should copy brand related images', async () => {
    const packConfig = {
      configObj: {
        [BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_FAVICON]: 'logo.png',
        [BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPLASH_PORTRAIT]: 'splash-portrait.png',
        [BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPLASH_LANDSCAPE]: 'splash-landscape.png',
        [BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_OG_IMAGE]: 'og.png',
        customKey: 'custom.png', // 不应该复制这个
      },
    };

    await copyPackImages({ appDataDir: mockAppDataDir, packDir: mockPackDir, packConfig });

    expect(fs.ensureDir).toHaveBeenCalledWith(mockMediaDir);
    expect(fs.copy).toHaveBeenCalledTimes(4);
    expect(fs.copy).toHaveBeenCalledWith(
      path.join(mockPackDir, 'images', 'logo.png'),
      path.join(mockAppDataDir, 'logo.png')
    );
    expect(fs.copy).toHaveBeenCalledWith(
      path.join(mockPackDir, 'images', 'splash-portrait.png'),
      path.join(mockAppDataDir, 'splash-portrait.png')
    );
    expect(fs.copy).toHaveBeenCalledWith(
      path.join(mockPackDir, 'images', 'splash-landscape.png'),
      path.join(mockAppDataDir, 'splash-landscape.png')
    );
    expect(fs.copy).toHaveBeenCalledWith(
      path.join(mockPackDir, 'images', 'og.png'),
      path.join(mockAppDataDir, 'og.png')
    );
  });

  test('should handle non-existent images', async () => {
    // 模拟某些图片文件不存在
    fs.existsSync.mockImplementation((filePath) => {
      return !filePath.includes('non-existent.png');
    });

    const packConfig = {
      navigations: [
        { section: 'bottomNavigation', icon: 'non-existent.png' },
        { section: 'bottomNavigation', icon: 'exists.png' },
      ],
      configObj: {
        [BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_FAVICON]: 'non-existent.png',
        [BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPLASH_PORTRAIT]: 'exists.png',
      },
    };

    await copyPackImages({ appDataDir: mockAppDataDir, packDir: mockPackDir, packConfig });

    expect(fs.copy).toHaveBeenCalledTimes(2);
    expect(fs.copy).toHaveBeenCalledWith(
      path.join(mockPackDir, 'images', 'exists.png'),
      path.join(mockMediaDir, 'exists.png')
    );
    expect(fs.copy).toHaveBeenCalledWith(
      path.join(mockPackDir, 'images', 'exists.png'),
      path.join(mockAppDataDir, 'exists.png')
    );
  });

  test('should handle both navigation and brand images', async () => {
    const packConfig = {
      navigations: [
        { section: 'bottomNavigation', icon: 'nav1.png' },
        { section: 'bottomNavigation', icon: 'nav2.png' },
      ],
      configObj: {
        [BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_FAVICON]: 'logo.png',
        [BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPLASH_PORTRAIT]: 'splash.png',
      },
    };

    await copyPackImages({ appDataDir: mockAppDataDir, packDir: mockPackDir, packConfig });

    expect(fs.ensureDir).toHaveBeenCalledWith(mockMediaDir);
    expect(fs.copy).toHaveBeenCalledTimes(4);
    // 验证导航图标
    expect(fs.copy).toHaveBeenCalledWith(
      path.join(mockPackDir, 'images', 'nav1.png'),
      path.join(mockMediaDir, 'nav1.png')
    );
    expect(fs.copy).toHaveBeenCalledWith(
      path.join(mockPackDir, 'images', 'nav2.png'),
      path.join(mockMediaDir, 'nav2.png')
    );
    // 验证品牌图片
    expect(fs.copy).toHaveBeenCalledWith(
      path.join(mockPackDir, 'images', 'logo.png'),
      path.join(mockAppDataDir, 'logo.png')
    );
    expect(fs.copy).toHaveBeenCalledWith(
      path.join(mockPackDir, 'images', 'splash.png'),
      path.join(mockAppDataDir, 'splash.png')
    );
  });
});
