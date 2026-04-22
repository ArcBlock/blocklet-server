const { test, expect, describe, mock, spyOn, beforeAll, afterAll, beforeEach, afterEach, it } = require('bun:test');

const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const morgan = require('morgan');
const dayjs = require('@abtnode/util/lib/dayjs');
const getLogger = require('..');
const { setupAccessLogger } = require('../lib/logger');

spyOn(
  morgan,
  'token',
  mock(() => mock())
);
spyOn(
  dayjs,
  'format',
  mock(() => '2024-03-14T12:00:00Z')
);

spyOn(
  dayjs,
  'call',
  mock(() => '2024-03-14T12:00:00Z')
);

const { customPrintfCallback, initLogger, getNoopLogger, getInstanceSize, deleteOldLogfiles } = getLogger;

afterAll(() => {
  mock.restore();
});

describe('core/logger', () => {
  beforeEach(() => {
    mock.clearAllMocks();
    getLogger.instanceMap.clear();
  });

  describe('customPrintfCallback', () => {
    it('should includes label', () => {
      const res = customPrintfCallback({ message: 'test-message', label: 'test-label' });
      expect(res.includes('[test-label]')).toBe(true);
    });

    it('should includes message', () => {
      const res = customPrintfCallback({ message: 'test-message', label: 'test-label' });
      expect(res.includes('test-message')).toBe(true);
    });

    it('should includes metadata', () => {
      Symbol.splat = { meta: 'test-meta' };
      const res = customPrintfCallback({
        message: 'test-message',
        label: 'test-label',
        [Symbol.for('splat')]: [{ meta: 'test-meta' }],
      });

      expect(res.includes('{"meta":"test-meta"}')).toBe(true);
    });
  });

  describe('getLogger', () => {
    test('should have expected length of instances with different labels', () => {
      expect(getInstanceSize()).toBe(0);

      getLogger('label1');
      getLogger('label2');
      expect(getInstanceSize()).toBe(2);
    });

    test('should return the instance of the same label', () => {
      const instance1 = getLogger('label1');
      const instance2 = getLogger('label1');

      expect(instance1).toBe(instance2);
    });
  });

  describe('initLogger', () => {
    test('should return noopLogger if not enabled the logger', () => {
      const instance = initLogger()();
      const noopLogger = getNoopLogger();

      for (let i = 0; i < Object.keys(instance).length; i++) {
        const item = Object.keys(instance)[i];
        expect(instance[item].toString()).toEqual(noopLogger[item].toString());
      }
    });
  });

  describe('deleteOldLogfiles', () => {
    const TEST_FOLDER = path.join(os.tmpdir(), 'blocklet-tests-util-log');

    beforeAll(() => {
      fs.ensureDirSync(TEST_FOLDER);
    });

    afterAll(() => {
      try {
        fs.removeSync(TEST_FOLDER);
      } catch (error) {
        console.error(error);
      }
    });

    afterEach(() => {
      mock.restore();
    });

    test('should do nothing if retain not a number', () => {
      spyOn(path, 'extname').mockImplementation(() => {});

      deleteOldLogfiles('/path/test', 'nan');
      expect(path.extname.mock.calls.length).toEqual(0);
    });

    test('should not delete /dev/null', () => {
      spyOn(path, 'extname').mockImplementation(() => {});

      deleteOldLogfiles('/dev/null', 1);
      expect(path.extname.mock.calls.length).toEqual(0);
    });

    test('should delete the old files which compressed', () => {
      const folder = path.join(TEST_FOLDER, 'delete-old-files');
      const file = path.join(folder, 'old.log');
      const file1 = path.join(folder, 'old-2021-04-21.log.gz');
      const file2 = path.join(folder, 'old-2021-04-22.log.gz');
      const file3 = path.join(folder, 'old-2021-04-23.log.gz');
      fs.ensureDirSync(folder);
      fs.writeFileSync(file, 'current file');
      fs.writeFileSync(file1, 'old1 file');
      fs.writeFileSync(file2, 'old2 file');
      fs.writeFileSync(file3, 'old3 file');
      deleteOldLogfiles(file, 2);
      expect(fs.existsSync(file1)).toEqual(false);
      expect(fs.existsSync(file2)).toEqual(true);
      expect(fs.existsSync(file3)).toEqual(true);
    });

    test('should delete the old files which not compressed', () => {
      const folder = path.join(TEST_FOLDER, 'delete-old-files');
      const file = path.join(folder, 'old.log');
      const file1 = path.join(folder, 'old-2021-04-21.log');
      const file2 = path.join(folder, 'old-2021-04-22.log');
      const file3 = path.join(folder, 'old-2021-04-23.log');
      fs.ensureDirSync(folder);
      fs.writeFileSync(file, 'current file');
      fs.writeFileSync(file1, 'old1 file');
      fs.writeFileSync(file2, 'old2 file');
      fs.writeFileSync(file3, 'old3 file');
      deleteOldLogfiles(file, 0);
      expect(fs.existsSync(file)).toEqual(true);
      expect(fs.existsSync(file1)).toEqual(false);
      expect(fs.existsSync(file2)).toEqual(false);
      expect(fs.existsSync(file3)).toEqual(false);
    });

    test("should only remove current file's old files", () => {
      const folder = path.join(TEST_FOLDER, 'delete-old-files');
      const file = path.join(folder, 'old.log');
      const file1 = path.join(folder, 'old-2021-04-21.log');
      const file2 = path.join(folder, 'old-2021-04-22.log');
      const file3 = path.join(folder, 'old-2021-04-23.log');
      const daemonFile1 = path.join(folder, 'daemon-2021-04-21.log');
      const daemonFile2 = path.join(folder, 'daemon-2021-04-22.log');
      const daemonFile3 = path.join(folder, 'daemon-2021-04-23.log');
      fs.ensureDirSync(folder);
      [file, file1, file2, file3, daemonFile1, daemonFile2, daemonFile3].forEach((item) => {
        fs.writeFileSync(item, Date.now().toString());
      });
      deleteOldLogfiles(file, 0);
      expect(fs.existsSync(file)).toEqual(true);
      expect(fs.existsSync(file1)).toEqual(false);
      expect(fs.existsSync(file2)).toEqual(false);
      expect(fs.existsSync(file3)).toEqual(false);
      expect(fs.existsSync(daemonFile1)).toEqual(true);
      expect(fs.existsSync(daemonFile2)).toEqual(true);
      expect(fs.existsSync(daemonFile3)).toEqual(true);
    });
  });
});

