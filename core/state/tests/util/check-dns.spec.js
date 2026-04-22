const { describe, expect, it } = require('bun:test');
const { convertDomainToUrl, getBlockletUrl, checkIsRedirectedBlocklet } = require('../../lib/util/check-dns');
const checkDnsAndCname = require('../../lib/util/check-dns');

describe('check-dns', () => {
  describe('convertDomainToUrl', () => {
    it('should add http:// prefix to domain without protocol', () => {
      expect(convertDomainToUrl('example.com')).toBe('http://example.com');
      expect(convertDomainToUrl('  example.com  ')).toBe('http://example.com');
    });

    it('should not modify domain with http protocol', () => {
      expect(convertDomainToUrl('http://example.com')).toBe('http://example.com');
    });

    it('should not modify domain with https protocol', () => {
      expect(convertDomainToUrl('https://example.com')).toBe('https://example.com');
    });

    it('should handle domain with path', () => {
      expect(convertDomainToUrl('example.com/path')).toBe('http://example.com/path');
    });
  });

  describe('getBlockletUrl', () => {
    it('should return appId from blocklet object', async () => {
      const result = await getBlockletUrl('https://store.blocklet.dev/');
      expect(result).toBe('zNKqX7D8ZAYa77HgzpoFfnV3BFbcmSRrE9aT');
    });
  });

  describe('checkIsRedirectedBlocklet', () => {
    it('should return true when both domains have same blocklet appId', async () => {
      const result = await checkIsRedirectedBlocklet('store.blocklet.dev', 'registry.arcblock.io');
      expect(result).toBe(true);

      const result1 = await checkIsRedirectedBlocklet(
        'store.blocklet.dev',
        'bbqa46mhdcymdys2u3yxbum5rvrh2wmsm2kajsuhvbq.did.abtnet.io'
      );
      expect(result1).toBe(true);
    }, 10_000);
  });

  describe('checkDnsAndCname', () => {
    it('should return success when DNS resolves and CNAME matches', async () => {
      const result = await checkDnsAndCname('store.blocklet.dev', 'registry.arcblock.io');

      expect(result.isDnsResolved).toBe(true);
      expect(result.isCnameMatch).toBe(true);
    });

    it('should return success when DNS resolves but no CNAME records', async () => {
      const result = await checkDnsAndCname('store.blocklet.dev', 'nonexistent-cname.com');

      expect(result.isDnsResolved).toBe(true);
      expect(result.isCnameMatch).toBe(false);
    });

    it('should handle DNS resolution errors gracefully', async () => {
      const result = await checkDnsAndCname('https://example-test-local.com', 'expected-cname.com');

      expect(result.isDnsResolved).toBe(false);
      expect(result.isCnameMatch).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
