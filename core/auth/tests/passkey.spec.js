const { test, expect, describe, beforeEach, mock } = require('bun:test');
const { toBase64 } = require('@ocap/util');
const { createPasskeyHandlers, formatBuffersToBase64 } = require('../lib/passkey');

describe('Passkey Handlers', () => {
  let node;
  let req;
  let res;
  let handlers;

  beforeEach(() => {
    // Setup real node (you may need to provide actual node instance)
    node = {
      getSession: mock(),
      startSession: mock(),
      endSession: mock(),
      getNodeInfo: mock(),
      getUser: mock(),
      updateUser: mock(),
      addUser: mock(),
      getConnectedAccount: mock(),
      createAuditLog: mock(),
      upsertUserSession: mock(),
      loginUser: mock(),
      isInitialized: mock(),
      disconnectUserAccount: mock(),
      updateNodeOwner: mock(),
      issuePassportToUser: mock(),
      getSessionSecret: mock(),
      isSubjectVerified: mock(),
    };

    // Setup request
    req = {
      query: {},
      get: mock(),
      user: null,
      passkeySession: null,
      body: {},
    };

    // Setup response
    res = {
      status: mock().mockReturnThis(),
      send: mock(),
    };

    handlers = createPasskeyHandlers(node, 'server', mock());
  });

  describe('ensurePasskeySession', () => {
    test('should return 400 if no challenge provided', async () => {
      await handlers.ensurePasskeySession(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        error: 'A valid passkey session is required to continue. Please try again.',
      });
    });

    test('should return 400 if session not found', async () => {
      req.query.challenge = toBase64('test-challenge');
      node.getSession.mockResolvedValue(null);

      await handlers.ensurePasskeySession(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        error: 'Your passkey session has expired. Please start over and try again.',
      });
    });

    test('should return 400 if invalid session type', async () => {
      req.query.challenge = toBase64('test-challenge');
      node.getSession.mockResolvedValue({ type: 'other' });

      await handlers.ensurePasskeySession(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        error: 'Invalid session type. Please start over with a new passkey session.',
      });
    });

    test('should call next if valid session', async () => {
      const mockNext = mock();
      req.query.challenge = toBase64('test-challenge');
      const mockSession = { type: 'passkey', data: {} };
      node.getSession.mockResolvedValue(mockSession);

      await handlers.ensurePasskeySession(req, res, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(req.passkeySession).toBe(mockSession);
    });
  });

  describe('formatBuffersToBase64', () => {
    test('should handle null and undefined', () => {
      expect(formatBuffersToBase64(null)).toBeNull();
      expect(formatBuffersToBase64(undefined)).toBeUndefined();
    });

    test('should convert Buffer to base64', () => {
      const buffer = Buffer.from('test');
      expect(formatBuffersToBase64(buffer)).toBe(toBase64(buffer));
    });

    test('should convert Uint8Array to base64', () => {
      const uint8Array = new Uint8Array([1, 2, 3]);
      expect(formatBuffersToBase64(uint8Array)).toBe(toBase64(uint8Array));
    });

    test('should handle arrays recursively', () => {
      const array = [Buffer.from('test'), { buf: Buffer.from('test2') }];
      const result = formatBuffersToBase64(array);
      expect(result[0]).toBe(toBase64(Buffer.from('test')));
      expect(result[1].buf).toBe(toBase64(Buffer.from('test2')));
    });

    test('should handle nested objects', () => {
      const obj = {
        buf1: Buffer.from('test1'),
        nested: {
          buf2: Buffer.from('test2'),
        },
      };
      const result = formatBuffersToBase64(obj);
      expect(result.buf1).toBe(toBase64(Buffer.from('test1')));
      expect(result.nested.buf2).toBe(toBase64(Buffer.from('test2')));
    });

    test('should return primitive values as is', () => {
      expect(formatBuffersToBase64('string')).toBe('string');
      expect(formatBuffersToBase64(123)).toBe(123);
      expect(formatBuffersToBase64(true)).toBe(true);
    });
  });

  // Add more test suites for other functions...
});
