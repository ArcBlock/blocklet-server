/* eslint-disable no-await-in-loop */
const { it, test, expect, describe, mock, beforeEach } = require('bun:test');
const { SERVER_ROLES, NODE_MODES, BLOCKLET_ROLES } = require('@abtnode/constant');
const { CustomError } = require('@blocklet/error');

const verifyTeam = require('../../../api/gql/middlewares/verify-team');
const verifyBlocklet = require('../../../api/gql/middlewares/verify-blocklet');
const mutateBlocklet = require('../../../api/gql/middlewares/mutate-blocklet');
const addBlockletStore = require('../../../api/gql/middlewares/add-blocklet-store');
const verifyDestroySession = require('../../../api/gql/middlewares/verify-destroy-session');

describe('verifyTeam', () => {
  test('should pass', () => {
    verifyTeam({ teamDid: 'BlockletA' }, { user: { blockletDid: 'BlockletA', role: 'blocklet-sdk' } });
    verifyTeam({ teamDid: 'BlockletA' }, { user: { blockletDid: 'BlockletA', role: 'blocklet-admin' } });
    verifyTeam({ teamDid: 'ABTNode' }, { user: { did: 'UserDid', role: 'admin' } });
  });

  test('should failed', () => {
    expect(() =>
      verifyTeam({ teamDid: 'BlockletA' }, { user: { blockletDid: 'BlockletB', role: 'blocklet-sdk' } })
    ).toThrowError("You cannot request other blocklet's data");

    expect(() =>
      verifyTeam({ teamDid: 'BlockletA' }, { user: { did: 'BlockletA', role: 'blocklet-admin' } })
    ).toThrowError("You cannot request other blocklet's data");

    expect(() =>
      verifyTeam({ teamDid: 'BlockletA' }, { user: { blockletDid: 'BlockletB', role: 'blocklet-admin' } })
    ).toThrowError("You cannot request other blocklet's data");
  });
});

describe('verifyBlocklet', () => {
  test('should pass', () => {
    verifyBlocklet({ did: 'BlockletA' }, { user: { blockletDid: 'BlockletA', role: 'blocklet-admin' } });

    verifyBlocklet({ teamDid: 'BlockletA' }, { user: { blockletDid: 'BlockletA', role: 'blocklet-admin' } });

    verifyBlocklet(
      { rootDid: 'BlockletA', did: 'ChildBLockletDid' },
      { user: { blockletDid: 'BlockletA', role: 'blocklet-admin' } }
    );

    verifyBlocklet(
      { did: ['BlockletA', 'ChildBlockletDid'] },
      { user: { blockletDid: 'BlockletA', role: 'blocklet-admin' } }
    );

    verifyBlocklet({ scope: 'BlockletA' }, { user: { blockletDid: 'BlockletA', role: 'blocklet-admin' } });

    // not blocklet role
    verifyBlocklet({ did: 'ABTNode' }, { user: { did: 'UserDid', role: 'admin' } });
  });

  test('should failed', () => {
    expect(() =>
      verifyBlocklet({ did: 'BlockletA' }, { user: { blockletDid: 'BlockletB', role: 'blocklet-admin' } })
    ).toThrowError("You cannot request other blocklet's data");

    expect(() =>
      verifyBlocklet(
        { rootDid: 'BlockletA', did: 'BlockletB' },
        { user: { blockletDid: 'BlockletB', role: 'blocklet-admin' } }
      )
    ).toThrowError("You cannot request other blocklet's data");
  });
});

