/* eslint-disable no-shadow */
const { describe, test, expect, beforeEach, beforeAll, afterAll, afterEach, mock, spyOn } = require('bun:test');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');

const { startLogWatcher, stopLogWatcher, parseLogEntry } = require('../../lib/router/monitor');

const line503 =
  '3.101.65.143 - - [2024-11-19T09:31:29+00:00] ddf44cac33c25c3839b82228e4b81b24 "faucet.abtnetwork.io" "GET /.well-known/service/xxx HTTP/1.1" 500 88 "-" "Uptime-Kuma/1.23.15" "-" rt="0.001" uid="-" uos="-" uct="0.000" uht="0.002" urt="0.002"';

const line200 =
  '125.33.204.33 - - [2024-11-19T09:30:26+00:00] 6a613dc2e5fcd730ef31081513c3300b "staging.aigne.io" "GET /ai-studio/api/projects/440337198227652608/logo.png?imageFilter=resize&w=140&version=2024-04-30T03:03:34.793Z&working=true HTTP/2.0" 200 11272 "https://staging.aigne.io/ai-studio/projects?locale=en" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" "-" rt="0.142" uid="z1QmoWwpb4o5yvfhwmQEjozUJv93CQjJSt7" uos="web" uct="0.001" uht="0.142" urt="0.142"';

const result = {
  ip: '3.101.65.143',
  remoteUser: '-',
  timeIso8601: '2024-11-19T09:31:29+00:00',
  requestId: 'ddf44cac33c25c3839b82228e4b81b24',
  host: 'faucet.abtnetwork.io',
  request: 'GET /.well-known/service/xxx HTTP/1.1',
  status: 500,
  bodyBytesSent: 88,
  referer: '-',
  userAgent: 'Uptime-Kuma/1.23.15',
  forwardedFor: '-',
  requestTime: 0.001,
  connectedDid: '-',
  connectedWalletOs: '-',
  upstreamConnectTime: 0.0,
  upstreamHeaderTime: 0.002,
  upstreamResponseTime: 0.002,
};

describe('LogMonitor', () => {
  const testDir = path.join(os.tmpdir(), Math.random().toString());

  beforeAll(() => {
    fs.ensureDirSync(testDir);
  });

  afterAll(() => {
    try {
      fs.removeSync(testDir);
    } catch (error) {
      console.error(error);
    }
  });

  afterEach(() => {
    mock.clearAllMocks();
  });

  describe('startLogWatcher', () => {
    let logFile;
    let onLogEntry;

    beforeEach((done) => {
      logFile = path.join(testDir, 'watch.log');
      onLogEntry = mock();

      if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
      }

      // Create empty file and wait for it to be created
      fs.writeFileSync(logFile, '');

      setTimeout(() => {
        done();
      }, 100);
    });

    afterEach(() => {
      stopLogWatcher();
      if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
      }
    });

    test('should watch file and detect 5xx errors', (done) => {
      startLogWatcher(logFile, onLogEntry);

      // Wait for watcher to be ready before writing
      setTimeout(() => {
        // Write a 500 error log entry
        fs.appendFileSync(logFile, line503);

        // Give watcher time to process
        setTimeout(() => {
          try {
            expect(onLogEntry).toHaveBeenCalledWith([result]);
            done();
          } catch (error) {
            done(error);
          }
        }, 300);
      }, 100);
    });

    test('should ignore non-5xx errors', (done) => {
      startLogWatcher(logFile, onLogEntry);

      setTimeout(() => {
        fs.appendFileSync(logFile, line200);

        // Give watcher time to process
        setTimeout(() => {
          try {
            expect(onLogEntry).not.toHaveBeenCalled();
            done();
          } catch (error) {
            done(error);
          }
        }, 300);
      }, 100);
    });

    test('should handle non-existent file', () => {
      const consoleSpy = spyOn(console, 'error').mockImplementation();
      startLogWatcher('/nonexistent/file.log', onLogEntry);
      expect(consoleSpy).toHaveBeenCalledWith('Log file /nonexistent/file.log does not exist');
      consoleSpy.mockRestore();
    });

    test('should handle malformed log entries', (done) => {
      startLogWatcher(logFile, onLogEntry);

      setTimeout(() => {
        fs.appendFileSync(logFile, 'malformed log entry\n');

        // Give watcher time to process
        setTimeout(() => {
          try {
            expect(onLogEntry).not.toHaveBeenCalled();
            done();
          } catch (error) {
            done(error);
          }
        }, 300);
      }, 100);
    });
  });

  describe('parseLogEntry', () => {
    test('should parse valid log entry', () => {
      const line =
        '107.173.155.80 - - [2024-11-19T09:17:18+00:00] 9e481cd73af7a7433b04a8fc869ec4d1 "bbqa6qzm34eo6x755i4iqzljayvhruweqfawetdxo5a.did.abtnet.io" "GET /ai-studio/api/ws/434958139360542720/main HTTP/1.1" 403 5 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36" "-" rt="0.005" uid="-" uos="-" uct="0.000" uht="0.005" urt="0.005"';

      const result = parseLogEntry(line, false);

      expect(result).toEqual({
        ip: '107.173.155.80',
        remoteUser: '-',
        timeIso8601: '2024-11-19T09:17:18+00:00',
        requestId: '9e481cd73af7a7433b04a8fc869ec4d1',
        host: 'bbqa6qzm34eo6x755i4iqzljayvhruweqfawetdxo5a.did.abtnet.io',
        request: 'GET /ai-studio/api/ws/434958139360542720/main HTTP/1.1',
        status: 403,
        bodyBytesSent: 5,
        referer: '-',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        forwardedFor: '-',
        requestTime: 0.005,
        connectedDid: '-',
        connectedWalletOs: '-',
        upstreamConnectTime: 0.0,
        upstreamHeaderTime: 0.005,
        upstreamResponseTime: 0.005,
      });
    });

    test('should parse valid log entry with HTTP/2 and query params', () => {
      const result = parseLogEntry(line200, false);
      expect(result).toEqual({
        ip: '125.33.204.33',
        remoteUser: '-',
        timeIso8601: '2024-11-19T09:30:26+00:00',
        requestId: '6a613dc2e5fcd730ef31081513c3300b',
        host: 'staging.aigne.io',
        request:
          'GET /ai-studio/api/projects/440337198227652608/logo.png?imageFilter=resize&w=140&version=2024-04-30T03:03:34.793Z&working=true HTTP/2.0',
        status: 200,
        bodyBytesSent: 11272,
        referer: 'https://staging.aigne.io/ai-studio/projects?locale=en',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        forwardedFor: '-',
        requestTime: 0.142,
        connectedDid: 'z1QmoWwpb4o5yvfhwmQEjozUJv93CQjJSt7',
        connectedWalletOs: 'web',
        upstreamConnectTime: 0.001,
        upstreamHeaderTime: 0.142,
        upstreamResponseTime: 0.142,
      });
    });

    test('should parse valid log entry for health check request', () => {
      expect(parseLogEntry(line503, false)).toEqual(result);
    });

    test('should return null for invalid log entry', () => {
      const invalidLine = 'Invalid log entry format';
      const result = parseLogEntry(invalidLine, false);
      expect(result).toBeNull();
    });
  });
});