describe('setupAccessLogger', () => {
  let app;
  let stream;
  let mockNext;
  let mockReq;
  let mockRes;
  let mockMorganMiddleware;

  beforeEach(() => {
    // Reset mocks
    mock.clearAllMocks();

    // Mock app
    app = { use: mock() };

    // Mock stream
    stream = { write: mock() };

    // Mock morgan middleware
    mockMorganMiddleware = mock();
    morgan.token = mock();
    // morgan.mockReturnValue(mockMorganMiddleware);

    // Mock dayjs
    // dayjs.mockReturnValue({ format: () => '2024-03-14T12:00:00Z' });

    // Mock request/response objects
    mockReq = {
      headers: {},
      cookies: {},
      ip: '127.0.0.1',
      originalUrl: '/api/test',
      _startAt: [1000, 0],
    };
    mockRes = {
      _startAt: [1001, 0],
    };
    mockNext = mock();
  });

  it('should register all morgan tokens', () => {
    setupAccessLogger(app, stream);

    // Verify all tokens are registered
    expect(morgan.token).toHaveBeenCalledWith('real_ip', expect.any(Function));
    expect(morgan.token).toHaveBeenCalledWith('request_id', expect.any(Function));
    expect(morgan.token).toHaveBeenCalledWith('host', expect.any(Function));
    expect(morgan.token).toHaveBeenCalledWith('http_x_forwarded_for', expect.any(Function));
    expect(morgan.token).toHaveBeenCalledWith('response_time', expect.any(Function));
    expect(morgan.token).toHaveBeenCalledWith('cookie_connected_did', expect.any(Function));
    expect(morgan.token).toHaveBeenCalledWith('cookie_connected_wallet_os', expect.any(Function));
    expect(morgan.token).toHaveBeenCalledWith('date_iso', expect.any(Function));
  });

  it('should register additional upstream tokens when upstream is true', () => {
    setupAccessLogger(app, stream, true);

    expect(morgan.token).toHaveBeenCalledWith('upstream_connect_time', expect.any(Function));
    expect(morgan.token).toHaveBeenCalledWith('upstream_header_time', expect.any(Function));
    expect(morgan.token).toHaveBeenCalledWith('upstream_response_time', expect.any(Function));
  });

  it('should skip logging for excluded paths', () => {
    setupAccessLogger(app, stream);

    // Get the middleware function that was registered
    const middleware = app.use.mock.calls[0][0];

    // Test with excluded paths
    const excludedPaths = ['/node_modules', '/.yalc', '/src', '/@'];
    excludedPaths.forEach((x) => {
      mockReq.originalUrl = x;
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockMorganMiddleware).not.toHaveBeenCalled();
    });
  });

  it('should test real_ip token with different scenarios', () => {
    setupAccessLogger(app, stream);

    // Get the real_ip token function
    const realIpFn = morgan.token.mock.calls.find((call) => call[0] === 'real_ip')[1];

    // Test different IP sources
    expect(realIpFn({ headers: { 'x-real-ip': '1.1.1.1' } })).toBe('1.1.1.1');
    expect(realIpFn({ headers: {}, ip: '2.2.2.2' })).toBe('2.2.2.2');
    expect(realIpFn({ headers: {}, _remoteAddress: '3.3.3.3' })).toBe('3.3.3.3');
    expect(realIpFn({ headers: {}, connection: { remoteAddress: '4.4.4.4' } })).toBe('4.4.4.4');
    expect(realIpFn({ headers: {} })).toBe('-');
  });

  it('should test response_time token calculation', () => {
    setupAccessLogger(app, stream);

    const responseTimeFn = morgan.token.mock.calls.find((call) => call[0] === 'response_time')[1];

    // Test with valid start times
    expect(responseTimeFn({ _startAt: [1000, 913402375] }, { _startAt: [1001, 948933666] })).toBe('1.036');

    // Test with missing start times
    expect(responseTimeFn({}, {})).toBe('-');
  });

  it('should test upstream tokens when enabled', () => {
    setupAccessLogger(app, stream, true);

    const upstreamConnectTimeFn = morgan.token.mock.calls.find((call) => call[0] === 'upstream_connect_time')[1];
    const upstreamHeaderTimeFn = morgan.token.mock.calls.find((call) => call[0] === 'upstream_header_time')[1];
    const upstreamResponseTimeFn = morgan.token.mock.calls.find((call) => call[0] === 'upstream_response_time')[1];

    // Test with values present
    expect(upstreamConnectTimeFn({ upstreamConnectTime: 100 })).toBe('100');
    expect(upstreamHeaderTimeFn({ upstreamHeaderTime: 200 })).toBe('200');
    expect(upstreamResponseTimeFn({ upstreamResponseTime: 300 })).toBe('300');

    // Test with values missing
    expect(upstreamConnectTimeFn({})).toBe('-');
    expect(upstreamHeaderTimeFn({})).toBe('-');
    expect(upstreamResponseTimeFn({})).toBe('-');
  });
});
