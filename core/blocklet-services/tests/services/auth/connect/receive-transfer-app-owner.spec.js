const { test, mock, expect, afterAll } = require('bun:test');

const userOriginalModule = require('@abtnode/util/lib/user');
const passportOriginalModule = require('@abtnode/auth/lib/passport');

mock.module('@arcblock/vc', () => ({}));
mock.module('@abtnode/util/lib/user', () => ({
  ...userOriginalModule,
}));
mock.module('@abtnode/auth/lib/passport', () => ({
  ...passportOriginalModule,
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { fromRandom } = require('@ocap/wallet');
const { types } = require('@ocap/mcrypto');
const createRoutes = require('../../../../api/services/auth/connect/receive-transfer-app-owner');

const createSessionToken = mock(() => ({}));

const createAppWallet = () => fromRandom({ role: types.RoleType.ROLE_APPLICATION });

test('should return a function', () => {
  expect(typeof createRoutes).toBe('function');
});

test('should config props as expected', () => {
  const { action, authPrincipal, claims, onAuth } = createRoutes({}, {}, createSessionToken);
  expect(action).toBe('receive-transfer-app-owner');
  expect(authPrincipal).toBe(false);
  expect(claims.length).toBe(2);
  expect(Object.keys(claims[0])).toEqual(['authPrincipal']);
  expect(Object.keys(claims[1])).toEqual(['keyPair', 'profile']);
  expect(typeof onAuth).toBe('function');
});

test('should config props as expected', () => {
  const { action, authPrincipal, claims, onAuth } = createRoutes({}, {}, createSessionToken);
  expect(action).toBe('receive-transfer-app-owner');
  expect(authPrincipal).toBe(false);
  expect(claims.length).toBe(2);
  expect(Object.keys(claims[0])).toEqual(['authPrincipal']);
  expect(Object.keys(claims[1])).toEqual(['keyPair', 'profile']);
  expect(typeof onAuth).toBe('function');
});

test('claims', async () => {
  const wallet = createAppWallet();

  const appDid = 'z8ia5ERpG5DZ8FSW3ac5tU1xsbzumE9NtqKCY';
  const node = {
    getBlocklet: () => ({
      meta: { did: 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV', title: 'app-title' },
      environments: [{ key: 'BLOCKLET_APP_SK', value: wallet.secretKey }],
    }),
    getNodeInfo: () => ({ sk: wallet.secretKey }),
    checkTransferAppOwnerSession: mock().mockReturnValue({ appDid }),
  };

  const {
    claims: [{ authPrincipal: authPrincipalFn }, { keyPair: keyPairFn, profile: profileFn }],
  } = createRoutes(node, {}, createSessionToken);

  const authPrincipal = await authPrincipalFn({
    extraParams: { appDid },
    context: { didwallet: { os: 'web', version: '99.0.0' } },
  });

  expect(authPrincipal).toEqual({
    description: 'Please continue with your account',
    chainInfo: {
      host: 'https://main.abtnetwork.io/api/',
      id: 'main',
      type: 'arcblock',
    },
  });

  const keyPair = await keyPairFn({
    extraParams: { appDid: 'z8ia5ERpG5DZ8FSW3ac5tU1xsbzumE9NtqKCY' },
    context: { didwallet: { os: 'web', version: '99.0.0' } },
  });

  expect(node.checkTransferAppOwnerSession).toHaveBeenCalled();
  expect(keyPair).toEqual(
    expect.objectContaining({
      declare: false,
      description: 'Please generate a new key-pair for this application',
      mfa: true,
      migrateFrom: '',
      moniker: 'app-title',
      targetType: expect.objectContaining({
        encoding: expect.any(String),
        hash: expect.any(String),
        key: expect.any(String),
        role: expect.any(String),
      }),
    })
  );

  const profile = await profileFn({ extraParams: {} });
  expect(profile).toEqual({
    description: 'Provide the following information to continue',
    fields: ['fullName', 'email', 'avatar'],
  });
});

test('onAuth', async () => {
  const wallet = createAppWallet();

  const appDid = 'z8ia5ERpG5DZ8FSW3ac5tU1xsbzumE9NtqKCY';
  const appPid = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
  const node = {
    getBlocklet: () => ({
      appDid,
      appPid,
      meta: { did: 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV', title: 'app-title' },
      environments: [{ key: 'BLOCKLET_APP_SK', value: wallet.secretKey }],
      settings: {
        initialized: true,
      },
      env: {
        dataDir: '/xxx',
      },
    }),
    getNodeInfo: () => ({ sk: wallet.secretKey }),
    checkTransferAppOwnerSession: mock().mockReturnValue({ appDid }),
    closeTransferAppOwnerSession: mock(),
    configBlocklet: mock(),
    getUser: mock(),
    addUser: mock(),
    updateUser: mock(),
    loginUser: mock(),
    updateBlockletOwner: mock(),
    createAuditLog: mock(),
    createPassportLog: mock(),
    getRoles: () => [{ name: 'owner', title: 'Owner' }],
    stopBlocklet: mock().mockResolvedValueOnce(),
    startBlocklet: mock().mockResolvedValueOnce(),
  };

  const { onAuth } = createRoutes(node, {}, createSessionToken);
  const res = await onAuth({
    userDid: 'z3Ct5Gj5ZKthE7yy15K262L9WfPtsKRUmVGFT',
    userPk: 'z3Ct5Gj5ZKthE7yy15K262L9WfPtsKRUmVGFT',
    extraParams: { appDid, transferId: 'z8ia7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0' },
    claims: [
      {
        type: 'profile',
      },
      {
        type: 'keyPair',
        secret: wallet.secretKey,
      },
    ],
    req: {
      getUserOrg: () => '',
    },
    updateSession: mock(),
  });

  expect(res).toMatchObject({
    disposition: 'attachment',
    type: 'VerifiableCredential',
  });
  expect(res.data.credentialSubject).toBeTruthy();
  expect(res.data['@context']).toContain('https://schema.arcblock.io/v0.1/context.jsonld');
});
