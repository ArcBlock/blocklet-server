/* eslint-disable no-unused-vars */
const Mcrypto = require('@ocap/mcrypto');
const { test, expect, describe, it } = require('bun:test');
const { fromRandom, WalletType } = require('@ocap/wallet');
const { toBase58 } = require('@ocap/util');
const jwt = require('jsonwebtoken');
const { SERVER_ROLES } = require('@abtnode/constant');
// eslint-disable-next-line
const { LOGIN_PROVIDER } = require('@blocklet/constant');

const { Auth } = require('../lib');

const {
  messages,
  getUser,
  createAuthToken,
  createInvitationRequest,
  handleInvitationResponse,
  createIssuePassportRequest,
  handleIssuePassportResponse,
  getVCFromClaims,
  checkWalletVersion,
  checkWalletVersionForMigrateAppToV2,
  getPassportStatusEndpoint,
  getPassportStatus,
  validatePassportStatus,
  beforeInvitationRequest,
  createBlockletControllerAuthToken,
  canSessionBeElevated,
} = Auth;

const { getServerAuthMethod } = require('../lib/util/get-auth-method');

const noop = () => {};

const user1Wallet = fromRandom();
const user1Did = user1Wallet.address;

const user2Wallet = fromRandom();
const user2Did = user2Wallet.address;

const nodeWallet = fromRandom(
  WalletType({
    role: Mcrypto.types.RoleType.ROLE_APPLICATION,
    pk: Mcrypto.types.KeyType.ED25519,
    hash: Mcrypto.types.HashType.SHA3,
  })
);
const nodeDid = nodeWallet.address;

const nodeInfo = {
  sk: nodeWallet.secretKey,
  pk: nodeWallet.publicKey,
  did: nodeDid,
  name: 'ABT Node(test)',
  version: '1.0.0',
  routing: {
    adminPath: '/admin',
  },
};

const createNode = () => {
  const issuanceSessions = [
    { id: 'mockId1', name: 'admin', ownerDid: user1Did },
    { id: 'mockId2', name: 'admin', ownerDid: user2Did },
  ];
  const users = [
    { did: user1Did, pk: user1Wallet.publicKey, avatar: 'bn://avatar/user1.png', approved: true },
    { did: user2Did, pk: user2Wallet.publicKey, avatar: 'bn://avatar/user2.png', approved: false },
  ];
  return {
    getUser({ teamDid, user }) {
      return users.find((x) => x.did === user.did);
    },
    updateUser({ teamDid, user }) {
      const index = users.findIndex((x) => x.did === user.did);
      if (index >= 0) {
        Object.assign(users[index], user);
      }
    },
    getPassportIssuances({ teamDid }) {
      return issuanceSessions;
    },
    processPassportIssuance({ teamDid, sessionId }) {
      return issuanceSessions.find((x) => x.id === sessionId);
    },
    getRoles({ teamDid }) {
      return [
        { name: 'owner', title: 'Owner' },
        { name: 'admin', title: 'Admin' },
      ];
    },
    createAuditLog: noop,
    dataDirs: {
      data: './',
    },
    getSessionSecret: () => '1234567890',
    getInvitation: ({ teamDid, inviteId }) => {
      return {
        inviteId,
        passportExpireTime: '',
      };
    },
    createPassportLog: ({ teamDid }) => {
      return {};
    },
  };
};

describe('getUser', () => {
  test('should work as expected', async () => {
    const node = createNode();

    const u1 = await getUser(node, nodeDid, user1Did);
    expect(u1).toBeTruthy();
    expect(u1.did).toBe(user1Did);

    const u2 = await getUser(node, nodeDid, user2Did);
    expect(u2).toBeTruthy();
  });
});

