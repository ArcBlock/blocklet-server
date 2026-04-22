const { describe, expect, beforeEach, it, mock } = require('bun:test');
const { checkPermissions, wrapToolHandler } = require('../../../api/services/mcp/server');

describe('checkPermissions', () => {
  const mockContext = {
    user: {
      did: 'test-did',
      role: 'owner',
      provider: 'oauth',
      method: 'loginToken',
    },
  };

  it('should return true when no policy is provided', () => {
    expect(checkPermissions(mockContext)).toBe(true);
  });

  it('should return false when no user in context', () => {
    expect(
      checkPermissions(
        {},
        {
          deny: {
            dids: ['test-did'],
          },
        }
      )
    ).toBe(false);
  });

  describe('deny rules', () => {
    it('should deny access when user DID is in deny list', () => {
      const policy = {
        deny: {
          dids: ['test-did'],
        },
      };
      expect(checkPermissions(mockContext, policy)).toBe(false);
    });

    it('should deny access when user role is in deny list', () => {
      const policy = {
        deny: {
          roles: ['owner'],
        },
      };
      expect(checkPermissions(mockContext, policy)).toBe(false);
    });

    it('should deny access when user provider is in deny list', () => {
      const policy = {
        deny: {
          providers: ['oauth'],
        },
      };
      expect(checkPermissions(mockContext, policy)).toBe(false);
    });

    it('should deny access when user method is in deny list', () => {
      const policy = {
        deny: {
          methods: ['loginToken'],
        },
      };
      expect(checkPermissions(mockContext, policy)).toBe(false);
    });
  });

  describe('allow rules', () => {
    it('should allow access when no specific allow rules are provided', () => {
      const policy = {
        allow: {},
      };
      expect(checkPermissions(mockContext, policy)).toBe(true);
    });

    it('should allow access when user DID is in allow list', () => {
      const policy = {
        allow: {
          dids: ['test-did'],
        },
      };
      expect(checkPermissions(mockContext, policy)).toBe(true);
    });

    it('should allow access when user role is in allow list', () => {
      const policy = {
        allow: {
          roles: ['owner'],
        },
      };
      expect(checkPermissions(mockContext, policy)).toBe(true);
    });

    it('should allow access when user provider is in allow list', () => {
      const policy = {
        allow: {
          providers: ['oauth'],
        },
      };
      expect(checkPermissions(mockContext, policy)).toBe(true);
    });

    it('should allow access when user method is in allow list', () => {
      const policy = {
        allow: {
          methods: ['loginToken'],
        },
      };
      expect(checkPermissions(mockContext, policy)).toBe(true);
    });

    it('should deny access when user does not match any allow rules', () => {
      const policy = {
        allow: {
          dids: ['other-did'],
          roles: ['admin'],
          providers: ['local'],
          methods: ['signedToken'],
        },
      };
      expect(checkPermissions(mockContext, policy)).toBe(false);
    });
  });

  describe('combined rules', () => {
    it('should deny access when user matches both allow and deny rules', () => {
      const policy = {
        allow: {
          dids: ['test-did'],
        },
        deny: {
          roles: ['owner'],
        },
      };
      expect(checkPermissions(mockContext, policy)).toBe(false);
    });
  });
});

describe('wrapToolHandler', () => {
  const mockHandler = mock();
  const mockExtra = {
    authInfo: {
      extra: {
        user: {
          did: 'test-did',
          role: 'owner',
        },
      },
    },
  };

  beforeEach(() => {
    mockHandler.mockClear();
  });

  it('should call handler when user has permission', async () => {
    const policy = {
      allow: {
        roles: ['owner'],
      },
    };
    const wrappedHandler = wrapToolHandler(mockHandler, policy);
    await wrappedHandler(mockExtra);
    expect(mockHandler).toHaveBeenCalledWith(mockExtra);
  });

  it('should throw error when user does not have permission', async () => {
    const policy = {
      allow: {
        roles: ['admin'],
      },
    };
    const wrappedHandler = wrapToolHandler(mockHandler, policy);
    await expect(wrappedHandler(mockExtra)).rejects.toThrow('Unauthorized');
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should call handler when no policy is provided', async () => {
    const wrappedHandler = wrapToolHandler(mockHandler);
    await wrappedHandler(mockExtra);
    expect(mockHandler).toHaveBeenCalledWith(mockExtra);
  });

  it('should throw error when no user in context', async () => {
    const policy = {
      allow: {
        roles: ['owner'],
      },
    };
    const wrappedHandler = wrapToolHandler(mockHandler, policy);
    await expect(wrappedHandler({ authContext: {} })).rejects.toThrow('Unauthorized');
    expect(mockHandler).not.toHaveBeenCalled();
  });
});
