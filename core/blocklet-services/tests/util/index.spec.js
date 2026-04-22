const { test, describe, expect } = require('bun:test');
const { ensureProxyUrl, getRedirectUrl, shouldIgnoreUrl } = require('../../api/util');
const { hasAigneRequirement } = require('../../api/util/blocklet-utils');

describe('ensureProxyUrl', () => {
  test('should work as expected', async () => {
    const blockletUrl = 'http://127.0.0.1:1234';
    const originalUrl = '/path/to';

    const req = {
      url: originalUrl,
      headers: {},
      getBlocklet: () => ({
        meta: { interfaces: [{ type: 'web', port: 'BLOCKLET_PORT' }] },
        // ports: { BLOCKLET_PORT: 5678 },
        children: [
          {
            meta: { did: 'did1', interfaces: [{ type: 'web', port: 'BLOCKLET_PORT' }] },
            ports: { BLOCKLET_PORT: 1234 },
          },
        ],
      }),
      getBlockletComponentId: () => 'did1',
    };

    const { target: t1 } = await ensureProxyUrl({ ...req, getBlockletComponentId: () => 'xxx' });
    expect(t1).toEqual(null);
    expect(req.url).toBe(originalUrl);

    const { target: t2 } = await ensureProxyUrl(req);
    expect(t2).toBe(blockletUrl);
    expect(req.url).toBe(originalUrl);

    req.headers['x-routing-rule-path-prefix'] = '/prefix';
    const { target: t3 } = await ensureProxyUrl(req);
    expect(t3).toBe(blockletUrl);
    expect(req.url).toBe(`/prefix${originalUrl}`);
  });
});

describe('getRedirectUrl', () => {
  test('should work as expected', () => {
    // pagePath
    expect(
      getRedirectUrl({
        req: { headers: [], url: '/', getBlockletComponentId: () => {} },
      })
    ).toBe(`/.well-known/service?redirect=${encodeURIComponent('/')}&showQuickConnect=false`);

    expect(
      getRedirectUrl({
        req: { headers: {}, url: '/', getBlockletComponentId: () => {} },
        pagePath: '/start',
      })
    ).toBe(`/.well-known/service/start?redirect=${encodeURIComponent('/')}&showQuickConnect=false`);

    expect(
      getRedirectUrl({
        req: { headers: {}, url: '/prefix', getBlockletComponentId: () => {} },
        pagePath: '/login',
      })
    ).toBe(`/.well-known/service/login?redirect=${encodeURIComponent('/prefix')}&showQuickConnect=false`);

    // locale
    expect(
      getRedirectUrl({
        req: { headers: {}, url: '/prefix?locale=zh', getBlockletComponentId: () => {} },
        pagePath: '/start',
      })
    ).toBe(
      `/.well-known/service/start?redirect=${encodeURIComponent('/prefix?locale=zh')}&showQuickConnect=false&locale=zh`
    );

    // x-path-prefix
    expect(
      getRedirectUrl({
        req: { headers: { 'x-path-prefix': '/absolute-prefix' }, url: '/?locale=zh', getBlockletComponentId: () => {} },
        pagePath: '/start',
      })
    ).toBe(
      `/.well-known/service/start?redirect=${encodeURIComponent('/absolute-prefix/?locale=zh')}&showQuickConnect=false&locale=zh`
    );

    // x-group-path-prefix
    expect(
      getRedirectUrl({
        req: {
          headers: {
            'x-group-path-prefix': '/absolute-prefix',
            'x-path-prefix': '/absolute-prefix/prefix',
          },
          url: '/?locale=zh',
          getBlockletComponentId: () => {},
        },
        pagePath: '/start',
      })
    ).toBe(
      `/absolute-prefix/.well-known/service/start?redirect=${encodeURIComponent(
        '/absolute-prefix/prefix/?locale=zh'
      )}&showQuickConnect=false&locale=zh`
    );

    // __start__
    expect(
      getRedirectUrl({
        req: { headers: {}, url: '/prefix?__start__=1&locale=zh', getBlockletComponentId: () => {} },
        pagePath: '/start',
      })
    ).toBe(
      `/.well-known/service/start?redirect=${encodeURIComponent('/prefix?locale=zh')}&showQuickConnect=false&locale=zh`
    );

    // server-url
    expect(
      getRedirectUrl({
        req: {
          headers: { 'x-group-path-prefix': '/' },
          url: '/prefix?__start__=1&locale=zh&serverUrl=http%3A%2F%2F192.168.1.87%3A3000',
          getBlockletComponentId: () => {},
        },
        pagePath: '/start',
      })
    ).toBe(
      `/.well-known/service/start?redirect=${encodeURIComponent(
        '/prefix?locale=zh'
      )}&showQuickConnect=false&locale=zh&serverUrl=http%3A%2F%2F192.168.1.87%3A3000`
    );

    expect(
      getRedirectUrl({
        req: {
          headers: { 'x-group-path-prefix': '/' },
          url: '/prefix?__start__=1&locale=zh&serverUrl=http%3A%2F%2F192.168.1.87%3A3000&fromLauncher=2',
          getBlockletComponentId: () => {},
        },
        pagePath: '/start',
      })
    ).toBe(
      `/.well-known/service/start?redirect=${encodeURIComponent(
        '/prefix?locale=zh'
      )}&showQuickConnect=false&locale=zh&serverUrl=http%3A%2F%2F192.168.1.87%3A3000&fromLauncher=2`
    );

    expect(
      getRedirectUrl({
        req: {
          headers: { 'x-group-path-prefix': '/' },
          url: '/prefix?__start__=1&locale=zh&serverUrl=http://192.168.1.87:3000',
          getBlockletComponentId: () => {},
        },
        pagePath: '/setup',
      })
    ).toBe(
      `/.well-known/service/setup?redirect=${encodeURIComponent(
        '/prefix?locale=zh'
      )}&showQuickConnect=false&locale=zh&serverUrl=http%3A%2F%2F192.168.1.87%3A3000`
    );

    expect(
      getRedirectUrl({
        req: {
          headers: { 'x-group-path-prefix': '/' },
          url: '/12345',
          getBlockletComponentId: () => 'componentXXX',
        },
        pagePath: '/login',
      })
    ).toBe(
      `/.well-known/service/login?redirect=${encodeURIComponent('/12345')}&showQuickConnect=false&componentId=componentXXX`
    );
  });
});