describe('issue passport', () => {
  test('should createIssuePassportRequest work as expected', async () => {
    const node = createNode();

    const claimRequest = await createIssuePassportRequest({
      node,
      nodeInfo,
      teamDid: nodeDid,
      id: 'mockId1',
      baseUrl: 'http://www.arcblock.io',
    });

    expect(claimRequest).toHaveProperty('description');
    expect(claimRequest).toHaveProperty('data');
    expect(claimRequest).toHaveProperty('type');
    expect(claimRequest).toHaveProperty('display');
  });

  test('should handleIssuePassportResponse work as expected', async () => {
    const node = createNode();

    const u1 = await getUser(node, nodeDid, user1Did);
    expect(u1.passports).toBeFalsy();

    const { response, role, passport } = await handleIssuePassportResponse({
      node,
      nodeInfo,
      teamDid: nodeDid,
      userDid: user1Did,
      userPk: user1Wallet.publicKey,
      id: 'mockId1',
      claims: [
        {
          type: 'signature',
          origin: '123',
          sig: await user1Wallet.sign('123'),
        },
      ],
      statusEndpointBaseUrl: 'http://status.a.io',
      updateSession: noop,
      endpoint: 'http://a.io',
    });

    expect(passport.role).toBe('admin');
    expect(passport.status).toBe('valid');
    expect(passport.endpoint).toBe('http://a.io');
    expect(passport.id).toBeTruthy();
    expect(passport.type).toEqual(expect.arrayContaining(['NFTPassport']));
    expect(role).toBe('admin');

    expect(response.disposition).toBe('attachment');
    expect(response.type).toBe('VerifiableCredential');
    expect(response.data).toHaveProperty('proof');
    expect(response.data).toHaveProperty('@context');
    expect(response.data).toHaveProperty('id');
    expect(response.data.type).toEqual(expect.arrayContaining(['NFTPassport']));
    expect(response.data.issuer.id).toBe(nodeDid);
    expect(response.data.credentialSubject.id).toBe(user1Did);
    expect(response.data.credentialSubject.passport.name).toBe('admin');
    expect(response.data.credentialSubject.passport.endpoint).toBe('http://a.io');
    expect(response.data.credentialStatus.id).toBe(
      `http://status.a.io/api/passport/status?userDid=${user1Did}&teamDid=${nodeDid}`
    );

    const u2 = await getUser(node, nodeDid, user1Did);
    expect(u2.passports.length).toBe(1);
  });
});

describe('createAuthToken', () => {
  test('should be a function', () => {
    expect(typeof createAuthToken).toBe('function');
  });
  test('should work as expected', (done) => {
    const token = createAuthToken({ did: 'did1', secret: '123', expiresIn: '1h', provider: LOGIN_PROVIDER.WALLET });
    jwt.verify(token, '123', (err, decoded) => {
      expect(err).toBeFalsy();
      expect(decoded).toEqual({
        type: 'user',
        did: 'did1',
        iat: expect.any(Number),
        exp: decoded.iat + 3600,
        provider: LOGIN_PROVIDER.WALLET,
        kyc: 0,
        elevated: false,
      });
      done();
    });
  });
  test('skip unknown', (done) => {
    const token = createAuthToken({ did: 'did1', secret: '123', unknown: 'xxx', expiresIn: '1h' });
    jwt.verify(token, '123', (_err, decoded) => {
      expect(decoded).toEqual({
        type: 'user',
        did: 'did1',
        iat: expect.any(Number),
        exp: expect.any(Number),
        provider: LOGIN_PROVIDER.WALLET,
        kyc: 0,
        elevated: false,
      });
      done();
    });
  });
  test('token type', (done) => {
    const token = createAuthToken({
      did: 'did1',
      secret: '123',
      tokenType: 'refresh',
      expiresIn: '1h',
      provider: LOGIN_PROVIDER.AUTH0,
    });
    jwt.verify(token, '123', (_err, decoded) => {
      expect(decoded).toEqual({
        type: 'user',
        did: 'did1',
        tokenType: 'refresh',
        iat: expect.any(Number),
        exp: expect.any(Number),
        provider: LOGIN_PROVIDER.AUTH0,
        kyc: 0,
        elevated: false,
      });
      done();
    });
  });
  test('role & passport type', (done) => {
    const token = createAuthToken({
      did: 'did1',
      secret: '123',
      role: 'admin',
      passport: { id: 'xxx', unknown: 'should skip' },
      expiresIn: '1h',
    });
    jwt.verify(token, '123', (_err, decoded) => {
      expect(decoded).toEqual({
        type: 'user',
        did: 'did1',
        role: 'admin',
        passport: {
          id: 'xxx',
        },
        iat: expect.any(Number),
        exp: expect.any(Number),
        provider: LOGIN_PROVIDER.WALLET,
        kyc: 0,
        elevated: false,
      });
      done();
    });
  });
  test('expiresIn is required', () => {
    expect(() => createAuthToken({ did: 'did1', secret: '123' })).toThrow('expiresIn');
  });
  test('fullName type', (done) => {
    const token = createAuthToken({ did: 'did1', secret: '123', expiresIn: '1h', fullName: 'xxx', elevated: true });
    jwt.verify(token, '123', (_err, decoded) => {
      expect(decoded).toEqual({
        type: 'user',
        did: 'did1',
        fullName: 'xxx',
        iat: expect.any(Number),
        exp: expect.any(Number),
        provider: LOGIN_PROVIDER.WALLET,
        kyc: 0,
        elevated: true,
      });
      done();
    });
  });
});

