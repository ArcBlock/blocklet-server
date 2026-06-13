const { test, expect, describe } = require('bun:test');
const { isValid } = require('@arcblock/did');
const { getBlockletKnownAs } = require('../../../lib/util/blocklet/did-document');

describe('did-document', () => {
  describe('getBlockletKnownAs', () => {
    const appDid = 'zNKn3GFQLhVjX88QHoxpWrjZKcSFgSn8BfH6';
    const appPid = 'zNKq9Pa6Uxn6f1TsjoNBeRBbawaKXL2EQqCf';

    test('should emit `did:abt:` aliases, not `did:0:`/`did:1:`', () => {
      // regression: `.map(toDid)` passed the array index as toDid's `method` arg (@ocap/util),
      // producing `did:0:`/`did:1:` which the DID registry rejects
      const result = getBlockletKnownAs({ appDid, appPid, meta: { did: appDid } });

      expect(result).toEqual([`did:abt:${appDid}`]);
      result.forEach((did) => {
        expect(did.startsWith('did:abt:')).toBe(true);
        expect(isValid(did)).toBe(true);
      });
    });

    test('should include migratedFrom aliases as valid dids', () => {
      const migratedDid = 'zNKaT2cjMMW4Js3hnBWUKPcdboQqrPUTWRat';
      const result = getBlockletKnownAs({
        appDid,
        appPid,
        meta: { did: appDid },
        migratedFrom: [{ appDid: migratedDid }],
      });

      expect(result).toContain(`did:abt:${appDid}`);
      expect(result).toContain(`did:abt:${migratedDid}`);
      result.forEach((did) => expect(isValid(did)).toBe(true));
    });
  });
});
