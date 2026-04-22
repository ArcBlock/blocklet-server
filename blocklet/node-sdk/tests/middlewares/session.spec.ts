// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect, beforeEach, afterEach, mock, Mock, afterAll } from 'bun:test';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Request as ExpressRequest, Response, NextFunction } from 'express';
import { LOGIN_PROVIDER } from '@blocklet/constant';
import { verify as verifyJwt } from '@arcblock/jwt';
import JWT from 'jsonwebtoken';
import { sessionMiddleware } from '../../src/middlewares/session';
import * as verifySignUtil from '../../src/util/verify-sign';
import { getWallet } from '../../src/wallet';
import { authMiddleware as auth } from '../../src/middlewares/auth';
import { SessionUser } from '../../src/util/login';

type Request = ExpressRequest & {
  user?: SessionUser;
};

const mockVerifyJwt = mock();
(mockVerifyJwt as any).verify = mock(() => true);
mock.module('@arcblock/jwt', () => {
  return {
    _esModule: true,
    default: mockVerifyJwt,
    verify: (mockVerifyJwt as any).verify,
  };
});
mock.module('jsonwebtoken', () => {
  return {
    _esModule: true,
    default: {
      verify: mock(() => true),
    },
  };
});
mock.module('../../src/util/verify-sign', () => {
  return {
    _esModule: true,
    verify: mock(() => true),
    getVerifyData: mock(() => true),
  };
});
mock.module('../../src/wallet', () => {
  return {
    _esModule: true,
    getWallet: mock(() => ({ secretKey: 'secret', address: 'address' })),
  };
});