describe('getVCFromClaims', () => {
  test('should be a function', () => {
    expect(typeof getVCFromClaims).toBe('function');
  });
});

describe('invite member', () => {
  test('beforeInvitationRequest', () => {
    const node = {
      getInvitation: ({ inviteId }) => (inviteId === 'i1' ? { inviteId: 'i1' } : null),
      getUsersCount: ({ teamDid }) => (teamDid === 't1' ? 1 : 0),
      checkInvitation: ({ teamDid, inviteId }) => {
        if (teamDid === 't1') {
          if (inviteId === 'i2') {
            throw new Error('The invitation link does not exist or has been used');
          }
        }
        if (teamDid === 't2') {
          throw new Error('The Application has no owner attached');
        }
      },
    };

    expect(beforeInvitationRequest({ node, teamDid: 't1', inviteId: 'i1' })).resolves.toBeUndefined();
    // FIXME: 这个测试用例是否需要保留？统一使用 node.checkInvitation 来判断之后，这个 case 好像已经没意义了
    expect(beforeInvitationRequest({ node, teamDid: 't1', inviteId: 'i2' })).rejects.toThrow(
      'The invitation link does not exist or has been used'
    );
    expect(beforeInvitationRequest({ node, teamDid: 't2', inviteId: 'i1' })).rejects.toThrow(
      'The Application has no owner attached'
    );
  });

  test('should be a function', () => {
    expect(typeof createInvitationRequest).toBe('function');
    expect(typeof handleInvitationResponse).toBe('function');
  });
});

