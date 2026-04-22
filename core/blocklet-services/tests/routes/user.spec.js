const { describe, test, mock, expect, beforeEach, afterAll } = require('bun:test');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('supertest');
const { getStatusFromError, formatError } = require('@blocklet/error');

const authOriginalModule = request('@abtnode/auth/lib/auth');
const didExtOriginalModule = request('@arcblock/did-ext');
const userOriginalModule = request('@abtnode/util/lib/user');

require('express-async-errors');

const did = 'z1hpgQbjSQrfvypEQdWs24GeBV7QFaoYd45';
const pk = 'zHn8s5apyaQdueKVT5F44rPyZDVrNyqQXsgZZhZViQWKq';
const did2 = 'z2qaL9mF75qcEiGEhcLZZLo5nGj8ECSeYSknZ';
const pk2 = 'z7bwaUHVMEwMW3WJWjPUczUTUAvaPeGt31aA79GNmsnPU';

mock.module('../../api/middlewares/verify-sig', () => {
  const stub = async (_req, _res, next) => {
    await Promise.resolve(); // 模拟异步操作
    next();
  };
  return Object.assign(stub, {
    __esModule: true,
    default: stub,
  });
});
mock.module('../../api/middlewares/check-user', () => {
  const stub = (req, res, next) => {
    req.user = { did };
    next();
  };
  return Object.assign(stub, {
    __esModule: true,
    default: stub,
  });
});
mock.module('../../api/middlewares/ensure-blocklet', () => {
  const stub = () => (req, res, next) => {
    req.blocklet = { appPid: 'abcdef', settings: { userSpaceHosts: {} } };
    next();
  };
  return Object.assign(stub, {
    __esModule: true,
    default: stub,
  });
});
mock.module('@blocklet/xss', () => {
  return {
    xss: () => (req, res, next) => {
      next();
    },
  };
});
mock.module('@abtnode/util/lib/user', () => {
  return {
    __esModule: true,
    ...userOriginalModule,
    getAvatarByUrl(str) {
      return str;
    },
    extractUserAvatar(str) {
      return str;
    },
  };
});

mock.module('../../api/libs/jwt', () => {
  const stub = () => {
    return {
      createSessionToken() {
        return 'token';
      },
    };
  };
  return Object.assign(stub, {
    __esModule: true,
    default: stub,
  });
});

mock.module('@abtnode/auth/lib/auth', () => {
  return {
    __esModule: true,
    ...authOriginalModule,
    getApplicationInfo() {
      return { dataDir: '' };
    },
  };
});