describe('mutateBlocklet', () => {
  const mockNode = blocklet => ({ getBlocklet: mock().mockResolvedValue(blocklet) });

  test('should do nothing if server mode is not serverless', async () => {
    await mutateBlocklet({}, { nodeMode: NODE_MODES.PRODUCTION });
  });

  test(`should do nothing if role is one of ${BLOCKLET_ROLES.join(',')} in serverless mode`, async () => {
    for (const role of BLOCKLET_ROLES) {
      const context = {
        nodeMode: NODE_MODES.SERVERLESS,
        user: {
          role,
          blockletDid: 'BlockletA',
        },
      };
      await mutateBlocklet({}, context, mockNode({ controller: true }));
    }
  });

  test(`should throw error if role is not one of ${BLOCKLET_ROLES.join(',')} in serverless mode`, async () => {
    const notAllowedRoleNames = Object.keys(SERVER_ROLES).filter(name => !BLOCKLET_ROLES.includes(SERVER_ROLES[name]));

    for (const name of notAllowedRoleNames) {
      const context = {
        nodeMode: NODE_MODES.SERVERLESS,
        user: {
          role: SERVER_ROLES[name],
          blockletDid: 'BlockletA',
        },
      };
      await expect(mutateBlocklet({}, context, mockNode({ controller: true }))).rejects.toThrow(
        /Serverless mode does not allow to mutate blocklet/i
      );
    }
  });

  describe('async/await and blockletDid extraction', () => {
    const allowedRole = BLOCKLET_ROLES[0];
    const notAllowedRole = SERVER_ROLES.ADMIN;
    const baseContext = {
      nodeMode: NODE_MODES.SERVERLESS,
      user: { role: allowedRole },
    };

    it('should extract blockletDid from rootDid', async () => {
      await expect(
        mutateBlocklet({ rootDid: 'did:root' }, baseContext, mockNode({ controller: true }))
      ).resolves.toBeUndefined();
    });
    it('should extract blockletDid from teamDid', async () => {
      await expect(
        mutateBlocklet({ teamDid: 'did:team' }, baseContext, mockNode({ controller: true }))
      ).resolves.toBeUndefined();
    });
    it('should extract blockletDid from scope', async () => {
      await expect(
        mutateBlocklet({ scope: 'did:scope' }, baseContext, mockNode({ controller: true }))
      ).resolves.toBeUndefined();
    });
    it('should extract blockletDid from did (string)', async () => {
      await expect(
        mutateBlocklet({ did: 'did:single' }, baseContext, mockNode({ controller: true }))
      ).resolves.toBeUndefined();
    });
    it('should extract blockletDid from did (array)', async () => {
      await expect(
        mutateBlocklet({ did: ['did:arr', 'did:other'] }, baseContext, mockNode({ controller: true }))
      ).resolves.toBeUndefined();
    });
    it('should use context.user.blockletDid if present', async () => {
      await expect(
        mutateBlocklet(
          {},
          { ...baseContext, user: { ...baseContext.user, blockletDid: 'did:ctx' } },
          mockNode({ controller: true })
        )
      ).resolves.toBeUndefined();
    });
    it('should throw if blockletDid cannot be determined', async () => {
      await expect(mutateBlocklet({}, baseContext, mockNode({ controller: true }), 'testAction')).rejects.toThrow(
        /missing or invalid blocklet DID for testAction/
      );
    });
    it('should do nothing if blocklet is not found or has no controller', async () => {
      await expect(mutateBlocklet({ rootDid: 'did:root' }, baseContext, mockNode(undefined))).resolves.toBeUndefined();
      await expect(mutateBlocklet({ rootDid: 'did:root' }, baseContext, mockNode({}))).resolves.toBeUndefined();
    });
    it('should throw if role is not allowed and blocklet is internal', async () => {
      const context = { ...baseContext, user: { ...baseContext.user, role: notAllowedRole } };
      await expect(mutateBlocklet({ rootDid: 'did:root' }, context, mockNode({ controller: true }))).rejects.toThrow(
        /Serverless mode does not allow to mutate blocklet/
      );
    });
    it('should not throw if role is allowed and blocklet is internal', async () => {
      await expect(
        mutateBlocklet({ rootDid: 'did:root' }, baseContext, mockNode({ controller: true }))
      ).resolves.toBeUndefined();
    });
  });
});

describe('addBlockletStore', () => {
  test('should do nothing if server mode is not serverless', () => {
    addBlockletStore({}, { nodeMode: NODE_MODES.DEBUG });
    addBlockletStore({}, { nodeMode: NODE_MODES.MAINTENANCE });
    addBlockletStore({}, { nodeMode: NODE_MODES.PRODUCTION });
  });

  test('should do nothing if the user is server manager and server mode is serverless', () => {
    const allowedRoleNames = Object.keys(SERVER_ROLES).filter(name => !BLOCKLET_ROLES.includes(SERVER_ROLES[name]));

    allowedRoleNames.forEach(name => {
      const context = {
        nodeMode: NODE_MODES.SERVERLESS,
        user: {
          role: SERVER_ROLES[name],
        },
      };

      addBlockletStore({}, context);
    });
  });

  test('should throw error if server mode is serverless', () => {
    expect(() => addBlockletStore({}, { nodeMode: NODE_MODES.SERVERLESS, user: {} })).toThrow(
      /Serverless mode does not allow to add blocklet store/i
    );

    BLOCKLET_ROLES.forEach(name => {
      const context = {
        nodeMode: NODE_MODES.SERVERLESS,
        user: {
          role: SERVER_ROLES[name],
        },
      };

      expect(() => addBlockletStore({}, context).toThrow(/Serverless mode does not allow to add blocklet store/i));
    });
  });
});

