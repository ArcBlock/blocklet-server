const { test, expect, describe, mock, beforeEach } = require('bun:test');
const { CustomError } = require('@blocklet/error');
const { getUserPublicInfo } = require('../../lib/util/user-info');

describe('getUserPublicInfo', () => {
  // Mock 外部依赖
  mock('../../lib/util/federated', () => ({
    getUserAvatarUrl: mock((avatar, blocklet) => `${blocklet.prefix}${avatar}`),
  }));

  let mockReq;
  let mockNode;

  beforeEach(() => {
    mock.restore();

    mockReq = {
      query: { did: 'did:abt:z1hs52JdwNgEYcZJ3VGeGwzFw7FaMqQGvqh' },
      user: { did: 'did:abt:z1hs52JdwNgEYcZJ3VGeGwzFw7FaMqQGvqh' },
      blocklet: { prefix: 'http://localhost:3000' },
    };

    mockNode = {
      getNodeInfo: mock(() =>
        Promise.resolve({
          did: 'did:abt:z1hs52JdwNgEYcZJ3VGeGwzFw6FaMqQGvqm',
          routing: { adminPath: '/admin' },
        })
      ),
      getUser: mock(() => ({
        did: 'did:abt:z1hs52JdwNgEYcZJ3VGeGwzFw7FaMqQGvqh',
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        address: 'Test Address',
        avatar: 'avatar://test-avatar.jpg',
        approved: true,
        sourceAppPid: 'app123',
        createdAt: '2023-01-01T00:00:00Z',
        metadata: { phone: '1234567890', extra: 'data' },
      })),
    };
  });

  test('should return user public info successfully', async () => {
    const result = await getUserPublicInfo({
      req: mockReq,
      teamDid: 'did:abt:z1hs52JdwNgEYcZJ3VGeGwzFw6FaMqQGvqm',
      node: mockNode,
    });

    expect(mockNode.getUser).toHaveBeenCalledWith({
      teamDid: 'did:abt:z1hs52JdwNgEYcZJ3VGeGwzFw6FaMqQGvqm',
      user: { did: 'did:abt:z1hs52JdwNgEYcZJ3VGeGwzFw7FaMqQGvqh' },
    });
    expect(result).toBeDefined();
  });

  test('should throw error for invalid DID', async () => {
    mockReq.query.did = 'invalid-did';

    await expect(
      getUserPublicInfo({
        req: mockReq,
        teamDid: 'did:abt:z1hs52JdwNgEYcZJ3VGeGwzFw6FaMqQGvqm',
        node: mockNode,
      })
    ).rejects.toThrow();
  });

  test('should throw error when teamDid is missing', async () => {
    mockNode.getNodeInfo.mockResolvedValue({ did: null });

    await expect(
      getUserPublicInfo({
        req: mockReq,
        teamDid: null,
        node: mockNode,
      })
    ).rejects.toThrow(new CustomError(400, 'teamDid is required'));
  });

  test('should return null for unapproved user', async () => {
    mockNode.getUser.mockResolvedValue({
      did: 'did:abt:z1hs52JdwNgEYcZJ3VGeGwzFw7FaMqQGvqh',
      approved: false,
    });

    const result = await getUserPublicInfo({
      req: mockReq,
      teamDid: 'did:abt:z1hs52JdwNgEYcZJ3VGeGwzFw6FaMqQGvqm',
      node: mockNode,
    });

    expect(result).toBeNull();
  });

  test('should return null for non-existent user', async () => {
    mockNode.getUser.mockResolvedValue(null);

    const result = await getUserPublicInfo({
      req: mockReq,
      teamDid: 'did:abt:z1hs52JdwNgEYcZJ3VGeGwzFw6FaMqQGvqm',
      node: mockNode,
    });

    expect(result).toBeNull();
  });

  test('should hide sensitive info for non-owner', async () => {
    mockReq.user = { did: 'did:abt:z1hs52JdwNgEYcZJ3VGeGwzFw6FaMqQG123' }; // 不是本人

    const result = await getUserPublicInfo({
      req: mockReq,
      teamDid: 'did:abt:z1hs52JdwNgEYcZJ3VGeGwzFw6FaMqQGvqm',
      node: mockNode,
    });

    // 验证返回结果中不包含敏感信息
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('phone');
    expect(result).not.toHaveProperty('address');
    expect(result.metadata).not.toHaveProperty('phone');
  });

  test('should get teamDid from node info when not provided', async () => {
    await getUserPublicInfo({
      req: mockReq,
      teamDid: null,
      node: mockNode,
    });

    expect(mockNode.getNodeInfo).toHaveBeenCalledWith({ useCache: true });
    expect(mockNode.getUser).toHaveBeenCalledWith({
      teamDid: 'did:abt:z1hs52JdwNgEYcZJ3VGeGwzFw6FaMqQGvqm',
      user: { did: 'did:abt:z1hs52JdwNgEYcZJ3VGeGwzFw7FaMqQGvqh' },
    });
  });
});