mock.module('@arcblock/did-ext', () => {
  return {
    __esModule: true,
    ...didExtOriginalModule,
    fromAppDid() {
      return { publicKey: pk, address: did };
    },
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { init } = require('../../api/routes/user');

const server = express();
server.use(bodyParser.json());
server.use((req, res, next) => {
  req.getBlockletInfo = () => {
    return {
      did: 'abcdef',
      wallet: {},
      secret: 'abcdefghijk',
    };
  };
  req.getNodeInfo = () => {
    return {};
  };
  req.getBlocklet = () => false;
  req.getUserOrg = () => '';

  next();
});

const mockUser = {
  did,
  pk,
  approved: true,
  fullName: 'ArcBot',
  email: 'ArcBot@arcblock.io',
  locale: 'en',
  avatar: 'avatar-url',
  metadata: {
    bio: 'Test bio',
    timezone: 'Asia/Shanghai',
  },
  emailVerified: true,
};

const mockNode = {
  createAuditLog: () => {},
  upsertUserSession: () => ({}),
  syncUserSession: () => ({}),
  getUser: ({ user }) => {
    if (user.did === did2) {
      return {
        approved: true,
        did: pk2,
        pk: did2,
      };
    }
    return mockUser;
  },
  loginUser() {
    const exist = true;
    const updated = {};
    return { ...updated, _action: exist ? 'update' : 'add' };
  },
  updateUser({ user }) {
    return {
      ...mockUser,
      ...user,
    };
  },
  updateUserInfoAndSync({ user }) {
    return {
      ...mockUser,
      ...user,
    };
  },
  followUser: mock().mockResolvedValue({ success: true, following: true }),
  unfollowUser: mock().mockResolvedValue({ success: true, following: false }),
  checkFollowing: mock().mockResolvedValue({}),
};

init(server, mockNode, {});

// eslint-disable-next-line no-unused-vars
server.use((err, req, res, next) => {
  res.status(getStatusFromError(err)).send(formatError(err));
});

describe('should user api work as expected', () => {
  test('normal wallet user data', async () => {
    const res = await request(server)
      .post('/.well-known/service/api/user/login')
      .set('x-blocklet-component-id', 'abc/def')
      .send({
        provider: 'wallet',
        did,
        pk,
        avatar: 'abcdefghijkl',
        email: 'ArcBot@arcblock.io',
        fullName: 'ArcBot',
      });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      user: { _action: 'update', locale: 'en' },
      token: 'token',
      refreshToken: 'token',
      visitorId: '',
    });
  });
  test('error did', async () => {
    const res = await request(server)
      .post('/.well-known/service/api/user/login')
      .set('x-blocklet-component-id', 'abc/def')
      .send({
        provider: 'wallet',
        did: 'error-did',
        pk,
        avatar: 'abcdefghijkl',
        email: 'ArcBot@arcblock.io',
        fullName: 'ArcBot',
      });
    expect(res.status).toBe(400);
    expect(res.text).toEqual('Expect "did" to be valid did');
  });
  test('error pk', async () => {
    const res = await request(server)
      .post('/.well-known/service/api/user/login')
      .set('x-blocklet-component-id', 'abc/def')
      .send({
        provider: 'wallet',
        did: did2,
        pk: pk2,
        avatar: 'abcdefghijkl',
        email: 'ArcBot@arcblock.io',
        fullName: 'ArcBot',
      });
    expect(res.status).toBe(400);
    expect(res.text).toEqual('Login user info is invalid');
  });
  test('error x-blocklet-component-id', async () => {
    const res = await request(server).post('/.well-known/service/api/user/login').send({
      provider: 'wallet',
      did: 'error-did',
      pk,
      avatar: 'abcdefghijkl',
      email: 'ArcBot@arcblock.io',
      fullName: 'ArcBot',
    });
    expect(res.status).toBe(400);
    expect(res.text).toEqual('componentId is required when login user');
  });
  test('error with locale zh', async () => {
    const res = await request(server).post('/.well-known/service/api/user/login').send({
      provider: 'wallet',
      did: 'error-did',
      pk,
      avatar: 'abcdefghijkl',
      email: 'ArcBot@arcblock.io',
      fullName: 'ArcBot',
      locale: 'zh',
    });
    expect(res.status).toBe(400);
    expect(res.text).toEqual('缺少登录参数: componentId');
  });
  test('empty user pk', async () => {
    const res = await request(server)
      .post('/.well-known/service/api/user/login')
      .set('x-blocklet-component-id', 'abc/def')
      .send({
        provider: 'wallet',
        did,
        pk: '',
        avatar: 'abcdefghijkl',
        email: 'ArcBot@arcblock.io',
        fullName: 'ArcBot',
      });
    expect(res.status).toBe(400);
    expect(res.text).toEqual('"pk" is not allowed to be empty');
  });

  test('empty id (auth0)', async () => {
    const res = await request(server)
      .post('/.well-known/service/api/user/login')
      .set('x-blocklet-component-id', 'abc/def')
      .send({
        provider: 'auth0',
        did,
        pk,
        avatar: 'abcdefghijkl',
        email: 'ArcBot@arcblock.io',
        fullName: 'ArcBot',
      });
    expect(res.status).toBe(400);
    expect(res.text).toEqual('"id" is required');
  });

  test('normal auth0 user data', async () => {
    const res = await request(server)
      .post('/.well-known/service/api/user/login')
      .set('x-blocklet-component-id', 'abc/def')
      .send({
        provider: 'auth0',
        avatar: 'abcdefghijkl',
        email: 'ArcBot@arcblock.io',
        fullName: 'ArcBot',
        id: 'auth0|abcdefghijkl',
      });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      token: 'token',
      refreshToken: 'token',
      visitorId: '',
      user: { _action: 'update', locale: 'en' },
    });
  });

  describe('profile update', () => {
    test('should update user profile successfully', async () => {
      const profileData = {
        locale: 'zh',
        fullName: 'Updated Name',
        email: 'updated@example.com',
        metadata: {
          bio: 'Updated bio',
          timezone: 'UTC+8',
          links: [
            {
              url: 'https://example.com',
              favicon: 'favicon-url',
            },
          ],
          status: {
            label: 'Available',
            value: 'available',
          },
        },
        address: {
          country: 'China',
          province: 'Shanghai',
          city: 'Shanghai',
          postalCode: '200000',
          line1: 'Some detailed address',
          line2: '',
        },
      };

      const res = await request(server).put('/.well-known/service/api/user/profile').send(profileData);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        did,
        locale: 'zh',
        fullName: 'Updated Name',
        email: 'updated@example.com',
        metadata: {
          bio: 'Updated bio',
          timezone: 'UTC+8',
          links: [
            {
              url: 'https://example.com',
              favicon: 'favicon-url',
            },
          ],
          status: {
            label: 'Available',
            value: 'available',
          },
        },
        address: {
          country: 'China',
          province: 'Shanghai',
          city: 'Shanghai',
          postalCode: '200000',
          line1: 'Some detailed address',
          line2: '',
        },
      });
    });

    test('should update partial user profile', async () => {
      const profileData = {
        locale: 'en-US',
        metadata: {
          bio: 'Only bio updated',
        },
      };

      const res = await request(server).put('/.well-known/service/api/user/profile').send(profileData);

      expect(res.status).toBe(200);
      expect(res.body.locale).toBe('en-US');
      expect(res.body.metadata.bio).toBe('Only bio updated');
      // Other fields should remain unchanged
      expect(res.body.did).toBe(did);
    });

    test('should fail with invalid metadata format', async () => {
      const profileData = {
        metadata: {
          links: [
            {
              // Missing required 'url' field
              favicon: 'favicon-url',
            },
          ],
        },
      };

      const res = await request(server).put('/.well-known/service/api/user/profile').send(profileData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('should update email from metadata', async () => {
      const profileData = {
        metadata: {
          email: 'new-email@example.com',
        },
      };

      const res = await request(server).put('/.well-known/service/api/user/profile').send(profileData);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('new-email@example.com');
    });

    test('should update phone from metadata', async () => {
      const profileData = {
        metadata: {
          phone: {
            phoneNumber: '+8612345678901',
            country: 'CN',
          },
        },
      };

      const res = await request(server).put('/.well-known/service/api/user/profile').send(profileData);

      expect(res.status).toBe(200);
      expect(res.body.phone).toBe('+8612345678901');
    });
  });

  describe('follow functionality', () => {
    beforeEach(() => {
      // mock.clearAllMocks();
    });

    test('should follow user successfully', async () => {
      const targetUserDid = did2;
      mockNode.followUser.mockResolvedValue({ success: true, following: true });

      const res = await request(server).post(`/.well-known/service/api/user/follow/${targetUserDid}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, following: true });
      expect(mockNode.followUser).toHaveBeenCalledWith({ teamDid: 'abcdef', userDid: targetUserDid, followerDid: did });
    });

    test('should not allow user to follow themselves', async () => {
      const res = await request(server).post(`/.well-known/service/api/user/follow/${did}`);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Cannot follow yourself' });
    });

    test('should unfollow user successfully', async () => {
      const targetUserDid = did2;
      mockNode.unfollowUser.mockResolvedValue({ success: true, following: false });

      const res = await request(server).delete(`/.well-known/service/api/user/follow/${targetUserDid}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, following: false });
      expect(mockNode.unfollowUser).toHaveBeenCalledWith({
        teamDid: 'abcdef',
        userDid: targetUserDid,
        followerDid: did,
      });
    });

    test('should not allow user to unfollow themselves', async () => {
      const res = await request(server).delete(`/.well-known/service/api/user/follow/${did}`);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Cannot unfollow yourself' });
    });

    test('should check follow status successfully', async () => {
      const targetUserDid = did2;
      mockNode.checkFollowing.mockResolvedValue({ [targetUserDid]: true });

      const res = await request(server).get(`/.well-known/service/api/user/follow/${targetUserDid}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ isFollowing: true });
      expect(mockNode.checkFollowing).toHaveBeenCalledWith({
        teamDid: 'abcdef',
        userDids: [targetUserDid],
        followerDid: did,
      });
    });

    test('should return 404 when target user does not exist', async () => {
      const nonExistentDid = 'z2nonExistentUserDid123456789';
      mockNode.getUser = mock().mockReturnValue(null);

      const res = await request(server).get(`/.well-known/service/api/user/follow/${nonExistentDid}`);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'User not found' });
    });
  });
});
