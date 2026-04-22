const { test, expect, describe, beforeEach, spyOn } = require('bun:test');
const { CustomError } = require('@blocklet/error');
const {
  ROLES,
  SERVER_ROLES,
  WELLKNOWN_BLOCKLET_ADMIN_PATH,
  WELLKNOWN_BLOCKLET_USER_PATH,
} = require('@abtnode/constant');

const {
  validateOperator,
  getEndpoint,
  isUserCenterPath,
  isAdminPath,
} = require('../../lib/util/verify-access-key-user');

describe('verify-access-key-user', () => {
  beforeEach(() => {
    spyOn(console, 'info').mockReturnValue();
  });

  test('should handle path identification and URL parsing', () => {
    // Path identification
    expect(isAdminPath(WELLKNOWN_BLOCKLET_ADMIN_PATH)).toBe(true);
    expect(isAdminPath('/other/path')).toBe(false);
    expect(isUserCenterPath(WELLKNOWN_BLOCKLET_USER_PATH)).toBe(true);
    expect(isUserCenterPath('/other/path')).toBe(false);

    // URL parsing
    expect(getEndpoint({ referrer: 'https://example.com/admin/dashboard?query=1' })).toBe('/admin/dashboard');
    expect(getEndpoint({ referrer: 'https://example.com/' })).toBe('/');
  });

  test('should validate operator access with various scenarios', () => {
    // Missing user context
    expect(() =>
      validateOperator({ hostname: 'example.com', referrer: 'https://example.com/admin' }, 'did:example:123')
    ).toThrow(new CustomError(400, 'Missing user context'));

    // SDK role bypass
    expect(() =>
      validateOperator({ user: { did: 'did:example:123', role: SERVER_ROLES.BLOCKLET_SDK } }, 'did:example:123')
    ).not.toThrow();

    // Missing hostname/referrer
    expect(() => validateOperator({ user: { did: 'did:example:123', role: ROLES.ADMIN } }, 'did:example:123')).toThrow(
      new CustomError(400, 'Missing hostname or referrer context')
    );

    // Admin path access control
    expect(() =>
      validateOperator(
        {
          hostname: 'example.com',
          referrer: `https://example.com${WELLKNOWN_BLOCKLET_ADMIN_PATH}`,
          user: { did: 'did:example:123', role: ROLES.ADMIN },
        },
        'did:example:123'
      )
    ).not.toThrow();

    // Non-user center paths must be accessed by admin user
    expect(() =>
      validateOperator(
        {
          hostname: 'example.com',
          referrer: 'https://example.com/invalid/path',
          user: { did: 'did:example:123', role: ROLES.ADMIN },
        },
        'did:example:123'
      )
    ).not.toThrow();

    expect(() =>
      validateOperator(
        {
          hostname: 'example.com',
          referrer: `https://example.com${WELLKNOWN_BLOCKLET_ADMIN_PATH}`,
          user: { did: 'did:example:123', role: ROLES.MEMBER },
        },
        'did:example:123'
      )
    ).toThrow(new CustomError(403, 'Unauthorized: You cannot access admin page'));

    // User center path access control
    const userContext = {
      hostname: 'example.com',
      referrer: `https://example.com${WELLKNOWN_BLOCKLET_USER_PATH}`,
      user: { did: 'did:example:123', role: ROLES.MEMBER },
    };

    expect(() => validateOperator(userContext, 'did:example:123')).not.toThrow();
    expect(() => validateOperator(userContext, 'did:example:different')).toThrow(
      new CustomError(403, 'Unauthorized: You cannot view access keys created by other users')
    );
  });
});
