import { describe, test, expect } from 'bun:test';
import urlFriendly, { isValidUrl } from '../src/url-friendly';

describe('urlFriendly', () => {
  test('isValidUrl', () => {
    expect(isValidUrl('auth-demo')).toBe(true);
    expect(isValidUrl('auth/demo')).toBe(true);
    expect(isValidUrl('/auth/demo')).toBe(true);

    [' ', '$', '*', '_', '+', '~', '.', '(', ')', "'", '"', '!', ':', '@', '\\'].forEach((c) => {
      expect(isValidUrl(`auth${c}zhang`)).toEqual(false);
    });

    expect(isValidUrl('@ab@')).toBe(false);
  });
});

describe('urlFriendly', () => {
  test('urlFriendly', () => {
    expect(urlFriendly('auth-demo')).toBe('auth-demo');
    expect(urlFriendly('auth.demo')).toBe('auth-demo');
    expect(urlFriendly('auth/demo')).toBe('auth/demo');
    expect(urlFriendly('auth_demo')).toBe('auth-demo');
    expect(urlFriendly('@auth/demo')).toBe('auth/demo');
    expect(urlFriendly('.auth.demo')).toBe('auth-demo');
    expect(urlFriendly('-auth.demo')).toBe('auth-demo');
    expect(urlFriendly('/auth/demo', { keepSlash: false })).toBe('auth-demo');
    expect(urlFriendly('/abc基石')).toBe('/abc');
    expect(urlFriendly('/abc基石', { keepSlash: false })).toBe('abc');
    expect(urlFriendly('/auth.demo')).toBe('/auth-demo');
    expect(urlFriendly('/auth demo')).toBe('/auth-demo');
    expect(urlFriendly(' /auth demo ')).toBe('/auth-demo');
    expect(urlFriendly(' ')).toBe('');
  });
});
