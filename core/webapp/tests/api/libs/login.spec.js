process.env.ABT_NODE_SESSION_SECRET = 'test';

const { test, expect, describe, mock, afterAll } = require('bun:test');

const realWallet = require('@ocap/wallet');

mock.module('@blocklet/meta/lib/info', () => {
  const mockWallet = realWallet.fromRandom();

  return state => ({
    wallet: mockWallet,
    name: state.meta.title || 'Test Blocklet',
    environments: state.environments || [],
    meta: {
      did: state.meta.did,
      title: state.meta.title || 'Test Blocklet',
    },
    configs: state.configs || [],
  });
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { fromRandom } = require('@ocap/wallet');
const { authWithAccessKeySignature, parseUserByDecodedJwtToken } = require('../../../api/libs/login');

describe('authWithAccessKeySignature', () => {
  const wallet = fromRandom();
  const node = {
    refreshLastUsed: () => {},
    getAccessKey: () =>
      Promise.resolve({
        accessKeyPublic: wallet.publicKey,
        authType: 'signature',
        passport: 'admin',
        remark: 'name1',
      }),
    getNodeInfo: () => ({
      did: wallet.address,
      fullName: 'name1',
      role: 'admin',
    }),
    getBlocklet: () =>
      Promise.resolve({
        did: wallet.address,
        meta: {
          title: 'name1',
        },
      }),
  };

  test('should auth with access key', async () => {
    const stamp = Date.now();

    node.getAccessKey = () =>
      Promise.resolve({
        accessKeyPublic: wallet.publicKey,
        authType: 'signature',
        passport: 'admin',
        remark: 'name1',
      });

    const user = await authWithAccessKeySignature({
      keyId: wallet.address,
      stamp,
      signature: await wallet.sign(`${stamp}-${wallet.address}`),
      node,
    });

    expect(user.did).toBe(wallet.address);
    expect(user.fullName).toBe('name1');
    expect(user.role).toBe('admin');

    node.getAccessKey = () =>
      Promise.resolve({
        accessKeyPublic: wallet.publicKey,
        authType: 'signature',
        passport: 'admin',
      });

    const user2 = await authWithAccessKeySignature({
      keyId: wallet.address,
      stamp,
      signature: await wallet.sign(`${stamp}-${wallet.address}`),
      node,
    });

    expect(user2.did).toBe(wallet.address);
    expect(user2.fullName).toBe(wallet.address);
    expect(user2.role).toBe('admin');

    node.getAccessKey = () => {
      return Promise.resolve({
        accessKeyPublic: wallet.publicKey,
        authType: 'signature',
        passport: 'admin',
        remark: 'name1',
      });
    };

    // invalid sign
    await expect(
      authWithAccessKeySignature({
        keyId: wallet.address,
        stamp,
        signature: await wallet.sign('invalid signature'),
        node,
      })
    ).rejects.toThrow('verify failed');

    // no access key id
    node.getAccessKey = () => Promise.reject(new Error('does not exist'));
    expect(
      authWithAccessKeySignature({
        keyId: wallet.address,
        stamp,
        signature: await wallet.sign(`${stamp}-${wallet.address}`),
        node,
      })
    ).rejects.toThrow('does not exist');
  });

  test('should auth with access key from node', async () => {
    const stamp = Date.now();

    // blocklet 可能找不到
    node.getBlocklet = () => Promise.resolve(null);
    node.getAccessKey = () =>
      Promise.resolve({
        accessKeyPublic: wallet.publicKey,
        authType: 'signature',
        passport: 'admin',
        remark: 'name1',
      });

    const user = await authWithAccessKeySignature({
      keyId: wallet.address,
      stamp,
      signature: await wallet.sign(`${stamp}-${wallet.address}`),
      node,
    });

    expect(user.did).toBe(wallet.address);
    expect(user.fullName).toBe('name1');
    expect(user.role).toBe('admin');
  });
});

describe('parseUserByDecodedJwtToken', () => {
  test('should throw if did not exist', () => {
    expect(parseUserByDecodedJwtToken()).rejects.toThrow('invalid did');
    expect(parseUserByDecodedJwtToken({})).rejects.toThrow('invalid did');
    expect(parseUserByDecodedJwtToken({ data: {} })).rejects.toThrow('invalid did');
  });

  test('should parse owner nft', async () => {
    const user = await parseUserByDecodedJwtToken({ data: { type: 'ownership_nft', did: 'did1', role: 'role1' } });
    expect(user).toEqual({ did: 'did1', role: 'role1', elevated: true });
  });

  test('should parse blocklet user', async () => {
    const user1 = await parseUserByDecodedJwtToken({
      data: { type: 'blocklet_user', did: 'user1', blockletDid: 'dida', role: 'owner', elevated: true },
    });
    expect(user1).toEqual({ did: 'user1', blockletDid: 'dida', role: 'blocklet-owner', elevated: true });

    const user2 = await parseUserByDecodedJwtToken({
      data: { type: 'blocklet_user', did: 'user1', blockletDid: 'dida', role: 'admin', elevated: false },
    });
    expect(user2).toEqual({ did: 'user1', blockletDid: 'dida', role: 'blocklet-admin', elevated: false });
  });

  test('should parse blocklet user', async () => {
    const user1 = await parseUserByDecodedJwtToken({
      data: { type: 'blocklet_user', did: 'user1', blockletDid: 'dida', role: 'owner' },
    });
    expect(user1).toEqual({ did: 'user1', blockletDid: 'dida', role: 'blocklet-owner', elevated: false });

    const user2 = await parseUserByDecodedJwtToken({
      data: { type: 'blocklet_user', did: 'user1', blockletDid: 'dida', role: 'admin' },
    });
    expect(user2).toEqual({ did: 'user1', blockletDid: 'dida', role: 'blocklet-admin', elevated: false });
  });

  test('should parse blocklet controller (external user)', async () => {
    const user1 = await parseUserByDecodedJwtToken({
      data: { type: 'blocklet_controller', did: 'user1', role: 'owner', controller: { prop: '...' } },
    });
    expect(user1).toEqual({
      did: 'user1',
      role: 'external-blocklet-controller',
      controller: { prop: '...' },
      passports: [{ name: 'external-blocklet-controller', title: 'External' }],
      elevated: true,
    });
  });

  test('should parse user', async () => {
    const node = {
      getNodeUser({ did }) {
        if (did === 'user1') {
          return {
            did: 'user1',
            approved: true,
            fullName: 'Bob',
            otherProps: '...',
          };
        }

        if (did === 'user2') {
          // not approved,
          return {
            did: 'user1',
            fullName: 'Bob',
            otherProps: '...',
          };
        }

        if (did === 'user3') {
          return {
            did: 'user3',
            approved: true,
            passports: [{ id: 'p3', status: 'revoked' }],
          };
        }

        return null;
      },
    };

    const user1 = await parseUserByDecodedJwtToken({
      data: { role: 'member', passport: { id: 'p1' }, did: 'user1' },
      node,
    });

    expect(user1).toEqual({
      did: 'user1',
      role: 'member',
      passportId: 'p1',
      approved: true,
      fullName: 'Bob',
      otherProps: '...',
      elevated: false,
    });

    // not approved
    expect(parseUserByDecodedJwtToken({ data: { did: 'user2' }, node })).rejects.toThrow('user not in whitelist');

    // passport revoked
    expect(parseUserByDecodedJwtToken({ data: { did: 'user3', passport: { id: 'p3' } }, node })).rejects.toThrow(
      'has been revoked'
    );

    // no user
    expect(parseUserByDecodedJwtToken({ data: { did: 'user4' }, node })).rejects.toThrow('user not in whitelist');
  });
});
