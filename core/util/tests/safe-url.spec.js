const { test, expect, describe } = require('bun:test');
const { assertSafeUrl, isBlockedAddress } = require('../lib/safe-url');

describe('isBlockedAddress', () => {
  test('should block internal ipv4 ranges', () => {
    for (const ip of [
      '127.0.0.1',
      '0.0.0.0',
      '10.1.2.3',
      '169.254.169.254', // cloud metadata
      '172.16.0.1',
      '172.31.255.255',
      '192.168.1.1',
      '100.64.0.1',
      '198.18.4.255',
      '224.0.0.1',
    ]) {
      expect(isBlockedAddress(ip)).toBe(true);
    }
  });

  test('should allow public ipv4', () => {
    for (const ip of ['1.1.1.1', '8.8.8.8', '52.39.39.9', '172.32.0.1', '192.167.1.1']) {
      expect(isBlockedAddress(ip)).toBe(false);
    }
  });

  test('should block internal ipv6 and mapped ipv4', () => {
    for (const ip of ['::1', '::', 'fe80::1', 'fd00::1', 'fc00::1', '::ffff:169.254.169.254']) {
      expect(isBlockedAddress(ip)).toBe(true);
    }
  });

  // Regression: WHATWG URL serializes mapped ipv4 in hex form, which bypassed the dotted form regex
  test('should block mapped and embedded ipv4 in hex form', () => {
    for (const ip of [
      '::ffff:7f00:1',
      '::ffff:a9fe:a9fe',
      '::ffff:a00:1',
      '::7f00:1', // ipv4-compatible
      '64:ff9b::7f00:1', // nat64
      '2002:7f00:1::', // 6to4
      '2001:0:4136:e378:8000:63bf:3fff:fdd2', // teredo
    ]) {
      expect(isBlockedAddress(ip)).toBe(true);
    }
  });

  test('should allow public ipv6', () => {
    expect(isBlockedAddress('2606:4700:4700::1111')).toBe(false);
  });

  test('should block non ip input', () => {
    expect(isBlockedAddress('not-an-ip')).toBe(true);
  });
});

describe('assertSafeUrl', () => {
  test('should reject invalid urls', async () => {
    await expect(assertSafeUrl('')).rejects.toThrow('Invalid url');
    await expect(assertSafeUrl('not a url')).rejects.toThrow('Invalid url');
  });

  test('should reject non http protocols', async () => {
    await expect(assertSafeUrl('file:///etc/passwd')).rejects.toThrow('Unsupported protocol');
    await expect(assertSafeUrl('gopher://example.com/')).rejects.toThrow('Unsupported protocol');
  });

  test('should reject embedded credentials', async () => {
    await expect(assertSafeUrl('http://user:pass@example.com/')).rejects.toThrow('Credentials are not allowed');
  });

  test('should reject internal literal ips without dns', async () => {
    await expect(assertSafeUrl('http://169.254.169.254/latest/meta-data/')).rejects.toThrow('Host is not allowed');
    await expect(assertSafeUrl('http://127.0.0.1:8080/')).rejects.toThrow('Host is not allowed');
    await expect(assertSafeUrl('http://[::1]/')).rejects.toThrow('Host is not allowed');
  });

  test('should reject every encoding of internal hosts', async () => {
    for (const url of [
      'http://2130706433:8089/',
      'http://0x7f000001:8089/',
      'http://017700000001:8089/',
      'http://0:8089/',
      'http://[::ffff:127.0.0.1]:8089/',
      'http://[::ffff:7f00:1]:8089/',
      'http://[::ffff:169.254.169.254]/latest/meta-data/',
      'http://[0:0:0:0:0:ffff:127.0.0.1]/',
      'http://[::127.0.0.1]/',
      'http://[64:ff9b::127.0.0.1]/',
    ]) {
      // eslint-disable-next-line no-await-in-loop
      await expect(assertSafeUrl(url)).rejects.toThrow('Host is not allowed');
    }
  });

  test('should accept public literal ips', async () => {
    const url = await assertSafeUrl('https://1.1.1.1/audit-log/list');
    expect(url.hostname).toBe('1.1.1.1');
  });

  test('should accept hostnames when dns resolution is skipped', async () => {
    const url = await assertSafeUrl('https://space.example.com/object', { resolve: false });
    expect(url.hostname).toBe('space.example.com');
  });
});