describe('verifyDestroySession middleware', () => {
  let mockStates;
  let mockContext;
  let mockSession;

  let mockGetUser;
  let mockGetNodeInfo;

  beforeEach(() => {
    // Reset environment variables
    delete process.env.VITE_NO_MFA_PROTECTED_METHODS;
    delete process.env.NODE_ENV;

    // Setup mock session state
    mockSession = {
      operator: 'did:123',
      type: 'destroy',
      action: 'testAction',
      input: { testKey: 'testValue' },
    };

    // Setup mock states
    mockStates = {
      session: {
        read: mock().mockResolvedValue(mockSession),
        end: mock().mockResolvedValue(),
      },
    };

    // Setup mock context
    mockContext = {
      user: {
        did: 'did:123',
      },
    };

    mockGetUser = mock().mockResolvedValue({
      did: 'did:123',
      connectedAccounts: [{ provider: 'wallet' }],
    });
    mockGetNodeInfo = mock().mockResolvedValue({
      did: 'did:123',
    });
  });

  it('should skip verification when VITE_NO_MFA_PROTECTED_METHODS is set', async () => {
    process.env.VITE_NO_MFA_PROTECTED_METHODS = 'true';
    await expect(
      verifyDestroySession({}, {}, { states: mockStates, getUser: mockGetUser, getNodeInfo: mockGetNodeInfo }, '')
    ).resolves.toBeUndefined();
  });

  it('should skip verification in test environment', async () => {
    process.env.NODE_ENV = 'test';
    await expect(
      verifyDestroySession({}, {}, { states: mockStates, getUser: mockGetUser, getNodeInfo: mockGetNodeInfo }, '')
    ).resolves.toBeUndefined();
  });

  it('should throw error when sessionId is missing', async () => {
    await expect(
      verifyDestroySession(
        {},
        mockContext,
        { states: mockStates, getUser: mockGetUser, getNodeInfo: mockGetNodeInfo },
        'testAction'
      )
    ).rejects.toThrow(new CustomError(400, 'Operation session is required'));
  });

  it('should throw error when session is not found', async () => {
    mockStates.session.read.mockResolvedValue(null);
    await expect(
      verifyDestroySession(
        { sessionId: '123' },
        mockContext,
        { states: mockStates, getUser: mockGetUser, getNodeInfo: mockGetNodeInfo },
        'testAction'
      )
    ).rejects.toThrow(new CustomError(404, 'Operation session not found'));
  });

  it('should throw error when user did is missing', async () => {
    mockContext.user = {};
    await expect(
      verifyDestroySession(
        { sessionId: '123' },
        mockContext,
        { states: mockStates, getUser: mockGetUser, getNodeInfo: mockGetNodeInfo },
        'testAction'
      )
    ).rejects.toThrow(new CustomError(403, 'Operation session user mismatch'));
  });

  it('should throw error when operator mismatch', async () => {
    mockContext.user.did = 'different:did';
    await expect(
      verifyDestroySession(
        { sessionId: '123' },
        mockContext,
        { states: mockStates, getUser: mockGetUser, getNodeInfo: mockGetNodeInfo },
        'testAction'
      )
    ).rejects.toThrow(new CustomError(403, 'Operation session user mismatch'));
  });

  it('should throw error when session type is not destroy', async () => {
    mockSession.type = 'other';
    await expect(
      verifyDestroySession(
        { sessionId: '123' },
        mockContext,
        { states: mockStates, getUser: mockGetUser, getNodeInfo: mockGetNodeInfo },
        'testAction'
      )
    ).rejects.toThrow(new CustomError(403, 'Operation session not valid'));
  });

  it('should throw error when action mismatch', async () => {
    await expect(
      verifyDestroySession(
        { sessionId: '123' },
        mockContext,
        { states: mockStates, getUser: mockGetUser, getNodeInfo: mockGetNodeInfo },
        'differentAction'
      )
    ).rejects.toThrow(new CustomError(403, 'Operation session not valid'));
  });

  it('should throw error when input values mismatch', async () => {
    await expect(
      verifyDestroySession(
        { sessionId: '123', testKey: 'differentValue' },
        mockContext,
        { states: mockStates, getUser: mockGetUser, getNodeInfo: mockGetNodeInfo },
        'testAction'
      )
    ).rejects.toThrow(new CustomError(403, 'Operation session input mismatch: testKey'));
  });

  it('should successfully verify and end session when all checks pass', async () => {
    await expect(
      verifyDestroySession(
        { sessionId: '123', testKey: 'testValue' },
        mockContext,
        { states: mockStates, getUser: mockGetUser, getNodeInfo: mockGetNodeInfo },
        'testAction'
      )
    ).resolves.toBeUndefined();

    expect(mockStates.session.end).toHaveBeenCalledWith('123');
  });

  it('should successfully verify while user has no valid connectAccount all checks pass', async () => {
    await expect(
      verifyDestroySession(
        { sessionId: '123', testKey: 'testValue' },
        { ...mockContext, user: { ...mockContext.user, blockletDid: 'BlockletA' } },
        {
          states: mockStates,
          getUser: mock().mockResolvedValue({
            connectedAccount: [{ provider: 'email' }],
          }),
          getNodeInfo: mockGetNodeInfo,
        },
        'testAction'
      )
    ).resolves.toBeUndefined();

    expect(mockStates.session.end).not.toHaveBeenCalled();
  });
});
