process.env.ABT_NODE_SESSION_SECRET = 'test';

const { test, expect, describe, mock, beforeEach } = require('bun:test');
const { fromRandom } = require('@ocap/wallet');

const createRoutes = require('../../../../api/routes/auth/connect-owner');

describe('connect-owner', () => {
  let node;
  let user;

  const onAuth = () =>
    createRoutes(node).onAuth({
      claims: [
        { type: 'profile', fullName: 'Alice' },
        { type: 'signature', origin: 'x', sig: 'y' },
      ],
      userDid: user.address,
      userPk: user.publicKey,
      updateSession: mock(),
      extraParams: { locale: 'en' },
      req: {},
      baseUrl: 'https://example.com',
    });

  const getProfileClaim = () =>
    createRoutes(node)
      .onConnect()
      .profile({ extraParams: { locale: 'en' } });

  beforeEach(() => {
    user = fromRandom();
    node = {
      getNodeInfo: mock(() => ({ did: fromRandom().address, name: 'server' })),
      isInitialized: mock(() => false),
      updateNodeOwner: mock(),
    };
  });

  test('should reject profile claim when server is initialized', async () => {
    node.isInitialized = mock(() => true);
    await expect(getProfileClaim()).rejects.toThrow();
  });

  test('should reject profile claim when server is owned by nft', async () => {
    node.getNodeInfo = mock(() => ({ ownerNft: { holder: 'a', issuer: 'b' } }));
    await expect(getProfileClaim()).rejects.toThrow('The server owner can only be claimed with an NFT.');
  });

  test('should return profile claim when server is not initialized', async () => {
    const claim = await getProfileClaim();
    expect(claim.fields).toEqual(['fullName', 'email', 'avatar']);
  });

  test('should not update owner when server is initialized', async () => {
    node.isInitialized = mock(() => true);
    await expect(onAuth()).rejects.toThrow();
    expect(node.updateNodeOwner).not.toHaveBeenCalled();
  });

  test('should not update owner when signature is invalid', async () => {
    await expect(onAuth()).rejects.toThrow('Failed to verify signature');
    expect(node.updateNodeOwner).not.toHaveBeenCalled();
  });
});
