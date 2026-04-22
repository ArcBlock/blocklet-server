/* eslint-disable global-require */
const { mock, test, describe, expect, beforeEach, afterAll } = require('bun:test');
const { STATIC_SERVER_ENGINE_DID } = require('@blocklet/constant');

// Mock express.static
const mockStaticMiddleware = mock((req, res, next) => next());
mock.module('express', () => ({
  static: mock(() => mockStaticMiddleware),
}));

// Mock logger - must export a function that returns logger object
const mockLogger = {
  debug: mock(),
  info: mock(),
  warn: mock(),
  error: mock(),
};
const loggerFactory = () => mockLogger;
mock.module('../../api/libs/logger', () => {
  return Object.assign(loggerFactory, {
    __esModule: true,
    default: loggerFactory,
    setupAccessLogger: mock(),
    getAccessLogStream: mock(),
  });
});

const serveStaticEngine = require('../../api/middlewares/serve-static-engine');

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

describe('serveStaticEngine', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    serveStaticEngine.clearAllCaches();
    mockStaticMiddleware.mockClear();

    mockReq = {
      method: 'GET',
      path: '/some/path',
      accepts: mock(() => 'html'),
      getBlocklet: mock(),
      getBlockletComponentId: mock(() => null),
    };

    mockRes = {
      status: mock().mockReturnThis(),
      send: mock(),
      sendFile: mock((filePath, options, callback) => {
        if (callback) callback();
      }),
    };

    mockNext = mock();
  });

  test('should call next when no blocklet found', async () => {
    mockReq.getBlocklet = mock(() => null);

    const middleware = serveStaticEngine();
    await middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  test('should call next when component not found', async () => {
    mockReq.getBlocklet = mock(() => ({ meta: { did: 'test' } }));
    mockReq.getBlockletComponentId = mock(() => 'non-existent-component');

    const middleware = serveStaticEngine();
    await middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  test('should call next when component cannot serve static engine', async () => {
    mockReq.getBlocklet = mock(() => ({
      meta: { did: 'test', group: 'node' }, // not static group
      environments: [{ key: 'BLOCKLET_APP_DIR', value: '/app' }],
    }));

    const middleware = serveStaticEngine();
    await middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  test('should call next when no static root found', async () => {
    mockReq.getBlocklet = mock(() => ({
      meta: { did: 'test', group: 'static' },
      environments: [], // no BLOCKLET_APP_DIR
    }));

    const middleware = serveStaticEngine();
    await middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  test('should serve static files for static group blocklet', async () => {
    mockReq.getBlocklet = mock(() => ({
      meta: { did: 'test', group: 'static', main: 'dist' },
      environments: [{ key: 'BLOCKLET_APP_DIR', value: '/app' }],
    }));

    const middleware = serveStaticEngine();
    await middleware(mockReq, mockRes, mockNext);

    // The static middleware should be created and called
    expect(mockStaticMiddleware).toHaveBeenCalled();
  });

  test('should serve static files for engine-based blocklet with static-server engine', async () => {
    mockReq.getBlocklet = mock(() => ({
      meta: {
        did: 'test',
        engine: {
          interpreter: 'blocklet',
          source: { name: STATIC_SERVER_ENGINE_DID },
        },
        main: 'public',
      },
      environments: [{ key: 'BLOCKLET_APP_DIR', value: '/var/blocklet' }],
    }));

    const middleware = serveStaticEngine();
    await middleware(mockReq, mockRes, mockNext);

    expect(mockStaticMiddleware).toHaveBeenCalled();
  });

  test('should handle errors in middleware', async () => {
    mockReq.getBlocklet = mock(() => {
      throw new Error('Test error');
    });

    const middleware = serveStaticEngine();
    await middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  test('should cache static middleware instances', async () => {
    const blocklet = {
      meta: { did: 'test', group: 'static', main: 'dist' },
      environments: [{ key: 'BLOCKLET_APP_DIR', value: '/app' }],
    };
    mockReq.getBlocklet = mock(() => blocklet);

    const middleware = serveStaticEngine();

    // First call - should create middleware
    await middleware(mockReq, mockRes, mockNext);
    expect(serveStaticEngine.getCacheSize()).toBe(1);

    // Second call with same root - should reuse cached middleware
    await middleware(mockReq, mockRes, mockNext);
    expect(serveStaticEngine.getCacheSize()).toBe(1);
  });

  test('should handle component from children', async () => {
    mockReq.getBlocklet = mock(() => ({
      meta: { did: 'parent' },
      children: [
        {
          meta: { did: 'child-component', group: 'static', main: 'build' },
          environments: [{ key: 'BLOCKLET_APP_DIR', value: '/child/app' }],
        },
      ],
    }));
    mockReq.getBlockletComponentId = mock(() => 'child-component');

    const middleware = serveStaticEngine();
    await middleware(mockReq, mockRes, mockNext);

    expect(mockStaticMiddleware).toHaveBeenCalled();
  });
});

describe('serveStaticEngine SPA fallback', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    serveStaticEngine.clearAllCaches();

    mockReq = {
      method: 'GET',
      path: '/app/route',
      accepts: mock(() => 'html'),
      getBlocklet: mock(() => ({
        meta: { did: 'test', group: 'static', main: 'dist' },
        environments: [{ key: 'BLOCKLET_APP_DIR', value: '/app' }],
      })),
      getBlockletComponentId: mock(() => null),
    };

    mockRes = {
      status: mock().mockReturnThis(),
      send: mock(),
      sendFile: mock((filePath, options, callback) => {
        if (callback) callback();
      }),
    };

    mockNext = mock();
  });

  test('should return 404 for missing resource files', async () => {
    mockReq.path = '/assets/missing.js';

    // Simulate static middleware not finding file (calls next)
    const staticMiddlewareMock = mock((req, res, next) => next());
    const expressMock = require('express');
    expressMock.static.mockReturnValue(staticMiddlewareMock);

    const middleware = serveStaticEngine();
    await middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.send).toHaveBeenCalledWith('Static Server: File Not Found');
  });

  test('should skip fallback for non-GET/HEAD requests', async () => {
    mockReq.method = 'POST';

    const staticMiddlewareMock = mock((req, res, next) => next());
    const expressMock = require('express');
    expressMock.static.mockReturnValue(staticMiddlewareMock);

    const middleware = serveStaticEngine();
    await middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  test('should skip fallback for non-HTML requests', async () => {
    // Return false when checking for 'html' acceptance
    mockReq.accepts = mock(() => false);

    const staticMiddlewareMock = mock((req, res, next) => next());
    const expressMock = require('express');
    expressMock.static.mockReturnValue(staticMiddlewareMock);

    const middleware = serveStaticEngine();
    await middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  test('should serve index.html for SPA routes', async () => {
    mockReq.path = '/dashboard/settings';

    const staticMiddlewareMock = mock((req, res, next) => next());
    const expressMock = require('express');
    expressMock.static.mockReturnValue(staticMiddlewareMock);

    const middleware = serveStaticEngine();
    await middleware(mockReq, mockRes, mockNext);

    expect(mockRes.sendFile).toHaveBeenCalledWith(
      expect.stringContaining('index.html'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        }),
      }),
      expect.any(Function)
    );
  });

  test('should return 404 when index.html not found for SPA fallback', async () => {
    mockReq.path = '/some/spa/route';

    const staticMiddlewareMock = mock((req, res, next) => next());
    const expressMock = require('express');
    expressMock.static.mockReturnValue(staticMiddlewareMock);

    // Simulate sendFile failing
    mockRes.sendFile = mock((filePath, options, callback) => {
      if (callback) callback(new Error('ENOENT'));
    });

    const middleware = serveStaticEngine();
    await middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.send).toHaveBeenCalledWith('Static Server: File Not Found');
  });
});

describe('serveStaticEngine cache utilities', () => {
  beforeEach(() => {
    serveStaticEngine.clearAllCaches();
  });

  test('getCacheSize should return 0 initially', () => {
    expect(serveStaticEngine.getCacheSize()).toBe(0);
  });

  test('clearCache should remove specific cache entry', async () => {
    const mockReq = {
      method: 'GET',
      path: '/',
      accepts: mock(() => 'html'),
      getBlocklet: mock(() => ({
        meta: { did: 'test', group: 'static', main: 'dist' },
        environments: [{ key: 'BLOCKLET_APP_DIR', value: '/app1' }],
      })),
      getBlockletComponentId: mock(() => null),
    };
    const mockRes = {
      status: mock().mockReturnThis(),
      send: mock(),
      sendFile: mock(),
    };
    const mockNext = mock();

    const middleware = serveStaticEngine();
    await middleware(mockReq, mockRes, mockNext);

    expect(serveStaticEngine.getCacheSize()).toBe(1);

    serveStaticEngine.clearCache('/app1/dist');
    expect(serveStaticEngine.getCacheSize()).toBe(0);
  });

  test('clearCache should handle null/undefined gracefully', () => {
    expect(() => serveStaticEngine.clearCache(null)).not.toThrow();
    expect(() => serveStaticEngine.clearCache(undefined)).not.toThrow();
  });

  test('clearAllCaches should remove all cache entries', async () => {
    const createReq = (appDir) => ({
      method: 'GET',
      path: '/',
      accepts: mock(() => 'html'),
      getBlocklet: mock(() => ({
        meta: { did: 'test', group: 'static', main: 'dist' },
        environments: [{ key: 'BLOCKLET_APP_DIR', value: appDir }],
      })),
      getBlockletComponentId: mock(() => null),
    });
    const mockRes = {
      status: mock().mockReturnThis(),
      send: mock(),
      sendFile: mock(),
    };
    const mockNext = mock();

    const middleware = serveStaticEngine();

    await middleware(createReq('/app1'), mockRes, mockNext);
    await middleware(createReq('/app2'), mockRes, mockNext);
    await middleware(createReq('/app3'), mockRes, mockNext);

    expect(serveStaticEngine.getCacheSize()).toBe(3);

    serveStaticEngine.clearAllCaches();
    expect(serveStaticEngine.getCacheSize()).toBe(0);
  });
});