const mockAuthMiddleware = mock();
(mockAuthMiddleware as any).getServiceClient = mock();
mock.module('../../src/middlewares/auth', () => {
  return {
    _esModule: true,
    authMiddleware: mockAuthMiddleware,
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

describe('middleware/session', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mockWallet: { secretKey: string; address: string };

  beforeEach(() => {
    req = {
      cookies: {},
      headers: {},
      get: mock(),
      query: {},
      body: {},
    };
    res = {
      status: mock().mockReturnThis(),
      json: mock(),
    };
    next = mock();
    mockWallet = { secretKey: 'secret', address: 'address' };
    (getWallet as any).mockReturnValue(mockWallet);
    mock.clearAllMocks();
  });

  afterEach(() => {
    mock.clearAllMocks();
  });

  test('should call next() if no login_token is present', async () => {
    const middleware = sessionMiddleware();
    await middleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  test('should set user and call next() if login token is valid', async () => {
    req.cookies = { login_token: 'test.token.valid' };
    (JWT.verify as Mock<any>).mockImplementation(
      (token: string, secret: string, callback: (err: Error | null, decoded: any) => void) => {
        callback(null, {
          did: 'user_did',
          role: 'user_role',
          fullName: 'John Doe',
          provider: LOGIN_PROVIDER.WALLET,
          walletOS: 'iOS',
          kyc: 1,
        });
      }
    );

    const middleware = sessionMiddleware();
    await middleware(req as Request, res as Response, next);

    expect((req as any).user).toEqual({
      did: 'user_did',
      role: 'user_role',
      fullName: 'John Doe',
      provider: LOGIN_PROVIDER.WALLET,
      walletOS: 'iOS',
      emailVerified: true,
      phoneVerified: false,
      method: 'loginToken',
    });
    expect(next).toHaveBeenCalled();
  });

  test('should return 401 if login token verification fails', async () => {
    req.cookies = { login_token: 'test.token.invalid' };
    (JWT.verify as Mock<any>).mockImplementation(
      (token: string, secret: string, callback: (err: Error | null, decoded: any) => void) => {
        callback(new Error('Invalid token'), null);
      }
    );

    const middleware = sessionMiddleware({ strictMode: true });
    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Invalid login token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next() if login token verification fails and strictMode is false', async () => {
    req.cookies = { login_token: 'invalid_token' };
    (JWT.verify as Mock<any>).mockImplementation(
      (token: string, secret: string, callback: (err: Error | null, decoded: any) => void) => {
        callback(new Error('Invalid token'), null);
      }
    );

    const middleware = sessionMiddleware();
    await middleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  test('should set user and call next() if component call is valid', async () => {
    req.get = mock().mockImplementation((header) => {
      if (header === 'x-component-sig') return 'valid_signature';
      if (header === 'x-component-did') return 'component_did';
      return null;
    });
    (verifySignUtil.verify as Mock<any>).mockResolvedValue(true);
    (verifySignUtil.getVerifyData as Mock<any>).mockReturnValue({
      sig: 'valid_signature',
      data: {},
    });

    const middleware = sessionMiddleware({ componentCall: true });
    await middleware(req as Request, res as Response, next);

    expect((req as any).user).toEqual({
      did: 'component_did',
      role: 'component',
      provider: 'wallet',
      fullName: 'component_did',
      walletOS: 'embed',
      emailVerified: false,
      phoneVerified: false,
      method: 'componentCall',
    });
    expect(next).toHaveBeenCalled();
  });

  test('should return 401 if component call signature is invalid', async () => {
    req.get = mock().mockReturnValue('invalid_signature');
    (verifySignUtil.verify as Mock<any>).mockResolvedValue(false);

    const middleware = sessionMiddleware({ componentCall: true, strictMode: true });
    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Invalid signature' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next() if component call signature is invalid and strictMode is false', async () => {
    req.get = mock().mockReturnValue('invalid_signature');
    (verifySignUtil.verify as Mock<any>).mockResolvedValue(false);

    const middleware = sessionMiddleware({ componentCall: true });
    await middleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  test('should set user and call next() if signed token is valid', async () => {
    req.query = { __jwt: 'valid_token' };
    (verifyJwt as Mock<any>).mockResolvedValue(true);

    const middleware = sessionMiddleware({ signedToken: true });
    await middleware(req as Request, res as Response, next);

    expect((req as any).user).toEqual({
      did: mockWallet.address,
      role: 'component',
      provider: 'wallet',
      fullName: mockWallet.address,
      walletOS: 'embed',
      emailVerified: false,
      phoneVerified: false,
      method: 'signedToken',
    });
    expect(next).toHaveBeenCalled();
  });

  test('should return 401 if signed token is invalid', async () => {
    req.query = { __jwt: 'invalid_token' };
    (verifyJwt as Mock<any>).mockResolvedValue(false);

    const middleware = sessionMiddleware({ signedToken: true, strictMode: true });
    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Invalid signed token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next() if signed token is invalid and strictMode is false', async () => {
    req.query = { __jwt: 'invalid_token' };
    (verifyJwt as Mock<any>).mockResolvedValue(false);

    const middleware = sessionMiddleware({ signedToken: true });
    await middleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  test('should call next() if no authentication method matches', async () => {
    const middleware = sessionMiddleware({ loginToken: false, componentCall: false, signedToken: false });
    await middleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  test('should set user and call next() if access key is valid', async () => {
    req.headers = { authorization: 'Bearer blocklet-access-key' };
    (auth.getServiceClient as Mock<any>).mockReturnValue({
      verifyAccessKey: mock().mockResolvedValue({
        data: {
          createdBy: 'user-did',
          accessKeyId: 'z-access-key-id',
          remark: 'test',
          passport: 'blocklet-guest',
        },
      }),
    });

    const middleware = sessionMiddleware({ accessKey: true });
    await middleware(req as Request, res as Response, next);

    expect((req as any).user).toEqual({
      did: 'user-did',
      accessKeyId: 'z-access-key-id',
      role: 'guest',
      fullName: 'test',
      provider: 'accessKey',
      walletOS: 'embed',
      method: 'accessKey',
    });
    expect(next).toHaveBeenCalled();
  });
});
