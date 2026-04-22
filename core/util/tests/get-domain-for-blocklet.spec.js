const { test, expect, describe } = require('bun:test');
const { encode: encodeBase32 } = require('../lib/base32');
const { getIpDnsDomainForBlocklet, getDidDomainForBlocklet } = require('../lib/get-domain-for-blocklet');

describe('getDomainForBlocklet', () => {
  describe('getIpDnsDomainForBlocklet', () => {
    test('should work as expected', () => {
      // legal blocklet name
      const did = 'abcd';
      const base32did = encodeBase32(did);

      expect(getIpDnsDomainForBlocklet({ meta: { name: 'auth-demo', did } }, { name: 'publicUrl' })).toBe(
        `${base32did}-888-888-888-888.ip.abtnet.io`
      );

      expect(getIpDnsDomainForBlocklet({ meta: { name: 'auth.demo', did } }, { name: 'publicUrl' })).toBe(
        `${base32did}-888-888-888-888.ip.abtnet.io`
      );

      expect(getIpDnsDomainForBlocklet({ meta: { name: '@auth/demo', did } }, { name: 'publicUrl' })).toBe(
        `${base32did}-888-888-888-888.ip.abtnet.io`
      );

      expect(getIpDnsDomainForBlocklet({ meta: { name: '@auth/demo', did } }, { name: 'adminUrl' })).toBe(
        `${base32did}-888-888-888-888.ip.abtnet.io`
      );

      // Invalid blocklet name

      expect(getIpDnsDomainForBlocklet({ meta: { name: 'auth/demo', did } }, { name: 'publicUrl' })).toBe(
        `${base32did}-888-888-888-888.ip.abtnet.io`
      );

      expect(getIpDnsDomainForBlocklet({ meta: { name: '.auth.demo', did } }, { name: 'publicUrl' })).toBe(
        `${base32did}-888-888-888-888.ip.abtnet.io`
      );

      expect(getIpDnsDomainForBlocklet({ meta: { name: '-auth.demo', did } }, { name: 'publicUrl' })).toBe(
        `${base32did}-888-888-888-888.ip.abtnet.io`
      );

      expect(getIpDnsDomainForBlocklet({ meta: { name: '/auth.demo', did } }, { name: 'publicUrl' })).toBe(
        `${base32did}-888-888-888-888.ip.abtnet.io`
      );

      expect(getIpDnsDomainForBlocklet({ meta: { name: 'auth_demo', did } }, { name: 'publicUrl' })).toBe(
        `${base32did}-888-888-888-888.ip.abtnet.io`
      );
    });
  });

  describe('getDidDomainForBlocklet', () => {
    const appPid = 'zNKmkxUn64RNDz6m4b2rwtznPP5bhsS8LJfX';
    test('should return with lower-case daemon-did', () => {
      expect(getDidDomainForBlocklet({ did: appPid, didDomain: 'did.abtnet.io' })).toEqual(
        `${encodeBase32(appPid)}.did.abtnet.io`
      );
    });
  });
});
