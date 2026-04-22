/* eslint-disable global-require */
/* eslint-disable import/no-extraneous-dependencies */
const { test, describe, expect, beforeAll, mock, beforeEach, afterAll } = require('bun:test');

const mockBearerToken = mock((req, res, next) => next());
const mockUserInfo = mock((req, res, next) => next());
const mockCheckRunning = mock((req, res, next) => next());
const mockCheckAuth = mock((req, res, next) => next());
const mockCheckKyc = mock((req, res, next) => next());
const mockCheckAdminPermission = mock((req, res, next) => next());
const mockCheckMemberPermission = mock((req, res, next) => next());
const mockCheckGuestPermission = mock((req, res, next) => next());
const mockFavicon = mock((req, res) => res.status(200).end());

mock.module('@abtnode/util/lib/logo-middleware', () => ({
  __esModule: true,
  attachSendLogoContext: () => (req, res, next) => next(),
  ensureBlockletExist: (req, res, next) => next(),
  ensureCustomSquareLogo: (req, res, next) => next(),
  ensureCustomRectLogo: (req, res, next) => next(),
  ensureBundleLogo: (req, res, next) => next(),
  ensureDefaultLogo: (req, res, next) => next(),
  ensureCustomFavicon: mockFavicon,
  fallbackLogo: () => {},
  cacheError: () => {},
}));
mock.module('../api/middlewares/check-running', () => {
  return {
    __esModule: true,
    default: (req, res, next) => mockCheckRunning(req, res, next),
  };
});

mock.module('../api/middlewares/check-permission', () => ({
  checkAdminPermission: (req, res, next) => mockCheckAdminPermission(req, res, next),
  checkMemberPermission: (req, res, next) => mockCheckMemberPermission(req, res, next),
  checkGuestPermission: (req, res, next) => mockCheckGuestPermission(req, res, next),
}));

mock.module('../api/services/auth/index', () => ({
  init: () => ({
    middlewares: {
      sessionBearerToken: mockBearerToken,
      refreshBearerToken: mockBearerToken,
      userInfo: mockUserInfo,
      checkAuth: mockCheckAuth,
      checkKyc: mockCheckKyc,
      ensureWsAuth: () => {},
    },
    routes: {
      attachDidAuthHandlers: () => {},
      createPassportRoutes: { init: () => {} },
      createPasskeyRoutes: { init: () => {} },
      createSessionRoutes: { init: () => {} },
      createCommonRoutes: { init: () => {} },
    },
  }),
}));

mock.module('../api/middlewares/check-permission', () => ({
  checkAdminPermission: mockCheckAdminPermission,
  checkMemberPermission: mockCheckMemberPermission,
  checkGuestPermission: mockCheckGuestPermission,
}));

const { WsServer } = require('@arcblock/ws');

