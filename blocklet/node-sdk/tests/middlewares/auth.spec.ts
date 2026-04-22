/* eslint-disable global-require */
// eslint-disable-next-line max-classes-per-file, import/no-extraneous-dependencies
import { Request, Response } from 'express';
import { describe, test, expect, afterAll, mock } from 'bun:test';
import { authMiddleware as auth } from '../../src/middlewares/auth';

describe('middleware/auth', () => {
  const OLD_ENV = process.env;

  const props = [
    ['BLOCKLET_APP_ID', 'zNKe4EwPHu2Sz1y69NFerD7UEGDc7YHQSx2T'],
    ['BLOCKLET_APP_NAME', 'a'],
    ['BLOCKLET_APP_DESCRIPTION', 'b'],
    [
      'BLOCKLET_APP_SK',
      '0xb041c3e453af05466411b7cc4e87e14d16300874447f424f4d6c4eb55bb3900d1a75984f7dae4c9bbeb1f4f47eac6ca639dd8c94c5d93785fd0f6465d558b654',
    ],
    ['BLOCKLET_DID', 'did1'],
    ['ABT_NODE', '1.1.0'],
    ['ABT_NODE_DID', 'did2'],
    ['ABT_NODE_PK', 'pk'],
    ['ABT_NODE_PORT', '2000'],
    ['ABT_NODE_SERVICE_PORT', '2001'],
  ];

  props.forEach((x) => {
    // eslint-disable-next-line prefer-destructuring
    process.env[x[0]] = x[1];
  });

  class MockClient {
    getPermissionsByRole() {
      return {
        code: 'ok',
        permissions: [{ name: 'query_blocklets' }],
      };
    }
  }

  const getClient = () => new MockClient();

  const req = {
    headers: {
      'x-user-did': 'did1',
      'x-user-role': 'admin',
      fullface: encodeURIComponent('%'),
    },
  } as unknown as Request & { user?: any };

  const guestReq = {
    headers: {
      'x-user-did': 'did1',
      'x-user-role': 'guest',
      'x-user-fullname': encodeURIComponent('%'),
    },
  } as unknown as Request & { user?: any };

  const kycReq = {
    headers: {
      'x-user-did': 'did1',
      'x-user-role': 'guest',
      'x-user-fullname': encodeURIComponent('%'),
      'x-user-kyc': '1',
    },
  } as unknown as Request & { user?: any };

  afterAll(() => {
    process.env = OLD_ENV;
    mock.restore();
  });
  test('should pass if has id and no need to check permission', (done) => {
    const middleware = auth();
    middleware(req as any, null, () => {
      done();
    });
  });
  test('should not pass if auth failed', (done) => {
    const middleware = auth();
    const res = {
      status(code: number) {
        (this as any).code = code;
        return this;
      },
      json(data: any) {
        expect((this as any).code).toBe(401);
        expect(data.error).toBe('not authorized');
        done();
      },
    } as unknown as Response;
    middleware(
      {
        headers: {},
      } as any,
      res,
      () => 0
    );
  });
  test('should pass if user role is accessible', (done) => {
    const middleware = auth({ roles: ['admin', 'owner'] });
    middleware(req as any, null, () => {
      done();
    });
  });
  test('should not pass if user role is not accessible', (done) => {
    const middleware = auth({ roles: ['admin', 'owner'] });
    const res = {
      status(code: number) {
        (this as any).code = code;
        return this;
      },
      json(data: any) {
        expect((this as any).code).toBe(403);
        expect(data.error).toBe('no permission');
        done();
      },
    } as unknown as Response;
    middleware(guestReq, res, () => 0);
  });

  test('should pass if resource action is accessible', (done) => {
    const middleware = auth({ permissions: ['query_blocklets'], getClient });
    middleware(req, null, () => {
      done();
    });
  });
  test('should use cache if role is not change when check resource accessibility', (done) => {
    class InvalidAuthClient {}
    // if not use cache, auth will failed because we use an InvalidAuthClient
    const middleware = auth({ permissions: ['query_blocklets'], getClient: () => new InvalidAuthClient() });
    middleware(req, null, () => {
      done();
    });
  });
  test('should not pass if resource action is not accessible', (done) => {
    const middleware = auth({ permissions: ['mutate_blocklets'], getClient });
    const res = {
      status(code: number) {
        (this as any).code = code;
        return this;
      },
      json(data: any) {
        expect((this as any).code).toBe(403);
        expect(data.error).toBe('no permission');
        done();
      },
    } as unknown as Response;
    middleware(guestReq, res, () => 0);
  });
  test('should throw error if params is incorrect', () => {
    // @ts-ignore
    expect(() => auth({ roles: 'string' })).toThrow();
    // @ts-ignore
    expect(() => auth({ permissions: 'string' })).toThrow();
  });

  test('should not pass if user kyc is not accessible', (done) => {
    const middleware = auth({ kyc: ['email', 'phone'] });
    const res = {
      status(code: number) {
        (this as any).code = code;
        return this;
      },
      json(data: any) {
        expect((this as any).code).toBe(403);
        expect(data.error).toBe('kyc required');
        done();
      },
    } as unknown as Response;
    middleware(kycReq, res, () => 0);
  });

  test('should pass if user kyc is accessible', (done) => {
    const middleware = auth({ kyc: ['email'] });
    middleware(kycReq, null, () => {
      done();
    });
  });

  test('should throw if kyc is not an array', () => {
    // @ts-ignore
    expect(() => auth({ kyc: 'email' })).toThrow(/kyc must be array/);
  });
});
