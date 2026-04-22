const { describe, expect, test } = require('bun:test');
const { isAllowedProtocol, isAllowedReferer, isAllowedURL } = require('../lib/ssrf-protector');

describe('SSRF Protector', () => {
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

    // Multicast IPs (224.0.0.0/4) are not covered by private-ip (CVE: GHSA-jm66-6qc7-hx83)
    test('should reject IPv4 multicast address 224.0.0.1', async () => {
      expect(await isAllowedURL('https://224.0.0.1/api')).toBe(false);
    });

    test('should reject IPv4 multicast address 239.255.255.255', async () => {
      expect(await isAllowedURL('https://239.255.255.255/api')).toBe(false);
    });

    test('should reject IPv4 multicast address 230.1.2.3', async () => {
      expect(await isAllowedURL('https://230.1.2.3/api')).toBe(false);
    });
  });
});
