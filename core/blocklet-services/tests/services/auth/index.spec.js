const { test, describe, expect, beforeAll, spyOn, mock, beforeEach, afterAll } = require('bun:test');
const path = require('path');
const os = require('os');
const { init } = require('../../../api/services/auth');
const { sessionCacheDisabledUser } = require('../../../api/cache');
const initJwt = require('../../../api/libs/jwt');
const attachSharedUtils = require('../../../api/util/attach-shared-utils');

describe('auth service', () => {
  let service;
  let createSessionToken;
  let token;
  const sessionTokenKey = 'login_token';
  const node = {
    getUserByDid: () => {},
    isPassportValid: () => {},
    getRBAC: () => {},
    getRole: () => {},
  };

  beforeAll(async () => {
    const options = {
      sessionSecret: 'abc',
      sessionTokenKey: 'login_token',
      dataDir: path.join(os.tmpdir(), Math.random().toString()),
    };

    createSessionToken = initJwt(node, options).createSessionToken;
    service = init({ node, options });

    token = await createSessionToken('did1', {
      secret: options.sessionSecret,
      role: 'admin',
      passport: { id: '123', name: 'admin' },
    });
  });

  test('should be function', () => {
    expect(typeof service.middlewares.sessionBearerToken).toBe('function');
    expect(typeof service.middlewares.refreshBearerToken).toBe('function');
    expect(typeof service.middlewares.userInfo).toBe('function');
    expect(typeof service.middlewares.checkAuth).toBe('function');
    expect(typeof service.middlewares.checkKyc).toBe('function');
    expect(typeof service.middlewares.ensureWsAuth).toBe('function');
  });

  test('bearerToken', (done) => {
    const req = {
      headers: {
        cookie: `${sessionTokenKey}=${token}`,
      },
    };
    const res = { locals: {} };
    const next = () => {
      expect(req.token).toBe(token);
      done();
    };
    service.middlewares.sessionBearerToken(req, res, next);
  });

  test('userInfo', async () => {
    // mock: disable cache for user did in token
    await sessionCacheDisabledUser.set('did1', {});

    const getUser = spyOn(node, 'getUserByDid');
    const isPassportValid = spyOn(node, 'isPassportValid');
    const req = {
      token,
      headers: {},
    };
    attachSharedUtils({ node, req, options: {} });

    req.getBlocklet = () => ({ appPid: 'xxx', appId: 'xxx' });
    req.getBlockletDid = () => 'xxx';
    req.getBlockletInfo = () => ({ secret: 'abc' });
    req.getUserOrg = () => '';

    getUser.mockImplementation(() => ({ approved: true, key: 'value' }));
    isPassportValid.mockImplementation(() => true);
    await new Promise((resolve) => {
      service.middlewares.userInfo(req, { locals: {} }, () => {
        resolve(req);
      });
    });

    expect(req.user.role).toBe('admin');
    expect(req.user.approved).toBe(true);
    expect(req.user.key).toBe('value');

    getUser.mockImplementation(() => ({ approved: false }));
    await new Promise((resolve) => {
      service.middlewares.userInfo(req, { locals: {} }, () => {
        resolve(req);
      });
    });

    getUser.mockRestore();
  });

  describe('checkAuth', () => {
    const RES_JSON_404 = { code: 404, error: 'Not Found' };
    let getRBAC;

    beforeAll(() => {
      getRBAC = spyOn(node, 'getRBAC');
    });

    afterAll(() => {
      getRBAC.mockRestore();
    });

    const req = {
      url: '/',
      headers: {},
      user: {},
      getComponent: () => ({}),
      getBlockletDid: () => 'xxx',
      getServiceConfig: () => ({
        blockUnauthenticated: true,
        blockUnauthorized: true,
      }),
      getRoutingRule: () => ({ to: { interfaceName: 'publicUrl' } }),
      accepts: () => 'not html',
      getBlockletComponentId: () => {},
      getUserOrg: () => '',
      getSecurityConfig: () => {
        return {
          accessPolicyConfig: {
            accessPolicy: {
              roles: [],
              reverse: true,
            },
          },
          responseHeaderPolicyConfig: null,
        };
      },
    };

    test('should work as expected', async () => {
      getRBAC.mockImplementation(() => ({ can: () => true, getRoles: () => [] }));
      await new Promise((resolve) => {
        service.middlewares.checkAuth(req, { locals: {} }, () => {
          resolve(req);
        });
      });
    });

    test('no session(req.user)', async () => {
      getRBAC.mockImplementation(() => ({ can: () => false, getRoles: () => [] }));
      await new Promise((resolve) => {
        const req2 = {
          ...req,
          user: null,
        };
        const res = {
          locals: {},
          status: () => res,
          json: (data) => {
            expect(data).toEqual(RES_JSON_404);
            resolve();
          },
        };
        service.middlewares.checkAuth(req2, res);
      });

      // no session: return html

      getRBAC.mockImplementation(() => ({ can: () => false, getRoles: () => [] }));
      await new Promise((resolve) => {
        const req2 = {
          ...req,
          user: null,
          accepts: () => 'html',
        };
        const res = {
          locals: {},
          status: () => res,
          set: () => res,
          redirect: (data) => {
            expect(data).toMatch('/login');
            resolve();
          },
        };
        service.middlewares.checkAuth(req2, res);
      });
    });

    test('no permission', async () => {
      getRBAC.mockImplementation(() => ({ can: () => false, getRoles: () => ['guest', 'member'] }));
      await new Promise((resolve) => {
        const mockReq = {
          ...req,
          getSecurityConfig: () => {
            return {
              accessPolicyConfig: {
                accessPolicy: {
                  roles: ['admin'],
                  reverse: false,
                },
              },
              responseHeaderPolicyConfig: null,
            };
          },
        };
        const res = {
          locals: {},
          status: () => res,
          json: (data) => {
            expect(data).toEqual(RES_JSON_404);
            resolve();
          },
        };
        service.middlewares.checkAuth(mockReq, res);
      });

      // return html

      getRBAC.mockImplementation(() => ({ can: () => false, getRoles: () => [] }));
      await new Promise((resolve) => {
        const mockReq = {
          ...req,
          accepts: () => 'html',
          getSecurityConfig: () => {
            return {
              accessPolicyConfig: {
                accessPolicy: {
                  roles: ['admin'],
                  reverse: false,
                },
              },
              responseHeaderPolicyConfig: null,
            };
          },
        };
        const res = {
          locals: {},
          status: () => res,
          set: () => res,
          redirect: (data) => {
            expect(data).toMatch('/login');
            resolve();
          },
        };
        service.middlewares.checkAuth(mockReq, res);
      });
    });

    test('invited can access', async () => {
      await new Promise((resolve) => {
        const req2 = {
          ...req,
          user: {
            role: 'admin',
          },
          getServiceConfig: () => ({
            whoCanAccess: 'invited',
          }),
        };

        service.middlewares.checkAuth(req2, { locals: {} }, () => {
          resolve(req2);
        });
      });

      await new Promise((resolve) => {
        const req2 = {
          ...req,
          user: {}, // ignore user role, accept all login user
          getServiceConfig: () => ({
            whoCanAccess: 'invited',
          }),
        };

        service.middlewares.checkAuth(req2, { locals: {} }, () => {
          resolve(req2);
        });
      });
    });

    test('owner can access', async () => {
      getRBAC.mockImplementation(() => ({
        getRoles: () => [
          {
            name: 'owner',
            title: 'Owner',
            description: 'Owner',
          },
        ],
      }));

      await new Promise((resolve) => {
        const req2 = {
          ...req,
          user: {
            role: 'owner',
          },
          getSecurityConfig: () => {
            return {
              accessPolicyConfig: {
                accessPolicy: {
                  roles: ['owner'],
                  reverse: false,
                },
              },
              responseHeaderPolicyConfig: null,
            };
          },
        };

        service.middlewares.checkAuth(req2, { locals: {} }, () => {
          resolve(req2);
        });
      });

      await new Promise((resolve) => {
        const mockReq = {
          ...req,
          user: {
            role: 'member',
          },
          getSecurityConfig: () => {
            return {
              accessPolicyConfig: {
                accessPolicy: {
                  roles: ['owner'],
                  reverse: false,
                },
              },
              responseHeaderPolicyConfig: null,
            };
          },
        };
        const res = {
          locals: {},
          status: () => res,
          json: (data) => {
            expect(data).toEqual(RES_JSON_404);
            resolve();
          },
        };

        service.middlewares.checkAuth(mockReq, res);
      });
    });

    test('specific roles can access (no permission check)', async () => {
      getRBAC.mockImplementation(() => ({
        getRoles: () => [
          {
            name: 'owner',
            title: 'Owner',
            description: 'Owner',
          },
          {
            name: 'admin',
            title: 'Admin',
            description: 'Admin',
          },
          {
            name: 'xxxxxx',
            title: 'xxxxxx',
            description: 'xxxxxx',
          },
        ],
      }));
      await new Promise((resolve) => {
        const req2 = {
          ...req,
          user: {
            role: 'admin',
          },
          getSecurityConfig: () => {
            return {
              accessPolicyConfig: {
                accessPolicy: {
                  roles: ['owner', 'admin', 'xxxxxx'],
                  reverse: false,
                },
              },
              responseHeaderPolicyConfig: null,
            };
          },
        };

        service.middlewares.checkAuth(req2, { locals: {} }, () => {
          resolve(req2);
        });
      });

      await new Promise((resolve) => {
        const req2 = {
          ...req,
          user: {
            role: 'member',
          },
          getSecurityConfig: () => {
            return {
              accessPolicyConfig: {
                accessPolicy: {
                  roles: ['owner', 'admin', 'xxxxxx'],
                  reverse: false,
                },
              },
              responseHeaderPolicyConfig: null,
            };
          },
        };
        const res = {
          locals: {},
          status: () => res,
          json: (data) => {
            expect(data).toEqual(RES_JSON_404);
            resolve();
          },
        };

        service.middlewares.checkAuth(req2, res);
      });

      await new Promise((resolve) => {
        const req2 = {
          ...req,
          user: null,
          url: '/api/public/xxxx',
        };

        service.middlewares.checkAuth(req2, { locals: {} }, () => {
          resolve(req2);
        });
      });
    });
  });

  describe('checkKyc', () => {
    const mockReq = {
      headers: {},
      user: { emailVerified: false },
      method: 'GET',
      getComponent: mock(),
      getBlockletComponentId: mock(),
      getBlocklet: mock(),
      getUserOrg: mock(),
      accepts: mock(),
    };

    const mockRes = {
      set: mock().mockReturnThis(),
      redirect: mock(),
      status: mock().mockReturnThis(),
      json: mock(),
      locals: {},
    };

    const mockNext = mock();

    beforeEach(() => {
      mock.clearAllMocks();
    });

    test('should call next if no user', async () => {
      const req = { ...mockReq, user: null };
      await service.middlewares.checkKyc(req, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should call next if component is in development mode', async () => {
      mockReq.getComponent.mockResolvedValue({ mode: 'development' });
      await service.middlewares.checkKyc(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should call next if email KYC is not required', async () => {
      mockReq.getComponent.mockResolvedValue({ mode: 'production' });
      mockReq.getBlocklet.mockResolvedValue({ requiredKyc: [] });
      await service.middlewares.checkKyc(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should call next if email is verified', async () => {
      const req = { ...mockReq, user: { emailVerified: true } };
      mockReq.getComponent.mockResolvedValue({ mode: 'production' });
      mockReq.getBlocklet.mockResolvedValue({ requiredKyc: ['email'] });
      await service.middlewares.checkKyc(req, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should redirect to KYC page if email is not verified and accepts HTML', async () => {
      mockReq.getComponent.mockResolvedValue({ mode: 'production' });
      mockReq.getBlocklet.mockResolvedValue({
        settings: { session: { email: { enabled: true, requireVerified: true } } },
      });
      mockReq.accepts.mockReturnValue('html');
      await service.middlewares.checkKyc(mockReq, mockRes, mockNext);
      expect(mockRes.set).toHaveBeenCalledTimes(3);
      expect(mockRes.redirect).toHaveBeenCalledWith(expect.stringContaining('/.well-known/service/kyc/email'));
    });

    test('should return 403 if email is not verified and accepts JSON', async () => {
      mockReq.getComponent.mockResolvedValue({ mode: 'production' });
      mockReq.getBlocklet.mockResolvedValue({
        settings: { session: { email: { enabled: true, requireVerified: true } } },
      });
      mockReq.accepts.mockReturnValue('json');
      await service.middlewares.checkKyc(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ code: 403, error: 'Forbidden', reason: 'email_not_verified' });
    });

    test('should call next if user is accessKey', async () => {
      const req = { ...mockReq, user: { emailVerified: true, provider: 'accessKey' } };
      mockReq.getComponent.mockResolvedValue({ mode: 'production' });
      mockReq.getBlocklet.mockResolvedValue({ requiredKyc: ['email'] });
      await service.middlewares.checkKyc(req, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  test('ensureWsAuth.queryString', async () => {
    const getUser = spyOn(node, 'getUserByDid');
    const isPassportValid = spyOn(node, 'isPassportValid');
    const getRBAC = spyOn(node, 'getRBAC');

    const req = {
      headers: { upgrade: 'websocket' },
      url: `/?token=${token}`,
    };

    attachSharedUtils({ node, req, options: {} });
    req.getBlocklet = () => ({});
    req.getComponent = () => ({});
    req.getUserOrg = () => '';
    req.getBlockletDid = () => 'xxx';
    req.getBlockletInfo = () => ({ secret: 'abc' });
    req.getServiceConfig = () => ({
      blockUnauthenticated: true,
      blockUnauthorized: true,
    });
    req.getRoutingRule = () => ({ to: { interfaceName: 'publicUrl' } });
    req.getBlockletComponentId = () => {};

    getUser.mockImplementation(() => ({ approved: true, key: 'value' }));
    isPassportValid.mockImplementation(() => true);
    getRBAC.mockImplementation(() => ({ can: () => true, getRoles: () => [] }));
    await new Promise((resolve) => {
      service.middlewares.ensureWsAuth(req, {}, {}, () => {
        resolve(req);
      });
    });

    getUser.mockRestore();
    getRBAC.mockRestore();
  });

  test('ensureWsAuth.cookie', async () => {
    const getUser = spyOn(node, 'getUserByDid');
    const isPassportValid = spyOn(node, 'isPassportValid');
    const getRBAC = spyOn(node, 'getRBAC');

    const req = {
      headers: { cookie: `login_token=${token}`, upgrade: 'websocket' },
      url: '/',
    };

    attachSharedUtils({ node, req, options: {} });
    req.getBlocklet = () => ({});
    req.getUserOrg = () => '';
    req.getBlockletDid = () => 'xxx';
    req.getBlockletInfo = () => ({ secret: 'abc' });
    req.getServiceConfig = () => ({
      blockUnauthenticated: true,
      blockUnauthorized: true,
    });
    req.getRoutingRule = () => ({ to: { interfaceName: 'publicUrl' } });
    req.getBlockletComponentId = () => {};

    getUser.mockImplementation(() => ({ approved: true, key: 'value' }));
    isPassportValid.mockImplementation(() => true);
    getRBAC.mockImplementation(() => ({ can: () => true, getRoles: () => [] }));
    await new Promise((resolve) => {
      service.middlewares.ensureWsAuth(req, {}, {}, () => {
        resolve(req);
      });
    });

    // getRBAC.mockImplementation(() => ({ can: () => false }));
    // await new Promise((resolve) => {
    //   const socket = {
    //     write: (text) => {
    //       expect(text).toMatch('404 Not Found');
    //     },
    //     destroy: () => {
    //       resolve(req);
    //     },
    //   };
    //   service.middlewares.ensureWsAuth(req, socket, {});
    // });

    getUser.mockRestore();
    getRBAC.mockRestore();
  });
});
