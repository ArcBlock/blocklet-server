/* eslint-disable global-require */
const { describe, it, expect, mock, beforeEach, afterAll } = require('bun:test');

const tokenHolderValidateMock = mock(() => ({}));
const isValidMock = mock(() => true);
const isFromPublicKeyMock = mock(() => true);
const getBlockletAppIdListMock = mock(() => []);
const verifyVaultMock = mock(() => true);

mock.module('@arcblock/validator', () => ({
  schemas: {
    tokenHolder: {
      validate: tokenHolderValidateMock,
    },
  },
}));

mock.module('@arcblock/did', () => ({
  __esModule: true,
  isValid: isValidMock,
  isFromPublicKey: isFromPublicKeyMock,
}));

mock.module('@blocklet/meta/lib/util', () => ({
  getBlockletAppIdList: getBlockletAppIdListMock,
}));

mock.module('@blocklet/meta/lib/security', () => ({
  verifyVault: verifyVaultMock,
}));

mock.module('@abtnode/logger', () => {
  const info = mock();
  const error = mock();

  const fn = mock(() => {
    return {
      info,
      error,
    };
  });

  return {
    __esModule: true,
    default: fn,
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const didMock = require('@arcblock/did');

didMock.isValid = isValidMock;
didMock.isFromPublicKey = isFromPublicKeyMock;

const validatorMock = require('@arcblock/validator');

validatorMock.schemas.tokenHolder.validate = tokenHolderValidateMock;

const utilMock = require('@blocklet/meta/lib/util');

utilMock.getBlockletAppIdList = getBlockletAppIdListMock;

const securityMock = require('@blocklet/meta/lib/security');

securityMock.verifyVault = verifyVaultMock;

const {
  validateVault,
  validateSession,
  configVault,
  commitVault,
  approveVault,
} = require('../../../lib/blocklet/security/vault');

describe('Vault Security Tests', () => {
  let mockNode;

  beforeEach(() => {
    mock.clearAllMocks();
    isValidMock.mockImplementation(() => true);
    isFromPublicKeyMock.mockImplementation(() => true);
    tokenHolderValidateMock.mockImplementation(() => ({}));
    getBlockletAppIdListMock.mockImplementation(() => []);
    verifyVaultMock.mockImplementation(() => true);

    mockNode = {
      getBlocklet: mock(),
      getSession: mock(),
      startSession: mock(),
      endSession: mock(),
      updateBlockletVault: mock(),
      createAuditLog: mock(),
      getUser: mock(),
    };
  });

  beforeEach(() => {
    mock.clearAllMocks();
    isValidMock.mockImplementation(() => true);
    isFromPublicKeyMock.mockImplementation(() => true);
    tokenHolderValidateMock.mockImplementation(() => ({}));
    getBlockletAppIdListMock.mockImplementation(() => []);
    verifyVaultMock.mockImplementation(() => true);
  });

  describe('validateVault', () => {
    const validVaultDid = 'did:abt:valid_vault';
    const validTeamDid = 'did:abt:valid_team';

    it('should throw error for invalid vault did', async () => {
      isValidMock.mockReturnValue(false);
      await expect(validateVault(mockNode, 'invalid-did', validTeamDid)).rejects.toThrow('Invalid vault did');
    });

    it('should throw error for invalid vault did type', async () => {
      isValidMock.mockReturnValue(true);
      tokenHolderValidateMock.mockReturnValue({ error: new Error('invalid type') });
      await expect(validateVault(mockNode, validVaultDid, validTeamDid)).rejects.toThrow('Invalid vault did type');
    });

    it('should throw error when blocklet not found', async () => {
      isValidMock.mockReturnValue(true);
      tokenHolderValidateMock.mockReturnValue({});
      mockNode.getBlocklet.mockResolvedValue(null);

      await expect(validateVault(mockNode, validVaultDid, validTeamDid)).rejects.toThrow('Blocklet not found');
    });

    it('should throw error when vault did matches blocklet app id', async () => {
      isValidMock.mockReturnValue(true);
      tokenHolderValidateMock.mockReturnValue({});
      mockNode.getBlocklet.mockResolvedValue({ appDid: 'some-did' });
      getBlockletAppIdListMock.mockReturnValue([validVaultDid]);

      await expect(validateVault(mockNode, validVaultDid, validTeamDid)).rejects.toThrow(
        'Can not use current blocklet did as vault'
      );
    });

    it('should throw error when adding same vault twice', async () => {
      isValidMock.mockReturnValue(true);
      tokenHolderValidateMock.mockReturnValue({});
      mockNode.getBlocklet.mockResolvedValue({
        appDid: 'some-did',
        vaults: [{ did: validVaultDid }],
      });
      getBlockletAppIdListMock.mockReturnValue([]);

      await expect(validateVault(mockNode, validVaultDid, validTeamDid)).rejects.toThrow(
        'Can not add same vault twice'
      );
    });

    it('should throw error when vault history verification fails', async () => {
      isValidMock.mockReturnValue(true);
      tokenHolderValidateMock.mockReturnValue({});
      mockNode.getBlocklet.mockResolvedValue({
        appDid: 'some-did',
        vaults: [{ did: 'other-did' }],
      });
      getBlockletAppIdListMock.mockReturnValue([]);
      verifyVaultMock.mockResolvedValue(false);

      await expect(validateVault(mockNode, validVaultDid, validTeamDid)).rejects.toThrow(
        'Vault history verification failed'
      );
    });

    it('should successfully validate vault', async () => {
      const mockBlocklet = {
        appDid: 'some-did',
        vaults: [{ did: 'other-did' }],
      };
      isValidMock.mockReturnValue(true);
      tokenHolderValidateMock.mockReturnValue({});
      mockNode.getBlocklet.mockResolvedValue(mockBlocklet);
      getBlockletAppIdListMock.mockReturnValue([]);
      verifyVaultMock.mockResolvedValue(true);

      const result = await validateVault(mockNode, validVaultDid, validTeamDid);
      expect(result).toEqual(mockBlocklet);
    });
  });

  describe('validateSession', () => {
    const validSessionId = 'valid-session-id';

    it('should throw error when session not found', async () => {
      mockNode.getSession.mockResolvedValue(null);
      await expect(validateSession(mockNode, validSessionId)).rejects.toThrow('Vault config session not found');
    });

    it('should throw error for invalid session type', async () => {
      mockNode.getSession.mockResolvedValue({ type: 'wrong-type' });
      await expect(validateSession(mockNode, validSessionId)).rejects.toThrow('Vault config session type mismatch');
    });

    it('should throw error for invalid vault did', async () => {
      mockNode.getSession.mockResolvedValue({
        type: 'configVault',
        vaultDid: 'invalid-did',
        teamDid: 'valid-did',
      });
      isValidMock.mockReturnValueOnce(false);
      await expect(validateSession(mockNode, validSessionId)).rejects.toThrow('Invalid vault did');
    });

    it('should throw error for invalid team did', async () => {
      mockNode.getSession.mockResolvedValue({
        type: 'configVault',
        vaultDid: 'valid-did',
        teamDid: 'invalid-did',
      });
      isValidMock.mockReturnValueOnce(true).mockReturnValueOnce(false);
      await expect(validateSession(mockNode, validSessionId)).rejects.toThrow('Invalid team did');
    });

    it('should successfully validate session', async () => {
      const mockSession = {
        type: 'configVault',
        vaultDid: 'valid-did',
        teamDid: 'valid-did',
      };
      mockNode.getSession.mockResolvedValue(mockSession);
      isValidMock.mockReturnValue(true);

      const result = await validateSession(mockNode, validSessionId);
      expect(result).toEqual(mockSession);
    });
  });

  describe('configVault', () => {
    it('should create new vault config session', async () => {
      const mockSession = { id: 'new-session-id' };
      const params = {
        teamDid: 'team-did',
        vaultDid: 'vault-did',
      };
      const context = { user: 'test' };

      isValidMock.mockReturnValue(true);
      tokenHolderValidateMock.mockReturnValue({});
      mockNode.getBlocklet.mockResolvedValue({ appDid: 'some-did', vaults: [] });
      getBlockletAppIdListMock.mockReturnValue([]);

      mockNode.startSession.mockResolvedValue(mockSession);

      const result = await configVault(mockNode, params, context);
      expect(result).toBe(mockSession.id);
      expect(mockNode.startSession).toHaveBeenCalledWith({
        data: {
          type: 'configVault',
          vaultDid: params.vaultDid,
          teamDid: params.teamDid,
          context,
        },
      });
    });
  });

  describe('commitVault', () => {
    const validParams = {
      sessionId: 'valid-session',
      userDid: 'user-did',
      userPk: 'user-pk',
      signature: 'valid-sig',
    };

    it('should throw error when public key and did mismatch', async () => {
      isFromPublicKeyMock.mockReturnValue(false);
      await expect(commitVault(mockNode, validParams)).rejects.toThrow('Vault pk and did mismatch');
    });

    it('should throw error when user did does not match vault did', async () => {
      isFromPublicKeyMock.mockReturnValue(true);
      mockNode.getSession.mockResolvedValue({
        type: 'configVault',
        vaultDid: 'different-did',
        teamDid: 'team-did',
      });
      isValidMock.mockReturnValue(true);

      await expect(commitVault(mockNode, validParams)).rejects.toThrow('Vault did not match');
    });

    it('should successfully commit vault configuration', async () => {
      const mockSession = {
        type: 'configVault',
        vaultDid: validParams.userDid,
        teamDid: 'team-did',
        context: { user: 'test' },
        approverSig: 'approver-sig',
        approverDid: 'approver-did',
        approverPk: 'approver-pk',
      };

      isFromPublicKeyMock.mockReturnValue(true);
      isValidMock.mockReturnValue(true);
      tokenHolderValidateMock.mockReturnValue({});
      mockNode.getSession.mockResolvedValue(mockSession);
      mockNode.getBlocklet.mockResolvedValue({ appDid: 'app-did', vaults: [] });
      getBlockletAppIdListMock.mockReturnValue([]);
      verifyVaultMock.mockResolvedValue(true);
      mockNode.getUser.mockResolvedValue({
        did: 'approver-did',
        sourceProvider: 'wallet',
        connectedAccounts: [{ did: 'approver-did', provider: 'wallet' }],
      });

      await commitVault(mockNode, validParams);

      expect(mockNode.updateBlockletVault).toHaveBeenCalled();
      expect(mockNode.endSession).toHaveBeenCalled();
      expect(mockNode.createAuditLog).toHaveBeenCalled();
    });
  });

  describe('approveVault', () => {
    const validParams = {
      sessionId: 'valid-session',
      userDid: 'user-did',
      userPk: 'user-pk',
      signature: 'valid-sig',
    };

    it('should throw error when public key and did mismatch', async () => {
      isFromPublicKeyMock.mockReturnValue(false);
      await expect(approveVault(mockNode, validParams)).rejects.toThrow('approver pk and did mismatch');
    });

    it('should throw error when session validation fails', async () => {
      isFromPublicKeyMock.mockReturnValue(true);
      mockNode.getSession.mockResolvedValue(null);
      await expect(approveVault(mockNode, validParams)).rejects.toThrow('Vault config session not found');
    });

    it('should throw error when blocklet owner is missing for first vault', async () => {
      isFromPublicKeyMock.mockReturnValue(true);
      mockNode.getSession.mockResolvedValue({
        type: 'configVault',
        vaultDid: 'vault-did',
        teamDid: 'team-did',
        context: { user: 'test' },
      });
      isValidMock.mockReturnValue(true);
      tokenHolderValidateMock.mockReturnValue({});

      mockNode.getBlocklet.mockResolvedValue({
        appDid: 'app-did',
        vaults: [],
        settings: {},
      });
      getBlockletAppIdListMock.mockReturnValue([]);

      await expect(approveVault(mockNode, validParams)).rejects.toThrow(
        'Blocklet owner must present before approve vault'
      );
    });

    it('should throw error when blocklet owner is not found', async () => {
      isFromPublicKeyMock.mockReturnValue(true);
      mockNode.getSession.mockResolvedValue({
        type: 'configVault',
        vaultDid: 'vault-did',
        teamDid: 'team-did',
        context: { user: 'test' },
      });
      isValidMock.mockReturnValue(true);
      tokenHolderValidateMock.mockReturnValue({});

      mockNode.getBlocklet.mockResolvedValue({
        appDid: 'app-did',
        vaults: [],
        settings: { owner: { did: 'owner-did' } },
      });
      getBlockletAppIdListMock.mockReturnValue([]);

      mockNode.getUser.mockResolvedValue(null);

      await expect(approveVault(mockNode, validParams)).rejects.toThrow('Blocklet owner not found: owner-did');
    });

    it('should throw error when user is not the app owner for first vault', async () => {
      isFromPublicKeyMock.mockReturnValue(true);
      mockNode.getSession.mockResolvedValue({
        type: 'configVault',
        vaultDid: 'vault-did',
        teamDid: 'team-did',
        context: { user: 'test' },
      });
      isValidMock.mockReturnValue(true);
      tokenHolderValidateMock.mockReturnValue({});

      mockNode.getBlocklet.mockResolvedValue({
        appDid: 'app-did',
        vaults: [],
        settings: { owner: { did: 'owner-did' } },
      });
      getBlockletAppIdListMock.mockReturnValue([]);

      mockNode.getUser.mockResolvedValue({
        did: 'owner-did',
        sourceProvider: 'wallet',
        connectedAccounts: [{ did: 'different-did', provider: 'wallet' }],
      });

      await expect(approveVault(mockNode, validParams)).rejects.toThrow(
        'You must be the app owner to approve vault change'
      );
    });

    it('should throw error when user is not the last vault owner', async () => {
      isFromPublicKeyMock.mockReturnValue(true);
      mockNode.getSession.mockResolvedValue({
        type: 'configVault',
        vaultDid: 'vault-did',
        teamDid: 'team-did',
        context: { user: 'test' },
      });
      isValidMock.mockReturnValue(true);
      tokenHolderValidateMock.mockReturnValue({});

      mockNode.getBlocklet.mockResolvedValue({
        appDid: 'app-did',
        vaults: [{ did: 'last-vault-did' }],
        settings: { owner: { did: 'owner-did' } },
      });
      getBlockletAppIdListMock.mockReturnValue([]);

      await expect(approveVault(mockNode, validParams)).rejects.toThrow(
        'You must be the last vault owner to approve vault change'
      );
    });

    it('should successfully approve vault as app owner for first vault', async () => {
      isFromPublicKeyMock.mockReturnValue(true);
      const mockSession = {
        type: 'configVault',
        vaultDid: 'vault-did',
        teamDid: 'team-did',
        context: { user: 'test' },
      };
      mockNode.getSession.mockResolvedValue(mockSession);
      isValidMock.mockReturnValue(true);
      tokenHolderValidateMock.mockReturnValue({});

      mockNode.getBlocklet.mockResolvedValue({
        appDid: 'app-did',
        vaults: [],
        settings: { owner: { did: 'owner-did' } },
      });
      getBlockletAppIdListMock.mockReturnValue([]);

      mockNode.getUser.mockResolvedValue({
        did: 'owner-did',
        sourceProvider: 'wallet',
        connectedAccounts: [{ did: validParams.userDid, provider: 'wallet' }],
      });

      mockNode.updateSession = mock().mockResolvedValue({});

      await approveVault(mockNode, validParams);

      expect(mockNode.updateSession).toHaveBeenCalledWith({
        id: validParams.sessionId,
        data: {
          approverSig: validParams.signature,
          approverDid: validParams.userDid,
          approverPk: validParams.userPk,
        },
      });
    });

    it('should successfully approve vault as last vault owner', async () => {
      isFromPublicKeyMock.mockReturnValue(true);
      const mockSession = {
        type: 'configVault',
        vaultDid: 'vault-did',
        teamDid: 'team-did',
        context: { user: 'test' },
      };
      mockNode.getSession.mockResolvedValue(mockSession);
      isValidMock.mockReturnValue(true);
      tokenHolderValidateMock.mockReturnValue({});

      mockNode.getBlocklet.mockResolvedValue({
        appDid: 'app-did',
        vaults: [{ did: validParams.userDid }],
        settings: { owner: { did: 'owner-did' } },
      });
      getBlockletAppIdListMock.mockReturnValue([]);

      mockNode.updateSession = mock().mockResolvedValue({});

      await approveVault(mockNode, validParams);

      expect(mockNode.updateSession).toHaveBeenCalledWith({
        id: validParams.sessionId,
        data: {
          approverSig: validParams.signature,
          approverDid: validParams.userDid,
          approverPk: validParams.userPk,
        },
      });
    });
  });
});
