const { mock, test, beforeEach, describe, expect } = require('bun:test');
const jwt = require('jsonwebtoken');
const proxyToDaemonFn = require('../../api/middlewares/proxy-to-daemon');

describe('proxyToDaemon', () => {
  const mockProxyFn = mock();
  const proxy = {
    safeWeb: mockProxyFn,
  };
  const baseReq = {
    getBlockletDid: () => 'did1',
    getBlocklet: () => ({
      settings: {
        enableSessionHardening: true,
      },
    }),
    user: {
      did: 'user1',
      role: 'member',
    },
  };

  const node = {
    getSessionSecret: () => 'abc',
  };

  const decodeToken = (token) =>
    new Promise((resolve, reject) => {
      jwt.verify(token, node.getSessionSecret(), (err, decoded) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(decoded);
      });
    });

  beforeEach(() => {
    mock.restore();
  });

  test('proxyToDaemon', async () => {
    const req = { ...baseReq, headers: [] };
    const proxyToDaemon = proxyToDaemonFn({ node, proxy });
    await proxyToDaemon(req, {});
    expect(req.headers.authorization).toBeTruthy();
    expect(mockProxyFn.mock.calls.length).toBe(1);
    const decoded = await decodeToken(req.headers.authorization.replace('Bearer ', ''));
    expect(decoded.type).toBe('blocklet_user');
    expect(decoded.did).toBe('user1');
    expect(decoded.blockletDid).toBe(req.getBlockletDid());
    expect(decoded.role).toBe('member');

    // should use cache
    await proxyToDaemon(req, {});
    expect(req.headers.authorization).toBeTruthy();
    expect(mockProxyFn.mock.calls.length).toBe(2);
  });
});