test('shouldIgnoreUrl', () => {
  expect(shouldIgnoreUrl('/', [])).toBe(false);
  expect(shouldIgnoreUrl('/', ['/'])).toBe(true);
  expect(shouldIgnoreUrl('/?a=b', ['/'])).toBe(true);
  expect(shouldIgnoreUrl('/#anchor', ['/'])).toBe(true);
  expect(shouldIgnoreUrl('/?', ['/'])).toBe(true);
  expect(shouldIgnoreUrl('/#', ['/'])).toBe(true);
  expect(shouldIgnoreUrl('/a?', ['/'])).toBe(false);
  expect(shouldIgnoreUrl('?', ['/'])).toBe(false);

  expect(shouldIgnoreUrl('/abc', ['/a/**'])).toBe(false);
  expect(shouldIgnoreUrl('/abc', ['/abc**'])).toBe(true);
  expect(shouldIgnoreUrl('/abc?a=1', ['/abc'])).toBe(true);
});

describe('hasAigneRequirement', () => {
  test('should check aigne config and children requirement', () => {
    expect(
      hasAigneRequirement({
        settings: {
          aigne: {
            url: 'https://example.com',
            key: 'test-key',
          },
        },
        children: [],
      })
    ).toBe(true);

    expect(
      hasAigneRequirement({
        settings: {
          aigne: {
            url: 'https://example.com',
          },
        },
        children: [],
      })
    ).toBe(false);

    expect(
      hasAigneRequirement({
        settings: {},
        children: [
          {
            meta: {
              requirements: {
                aigne: true,
              },
            },
          },
        ],
      })
    ).toBe(true);

    expect(
      hasAigneRequirement({
        settings: {},
        children: [
          {
            meta: {
              requirements: {
                aigne: false,
              },
            },
          },
        ],
      })
    ).toBe(false);

    expect(hasAigneRequirement({ settings: {}, children: [] })).toBe(false);
  });
});
