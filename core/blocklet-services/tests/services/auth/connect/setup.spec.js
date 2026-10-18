const { test, mock, expect, describe, beforeEach } = require('bun:test');
const { toBase58, toHex } = require('@ocap/util');
const { fromRandom } = require('@ocap/wallet');
const { types } = require('@ocap/mcrypto');

const createRoutes = require('../../../../api/services/auth/connect/setup');

const createAppWallet = () => fromRandom({ role: types.RoleType.ROLE_APPLICATION });

const createProof = async (wallet, appDid) => {
  const origin = toBase58(`I am the owner of app ${appDid}`);
  return { claim: { origin, sig: await wallet.sign(origin) }, pk: wallet.publicKey };
};

describe('setup', () => {
  let node;
  let app;
  let user;
  let blocklet;
  let req;
  let createSessionToken;
  let updateSession;

  const onConnect = (userDid) =>
    createRoutes(node, {}, createSessionToken).onConnect({ req, userDid, extraParams: {} });

  const onAuth = (userDid, proof) =>
    createRoutes(node, {}, createSessionToken).onAuth({
      claims: [{ type: 'profile', fullName: 'Alice' }],
      userDid,
      userPk: user.publicKey,
      updateSession,
      extraParams: { locale: 'en', previousWorkflowData: proof },
      req,
      baseUrl: 'https://example.com',
    });

  beforeEach(() => {
    app = createAppWallet();
    user = fromRandom();
    blocklet = {
      meta: { did: app.address, name: 'test' },
      appDid: app.address,
      settings: {},
      env: { dataDir: '/tmp' },
    };
    node = {
      getUsersCount: mock(() => 0),
      getUser: mock(() => null),
      updateUser: mock(),
      loginUser: mock(() => ({ did: user.address })),
      createAuditLog: mock(),
      upsertUserSession: mock(() => ({ visitorId: 'visitor' })),
    };
    req = {
      headers: {},
      query: {},
      body: {},
      get: () => '',
      getBlocklet: mock(() => blocklet),
      getBlockletInfo: mock(() => ({ secret: 'secret' })),
      context: { didwallet: { os: 'web' } },
    };
    createSessionToken = mock(() => 'session-token');
    updateSession = mock();
  });

  describe('checkOwner', () => {
    test('should allow the first user of an application without owner', async () => {
      await expect(onConnect(user.address)).resolves.toBeTruthy();
    });

    test('should allow the only existing user of an application without owner', async () => {
      node.getUsersCount = mock(() => 1);
      node.getUser = mock(() => ({ did: user.address }));
      await expect(onConnect(user.address)).resolves.toBeTruthy();
    });

    test('should reject other user when the application has one member', async () => {
      node.getUsersCount = mock(() => 1);
      await expect(onConnect(user.address)).rejects.toThrow('You are not owner of the application');
    });

    test('should reject when the application without owner has more than one member', async () => {
      node.getUsersCount = mock(() => 2);
      node.getUser = mock(() => ({ did: user.address }));
      await expect(onConnect(user.address)).rejects.toThrow('You are not owner of the application');
    });

    test('should allow the owner of the application', async () => {
      blocklet.settings.owner = { did: user.address };
      node.getUsersCount = mock(() => 10);
      node.getUser = mock(() => ({ did: user.address }));
      await expect(onConnect(user.address)).resolves.toBeTruthy();
    });

    test('should reject non-owner when the application has owner', async () => {
      blocklet.settings.owner = { did: fromRandom().address };
      node.getUser = mock(() => ({ did: user.address }));
      await expect(onConnect(user.address)).rejects.toThrow('You are not owner of the application');
    });
  });

  describe('owner proof', () => {
    test('should reject missing proof', async () => {
      await expect(onAuth(user.address, undefined)).rejects.toThrow('No owner proof found from previous workflow');
    });

    test('should reject proof signed by a key pair other than the application', async () => {
      const proof = await createProof(fromRandom(), app.address);
      await expect(onAuth(user.address, proof)).rejects.toThrow('Signer public key does not match the expected DID');
      expect(createSessionToken).not.toHaveBeenCalled();
    });

    test('should reject proof with invalid signature', async () => {
      const proof = await createProof(app, app.address);
      proof.claim.sig = `0x${'11'.repeat(64)}`;
      await expect(onAuth(user.address, proof)).rejects.toThrow('Failed to verify signature');
      expect(createSessionToken).not.toHaveBeenCalled();
    });

    test('should reject proof signed for other message', async () => {
      const origin = toBase58('something else');
      const proof = { claim: { origin, sig: await app.sign(origin) }, pk: app.publicKey };
      await expect(onAuth(user.address, proof)).rejects.toThrow('Invalid owner proof from previous workflow');
      expect(createSessionToken).not.toHaveBeenCalled();
    });

    test('should accept hex encoded origin', async () => {
      const origin = toHex(`I am the owner of app ${app.address}`);
      const proof = { claim: { origin, sig: await app.sign(origin) }, pk: app.publicKey };
      await onAuth(user.address, proof);
      expect(createSessionToken).toHaveBeenCalled();
    });

    test('should issue owner session with a valid proof', async () => {
      const proof = await createProof(app, app.address);
      await onAuth(user.address, proof);
      expect(node.loginUser).toHaveBeenCalled();
      expect(createSessionToken).toHaveBeenCalledWith(user.address, expect.objectContaining({ role: 'owner' }));
      expect(updateSession).toHaveBeenCalled();
    });
  });
});
