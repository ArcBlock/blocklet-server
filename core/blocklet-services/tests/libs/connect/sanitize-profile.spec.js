const { test, expect, describe } = require('bun:test');

const { utils } = require('../../../api/libs/connect/session');

const { sanitizeProfile } = utils;

describe('sanitizeProfile', () => {
  test('should keep the display fields a profile claim legitimately carries', () => {
    const out = sanitizeProfile({
      fullName: 'Alice',
      email: 'alice@example.com',
      phone: '+100',
      avatar: 'https://a/b.png',
      url: 'https://a',
    });
    expect(out).toEqual({
      fullName: 'Alice',
      email: 'alice@example.com',
      phone: '+100',
      avatar: 'https://a/b.png',
      url: 'https://a',
    });
  });

  // Regression: the profile claim is fully client controlled and was
  // spread over the server-computed `passport`, so a forged { role: 'owner' } passport
  // landed in the passports table verbatim.
  test('should drop an injected passport', () => {
    const out = sanitizeProfile({
      fullName: 'poc',
      passport: { name: 'owner', role: 'owner', scope: 'passport' },
    });
    expect(out.passport).toBeUndefined();
    expect(out.fullName).toBe('poc');
  });

  test('should drop every server owned field', () => {
    const out = sanitizeProfile({
      fullName: 'poc',
      passport: { role: 'owner' },
      role: 'owner',
      approved: true,
      did: 'z1victim',
      pk: '0xdead',
      passports: [{ role: 'owner' }],
      connectedAccount: [{ provider: 'wallet' }],
      lastLoginIp: '1.2.3.4',
      sourceAppPid: 'zNKevil',
      createdByAppPid: 'zNKevil',
      inviter: 'z1victim',
      emailVerified: true,
      phoneVerified: true,
      extra: { a: 1 },
      remark: 'x',
    });
    expect(Object.keys(out)).toEqual(['fullName']);
  });

  test('should pass null and undefined through untouched', () => {
    expect(sanitizeProfile(undefined)).toBeUndefined();
    expect(sanitizeProfile(null)).toBeNull();
  });

  test('should not mutate the input', () => {
    const input = { fullName: 'a', role: 'owner' };
    sanitizeProfile(input);
    expect(input.role).toBe('owner');
  });
});
