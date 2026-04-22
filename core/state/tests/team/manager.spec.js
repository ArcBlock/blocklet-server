const { describe, test, expect, beforeAll, afterAll } = require('bun:test');
const { fromRandom } = require('@ocap/wallet');

const { setupInstance, tearDownInstance } = require('../../tools/fixture');

describe('TeamManager', () => {
  let instance = null;
  let teamManager = null;
  let teamAPI = null;
  let nodeDid = '';

  // 共享 setupInstance - 只调用一次，而不是 3 次
  beforeAll(async () => {
    instance = await setupInstance('team-manager');
    teamManager = instance.teamManager;
    teamAPI = instance.teamAPI;
    nodeDid = (await instance.states.node.read()).did;
  });

  afterAll(async () => {
    await tearDownInstance(instance);
  });

  describe('Basic', () => {
    describe('getNotificationReceivers', () => {
      test('should return empty array when no parameters provided', async () => {
        const result = await teamManager.getNotificationReceivers({
          teamDid: nodeDid,
        });

        expect(result).toEqual([]);
      });

      test('should return empty array when empty arrays provided', async () => {
        const result = await teamManager.getNotificationReceivers({
          teamDid: nodeDid,
          userDids: [],
          roles: [],
        });

        expect(result).toEqual([]);
      });
    });
  });

  describe('Error Handling', () => {
    describe('getNotificationReceivers', () => {
      test('should handle non-existent users gracefully', async () => {
        const nonExistentDid = fromRandom().address;
        const result = await teamManager.getNotificationReceivers({
          teamDid: nodeDid,
          userDids: [nonExistentDid],
        });

        // Should return empty array for non-existent users
        expect(result).toEqual([]);
      });

      test('should throw error for invalid teamDid', async () => {
        const invalidTeamDid = fromRandom().address;

        await expect(
          teamManager.getNotificationReceivers({
            teamDid: invalidTeamDid,
            userDids: [fromRandom().address],
          })
        ).rejects.toThrow();
      });
    });
  });

  describe('Parameters', () => {
    describe('getNotificationReceivers', () => {
      test('should respect selection parameter structure', async () => {
        const result = await teamManager.getNotificationReceivers({
          teamDid: nodeDid,
          userDids: [],
          selection: { did: 1, email: 1 },
        });

        expect(result).toEqual([]);
      });

      test('should respect includeConnectedAccounts parameter structure', async () => {
        const result = await teamManager.getNotificationReceivers({
          teamDid: nodeDid,
          userDids: [],
          includeConnectedAccounts: true,
        });

        expect(result).toEqual([]);
      });

      test('should handle roles parameter when empty', async () => {
        const result = await teamManager.getNotificationReceivers({
          teamDid: nodeDid,
          roles: ['non-existent-role'],
        });

        expect(result).toEqual([]);
      });
    });
  });

  describe('getOwnerAndAdminUsers', () => {
    test('should exclude users with revoked admin passports', async () => {
      const wallet = fromRandom();
      const user = {
        did: wallet.address,
        pk: wallet.publicKey,
        name: 'AdminUser',
      };

      const passport = {
        id: `passport-${Date.now()}`,
        type: ['NFTPassport', 'VerifiableCredential'],
        issuer: {
          id: 'zNKf2ZJqsZNYrCKUjTCqwVjiPtk8Axq8tqU9',
          name: 'ArcBlock Team',
          pk: 'zH594bV5vaL4jjLKWq6eZ1ao3uLCFVUzyfr4RZRrcKc5y',
        },
        issuanceDate: '2022-11-21T03:40:32.731Z',
        endpoint: 'https://team.arcblock.io',
        name: 'admin',
        specVersion: '1.0.0',
        title: 'Admin',
        status: 'valid',
        role: 'admin',
      };

      // Add user with a valid admin passport
      await teamAPI.addUser({
        teamDid: nodeDid,
        user: { did: user.did, pk: user.pk, name: user.name, approved: true, passports: [passport] },
      });

      // Should include user with valid admin passport
      const result1 = await teamManager.getOwnerAndAdminUsers(nodeDid, true);
      expect(result1.some((u) => u.did === user.did)).toBe(true);

      // Revoke passport
      await teamAPI.revokeUserPassport({ teamDid: nodeDid, userDid: user.did, passportId: passport.id });

      // Should exclude user with revoked admin passport
      const result2 = await teamManager.getOwnerAndAdminUsers(nodeDid, true);
      expect(result2.some((u) => u.did === user.did)).toBe(false);
    });
  });
});
