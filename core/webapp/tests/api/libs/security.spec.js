const { it, expect, describe, mock, beforeEach } = require('bun:test');
const {
  NODE_MODES,
  ROLES,
  SERVER_ROLES,
  SKIP_ACCESS_VERIFY_METHODS,
  STUDIO_ALLOWED_METHODS,
  SDK_ALLOWED_METHODS,
} = require('@abtnode/constant');
const { BLOCKLET_TENANT_MODES } = require('@blocklet/constant');

// @note: 在 jest-setup.js 和 global 设置均不能生效，所以在此处设置
process.env.ABT_NODE_SESSION_SECRET = '49bcf865c77a15993d87245b124bbc5125d2c3997437d1fda3';

const { protectGQL } = require('../../../api/libs/security');

const publicQuery = `{
  getNodeInfo {
    code
    info {
      autoUpgrade
      createdAt
      description
      did
      didDomain
      mode
      name
      nextVersion
      nftDomainUrl
      pk
      port
      registerUrl
      sessionSalt
      startedAt
      status
      upgradeSessionId
      uptime
      version
      webWalletUrl
    }
  }
}`;

describe('security.js', () => {
  let mockInstance;
  let mockReq;
  let mockRes;
  let mockNext;
  let mockGqlConfig;

  beforeEach(() => {
    mockInstance = {
      getNodeInfo: mock(),
      getRBAC: mock(),
      getUser: mock(),
    };

    mockReq = {
      query: {},
      body: {},
      user: null,
    };

    mockRes = {
      status: mock().mockReturnThis(),
      json: mock(),
    };

    mockNext = mock();

    mockGqlConfig = {
      testOperation: {
        permissions: ['test_permission'],
      },
    };
  });

  describe('protectGQL', () => {
    it('should return error when no query is provided', async () => {
      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 'invalid query',
        error: 'Please provide a valid query',
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockInstance.getNodeInfo).not.toHaveBeenCalled();
    });

    it('should allow whitelisted operations without user', async () => {
      mockReq.query.query = '{ getNodeInfo }';
      mockInstance.getNodeInfo.mockResolvedValue({ mode: NODE_MODES.DEBUG });

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should require user for non-whitelisted operations', async () => {
      mockReq.query.query = '{ testOperation }';
      mockInstance.getNodeInfo.mockResolvedValue({ mode: NODE_MODES.DEBUG });

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ code: 'forbidden', error: 'not allowed' });
    });

    it('should prevent batch mutations', async () => {
      mockReq.query.query = `
        mutation { testOperation }
        mutation { testOperation }
      `;
      mockReq.user = { role: ROLES.OWNER };
      mockInstance.getNodeInfo.mockResolvedValue({ mode: NODE_MODES.DEBUG });

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ code: 'forbidden', error: 'batch mutation not allowed' });
    });

    it('should block mutations during maintenance mode', async () => {
      mockReq.query.query = 'mutation { testOperation }';
      mockReq.user = { role: ROLES.OWNER };
      mockInstance.getNodeInfo.mockResolvedValue({ mode: NODE_MODES.MAINTENANCE });

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 'under maintenance',
        error: 'Blocklet server is under maintenance',
      });
    });

    it('should require elevated session for mutations when server session hardening is enabled', async () => {
      mockReq.query.query = 'mutation { testOperation }';
      mockReq.user = { role: ROLES.OWNER, elevated: false };
      mockInstance.getNodeInfo.mockResolvedValue({
        mode: NODE_MODES.DEBUG,
        enableSessionHardening: true,
      });
      mockReq.headers = { 'x-blocklet-did': '' };
      mockInstance.getUser.mockResolvedValue({
        connectedAccounts: [{ provider: 'passkey' }, { provider: 'wallet' }],
      });

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 'need verification',
        error: 'you need to verify your access as admin',
      });
    });

    it('should require elevated session for mutations when blocklet session hardening is enabled', async () => {
      mockReq.query.query = 'mutation { testOperation }';
      mockReq.user = { role: ROLES.OWNER, elevated: false, esh: true };
      mockInstance.getNodeInfo.mockResolvedValue({
        mode: NODE_MODES.DEBUG,
        enableSessionHardening: true,
      });
      mockReq.headers = { 'x-blocklet-did': 'did:abt:123' };
      mockInstance.getUser.mockResolvedValue({
        connectedAccounts: [{ provider: 'passkey' }, { provider: 'wallet' }],
      });

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 'need verification',
        error: 'you need to verify your access as admin',
      });
    });

    it('should check permissions for non-owner users', async () => {
      mockReq.query.query = '{ testOperation }';
      mockReq.user = { role: 'USER' };
      mockInstance.getNodeInfo.mockResolvedValue({ mode: NODE_MODES.DEBUG });
      mockInstance.getRBAC.mockResolvedValue({
        canAny: mock().mockResolvedValue(false),
      });

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ code: 'forbidden', error: 'no permission' });
    });

    it('should allow operations for users with proper permissions', async () => {
      mockReq.query.query = '{ testOperation }';
      mockReq.user = { role: 'USER' };
      mockInstance.getNodeInfo.mockResolvedValue({ mode: NODE_MODES.DEBUG });
      mockInstance.getRBAC.mockResolvedValue({
        canAny: mock().mockResolvedValue(true),
      });

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle invalid GraphQL queries', async () => {
      mockReq.query.query = 'invalid query';
      mockInstance.getNodeInfo.mockResolvedValue({ mode: NODE_MODES.DEBUG });

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'internal',
          error: expect.any(String),
        })
      );
    });

    it('should allow operations for multiple tenant mode users: query', async () => {
      mockReq.query.query = publicQuery;
      mockReq.user = {
        role: 'USER',
        tenantMode: BLOCKLET_TENANT_MODES.MULTIPLE,
      };
      mockInstance.getNodeInfo.mockResolvedValue({ mode: NODE_MODES.DEBUG });

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should skip access verification for whitelisted methods: query', async () => {
      const skipMethod = Object.keys(SKIP_ACCESS_VERIFY_METHODS)[0];
      mockReq.query.query = `{ ${skipMethod} }`;
      mockReq.user = { role: 'USER' };
      mockInstance.getNodeInfo.mockResolvedValue({ mode: NODE_MODES.DEBUG });

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockInstance.getRBAC).not.toHaveBeenCalled();
    });

    it('should allow studio methods for multiple tenant mode users: query', async () => {
      const studioMethod = Object.keys(STUDIO_ALLOWED_METHODS)[0];
      mockReq.query.query = `{ ${studioMethod} }`;
      mockReq.user = {
        role: 'USER',
        tenantMode: BLOCKLET_TENANT_MODES.MULTIPLE,
      };
      mockInstance.getNodeInfo.mockResolvedValue({ mode: NODE_MODES.DEBUG });

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockInstance.getRBAC).not.toHaveBeenCalled();
    });

    it('should check permissions for studio methods in single tenant mode: query', async () => {
      const studioMethod = Object.keys(STUDIO_ALLOWED_METHODS)[0];
      mockReq.query.query = `{ ${studioMethod} }`;
      mockReq.user = {
        role: 'USER',
        tenantMode: BLOCKLET_TENANT_MODES.SINGLE,
      };
      mockInstance.getNodeInfo.mockResolvedValue({ mode: NODE_MODES.DEBUG });
      mockInstance.getRBAC.mockResolvedValue({
        canAny: mock().mockResolvedValue(false),
      });

      // Add the studio method to mockGqlConfig with required permissions
      mockGqlConfig[studioMethod] = {
        permissions: ['studio_permission'],
      };

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ code: 'forbidden', error: 'no permission' });
    });

    it('should allow studio methods for users with proper permissions in single tenant mode', async () => {
      const studioMethod = Object.keys(STUDIO_ALLOWED_METHODS)[0];
      mockReq.query.query = `{ ${studioMethod} }`;
      mockReq.user = {
        role: 'USER',
        tenantMode: BLOCKLET_TENANT_MODES.SINGLE,
      };
      mockInstance.getNodeInfo.mockResolvedValue({ mode: NODE_MODES.DEBUG });
      mockInstance.getRBAC.mockResolvedValue({
        canAny: mock().mockResolvedValue(true),
      });

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow operations for multiple tenant mode users: mutation', async () => {
      const studioMethod = Object.keys(STUDIO_ALLOWED_METHODS)[0];
      mockReq.query.query = `mutation { ${studioMethod} }`;
      mockReq.user = {
        role: 'USER',
        tenantMode: BLOCKLET_TENANT_MODES.MULTIPLE,
        elevated: true,
      };
      mockInstance.getNodeInfo.mockResolvedValue({
        mode: NODE_MODES.DEBUG,
        enableSessionHardening: true,
      });

      // Add the studio method to mockGqlConfig with required permissions
      mockGqlConfig[studioMethod] = {
        permissions: ['studio_permission'],
      };

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should skip access verification for whitelisted methods: mutation', async () => {
      const skipMethod = Object.keys(SKIP_ACCESS_VERIFY_METHODS)[0];
      mockReq.query.query = `mutation { ${skipMethod} }`;
      mockReq.user = {
        role: 'USER',
        elevated: true,
      };
      mockInstance.getNodeInfo.mockResolvedValue({
        mode: NODE_MODES.DEBUG,
        enableSessionHardening: true,
      });

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockInstance.getRBAC).not.toHaveBeenCalled();
    });

    it('should allow studio methods for multiple tenant mode users: mutation', async () => {
      const studioMethod = Object.keys(STUDIO_ALLOWED_METHODS)[0];
      mockReq.query.query = `mutation { ${studioMethod} }`;
      mockReq.user = {
        role: 'USER',
        tenantMode: BLOCKLET_TENANT_MODES.MULTIPLE,
        elevated: true,
      };
      mockInstance.getNodeInfo.mockResolvedValue({
        mode: NODE_MODES.DEBUG,
        enableSessionHardening: true,
      });

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockInstance.getRBAC).not.toHaveBeenCalled();
    });

    it('should check permissions for studio methods in single tenant mode: mutation', async () => {
      const studioMethod = Object.keys(STUDIO_ALLOWED_METHODS)[0];
      mockReq.query.query = `mutation { ${studioMethod} }`;
      mockReq.user = {
        role: 'USER',
        tenantMode: BLOCKLET_TENANT_MODES.SINGLE,
        elevated: true,
      };
      mockInstance.getNodeInfo.mockResolvedValue({
        mode: NODE_MODES.DEBUG,
        enableSessionHardening: true,
      });
      mockInstance.getRBAC.mockResolvedValue({
        canAny: mock().mockResolvedValue(false),
      });

      // Add the studio method to mockGqlConfig with required permissions
      mockGqlConfig[studioMethod] = {
        permissions: ['studio_permission'],
      };

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ code: 'forbidden', error: 'no permission' });
    });

    it('should allow studio methods for users with proper permissions in single tenant mode: mutation', async () => {
      const studioMethod = Object.keys(STUDIO_ALLOWED_METHODS)[0];
      mockReq.query.query = `mutation { ${studioMethod} }`;
      mockReq.user = {
        role: 'USER',
        tenantMode: BLOCKLET_TENANT_MODES.SINGLE,
        elevated: true,
      };
      mockInstance.getNodeInfo.mockResolvedValue({
        mode: NODE_MODES.DEBUG,
        enableSessionHardening: true,
      });
      mockInstance.getRBAC.mockResolvedValue({
        canAny: mock().mockResolvedValue(true),
      });

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow SDK methods for blocklet SDK users without permission check: query', async () => {
      const sdkMethod = Object.keys(SDK_ALLOWED_METHODS)[0];
      mockReq.query.query = `{ ${sdkMethod} }`;
      mockReq.user = {
        role: SERVER_ROLES.BLOCKLET_SDK,
      };
      mockInstance.getNodeInfo.mockResolvedValue({ mode: NODE_MODES.DEBUG });

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockInstance.getRBAC).not.toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should require permission check for non-SDK methods with blocklet SDK role: query', async () => {
      mockReq.query.query = '{ testOperation }';
      mockReq.user = {
        role: SERVER_ROLES.BLOCKLET_SDK,
      };
      mockInstance.getNodeInfo.mockResolvedValue({ mode: NODE_MODES.DEBUG });
      mockInstance.getRBAC.mockResolvedValue({
        canAny: mock().mockResolvedValue(false),
      });

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ code: 'forbidden', error: 'no permission' });
      expect(mockInstance.getRBAC).toHaveBeenCalled();
    });

    it('should allow SDK methods for blocklet SDK users even when some operations require permissions: query', async () => {
      const sdkMethod = Object.keys(SDK_ALLOWED_METHODS)[0];
      mockReq.query.query = `{ ${sdkMethod} }`;
      mockReq.user = {
        role: SERVER_ROLES.BLOCKLET_SDK,
      };
      mockInstance.getNodeInfo.mockResolvedValue({ mode: NODE_MODES.DEBUG });

      // Add the SDK method to mockGqlConfig with required permissions
      mockGqlConfig[sdkMethod] = {
        permissions: ['sdk_permission'],
      };

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockInstance.getRBAC).not.toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should require elevated session for mutations when server session hardening is enabled: studio method', async () => {
      // Use a non-studio method to ensure session hardening check is triggered
      mockReq.query.query = 'mutation { testOperation }';
      mockReq.user = {
        role: 'USER',
        tenantMode: BLOCKLET_TENANT_MODES.SINGLE,
        elevated: false,
      };
      mockInstance.getNodeInfo.mockResolvedValue({
        mode: NODE_MODES.DEBUG,
        enableSessionHardening: true,
      });
      mockReq.headers = { 'x-blocklet-did': '' };
      mockInstance.getUser.mockResolvedValue({
        connectedAccounts: [{ provider: 'passkey' }, { provider: 'wallet' }],
      });

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 'need verification',
        error: 'you need to verify your access as admin',
      });
    });

    it('should require elevated session for mutations when blocklet session hardening is enabled: studio method', async () => {
      // Use a non-studio method to ensure session hardening check is triggered
      mockReq.query.query = 'mutation { testOperation }';
      mockReq.user = {
        role: 'USER',
        tenantMode: BLOCKLET_TENANT_MODES.SINGLE,
        elevated: false,
        esh: true,
      };
      mockInstance.getNodeInfo.mockResolvedValue({
        mode: NODE_MODES.DEBUG,
        enableSessionHardening: true,
      });
      mockReq.headers = { 'x-blocklet-did': 'did:abt:123' };
      mockInstance.getUser.mockResolvedValue({
        connectedAccounts: [{ provider: 'passkey' }, { provider: 'wallet' }],
      });

      const middleware = protectGQL(mockInstance, mockGqlConfig);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 'need verification',
        error: 'you need to verify your access as admin',
      });
    });
  });
});
