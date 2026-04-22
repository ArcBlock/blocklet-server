// const auth = require('@abtnode/auth/lib/auth');

const { describe, beforeEach, expect, it, mock, afterAll, spyOn } = require('bun:test');

mock.module('jsonwebtoken', () => {
  return {
    verify: mock(() => true),
    sign: mock(() => 'mocked-token'),
  };
});
const auth = require('@abtnode/auth/lib/auth');

mock.module('@abtnode/auth/lib/auth', () => ({
  ...auth,
  createAuthToken: mock(() => 'mocked-token'),
}));
mock.module('@blocklet/sdk/lib/util/login', () => ({
  encodeKycStatus: mock(),
  decodeKycStatus: mock(),
}));

const jwt = require('jsonwebtoken');
const { LOGIN_PROVIDER } = require('@blocklet/constant');
const { encodeKycStatus, decodeKycStatus } = require('@blocklet/sdk/lib/util/login');
const { createAuthToken } = require('@abtnode/auth/lib/auth');
const initJwt = require('../../api/libs/jwt');

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

describe('jwt', () => {
  let mockNode;

  beforeEach(() => {
    mockNode = {
      getUserByDid: mock(),
      isPassportValid: mock(),
      getRole: mock(),
    };
    spyOn(jwt, 'verify').mockImplementation((token, secret, callback) => callback(null, {}));
    encodeKycStatus.mockReturnValue(0);
    decodeKycStatus.mockReturnValue({ emailVerified: false, phoneVerified: false });
  });

  afterAll(() => {
    mock.restore();
    mock.clearAllMocks();
  });

  describe('getUser', () => {
    it('should return user if approved', async () => {
      const user = { approved: true };
      mockNode.getUserByDid.mockResolvedValue(user);
      const result = await initJwt.getUser(mockNode, 'teamDid', 'userDid');
      expect(result).toBe(user);
    });

    it('should return null if user not approved', async () => {
      mockNode.getUserByDid.mockResolvedValue({ approved: false });
      const result = await initJwt.getUser(mockNode, 'teamDid', 'userDid');
      expect(result).toBeNull();
    });
  });

  describe('initJwt', () => {
    let jwtInstance;

    beforeEach(() => {
      jwtInstance = initJwt(mockNode, { sessionTtl: '2d' });
    });

    describe('createSessionToken', () => {
      it('should create a session token', () => {
        const token = jwtInstance.createSessionToken('did', {
          role: 'user',
          secret: 'secret',
          passport: { id: 'passportId' },
          expiresIn: '1h',
          tokenType: 'access',
          fullName: 'John Doe',
          provider: LOGIN_PROVIDER.WALLET,
          walletOS: 'iOS',
          emailVerified: true,
          phoneVerified: false,
        });

        expect(createAuthToken).toHaveBeenCalledWith(
          expect.objectContaining({
            did: 'did',
            role: 'user',
            secret: 'secret',
            expiresIn: '1h',
            tokenType: 'access',
            fullName: 'John Doe',
            provider: LOGIN_PROVIDER.WALLET,
            walletOS: 'iOS',
            kyc: 0,
          })
        );
        expect(token).toBe('mocked-token');
      });
    });

    describe('verifySessionToken', () => {
      it('should verify a valid token', async () => {
        const user = { did: 'userDid', approved: true, emailVerified: true, phoneVerified: false };
        mockNode.getUserByDid.mockResolvedValue(user);
        mockNode.isPassportValid.mockResolvedValue(true);

        jwt.verify.mockImplementation((token, secret, callback) =>
          callback(null, { did: 'userDid', role: 'user', passport: { id: 'passportId', name: 'passport' } })
        );

        const result = await jwtInstance.verifySessionToken('token', 'secret', {
          checkFromDb: true,
          teamDid: 'teamDid',
        });
        expect(result).toEqual(
          expect.objectContaining({
            did: 'userDid',
            role: 'user',
            approved: true,
            passport: { id: 'passportId', name: 'passport' },
          })
        );
      });

      it('should reject for invalid token', async () => {
        jwt.verify.mockImplementation((token, secret, callback) => callback(new Error('Invalid token')));

        await expect(jwtInstance.verifySessionToken('token', 'secret')).rejects.toThrow('Invalid token');
      });

      it('should reject for invalid did', async () => {
        jwt.verify.mockImplementation((token, secret, callback) => callback(null, {}));

        await expect(jwtInstance.verifySessionToken('token', 'secret')).rejects.toThrow(
          'Invalid jwt token: invalid did'
        );
      });

      it('should reject for unapproved user', async () => {
        mockNode.getUserByDid.mockResolvedValue({ approved: false });
        jwt.verify.mockImplementation((token, secret, callback) => callback(null, { did: 'userDid' }));

        await expect(
          jwtInstance.verifySessionToken('token', 'secret', { checkFromDb: true, teamDid: 'teamDid' })
        ).rejects.toThrow('Invalid jwt token: invalid user');
      });

      it('should reject for revoked passport', async () => {
        mockNode.getUserByDid.mockResolvedValue({ approved: true });
        mockNode.isPassportValid.mockResolvedValue(false);
        jwt.verify.mockImplementation((token, secret, callback) =>
          callback(null, {
            did: 'userDid',
            passport: { id: 'passportId', name: 'passport', issuer: { name: 'issuer' } },
          })
        );

        await expect(
          jwtInstance.verifySessionToken('token', 'secret', { checkFromDb: true, teamDid: 'teamDid' })
        ).rejects.toThrow('Passport passport has been revoked by issuer');
      });

      it('should use custom checkFromDb function', async () => {
        const customCheck = mock(() => false);
        jwt.verify.mockImplementation((token, secret, callback) => callback(null, { did: 'userDid' }));

        const result = await jwtInstance.verifySessionToken('token', 'secret', { checkFromDb: customCheck });
        expect(customCheck).toHaveBeenCalled();
        expect(result).toEqual(expect.objectContaining({ did: 'userDid' }));
      });

      it('should use custom checkToken function', async () => {
        const customCheck = mock(() => true);
        jwt.verify.mockImplementation((token, secret, callback) => callback(null, { did: 'userDid' }));

        await jwtInstance.verifySessionToken('token', 'secret', { checkToken: customCheck });
        expect(customCheck).toHaveBeenCalled();
      });

      it('should reject if custom checkToken function throws', async () => {
        const customCheck = mock(() => {
          throw new Error('Custom check failed');
        });
        jwt.verify.mockImplementation((token, secret, callback) => callback(null, { did: 'userDid' }));

        await expect(jwtInstance.verifySessionToken('token', 'secret', { checkToken: customCheck })).rejects.toThrow(
          'Custom check failed'
        );
      });
    });
  });
});
