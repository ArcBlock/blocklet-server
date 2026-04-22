const { test, expect, describe, beforeAll, afterAll, afterEach, mock, spyOn, beforeEach } = require('bun:test');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const logUtil = require('@abtnode/logger');

const LogRotator = require('../../lib/util/rotator');

describe('pm2-log-rotator', () => {
  const TEST_FOLDER = path.join(os.tmpdir(), 'pm2-rotate-test');

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

  describe('getLimitSize', () => {
    let rotate;
    beforeAll(() => {
      rotate = new LogRotator();
    });

    test('should return default value when param is falsy', () => {
      const defaultSize = 1024 * 1024 * 10;

      expect(rotate.getLimitSize()).toEqual(defaultSize);
      expect(rotate.getLimitSize(null)).toEqual(defaultSize);
      expect(rotate.getLimitSize('')).toEqual(defaultSize);
    });

    test('should return original param if param is a number type', () => {
      expect(rotate.getLimitSize(1)).toEqual(1);
      expect(rotate.getLimitSize(12)).toEqual(12);
    });

    test('should throw error if the param is not string or number type', () => {
      expect(() => rotate.getLimitSize({ test: 'foo' })).toThrowError(/must be a string or number/);
    });

    test('should parse byte', () => {
      expect(rotate.getLimitSize('100b')).toEqual(100);
      expect(rotate.getLimitSize('100B')).toEqual(100);
    });

    test('should parse kilo byte', () => {
      const value = 100 * 1024;

      expect(rotate.getLimitSize('100k')).toEqual(value);
      expect(rotate.getLimitSize('100K')).toEqual(value);
    });

    test('should parse mega byte', () => {
      const value = 100 * 1024 * 1024;

      expect(rotate.getLimitSize('100m')).toEqual(value);
      expect(rotate.getLimitSize('100M')).toEqual(value);
    });

    test('should parse giga byte', () => {
      const value = 100 * 1024 * 1024 * 1024;

      expect(rotate.getLimitSize('100g')).toEqual(value);
      expect(rotate.getLimitSize('100G')).toEqual(value);
    });
  });

  describe('proceedFile', () => {
    let rotate;
    beforeAll(() => {
      rotate = new LogRotator();
    });

    test('should proceed file if file exists', async () => {
      const existsSync = spyOn(fs, 'existsSync').mockImplementation(() => true);
      const statSync = spyOn(fs, 'statSync').mockImplementation(() => ({ size: 1 }));
      rotate.proceedSync = mock().mockResolvedValue();
      logUtil.deleteOldLogfiles = mock();

      await rotate.proceedFile();
      expect(existsSync.mock.calls.length).toEqual(1);
      expect(statSync.mock.calls.length).toEqual(1);
      expect(rotate.proceedSync.mock.calls.length).toEqual(1);
      expect(logUtil.deleteOldLogfiles.mock.calls.length).toEqual(1);
    });

    test('should not proceed file if file does not exist', async () => {
      const existsSync = spyOn(fs, 'existsSync').mockImplementation(() => false);
      rotate.proceed = mock(() => {});

      await rotate.proceedFile();
      expect(existsSync.mock.calls.length).toEqual(1);
      expect(rotate.proceed.mock.calls.length).toEqual(0);
    });

    test('should run delete file function if file size <=0 ', async () => {
      const existsSync = spyOn(fs, 'existsSync').mockImplementation(() => true);
      const statSync = spyOn(fs, 'statSync').mockImplementation(() => ({ size: 0 }));
      rotate.proceedSync = mock().mockResolvedValue();
      logUtil.deleteOldLogfiles = mock();

      await rotate.proceedFile();
      expect(existsSync).toHaveBeenCalled();
      expect(statSync).toHaveBeenCalled();
      expect(rotate.proceedSync).not.toHaveBeenCalled();
      expect(logUtil.deleteOldLogfiles.mock.calls.length).toBe(1);
    });
  });

  describe('proceedSync', () => {
    test('should rotate without compress', async () => {
      const rotate = new LogRotator({ compress: false, dateFormat: '5000', retain: 30 });
      const file = path.join(TEST_FOLDER, 'foo2.log');
      fs.rmSync(path.join(TEST_FOLDER, 'foo2-5000.log'), { force: true });
      const content = 'this is test';
      fs.writeFileSync(file, content);

      const newFile = await rotate.proceedSync(file);
      expect(fs.existsSync(newFile)).toEqual(true);
      expect(path.basename(newFile)).toEqual('foo2-5000.log');
      expect(fs.readFileSync(newFile).toString()).toEqual(content);
      expect(fs.statSync(file).size).toEqual(0);
    });

    test('should rotate with compress', async () => {
      const rotate = new LogRotator({ compress: true, dateFormat: '5000', retain: 30 });
      const file = path.join(TEST_FOLDER, 'foo3.log');
      fs.rmSync(path.join(TEST_FOLDER, 'foo3-5000.log.gz'), { force: true });
      fs.writeFileSync(file, 'this is test');

      const newFile = await rotate.proceedSync(file);

      expect(fs.existsSync(newFile)).toEqual(true);
      expect(path.basename(newFile)).toEqual('foo3-5000.log.gz');
      expect(fs.statSync(file).size).toEqual(0);
    });
  });

  describe('proceedPm2App', () => {
    let rotate;
    beforeAll(() => {
      rotate = new LogRotator();
      rotate.proceedFile = mock();
    });

    beforeEach(() => {
      mock.clearAllMocks();
    });

    test('should proceed output log file', () => {
      rotate.proceedPm2App({ pm2_env: { pm_out_log_path: '/tmp/foo.log' } });
      expect(rotate.proceedFile.mock.calls.length).toEqual(1);
    });

    test('should proceed error log file', async () => {
      await rotate.proceedPm2App({ pm2_env: { pm_out_log_path: '/tmp/foo.log', pm_err_log_path: '/tmp/error.log' } });
      expect(rotate.proceedFile.mock.calls.length).toEqual(2);
    });

    test('should not proceed error file if the error file and output file are same', () => {
      rotate.proceedPm2App({ pm2_env: { pm_out_log_path: '/tmp/foo.log', pm_err_log_path: '/tmp/foo.log' } });
      expect(rotate.proceedFile.mock.calls.length).toEqual(1);
    });

    test('should proceed pm file', () => {
      rotate.proceedPm2App({ pm2_env: { pm_log_path: '/tmp/root_foo.log' } });
      expect(rotate.proceedFile.mock.calls.length).toEqual(1);
    });

    test('should not proceed error file if the pm file and output file are same', () => {
      rotate.proceedPm2App({ pm2_env: { pm_log_path: '/tmp/foo.log', pm_out_log_path: '/tmp/foo.log' } });
      expect(rotate.proceedFile.mock.calls.length).toEqual(1);
    });

    test('should not proceed error file if the pm file and error file are same', () => {
      rotate.proceedPm2App({ pm2_env: { pm_log_path: '/tmp/foo.log', pm_error_log_path: '/tmp/foo.log' } });
      expect(rotate.proceedFile.mock.calls.length).toEqual(1);
    });

    test('should proceed all log files', async () => {
      await rotate.proceedPm2App({
        pm2_env: {
          pm_log_path: '/tmp/root_foo.log',
          pm_out_log_path: '/tmp/foo.log',
          pm_err_log_path: '/tmp/error.log',
        },
      });
      expect(rotate.proceedFile.mock.calls.length).toEqual(3);
    });
  });
});
