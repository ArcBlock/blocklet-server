const { describe, expect, test } = require('bun:test');
const { isNFTExpired } = require('../lib/nft');

describe('nft', () => {
  describe('isNFTExpired', () => {
    test('should return false if NFT has not expired', () => {
      const nft = {
        data: {
          value: { expirationDate: ['3022-11-29T04:26:47.447Z'] },
        },
      };

      expect(isNFTExpired(nft)).toEqual(false);
    });

    test('should return true if NFT has expired', () => {
      const nft = {
        data: {
          value: { expirationDate: ['1022-11-29T04:26:47.447Z'] },
        },
      };

      expect(isNFTExpired(nft)).toEqual(true);
    });
  });
});
