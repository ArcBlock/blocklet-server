const { test, expect, describe } = require('bun:test');
const { encode, decode } = require('../lib/base32');

describe('base32', () => {
  describe('encode', () => {
    test('should return empty if the value if falsy', () => {
      expect(encode('')).toEqual('');
      expect(encode(null)).toEqual(null);
      expect(typeof encode()).toEqual('undefined');
    });

    test('should ignore did:abt prefix', () => {
      expect(encode('did:abt:zb2rhk6GMPQF3hfzwXTaNYFLKomMeC6UXdUt6jZKPpeVirLtV')).toEqual(
        'bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy'
      );
    });

    test('should work as expected', () => {
      expect(encode('zb2rhk6GMPQF3hfzwXTaNYFLKomMeC6UXdUt6jZKPpeVirLtV')).toEqual(
        'bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy'
      );

      expect(encode('z1eZDw74rF2HnCviWEqAGTWtuYNYtQzoF7m')).toEqual('baaazx5gcwr47u7wbtvwbfv723f5zlcp4ihltq2o54a');
    });

    test('should encode eth address as expected', () => {
      expect(encode('0x8Dc52ae870CE486a448B085628Ddd533CfF798E1')).toEqual('brxcsv2dqzzegurelbblcrxovgph7pghb');
    });
  });

  describe('decode', () => {
    test('should return empty if the value if falsy', () => {
      expect(decode('')).toEqual('');
      expect(decode(null)).toEqual(null);
      expect(typeof decode()).toEqual('undefined');
    });

    test('should decode arcblock did as expected', () => {
      expect(decode('bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy')).toEqual(
        'zb2rhk6GMPQF3hfzwXTaNYFLKomMeC6UXdUt6jZKPpeVirLtV'
      );
    });

    test('should decode eth did as expected', () => {
      expect(decode('brxcsv2dqzzegurelbblcrxovgph7pghb')).toEqual(
        '0x8Dc52ae870CE486a448B085628Ddd533CfF798E1'.toLowerCase()
      );
    });
  });
});
