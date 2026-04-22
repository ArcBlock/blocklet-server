const { test, expect, describe, mock, beforeEach } = require('bun:test');
const { fromRandom } = require('@ocap/wallet');
const { toBase58 } = require('@ocap/util');
const {
  checkAccessKeySource,
  authBySimpleAccessKey,
  isAccessKey,
  isLoginToken,
} = require('../lib/auth-simple-access-key');

describe('isAccessKey', () => {
  test('should return true if token is access key', () => {
    expect(isAccessKey('blocklet-123')).toBe(true);
    expect(isAccessKey('blocklet-123.456.789')).toBe(false);
    expect(isAccessKey('123.456.789')).toBe(false);
    expect(isAccessKey('')).toBe(false);
  });
});

describe('isLoginToken', () => {
  test('should return true if token is login token', () => {
    expect(isLoginToken('123.456.789')).toBe(true);
    expect(isLoginToken('blocklet-123')).toBe(false);
    expect(isLoginToken('')).toBe(false);
  });
});

describe('checkAccessKeySource', () => {
  const node = {
    getAccessKey: mock(),
  };
  const info = {
    did: 'did:abt:node1',
  };
  const keyId = 'test-key-id';

  beforeEach(() => {
    mock.clearAllMocks();
  });

  test('should get access key from node did', async () => {
    const mockAccessKey = {
      authType: 'simple',
      passport: 'admin',
    };
    node.getAccessKey.mockResolvedValue(mockAccessKey);

    const result = await checkAccessKeySource({ node, keyId, info });

    expect(result).toEqual({
      teamDid: info.did,
      isFromBlocklet: undefined,
      accessKey: mockAccessKey,
    });
    expect(node.getAccessKey).toHaveBeenCalledWith({
      teamDid: info.did,
      accessKeyId: keyId,
    });
  });

  test('should get access key from blocklet did when node did fails', async () => {
    const mockAccessKey = {
      authType: 'simple',
      passport: 'admin',
    };
    const blockletDid = 'did:abt:blocklet1';

    node.getAccessKey.mockRejectedValueOnce(new Error('not found'));
    node.getAccessKey.mockResolvedValueOnce(mockAccessKey);

    const result = await checkAccessKeySource({
      node,
      keyId,
      info,
      blockletDid,
    });

    expect(result).toEqual({
      teamDid: blockletDid,
      isFromBlocklet: true,
      accessKey: mockAccessKey,
    });
    expect(node.getAccessKey).toHaveBeenCalledTimes(2);
    expect(node.getAccessKey).toHaveBeenNthCalledWith(1, {
      teamDid: info.did,
      accessKeyId: keyId,
    });
    expect(node.getAccessKey).toHaveBeenNthCalledWith(2, {
      teamDid: blockletDid,
      accessKeyId: keyId,
    });
  });

  test('should return null access key when both node and blocklet did fail', async () => {
    const blockletDid = 'did:abt:blocklet1';

    node.getAccessKey.mockRejectedValue(new Error('not found'));

    const result = await checkAccessKeySource({
      node,
      keyId,
      info,
      blockletDid,
    });

    expect(result).toEqual({
      teamDid: blockletDid,
      isFromBlocklet: true,
      accessKey: null,
    });
    expect(node.getAccessKey).toHaveBeenCalledTimes(2);
  });

  test('should return null access key when node did fails and no blocklet did provided', async () => {
    node.getAccessKey.mockRejectedValue(new Error('not found'));

    const result = await checkAccessKeySource({
      node,
      keyId,
      info,
    });

    expect(result).toEqual({
      teamDid: info.did,
      isFromBlocklet: undefined,
      accessKey: null,
    });
    expect(node.getAccessKey).toHaveBeenCalledTimes(1);
  });
});

describe('authBySimpleAccessKey', () => {
  const wallet = fromRandom();
  const node = {
    refreshLastUsed: mock(),
    getAccessKey: mock(),
    verifyAccessKey: mock(),
    getNodeInfo: mock(() => ({
      did: wallet.address,
    })),
  };
  const base58PublicKey = toBase58(wallet.publicKey);
  const validToken = `blocklet-${base58PublicKey}`;

  beforeEach(() => {
    mock.clearAllMocks();
  });

  test('should auth with simple access key', async () => {
    node.getAccessKey.mockResolvedValue({
      authType: 'simple',
      passport: 'admin',
      remark: 'name1',
      createdBy: wallet.address,
      expireAt: new Date(Date.now() + 86400000).toISOString(),
    });

    const user = await authBySimpleAccessKey(validToken, node);

    expect(user.did).toBe(wallet.address);
    expect(user.role).toBe('admin');
    expect(user.fullName).toBe('name1');
    expect(user.elevated).toBe(true);

    node.getAccessKey.mockResolvedValue({
      authType: 'simple',
      passport: 'admin',
      createdBy: wallet.address,
      expireAt: new Date(Date.now() + 86400000).toISOString(),
    });

    const user2 = await authBySimpleAccessKey(validToken, node);
    expect(user2.fullName).toBe(wallet.address);
    await expect(authBySimpleAccessKey('invalid-token', node)).rejects.toThrow('Invalid access key secret');

    node.getAccessKey.mockResolvedValue({
      authType: 'simple',
      passport: 'admin',
      createdBy: wallet.address,
      expireAt: new Date(Date.now() - 1000).toISOString(),
    });
    await expect(authBySimpleAccessKey(validToken, node)).rejects.toThrow(/has expired/);

    node.getAccessKey.mockResolvedValue({
      authType: 'signature',
      passport: 'admin',
      createdBy: wallet.address,
    });
    await expect(authBySimpleAccessKey(validToken, node)).rejects.toThrow(/is not a simple type/);

    node.getAccessKey.mockResolvedValue({
      authType: 'simple',
      passport: 'admin',
    });
    await expect(authBySimpleAccessKey(validToken, node)).rejects.toThrow(/is not created by a user/);
  });

  test('should auth with blocklet did', async () => {
    const blockletDid = 'z1234567890';
    node.getAccessKey.mockImplementation(({ teamDid }) => {
      if (teamDid === blockletDid) {
        return Promise.resolve({
          authType: 'simple',
          passport: 'admin',
          remark: 'name1',
          createdBy: wallet.address,
        });
      }

      return Promise.reject(new Error('not found'));
    });

    const token = `blocklet-${toBase58(wallet.publicKey)}`;
    const user = await authBySimpleAccessKey(token, node, blockletDid);

    expect(user.did).toBe(wallet.address);
    expect(user.role).toBe('blocklet-admin');
    expect(user.blockletDid).toBe(blockletDid);
  });
});
