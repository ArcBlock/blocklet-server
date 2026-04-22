const { describe, expect, test } = require('bun:test');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');

const logCLI = require('../../../lib/commands/server/logs');

describe('logs', () => {
  describe('getLatestBusinessLog', () => {
    const { _getLatestBusinessLog: getLatestBusinessLog } = logCLI;

    test('should throw exception when log directory is invalid', () => {
      expect(() => getLatestBusinessLog(`abtnode-test-${Date.now()}`)).toThrow(/does not exist/);
    });

    test('should return empty string if no file in directory', () => {
      const dir = path.join(os.tmpdir(), `abtnode-test-${Date.now()}`);
      fs.mkdirSync(dir);
      expect(getLatestBusinessLog(dir)).toEqual('');

      fs.rmSync(dir, { recursive: true });
    });

    test('should return latest log file if there is compressed log files', () => {
      const dir = path.join(os.tmpdir(), `abtnode-test-${Date.now()}`);
      const latestLogFile = path.join(dir, 'daemon-2020-09-29.log.gz');
      fs.mkdirSync(dir);

      fs.writeFileSync(path.join(dir, 'daemon-2020-09-25.log.gz'), '');
      fs.writeFileSync(path.join(dir, 'daemon-2020-09-28.log.gz'), '');
      fs.writeFileSync(latestLogFile, '');

      expect(getLatestBusinessLog(dir)).toEqual(latestLogFile);

      fs.removeSync(dir);
    });

    test('should return latest log file by log file name', () => {
      const dir = path.join(os.tmpdir(), `abtnode-test-${Date.now()}`);
      const latestLogFile = path.join(dir, 'daemon-2020-09-29.log');
      fs.mkdirSync(dir);

      fs.writeFileSync(path.join(dir, 'daemon-2020-09-25.log'), '');
      fs.writeFileSync(path.join(dir, 'daemon-2020-09-28.log'), '');
      fs.writeFileSync(latestLogFile, '');

      expect(getLatestBusinessLog(dir)).toEqual(latestLogFile);

      fs.removeSync(dir);
    });
  });
});
