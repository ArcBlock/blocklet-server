/* eslint-disable global-require */
// eslint-disable-next-line import/no-extraneous-dependencies
import { Request } from 'express';
import { describe, test, expect, mock, afterAll } from 'bun:test';
import { userMiddleware as user } from '../../src/middlewares/user';

mock.module('@arcblock/ws', () => {
  const mockChannel = {
    join: mock(() => mockChannel),
    receive: mock(() => mockChannel),
    on: mock(() => mockChannel),
    leave: mock(() => mockChannel),
    push: mock(() => mockChannel),
  };

  const WsClient = mock(() => ({
    connect: mock(async () => {}),
    on: mock(() => {}),
    off: mock(() => {}),
    emit: mock(() => {}),
    channel: mock(() => mockChannel),
    close: mock(() => {}),
  }));

  return {
    WsClient,
    // WsServer,
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

describe('middleware/user', () => {
  test('should fill req.user', (done) => {
    const middleware = user();
    const req = {
      headers: {
        'x-user-did': 'did1',
        'x-user-role': 'admin',
        'x-user-fullname': encodeURIComponent('%'),
        'x-user-kyc': '1',
      },
    } as unknown as Request & { user?: any };
    middleware(req, null, () => {
      expect((req as $TSFixMe).user).toEqual({
        did: 'did1',
        role: 'admin',
        fullName: '%',
        emailVerified: true,
        phoneVerified: false,
      });
      done();
    });
  });
  test('should not fill req.user', (done) => {
    const middleware = user();
    const req = {
      headers: {},
    } as unknown as Request & { user?: any };
    middleware(req, null, () => {
      expect((req as $TSFixMe).user).toBeFalsy();
      done();
    });
  });
});
