/* eslint-disable no-console */
const { describe, expect, test } = require('bun:test');
const isPathPrefixEqual = require('../lib/is-path-prefix-equal');

describe('isPathPrefixEqual', () => {
  test('should return isPathPrefixEqual as expected', () => {
    expect(isPathPrefixEqual('', '')).toBeTruthy();
    expect(isPathPrefixEqual('', '/')).toBeTruthy();
    expect(isPathPrefixEqual('/', '/')).toBeTruthy();
    expect(isPathPrefixEqual('/', '')).toBeTruthy();
    expect(isPathPrefixEqual('a', 'a')).toBeTruthy();
    expect(isPathPrefixEqual('a', '/a')).toBeTruthy();
    expect(isPathPrefixEqual('a', '/a/')).toBeTruthy();
    expect(isPathPrefixEqual('/a/b', 'a/b/')).toBeTruthy();
    expect(isPathPrefixEqual('a', 'b')).toBeFalsy();
    expect(isPathPrefixEqual('a', '')).toBeFalsy();
    expect(isPathPrefixEqual('/a', '')).toBeFalsy();
  });
});
