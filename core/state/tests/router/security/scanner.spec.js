/* eslint-disable no-shadow */
/* eslint-disable no-useless-escape */
const { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, mock, spyOn } = require('bun:test');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');

const { startLogWatcher, stopLogWatcher, parseLogEntry } = require('../../../lib/router/security/scanner');

// eslint-disable-next-line quotes
const line403 = `2025/02/07 23:09:28 [error] 3073842#3073842: *78010 [client 193.41.206.176] ModSecurity: Access denied with code 403 (phase 1). Matched "Operator \`PmFromFile' with parameter\`restricted-files.data' against variable \`REQUEST_FILENAME' (Value: \`/src/.env' )[file "/data/.abtnode/router/nginx/includes/security/crs4/rules/REQUEST-930-APPLICATION-ATTACK-LFI.conf"][line "124"][id "930130"][rev ""][msg "Restricted File Access Attempt"][data "Matched Data: .env found within REQUEST_FILENAME: /src/.env"][severity "2"][ver "OWASP_CRS/4.9.0"][maturity "0"][accuracy "0"][tag "application-multi"][tag "language-multi"][tag "platform-multi"][tag "attack-lfi"][tag "paranoia-level/1"][tag "OWASP_CRS"][tag "capec/1000/255/153/126"][tag "PCI/6.5.4"][hostname "172.31.13.154"][uri "/src/.env"][unique_id "071b2ba6e34ebd0635416ad926c6af5f"][ref "o5,4v4,9t:utf8toUnicode,t:urlDecodeUni,t:normalizePathWin"], client: 193.41.206.176, server: ~^\\d+.\\d+.\\d+.\\d+$, request: "GET /src/.env HTTP/1.1", host: "18.180.145.193"`;

const line200 =
  '2025/02/07 23:09:40 [error] 3073842#3073842: *78010 open() "/data/.abtnode/router/nginx/www/assets/index-DN8pXU_t.js" failed (2: No such file or directory), client: 193.41.206.176, server: ~^d+.d+.d+.d+$, request: "GET /./assets/index-DN8pXU_t.js HTTP/1.1", host: "18.180.145.193"';

const result = {
  type: 'modsecurity',
  timestamp: '2025/02/07 23:09:28',
  ip: '193.41.206.176',
  ruleId: '930130',
  requestId: '071b2ba6e34ebd0635416ad926c6af5f',
};

describe('LogScanner', () => {
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

    test('should watch file and detect 403 errors', (done) => {
      startLogWatcher(logFile, onLogEntry);

      setTimeout(() => {
        fs.appendFileSync(logFile, line403);
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

    test('should ignore non-403 errors', (done) => {
      startLogWatcher(logFile, onLogEntry);

      setTimeout(() => {
        fs.appendFileSync(logFile, line200);
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
      expect(parseLogEntry(line403)).toEqual(result);
    });

    test('should return null for invalid log entry', () => {
      expect(parseLogEntry(line200)).toBeNull();
    });

    test('should parse valid rate limit log entry', () => {
      const rateLimitLine =
        '2025/04/28 16:30:50 [error] 10211#0: *1097 limiting requests, excess: 20.020 by zone "ip_rate_limit", client: 192.168.123.22, server: bbqartjsky2iiebu2noxsg6gn7nf7ezacguwmx6q6ci.did.abtnet.io, request: "GET /.well-known/service/api/did/session HTTP/1.0", host: "bbqartjsky2iiebu2noxsg6gn7nf7ezacguwmx6q6ci.did.abtnet.io"';
      expect(parseLogEntry(rateLimitLine)).toEqual({
        type: 'rate_limit',
        timestamp: '2025/04/28 16:30:50',
        excess: 20.02,
        zone: 'ip_rate_limit',
        ip: '192.168.123.22',
      });
    });

    test('should return null for non-matching rate limit log entry', () => {
      const nonMatchingRateLimitLine =
        '2025/04/28 16:30:50 [error] 10211#0: *1097 limiting requests, client: 192.168.123.22';
      expect(parseLogEntry(nonMatchingRateLimitLine)).toBeNull();
    });
  });
});
