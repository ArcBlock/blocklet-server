const { test, expect, describe } = require('bun:test');
const { getServerAuthMethod } = require('../../lib/util/get-auth-method'); // Replace 'yourModule' with the actual module path

describe('getServerAuthMethod', () => {
  test('should return "session" if authorized', () => {
    const result = getServerAuthMethod({}, '', '', true);
    expect(result).toBe('session');
  });

  test('should return "launcher" if launcherSessionId is provided', () => {
    const result = getServerAuthMethod({}, '', '123');
    expect(result).toBe('launcher');
  });

  test('should return "nft" if type is "serverless"', () => {
    const result = getServerAuthMethod({}, 'serverless');
    expect(result).toBe('nft');
  });

  test('should return "vc" if info is initialized', () => {
    const result = getServerAuthMethod({ initialized: true }, '');
    expect(result).toBe('vc');
  });

  test('should return "nft" if all conditions for "nft" are met', () => {
    const info = {
      ownerNft: { holder: 'holder', issuer: 'issuer' },
      launcher: { tag: 'tag', chainHost: 'chainHost', did: 'issuer' },
    };
    const result = getServerAuthMethod(info, '');
    expect(result).toBe('nft');
  });

  test('should return "vc" for default case', () => {
    const result = getServerAuthMethod({}, '');
    expect(result).toBe('vc');
  });
});
