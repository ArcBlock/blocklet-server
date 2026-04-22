const { describe, test, expect } = require('bun:test');
const { utils } = require('../../../api/libs/connect/session');

const { checkAppOwner } = utils;

describe(__filename, () => {
  describe('checkAppOwner', () => {
    test('should be work as expected', async () => {
      const errData = {
        role: 'owner',
        userDid: 'abc',
        blocklet: { meta: { did: 'abc' }, settings: { initialized: true, owner: { did: 'def' } } },
        node: {
          getUser: () => ({
            connectedAccounts: [],
          }),
        },
      };
      expect(checkAppOwner(errData)).rejects.toThrow('Only the app owner can access this');
      expect(checkAppOwner({ ...errData, locale: 'zh' })).rejects.toThrow('你不是该应用的所有者');

      const result = await checkAppOwner({
        role: 'owner',
        userDid: 'abc',
        blocklet: { meta: { did: 'abc' }, settings: { initialized: true, owner: { did: 'abc' } } },
        node: {
          getUser: () => ({
            connectedAccounts: [{ did: 'abc' }],
          }),
        },
      });
      expect(result).toBeUndefined();
    });
  });
});