describe('checkWalletVersion', () => {
  test('should work as expected', () => {
    expect(() => checkWalletVersion({ didwallet: { os: 'android', version: '0.0.1' } })).toThrowError();
    expect(() => checkWalletVersion({ didwallet: { os: 'ios', version: '0.0.1' } })).toThrowError();
    expect(() => checkWalletVersion({ didwallet: { os: 'web', version: '0.0.1' } })).toThrowError();
    expect(() => checkWalletVersion({ didwallet: { os: 'unknown', version: '0.0.1' } })).toThrowError();

    expect(checkWalletVersion({ didwallet: { os: 'android', version: '99.99.99' } })).toBeTruthy();
    expect(checkWalletVersion({ didwallet: { os: 'ios', version: '99.99.99' } })).toBeTruthy();
    expect(checkWalletVersion({ didwallet: { os: 'web', version: '99.99.99' } })).toBeTruthy();
    expect(checkWalletVersion({ didwallet: { os: 'unknown', version: '99.99.99' } })).toBeTruthy();

    expect(
      checkWalletVersion({
        didwallet: { os: 'android', version: '99.99.99' },
        expected: { android: '99.99.99', ios: '100.0.0', web: '100.0.0' },
      })
    ).toBeTruthy();
    expect(() =>
      checkWalletVersion({ didwallet: { os: 'android', version: '99.99.99' }, expected: { android: '100.0.0' } })
    ).toThrowError();
    expect(
      checkWalletVersion({ didwallet: { os: 'web', version: '99.99.99' }, expected: { android: '1.0.1' } })
    ).toBeTruthy();

    // unknown os will use default expected version
    expect(
      checkWalletVersion({
        didwallet: { os: 'unknown', version: '99.99.99' },
        expected: { android: '100.0.0', ios: '100.0.0', web: '100.0.0' },
      })
    ).toBeTruthy();
  });
  test('checkWalletVersionForMigrateAppToV2', () => {
    expect(() =>
      checkWalletVersionForMigrateAppToV2({ didwallet: { os: 'android', version: '4.0.0' } })
    ).toThrowError();
    expect(() => checkWalletVersionForMigrateAppToV2({ didwallet: { os: 'ios', version: '4.0.0' } })).toThrowError();
    expect(() => checkWalletVersionForMigrateAppToV2({ didwallet: { os: 'web', version: '4.0.0' } })).toThrowError();

    expect(checkWalletVersionForMigrateAppToV2({ didwallet: { os: 'android', version: '5.0.0' } })).toBeTruthy();
    expect(checkWalletVersionForMigrateAppToV2({ didwallet: { os: 'ios', version: '5.0.0' } })).toBeTruthy();
    expect(checkWalletVersionForMigrateAppToV2({ didwallet: { os: 'web', version: '5.0.0' } })).toBeTruthy();
  });
});

describe('getPassportStatusEndpoint', () => {
  test('should work as expected', () => {
    expect(getPassportStatusEndpoint({ baseUrl: 'http://a.io', userDid: '1', teamDid: '2' })).toBe(
      'http://a.io/api/passport/status?userDid=1&teamDid=2'
    );
  });
});

describe('getPassportStatus', () => {
  const users = [
    { did: '1', passports: [{ id: 'vc1', name: 'admin', status: 'valid' }], approved: true },
    { did: '2', passports: [{ id: 'vc2', name: 'admin', status: 'revoked' }], approved: true },
    { did: '3', passports: [{ id: 'vc3', name: 'admin', status: 'valid' }], approved: false },
  ];
  const node = {
    getNodeInfo: () => nodeInfo,
    getUser: ({ teamDid, user: { did } }) => users.find((x) => x.did === did),
    dataDirs: { data: './' },
    getSessionSecret: () => '1234567890',
  };

  test('should work as expected', async () => {
    // valid
    const res1 = await getPassportStatus({ node, teamDid: nodeInfo.did, userDid: '1', vcId: 'vc1', locale: 'en' });
    expect(res1.id).toBe('vc1');
    expect(res1.statusList[0].issuer).toEqual({
      id: nodeInfo.did,
      pk: toBase58(nodeInfo.pk),
      name: nodeInfo.name,
    });
    expect(res1.statusList[0].claim.name).toBe('passport-status');
    expect(res1.statusList[0].claim.label).toBe('Status');
    expect(res1.statusList[0].claim.value).toBe('valid');
    expect(res1.statusList[0].claim.reason).toBeFalsy();

    // passport is revoked, i18n
    const res2 = await getPassportStatus({ node, teamDid: nodeInfo.did, userDid: '2', vcId: 'vc2', locale: 'zh' });
    expect(res2.id).toBe('vc2');
    expect(res2.statusList[0].claim.label).toBe('状态');
    expect(res2.statusList[0].claim.value).toBe('revoked');
    expect(res2.statusList[0].claim.reason).toBeTruthy();

    // user is revoked
    const res3 = await getPassportStatus({ node, teamDid: nodeInfo.did, userDid: '3', vcId: 'vc3' });
    expect(res3.id).toBe('vc3');
    expect(res3.statusList[0].claim.value).toBe('revoked');
  });

  test('should throw error', async () => {
    // user does not exist
    await expect(
      getPassportStatus({ node, teamDid: nodeInfo.did, userDid: 'no-exist', vcId: 'vc1', locale: 'en' })
    ).rejects.toBeTruthy();

    // passport does not exist
    await expect(
      getPassportStatus({ node, teamDid: nodeInfo.did, userDid: '1', vcId: '2', locale: 'en' })
    ).rejects.toBeTruthy();
  });
});

