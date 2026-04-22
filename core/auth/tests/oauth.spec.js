const { mock, expect, describe, beforeEach, it } = require('bun:test');
const { checkInvitedUserOnly } = require('../lib/oauth');

describe('OAuth', () => {
  let mockNode;

  beforeEach(() => {
    // Reset all mocks
    mock.restore();

    // Setup common mocks
    mockNode = {
      getNodeInfo: mock(() => Promise.resolve({ did: 'nodeDid' })),
      getUser: mock(() =>
        Promise.resolve({
          did: 'userDid',
          fullName: 'Test User',
          passports: [],
        })
      ),
      getSessionSecret: mock(() => Promise.resolve('secret')),
      createAuditLog: mock(() => Promise.resolve({})),
      getUsersCount: mock(() => Promise.resolve(0)),
    };
  });

  describe('checkInvitedUserOnly', () => {
    it('should return false for first user', async () => {
      mockNode.getUsersCount.mockResolvedValue(0);
      const result = await checkInvitedUserOnly({}, mockNode, 'teamDid');
      expect(result).toBe(false);
    });

    it('should return false when no access policy is set', async () => {
      mockNode.getUsersCount.mockResolvedValue(1);
      const result = await checkInvitedUserOnly({}, mockNode, 'teamDid');
      expect(result).toBe(false);
    });

    it('should return true when access policy is set with roles', async () => {
      mockNode.getUsersCount.mockResolvedValue(1);
      const config = {
        accessPolicy: {
          roles: ['user'],
          reverse: false,
        },
      };
      const result = await checkInvitedUserOnly(config, mockNode, 'teamDid');
      expect(result).toBe(true);
    });

    it('should return true when access policy is set with reverse', async () => {
      mockNode.getUsersCount.mockResolvedValue(1);
      const config = {
        accessPolicy: {
          roles: null,
          reverse: true,
        },
      };
      const result = await checkInvitedUserOnly(config, mockNode, 'teamDid');
      expect(result).toBe(true);
    });
  });
});
