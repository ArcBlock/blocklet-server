const { describe, expect, test } = require('bun:test');
const { urlPathFriendly, isValidUrlPath } = require('../lib/url-path-friendly');

describe('urlPathFriendly', () => {
  test('isValidUrl', () => {
    expect(isValidUrlPath('auth-demo')).toBe(true);
    expect(isValidUrlPath('auth/demo')).toBe(true);
    expect(isValidUrlPath('/auth/demo')).toBe(true);
    expect(isValidUrlPath('auth_demo')).toBe(true);
    expect(isValidUrlPath('auth.demo')).toBe(true);
    expect(isValidUrlPath('/.well-known/nostr.json')).toBe(true);
    expect(isValidUrlPath('/')).toBe(true);
    expect(isValidUrlPath('/example')).toBe(true);
    expect(isValidUrlPath('/example/')).toBe(true);
    expect(isValidUrlPath('/example/path')).toBe(true);
    expect(isValidUrlPath('example/path')).toBe(true);
    expect(isValidUrlPath('example/path/')).toBe(true);
    expect(isValidUrlPath('/example/path/')).toBe(true);
    expect(isValidUrlPath('/example/path-123')).toBe(true);
    expect(isValidUrlPath('/example/path_456')).toBe(true);
    expect(isValidUrlPath('/example/path.789')).toBe(true);

    // should not have ~ and @ and # and ? and %
    expect(isValidUrlPath('~auth-demo')).toBe(false);
    expect(isValidUrlPath('auth~demo')).toBe(false);
    expect(isValidUrlPath('/example/path~abc')).toBe(false);
    expect(isValidUrlPath('auth@demo')).toBe(false);
    expect(isValidUrlPath('@ab@')).toBe(false);
    expect(isValidUrlPath('/example/path#fragment')).toBe(false);
    expect(isValidUrlPath('/example/path?query=string')).toBe(false);
    expect(isValidUrlPath('/example/path%')).toBe(false);

    // should not have space
    expect(isValidUrlPath('auth demo')).toBe(false);
    expect(isValidUrlPath('/example/path ')).toBe(false);

    // should not have duplicate /
    expect(isValidUrlPath('/example//path')).toBe(false);

    // should allow uppercase
    expect(isValidUrlPath('/example/ABC')).toBe(true);

    // should not have characters that MAYBE unsafe
    expect(isValidUrlPath('auth$demo')).toBe(false);
    expect(isValidUrlPath('auth*demo')).toBe(false);
    expect(isValidUrlPath('auth+demo')).toBe(false);
    expect(isValidUrlPath('auth(demo')).toBe(false);
    expect(isValidUrlPath('auth)demo')).toBe(false);
    expect(isValidUrlPath("auth'demo")).toBe(false);
    expect(isValidUrlPath('auth"demo')).toBe(false);
    expect(isValidUrlPath('auth!demo')).toBe(false);
    expect(isValidUrlPath('auth:demo')).toBe(false);
    expect(isValidUrlPath('auth\\demo')).toBe(false);
    expect(isValidUrlPath('/example/漢字')).toBe(false);
  });
});

describe('urlPathFriendly', () => {
  test('urlPathFriendly', () => {
    expect(urlPathFriendly('auth.demo')).toBe('auth.demo');
    expect(urlPathFriendly('.auth.demo')).toBe('.auth.demo');
    expect(urlPathFriendly('/.well-known/nostr.json')).toBe('/.well-known/nostr.json');
    expect(urlPathFriendly('/no-str/.well-known/nostr.json')).toBe('/no-str/.well-known/nostr.json');
    expect(urlPathFriendly('/auth.demo')).toBe('/auth.demo');
    expect(urlPathFriendly('-auth.demo')).toBe('-auth.demo');
    expect(urlPathFriendly('auth/demo')).toBe('auth/demo');
    expect(urlPathFriendly('/auth/demo')).toBe('/auth/demo');
    expect(urlPathFriendly('auth/demo')).toBe('auth/demo');
    expect(urlPathFriendly('auth-demo')).toBe('auth-demo');
    expect(urlPathFriendly('auth_demo')).toBe('auth_demo');
    expect(urlPathFriendly('/')).toBe('/');
    expect(urlPathFriendly('/example')).toBe('/example');
    expect(urlPathFriendly('/example/')).toBe('/example/');
    expect(urlPathFriendly('/example/path')).toBe('/example/path');
    expect(urlPathFriendly('example/path')).toBe('example/path');
    expect(urlPathFriendly('example/path/')).toBe('example/path/');
    expect(urlPathFriendly('/example/path/')).toBe('/example/path/');
    expect(urlPathFriendly('/example/path-123')).toBe('/example/path-123');
    expect(urlPathFriendly('/example/path_456')).toBe('/example/path_456');
    expect(urlPathFriendly('/example/path.789')).toBe('/example/path.789');

    expect(urlPathFriendly('~auth-demo')).toBe('-auth-demo');
    expect(urlPathFriendly('auth~demo')).toBe('auth-demo');
    expect(urlPathFriendly('/example/path~abc')).toBe('/example/path-abc');
    expect(urlPathFriendly('auth@demo')).toBe('auth-demo');
    expect(urlPathFriendly('@ab@')).toBe('-ab-');
    expect(urlPathFriendly('/example/path#fragment')).toBe('/example/path-fragment');
    expect(urlPathFriendly('/example/path?query=string')).toBe('/example/path-query-string');
    expect(urlPathFriendly('/example/path%')).toBe('/example/path-');
    expect(urlPathFriendly('/example/path ')).toBe('/example/path');
    expect(urlPathFriendly('/example//path')).toBe('/example/path');
    expect(urlPathFriendly('/example/ABC')).toBe('/example/ABC');
    expect(urlPathFriendly('auth$demo')).toBe('auth-demo');
    expect(urlPathFriendly('auth*demo')).toBe('auth-demo');
    expect(urlPathFriendly('auth+demo')).toBe('auth-demo');
    expect(urlPathFriendly('auth(demo')).toBe('auth-demo');
    expect(urlPathFriendly('auth)demo')).toBe('auth-demo');
    expect(urlPathFriendly("auth'demo")).toBe('auth-demo');
    expect(urlPathFriendly('auth"demo')).toBe('auth-demo');
    expect(urlPathFriendly('auth!demo')).toBe('auth-demo');
    expect(urlPathFriendly('auth:demo')).toBe('auth-demo');
    expect(urlPathFriendly('auth\\demo')).toBe('auth-demo');
    expect(urlPathFriendly('/example/漢字')).toBe('/example/');

    expect(urlPathFriendly('@auth/demo')).toBe('-auth/demo');
    expect(urlPathFriendly('auth//demo')).toBe('auth/demo');
    expect(urlPathFriendly('//auth//demo')).toBe('/auth/demo');
    expect(urlPathFriendly('/auth//demo', { keepSlash: false })).toBe('auth/demo');
    expect(urlPathFriendly('/abc基石')).toBe('/abc');
    expect(urlPathFriendly('/abc基石', { keepSlash: false })).toBe('abc');
    expect(urlPathFriendly('/auth/demo', { keepSlash: false })).toBe('auth/demo');
    expect(urlPathFriendly('/', { keepSlash: false })).toBe('');
    expect(urlPathFriendly('auth demo')).toBe('auth-demo');
    expect(urlPathFriendly('/auth demo')).toBe('/auth-demo');
    expect(urlPathFriendly(' /auth demo ')).toBe('/auth-demo');
    expect(urlPathFriendly(' ')).toBe('');
  });
});