mock.module('@arcblock/ws', () => {
  const mockChannel = {
    join: mock(() => mockChannel),
    receive: mock(() => mockChannel),
    on: mock(() => mockChannel),
    leave: mock(() => mockChannel),
    push: mock(() => mockChannel),
  };

  const WsClient = mock(() => ({
    connect: mock(async () => {}),
    on: mock(() => {}),
    off: mock(() => {}),
    emit: mock(() => {}),
    channel: mock(() => mockChannel),
    close: mock(() => {}),
  }));

  return {
    WsClient,
    WsServer,
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const request = require('supertest');
const { fromRandom } = require('@ocap/wallet');

const formatContext = require('../api/util/format-context');

const dataDir = path.join(os.tmpdir(), Math.random().toString(36).substring(2, 15));

const ensureBuildDir = () => {
  const file = path.join(__dirname, '../dist/index.html');
  if (!fs.existsSync(file)) {
    fs.outputFileSync(file, 'hello');
  }
};

// eslint-disable-next-line no-promise-executor-return
const sleep = (t = 400) => new Promise((r) => setTimeout(r, t));

beforeAll(() => {
  fs.mkdirpSync(dataDir);
  ensureBuildDir();
});

afterAll(async () => {
  await sleep(2000);
  fs.rmSync(dataDir, { recursive: true, force: true });
});

const nodeWallet = fromRandom();
const node = {
  states: {
    node: {
      read: () => ({ sk: nodeWallet.secretKey }),
    },
  },
  getNodeInfo: () => ({ did: nodeWallet.address, sk: nodeWallet.secretKey }),
  dataDirs: { services: dataDir, cache: dataDir, tmp: dataDir, data: dataDir },
  getSessionSecret: () => '123',
  getBlocklet: ({ did }) => ({
    did,
    meta: {
      did,
      interfaces: [
        {
          name: 'publicUrl',
          services: [
            {
              name: 'auth',
              config: {
                whoCanAccess: 'all',
              },
            },
          ],
        },
      ],
    },
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

describe('Blocklet Service', () => {
  test('should have formatContext method', async () => {
    expect(typeof formatContext).toEqual('function');

    const result = await formatContext({
      originalUrl: 'https://www.example.com/path',
      user: { avatar: 'xxx', did: '123' },
      headers: {
        'x-real-hostname': 'www.example.com',
        'x-real-port': 80,
        'x-real-protocol': 'https:',
      },
    });

    expect(result).toEqual({
      protocol: 'https',
      user: { did: '123' },
      url: 'https://www.example.com/path',
      query: undefined,
      hostname: 'www.example.com',
      port: 0,
    });
  });
});

describe('Create Server', () => {
  const createServer = require('../api/index');

  const server = createServer(node, { sessionSecret: '123' });

  beforeEach(() => {
    mock.clearAllMocks();
  });

  test('should be a function', () => {
    expect(typeof server.listen).toBe('function');
    expect(typeof server.sendToAppComponents).toBe('function');
  });

  test('should not create server', () => {
    expect(() => createServer({ dataDirs: {} })).toThrow('requires dataDir');
    expect(() => createServer(node)).toThrow('requires sessionSecret');
  });

  test('request service page', async () => {
    const res = await request(server).get('/.well-known/service/login');
    expect(res.status).toBe(200);
    expect(mockBearerToken.mock.calls.length).toBe(1);
    expect(mockUserInfo.mock.calls.length).toBe(1);
    expect(mockCheckRunning.mock.calls.length).toBe(0);
    expect(mockCheckAuth.mock.calls.length).toBe(0);
    expect(mockCheckKyc.mock.calls.length).toBe(0);
  });

  test('request blocklet', async () => {
    const res = await request(server).get('/blocklet-path');
    expect(res.status).toBe(500);
    expect(res.text).toMatch(/Blocklet Service: failed to get component target: No valid port found for component/);
    expect(mockBearerToken.mock.calls.length).toBe(1);
    expect(mockUserInfo.mock.calls.length).toBe(1);
    expect(mockCheckRunning.mock.calls.length).toBe(1);
    expect(mockCheckAuth.mock.calls.length).toBe(1);
    expect(mockCheckKyc.mock.calls.length).toBe(1);
  });

  test('invalid request', async () => {
    const res = await request(server).get('/.well-known/service/invalid-path.js');
    expect(res.status).toBe(400);
    expect(res.text).toBe('Bad request');
    expect(mockBearerToken.mock.calls.length).toBe(1);
    expect(mockUserInfo.mock.calls.length).toBe(1);
    expect(mockCheckRunning.mock.calls.length).toBe(1);
    expect(mockCheckAuth.mock.calls.length).toBe(1);
    expect(mockCheckKyc.mock.calls.length).toBe(1);
  });

  test('proxy to daemon', async () => {
    const res = await request(server).get('/.well-known/service/api/gql');
    // 因为 proxyToDaemon 没有被 mock，所以会返回 502, 但是 proxy-to-daemon 之前的中间件都执行了
    expect(res.status).toBe(502);
    expect(mockBearerToken.mock.calls.length).toBe(1);
    expect(mockUserInfo.mock.calls.length).toBe(1);
    expect(mockCheckAdminPermission.mock.calls.length).toBe(0);
    expect(mockCheckMemberPermission.mock.calls.length).toBe(0);
    expect(mockCheckGuestPermission.mock.calls.length).toBe(1);
    // expect(mockProxyToDaemon.mock.calls.length).toBe(1);
    expect(mockCheckRunning.mock.calls.length).toBe(0);
    expect(mockCheckAuth.mock.calls.length).toBe(0);
    expect(mockCheckKyc.mock.calls.length).toBe(0);
  });

  test('favicon', async () => {
    expect(mockFavicon.mock.calls.length).toBe(0);

    const res1 = await request(server).get('/favicon.ico');
    expect(res1.status).toBe(200);
    expect(mockFavicon.mock.calls.length).toBe(1);

    mockFavicon.mockClear();
    expect(mockFavicon.mock.calls.length).toBe(0);
    const res2 = await request(server).get('/.well-known/service/blocklet/favicon');
    expect(res2.status).toBe(200);
    expect(mockFavicon.mock.calls.length).toBe(1);
  });
});
