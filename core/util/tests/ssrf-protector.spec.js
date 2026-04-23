const dns = require('dns');
const { afterEach, describe, expect, mock, spyOn, test } = require('bun:test');
const {
  isAllowedProtocol,
  isAllowedReferer,
  isAllowedURL,
  isBlockedIP,
  resolveAndValidateHostname,
} = require('../lib/ssrf-protector');

describe('SSRF Protector', () => {
  afterEach(() => {
    mock.restore();
  });

  describe('isAllowedProtocol', () => {
    test('should allow https protocol', () => {
      expect(isAllowedProtocol('https')).toBe(true);
    });

    test('should reject http protocol', () => {
      expect(isAllowedProtocol('http')).toBe(false);
    });

    test('should reject ftp protocol', () => {
      expect(isAllowedProtocol('ftp')).toBe(false);
    });

    test('should reject null protocol', () => {
      expect(isAllowedProtocol(null)).toBe(false);
    });

    test('should reject undefined protocol', () => {
      expect(isAllowedProtocol(undefined)).toBe(false);
    });
  });

  describe('isAllowedReferer', () => {
    test('should allow referer from same host', () => {
      const referer = 'https://example.com/page';
      const host = 'example.com';
      expect(isAllowedReferer(referer, host)).toBe(true);
    });

    test('should allow referer from same host with port', () => {
      const referer = 'https://example.com:8080/page';
      const host = 'example.com:8080';
      expect(isAllowedReferer(referer, host)).toBe(true);
    });

    test('should reject referer from different host', () => {
      const referer = 'https://malicious.com/page';
      const host = 'example.com';
      expect(isAllowedReferer(referer, host)).toBe(false);
    });

    test('should reject invalid referer URL', () => {
      const referer = 'invalid-url';
      const host = 'example.com';
      expect(isAllowedReferer(referer, host)).toBe(false);
    });

    test('should reject null referer', () => {
      const referer = null;
      const host = 'example.com';
      expect(isAllowedReferer(referer, host)).toBe(false);
    });

    test('should reject null host', () => {
      const referer = 'https://example.com/page';
      const host = null;
      expect(isAllowedReferer(referer, host)).toBe(false);
    });
  });

  describe('isAllowedURL', () => {
    test('should allow valid HTTPS URL with public IP', async () => {
      const result = await isAllowedURL('https://google.com/api');

      expect(result).toBe(true);
    });

    test('should reject HTTP URLs', async () => {
      const result = await isAllowedURL('http://google.com/api');
      expect(result).toBe(false);
    });

    test('should reject FTP URLs', async () => {
      const result = await isAllowedURL('ftp://google.com/api');
      expect(result).toBe(false);
    });

    test('should allow public IP addresses directly', async () => {
      const result = await isAllowedURL('https://8.8.8.8/api');
      expect(result).toBe(true);
    });

    test('should reject private IP addresses directly', async () => {
      const result = await isAllowedURL('https://192.168.1.1/api');
      expect(result).toBe(false);
    });

    test('should reject localhost IP addresses', async () => {
      const result = await isAllowedURL('https://127.0.0.1/api');
      expect(result).toBe(false);
    });

    test('should reject invalid URLs', async () => {
      const result = await isAllowedURL('invalid-url');
      expect(result).toBe(false);
    });

    test('should reject null URL', async () => {
      const result = await isAllowedURL(null);
      expect(result).toBe(false);
    });

    test('should reject empty URL', async () => {
      const result = await isAllowedURL('');
      expect(result).toBe(false);
    });

    test('should allow any URL in test environment', async () => {
      const result = await isAllowedURL('http://192.168.1.1/api');

      expect(result).toBe(false);
    });

    test('should handle URLs with query parameters', async () => {
      const result = await isAllowedURL('https://google.com/api?param=value');

      expect(result).toBe(true);
    });

    test('should handle URLs with fragments', async () => {
      const result = await isAllowedURL('https://google.com/api#section');

      expect(result).toBe(true);
    });

    test('should reject IPv4 multicast address 224.0.0.1', async () => {
      expect(await isAllowedURL('https://224.0.0.1/api')).toBe(false);
    });

    test('should reject IPv4 multicast address 239.255.255.255', async () => {
      expect(await isAllowedURL('https://239.255.255.255/api')).toBe(false);
    });

    test('should reject IPv4 multicast address 230.1.2.3', async () => {
      expect(await isAllowedURL('https://230.1.2.3/api')).toBe(false);
    });

    test('should reject blocked IPv6 addresses directly', async () => {
      expect(await isAllowedURL('https://[::1]/api')).toBe(false);
      expect(await isAllowedURL('https://[ff02::1]/api')).toBe(false);
      expect(await isAllowedURL('https://[::ffff:127.0.0.1]/api')).toBe(false);
    });
  });

  describe('isBlockedIP', () => {
    test('should allow public unicast addresses', () => {
      expect(isBlockedIP('8.8.8.8')).toBe(false);
      expect(isBlockedIP('2606:4700:4700::1111')).toBe(false);
    });

    test('should block non-public address ranges', () => {
      [
        '0.0.0.0',
        '10.0.0.1',
        '100.64.0.1',
        '127.0.0.1',
        '169.254.169.254',
        '172.16.0.1',
        '192.168.1.1',
        '224.0.0.1',
        '255.255.255.255',
        '::',
        '::1',
        'fc00::1',
        'fe80::1',
        'ff02::1',
        '::ffff:127.0.0.1',
      ].forEach((ip) => {
        expect(isBlockedIP(ip)).toBe(true);
      });
    });
  });

  describe('resolveAndValidateHostname', () => {
    test('should reject hostnames if any DNS answer is blocked', async () => {
      spyOn(dns, 'lookup').mockImplementation((hostname, options, callback) => {
        callback(null, [{ address: '8.8.8.8' }, { address: '10.0.0.1' }]);
      });

      expect(await resolveAndValidateHostname('mixed.example.com')).toBe(false);
    });

    test('should allow hostnames when all DNS answers are public', async () => {
      spyOn(dns, 'lookup').mockImplementation((hostname, options, callback) => {
        callback(null, [{ address: '8.8.8.8' }, { address: '2606:4700:4700::1111' }]);
      });

      expect(await resolveAndValidateHostname('public.example.com')).toBe(true);
    });
  });
});