describe('validatePassportStatus', () => {
  test('should be a function', () => {
    expect(typeof validatePassportStatus).toBe('function');
  });
});

describe('getServerAuthMethod', () => {
  test('should return vc when initialized', () => {
    expect(getServerAuthMethod({ initialized: true })).toBe('vc');
    expect(getServerAuthMethod({})).toBe('vc');
  });

  test('should return nft when from launcher and not initialized', () => {
    expect(
      getServerAuthMethod({
        initialized: false,
        ownerNft: { issuer: 'a', holder: 'b' },
        launcher: { tag: 'c', chainHost: 'd', did: 'a' },
      })
    ).toBe('nft');
  });
});

test('createBlockletControllerAuthToken', (done) => {
  const token = createBlockletControllerAuthToken({
    did: 'abc',
    role: 'external-blocklet-controller',
    controller: { id: 'xxx' },
    secret: 'secret',
    expiresIn: '1d',
  });

  jwt.verify(token, 'secret', (err, decoded) => {
    expect(err).toBeFalsy();
    expect(decoded).toEqual(
      expect.objectContaining({
        type: 'blocklet_controller',
        did: 'abc',
        role: 'external-blocklet-controller',
        controller: { id: 'xxx' },
      })
    );
    done();
  });
});

describe('auth messages has key', () => {
  const funcKeys = {
    invalidCredentialType: 1,
    invalidCredentialId: 1,
    passportRevoked: 1,
    passportStatusCheckFailed: 1,
  };

  const ignoreKeys = {
    cannotImportFromDidSpace: 1,
    destroySelf: 1,
    userNotExist: 1,
    notAllowedToDelete: 1,
    notAllowedToDeleteOwner: 1,
    passportNotAllowedToUse: 1,
  };

  test('auth messages has key', () => {
    const keys = Object.keys(messages);
    keys.forEach((key) => {
      if (ignoreKeys[key]) {
        return;
      }

      const localMap = messages[key];
      expect(localMap).toBeDefined();
      ['en', 'zh'].forEach((language) => {
        if (funcKeys[key]) {
          expect(typeof localMap[language]).toEqual('function');
        } else {
          expect(typeof localMap[language]).toEqual('string');
          expect(localMap[language].length > 0).toBeTruthy();
        }
      });
    });
  });
});

describe('canSessionBeElevated', () => {
  // Test when session hardening is disabled
  it('should return false when enableSessionHardening is false', () => {
    const info = { enableSessionHardening: false };
    const result = canSessionBeElevated(SERVER_ROLES.OWNER, info);
    expect(result).toBe(false);
  });

  // Test when session hardening is enabled
  describe('when enableSessionHardening is true', () => {
    const info = { enableSessionHardening: true };

    // Test all valid roles
    const validRoles = [
      SERVER_ROLES.OWNER,
      SERVER_ROLES.ADMIN,
      SERVER_ROLES.MEMBER,
      SERVER_ROLES.CI,
      SERVER_ROLES.BLOCKLET_OWNER,
      SERVER_ROLES.BLOCKLET_ADMIN,
      SERVER_ROLES.BLOCKLET_MEMBER,
      SERVER_ROLES.BLOCKLET_SDK,
    ];

    validRoles.forEach((role) => {
      it(`should return true for role ${role}`, () => {
        const result = canSessionBeElevated(role, info);
        expect(result).toBe(true);
      });
    });

    // Test invalid role
    it('should return false for invalid role', () => {
      const result = canSessionBeElevated('INVALID_ROLE', info);
      expect(result).toBe(false);
    });

    // Test undefined role
    it('should return false for undefined role', () => {
      const result = canSessionBeElevated(undefined, info);
      expect(result).toBe(false);
    });
  });
});
