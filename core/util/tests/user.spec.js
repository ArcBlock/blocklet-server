/* eslint-disable global-require */
/* eslint-disable import/no-extraneous-dependencies */
const { it, describe, expect, test, beforeEach, mock, afterAll } = require('bun:test');

const mockOutputFile = mock();
const mockExistsSync = mock((p) => {
  return !p.endsWith('.not.exist');
});
const mockReadFile = mock(() => {
  return Buffer.from('abc');
});

mock.module('fs-extra', () => ({
  outputFile: mockOutputFile,
  existsSync: mockExistsSync,
  promises: {
    readFile: mockReadFile,
  },
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const axios = require('@abtnode/util/lib/axios');

const {
  extractUserAvatar,
  parseUserAvatar,
  getAvatarFile,
  getEmailHash,
  getAvatarByEmail,
  getAvatarByUrl,
  getUserAvatarUrl,
  getServerAvatarUrl,
  getAppAvatarUrl,
  updateConnectedAccount,
} = require('../lib/user');

beforeEach(() => {
  mock.clearAllMocks();
});

// base64('abc') is YWJj
// md5('abc') is 0150983cd24fb0d6963f7d28e17f72

test('getAvatarFile', () => {
  expect(getAvatarFile('/path/to', 'abcdefg.png')).toBe('/path/to/.assets/avatar/ab/cdefg.png');
  expect(getAvatarFile('/path/to/', 'abcdefg.png')).toBe('/path/to/.assets/avatar/ab/cdefg.png');
  expect(getAvatarFile('/path/to', 'abcdefg')).toBe('/path/to/.assets/avatar/ab/cdefg');
});

test('extractUserAvatar', async () => {
  const r1 = await extractUserAvatar('data:image/png;base64,YWJj', { dataDir: '/path/to' });
  expect(r1).toBe('bn://avatar/900150983cd24fb0d6963f7d28e17f72.png');
  expect(mockOutputFile.mock.calls.length).toBe(1);
  expect(mockOutputFile.mock.calls[0][0]).toBe('/path/to/.assets/avatar/90/0150983cd24fb0d6963f7d28e17f72.png');

  const r2 = await extractUserAvatar('data:image/jpg;base64,YWJj', { dataDir: '/path/to' });
  expect(r2).toBe('bn://avatar/900150983cd24fb0d6963f7d28e17f72.jpg');
  expect(mockOutputFile.mock.calls.length).toBe(2);
  expect(mockOutputFile.mock.calls[1][0]).toBe('/path/to/.assets/avatar/90/0150983cd24fb0d6963f7d28e17f72.jpg');

  const r3 = await extractUserAvatar('http://a.io');
  expect(r3).toBe('http://a.io');
  expect(mockOutputFile.mock.calls.length).toBe(2);

  const r4 = await extractUserAvatar('');
  expect(r4).toBe('');
  expect(mockOutputFile.mock.calls.length).toBe(2);
});

test('parseUserAvatar', async () => {
  const r1 = await parseUserAvatar('data:image/png;base64,YWJj');
  expect(r1).toBe('data:image/png;base64,YWJj');

  const r2 = await parseUserAvatar('');
  expect(r2).toBe('');

  const r3 = await parseUserAvatar('http://a.io');
  expect(r3).toBe('http://a.io');

  // mock avatar file not exist
  const r4 = await parseUserAvatar('bn://avatar/900150983cd24fb0d6963f7d28e17f72.not.exist', { dataDir: '/path/to' });
  expect(r4).toBe('bn://avatar/900150983cd24fb0d6963f7d28e17f72.not.exist');

  // the mock file data is 'abc'
  const r5 = await parseUserAvatar('bn://avatar/900150983cd24fb0d6963f7d28e17f72.png', { dataDir: '/path/to' });
  expect(r5).toBe('data:image/png;base64,YWJj');

  // the mock file data is 'abc'
  const r6 = await parseUserAvatar('bn://avatar/900150983cd24fb0d6963f7d28e17f72.jpg', { dataDir: '/path/to' });
  expect(r6).toBe('data:image/jpg;base64,YWJj');
});

describe('updateConnectedAccount', () => {
  const start = new Date(0).toISOString();
  const wallet = {
    provider: 'wallet',
    did: 'abc',
    firstLoginAt: start,
    lastLoginAt: start,
  };
  const auth0 = {
    provider: 'auth0',
    did: 'def',
    firstLoginAt: start,
    lastLoginAt: start,
  };
  const nft1 = {
    provider: 'nft',
    did: 'efg',
    firstLoginAt: start,
    lastLoginAt: start,
  };
  const nft2 = {
    provider: 'nft',
    did: 'hig',
  };

  test('should update a account when account is connected', () => {
    const merged = updateConnectedAccount([wallet, auth0], wallet);
    expect(merged).toHaveLength(2);

    const updated = merged.find((item) => item.provider === 'wallet');
    expect(updated.firstLoginAt).toEqual(wallet.firstLoginAt);
    expect(updated.lastLoginAt).not.toEqual(wallet.lastLoginAt);
  });

  test('should insert a account when account is not connected', () => {
    const merged = updateConnectedAccount([wallet], auth0);
    expect(merged).toHaveLength(2);

    const updated = merged.find((item) => item.provider === 'auth0');
    expect(updated.firstLoginAt).toEqual(auth0.firstLoginAt);
    expect(updated.lastLoginAt).not.toEqual(auth0.lastLoginAt);
  });

  test('should allow multiple account from same provider', () => {
    const merged = updateConnectedAccount([wallet], [nft1, nft2]);
    expect(merged).toHaveLength(3);

    const updated = merged.find((item) => item.did === 'efg');
    expect(updated.firstLoginAt).toEqual(nft1.firstLoginAt);
    expect(updated.lastLoginAt).not.toEqual(nft1.lastLoginAt);

    const updated2 = merged.find((item) => item.did === 'hig');
    expect(updated2.firstLoginAt).not.toEqual(nft2.firstLoginAt);
    expect(updated2.lastLoginAt).not.toEqual(nft2.lastLoginAt);
  });

  test('should work', () => {
    const did = 'z1grtdmEWcqnrYo7CqT9qRugB64RLTRURrD';
    const pk = '0x711ff9b08db1a26b813d90faaee971748bd624d8534745748896ed9a838d24a4';
    const beforeTime = new Date('2018-06-07').toISOString();
    const merged = updateConnectedAccount(
      [
        {
          provider: 'wallet',
          did,
          pk,
          firstLoginAt: beforeTime,
          lastLoginAt: beforeTime,
        },
      ],
      {
        provider: 'wallet',
        did,
      }
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].firstLoginAt).toEqual(beforeTime);
    expect(merged[0].lastLoginAt).not.toEqual(beforeTime);
  });
});

describe('Work with getEmailHash', () => {
  test('generate hash with normal email', () => {
    expect(getEmailHash('blocklet@arcblock.io')).toEqual('b463601b4394f4dd868fb22f3300087e');
  });

  test('generate hash with upper case email', () => {
    expect(getEmailHash('Blocklet@ArcBlock.io')).toEqual('b463601b4394f4dd868fb22f3300087e');
  });

  test('generate hash with whitespace case email', () => {
    expect(getEmailHash(' Blocklet@ArcBlock.io  ')).toEqual('b463601b4394f4dd868fb22f3300087e');
  });
});

describe('Work with getAvatarByEmail', () => {
  test('generate avatar with normal email', async () => {
    axios.get = mock().mockResolvedValueOnce({ data: Buffer.from('abc') });
    const avatarBase64 = await getAvatarByEmail('blocklet@arcblock.io');
    expect(avatarBase64).toEqual('data:image/png;base64,YWJj');
  });
});

describe('Work with getAvatarByUrl', () => {
  test('generate avatar with normal email', async () => {
    axios.get = mock().mockResolvedValueOnce({ data: Buffer.from('abc') });
    const avatarBase64 = await getAvatarByUrl('https://picsum.photos/100/100');
    expect(avatarBase64).toEqual('data:image/png;base64,YWJj');
  });
});

describe('getUserAvatarUrl', () => {
  const baseUrl = 'https://example.com';
  const user = {
    avatar: 'bn://avatar/user1/avatar.png',
  };
  const info = {
    routing: {
      adminPath: '/admin',
    },
    did: 'did:example:123',
  };

  it('should return untouched when avatar is remote URL', () => {
    const isServer = true;
    const expectedUrl = 'https://example.com/admin/user/avatar/did:example:123/avatar.png';

    const url = getUserAvatarUrl(baseUrl, expectedUrl, info, isServer);
    expect(url).toEqual(expectedUrl);
  });

  it('should return the user avatar URL on the server', () => {
    const isServer = true;
    const expectedUrl = 'https://example.com/admin/user/avatar/did:example:123/avatar.png';

    const url = getUserAvatarUrl(baseUrl, user.avatar, info, isServer);

    expect(url).toEqual(expectedUrl);
  });

  it('should return the user avatar URL on the client', () => {
    const isServer = false;
    const expectedUrl = 'https://example.com/.well-known/service/user/avatar/avatar.png?imageFilter=resize&w=48&h=48';

    const url = getUserAvatarUrl(baseUrl, user.avatar, info, isServer);

    expect(url).toEqual(expectedUrl);
  });

  it('should throw an error if the user avatar URL is not persisted on disk', () => {
    const invalidUser = {
      avatar: 'invalid-avatar-url',
    };
    const isServer = true;

    expect(() => {
      getUserAvatarUrl(baseUrl, invalidUser.avatar, info, isServer);
    }).toThrowError('User avatar is not persisted on disk');
  });
});

describe('getServerAvatarUrl', () => {
  const info = {
    routing: {
      adminPath: '/admin',
    },
    version: '1.0.0',
  };

  it('should return the server avatar URL', () => {
    const baseUrl = 'https://example.com';
    const expectedUrl = 'https://example.com/images/node.png?v=1.0.0';
    const url = getServerAvatarUrl(baseUrl, info);
    expect(url).toEqual(expectedUrl);
  });

  it('should return the server avatar URL', () => {
    const baseUrl = 'https://example.com/admin';
    const expectedUrl = 'https://example.com/images/node.png?v=1.0.0';
    const url = getServerAvatarUrl(baseUrl, info);
    expect(url).toEqual(expectedUrl);
  });

  it('should return an empty string if baseUrl is not provided', () => {
    const url = getServerAvatarUrl(undefined, info);

    expect(url).toEqual('');
  });
});

describe('getAppAvatarUrl', () => {
  it('should return the app avatar URL', () => {
    const baseUrl = 'https://example.com';
    const expectedUrl = 'https://example.com/.well-known/service/blocklet/logo?imageFilter=convert&f=png&h=80';
    const url = getAppAvatarUrl(baseUrl);
    expect(url).toMatch(expectedUrl);
  });

  it('should return the app avatar URL', () => {
    const baseUrl = 'https://example.com/xxx';
    const expectedUrl = 'https://example.com/.well-known/service/blocklet/logo?imageFilter=convert&f=png&h=80';
    const url = getAppAvatarUrl(baseUrl);
    expect(url).toMatch(expectedUrl);
  });

  it('should return an empty string if baseUrl is not provided', () => {
    const url = getAppAvatarUrl(undefined);
    expect(url).toEqual('');
  });
});
