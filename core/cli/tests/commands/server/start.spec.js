const { describe, expect, test, spyOn, beforeEach, afterEach, mock } = require('bun:test');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { NODE_MODES } = require('@abtnode/constant');
const set = require('lodash/set');

const start = require('../../../lib/commands/server/start');
const util = require('../../../lib/util');
const nodeLib = require('../../../lib/node');

const getMockConfigValue = () => {
  const attributes = [
    { name: 'port', type: Number, required: false },
    { name: 'routing.https', type: Boolean, required: false },
    { name: 'routing.maxUploadFileSize', type: null, required: true },
    { name: 'routing.adminPath', type: null, required: true },
    { name: 'routing.headers', type: null, required: false },
    { name: 'routing.ipWildcardDomain', type: null, required: false },
    { name: 'routing.wildcardCertHost', type: null, required: false },
    { name: 'routing.provider', type: null, required: false },
    { name: 'routing.httpPort', type: Number, required: false },
    { name: 'routing.httpsPort', type: Number, required: false },
    { name: 'mode', type: String, required: false },
    { name: 'runtimeConfig.daemonMaxMemoryLimit', type: Number, required: false },
    { name: 'runtimeConfig.blockletMaxMemoryLimit', type: Number, required: false },
    { name: 'didRegistry', type: String, required: true },
    { name: 'didDomain', type: String, required: true },
  ];

  const defaultValue = {
    [Boolean]: true,
    [Number]: 111,
    [String]: '111',
    [null]: '111',
  };

  const dbInfo = {};
  const config = { node: {} };
  attributes.forEach((x) => {
    set(dbInfo, x.name, defaultValue[x.type]);
    set(config.node, x.name, defaultValue[x.type]);
  });

  return { dbInfo, config };
};

describe('command.node.start', () => {
  describe('isVersionMatched', () => {
    test('should throw error if config version is invalid', () => {
      expect(() => start.isVersionMatched()).toThrow(/invalid configuration version/);
      expect(() => start.isVersionMatched(null)).toThrow(/invalid configuration version/);
      expect(() => start.isVersionMatched('invalid_version')).toThrow(/invalid configuration version/);
    });

    test('should throw error if config version is invalid', () => {
      expect(() => start.isVersionMatched('1.0.0')).toThrow(/invalid cli version/);
      expect(() => start.isVersionMatched('1.0.0', null)).toThrow(/invalid cli version/);
      expect(() => start.isVersionMatched('1.0.0', 'invalid_version')).toThrow(/invalid cli version/);
    });

    test('should return falsy if cli version is less than config version', () => {
      expect(start.isVersionMatched('1.0.0', '0.9.9').matched).toEqual(false);
    });

    test('should return falsy if cli version is greater or equal than next major version of current config version', () => {
      expect(start.isVersionMatched('1.0.0', '2.0.0').matched).toEqual(false);
    });

    test('should return truthy if cli version is greater or equal than config version, and less equal than next major version of current config version', () => {
      expect(start.isVersionMatched('1.0.0', '1.0.0').matched).toEqual(true);
      expect(start.isVersionMatched('1.0.0-beta', '1.0.0').matched).toEqual(true);
      expect(start.isVersionMatched('1.0.0', '1.0.0-beta').matched).toEqual(true);
      expect(start.isVersionMatched('1.0.0', '1.0.1').matched).toEqual(true);
    });

    test('beta version', () => {
      const r1 = start.isVersionMatched('1.8.63', '1.8.63-beta-b71f5f80');
      expect(r1).toEqual({
        matched: true,
        nextMajorVersion: '2.0.0',
        configVersion: '1.8.63',
        cliVersion: '1.8.63-beta-b71f5f80',
      });

      const r2 = start.isVersionMatched('1.8.63-beta-b71f5f80', '1.8.63');
      expect(r2.matched).toEqual(true);

      const r3 = start.isVersionMatched('1.8.63-beta-c51e554d', '1.8.63-beta-b71f5f80');
      expect(r3.matched).toEqual(true);
      expect(r3).toEqual({
        matched: true,
        nextMajorVersion: '2.0.0',
        configVersion: '1.8.63-beta-c51e554d',
        cliVersion: '1.8.63-beta-b71f5f80',
      });
    });
  });

  describe('start', () => {
    test(
      'should return 1 if the version is not matched',
      async () => {
        delete process.env.ABT_NODE_SKIP_VERSION_CHECK;
        const dataDir = '/tmp/not-exists';
        spyOn(nodeLib, 'readNodeConfig').mockResolvedValue({ config: { node: { version: '1.1.0' } }, dataDir });
        spyOn(util, 'getCLIVersion').mockReturnValue('1.0.0');
        spyOn(util, 'printError').mockImplementation(() => {});
        spyOn(util, 'ensurePermission').mockImplementation(() => {});

        expect(await start.start({ updateDb: false, enforceLock: true })).toEqual(1);
        expect(nodeLib.readNodeConfig.mock.calls.length).toEqual(1);
        expect(util.getCLIVersion.mock.calls.length).toEqual(1);
        expect(util.printError.mock.calls.length).toEqual(1);
      },
      1000 * 120
    );
  });

  describe.serial('clear start lock', () => {
    const makeLockFile = (name) => path.join(os.tmpdir(), `start-spec/${name}-${process.pid}-${Date.now()}.lock`);

    beforeEach(() => {
      mock.clearAllMocks();
      mock.restore();
    });

    afterEach(() => {
      mock.clearAllMocks();
    });

    test('should remove existed file if enforceLock=false', () => {
      const lockFile = makeLockFile('test1');
      fs.ensureFileSync(lockFile);

      const mockReadFileSync = spyOn(fs, 'readFileSync');

      start.clearStartLock({ pid: 123, lockFile });

      expect(mockReadFileSync).not.toHaveBeenCalled();
      expect(fs.existsSync(lockFile)).toBe(false);
    });

    test('should do nothing if lock file does not exist', () => {
      const mockExistsSync = spyOn(fs, 'existsSync').mockReturnValue(false);
      const mockReadFileSync = spyOn(fs, 'readFileSync');

      start.clearStartLock({ pid: 123, lockFile: '/xxx/yyy', enforceLock: true });

      expect(mockExistsSync).toHaveBeenCalled();
      expect(mockReadFileSync).not.toHaveBeenCalled();
    });

    test('should do nothing if pid is different from the one in the lock file', () => {
      const lockFile = makeLockFile('test2');
      start.createStartLock({ lockFile, pid: '123' });
      const mockReadFileSync = spyOn(fs, 'readFileSync');

      expect(fs.existsSync(lockFile));

      start.clearStartLock({ pid: 456, lockFile, enforceLock: true });

      expect(fs.existsSync(lockFile)).toBe(true);
      expect(mockReadFileSync).toHaveBeenCalled();
    });
    test('should print error message if clear failed', () => {
      const lockFile = makeLockFile('test3');
      const mockExistsSync = spyOn(fs, 'existsSync').mockImplementation(() => {
        return new Error('test error');
      });
      const mockPrintError = spyOn(util, 'printError');

      start.clearStartLock({ pid: 123, enforceLock: true, lockFile });

      expect(mockExistsSync).toHaveBeenCalled();
      expect(mockPrintError).toHaveBeenCalled();
    });

    test('should delete lock file', () => {
      const pid = 123;
      const lockFile = makeLockFile('test4');
      start.createStartLock({ lockFile, pid });

      expect(fs.existsSync(lockFile));

      start.clearStartLock({ pid, lockFile, enforceLock: true });

      expect(fs.existsSync(lockFile)).toBe(false);
    });
  });

  describe('isConfigDifferentFromDB', () => {
    test('return false if dbInfo is empty', () => {
      expect(start.isConfigDifferentFromDB()).toBe(false);
      expect(start.isConfigDifferentFromDB(null)).toBe(false);
    });

    test('should return false if no difference', () => {
      const { dbInfo, config } = getMockConfigValue();
      expect(start.isConfigDifferentFromDB(dbInfo, config)).toBe(false);
    });

    test('should return true if there is difference', () => {
      const { dbInfo, config } = getMockConfigValue();
      config.node.port = 1024;
      const mockPrint = spyOn(util, 'print');
      const mockPrintWarning = spyOn(util, 'printWarning');

      expect(start.isConfigDifferentFromDB(dbInfo, config)).toBe(true);
      expect(mockPrint).toHaveBeenCalledWith(expect.stringMatching(/port.+1024/));
      expect(mockPrintWarning).toHaveBeenCalledWith(expect.stringMatching(/there are some differences/));
    });
  });

  describe('getDifferentAttributes', () => {
    test('should check slpDomain only in serverless mode', () => {
      const difference1 = start.getDifferentAttributes(
        { mode: NODE_MODES.SERVERLESS, slpDomain: null },
        { node: { mode: NODE_MODES.PRODUCTION, slpDomain: 'abc.abtnet.io' } }
      );

      // When mode != serverless, slpDomain is not required
      expect(difference1.find((x) => x.name === 'mode')).toBeTruthy();
      expect(difference1.find((x) => x.name === 'serverless')).toBeFalsy();

      const difference2 = start.getDifferentAttributes(
        { mode: NODE_MODES.SERVERLESS, slpDomain: null },
        { node: { mode: NODE_MODES.SERVERLESS, slpDomain: 'abc.abtnet.io' } }
      );

      // When mode = serverless, slpDomain is required
      expect(difference2.find((x) => x.name === 'slpDomain')).toBeTruthy();
    });

    test('should return expected different values if they are not equal', () => {
      const attributes = [
        { name: 'port', type: Number, required: false },
        { name: 'routing.https', type: Boolean, required: false },
        { name: 'routing.maxUploadFileSize', type: null, required: true },
        { name: 'routing.adminPath', type: null, required: true },
        { name: 'routing.headers', type: null, required: false },
        { name: 'routing.ipWildcardDomain', type: null, required: false },
        { name: 'routing.wildcardCertHost', type: null, required: false },
        { name: 'routing.provider', type: null, required: false },
        { name: 'routing.httpPort', type: Number, required: false },
        { name: 'routing.httpsPort', type: Number, required: false },
        { name: 'mode', type: String, required: false },
        // { name: 'runtimeConfig.daemonMaxMemoryLimit', type: Number, required: false },
        { name: 'runtimeConfig.blockletMaxMemoryLimit', type: Number, required: false },
        { name: 'didRegistry', type: String, required: true },
        { name: 'didDomain', type: String, required: true },
      ];

      let dbInfo = {};
      let config = { node: {} };

      const dbValue = {
        [Boolean]: true,
        [Number]: 111,
        [String]: '111',
        [null]: '111',
      };
      const configValue = {
        [Boolean]: false,
        [Number]: 222,
        [String]: '222',
        [null]: '222',
      };

      expect.assertions(attributes.length);

      attributes.forEach((x) => {
        if (x.required) {
          set(dbInfo, x.name, 'test1');
          set(config.node, x.name, 'test2');
        } else {
          set(dbInfo, x.name, dbValue[x.type]);
          set(config.node, x.name, configValue[x.type]);
        }

        const difference = start.getDifferentAttributes(dbInfo, config);
        expect(difference.find((y) => y.name === x.name)).toBeTruthy();
        dbInfo = {};
        config = { node: {} };
      });
    });

    test('should return empty array if no value changed', () => {
      const { dbInfo, config } = getMockConfigValue();
      const difference = start.getDifferentAttributes(dbInfo, config);

      expect(difference).toEqual([]);
    });
  });

  describe('copyEnvToProcess', () => {
    let originalEnv;

    beforeEach(() => {
      mock.clearAllMocks();
      // Backup original env variables
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      mock.clearAllMocks();
      // Restore original env variables
      process.env = originalEnv;
    });

    test('should handle null or undefined input gracefully', () => {
      start.copyEnvToProcess(null);
      start.copyEnvToProcess(undefined);
      // Should not throw any errors
    });

    test('should handle non-object input gracefully', () => {
      start.copyEnvToProcess('string');
      start.copyEnvToProcess(123);
      start.copyEnvToProcess(true);
      start.copyEnvToProcess([]);
      // Should not throw any errors
    });

    test('should handle empty object', () => {
      const beforeCount = Object.keys(process.env).length;
      start.copyEnvToProcess({});
      const afterCount = Object.keys(process.env).length;

      expect(afterCount).toBe(beforeCount);
    });

    test('should copy string values correctly', () => {
      const configEnv = {
        TEST_STRING: 'hello world',
        TEST_EMPTY_STRING: '',
      };

      start.copyEnvToProcess(configEnv);

      expect(process.env.TEST_STRING).toBe('hello world');
      expect(process.env.TEST_EMPTY_STRING).toBe('');
    });

    test('should convert different types to strings', () => {
      const configEnv = {
        TEST_NUMBER: 123,
        TEST_BOOLEAN_TRUE: true,
        TEST_BOOLEAN_FALSE: false,
        TEST_ZERO: 0,
        TEST_FLOAT: 3.14,
      };

      start.copyEnvToProcess(configEnv);

      expect(process.env.TEST_NUMBER).toBe('123');
      expect(process.env.TEST_BOOLEAN_TRUE).toBe('true');
      expect(process.env.TEST_BOOLEAN_FALSE).toBe('false');
      expect(process.env.TEST_ZERO).toBe('0');
      expect(process.env.TEST_FLOAT).toBe('3.14');
    });

    test('should handle object values by converting to string', () => {
      const configEnv = {
        TEST_OBJECT: { key: 'value' },
        TEST_ARRAY: [1, 2, 3],
      };

      start.copyEnvToProcess(configEnv);

      expect(process.env.TEST_OBJECT).toBe('[object Object]');
      expect(process.env.TEST_ARRAY).toBe('1,2,3');
    });

    test('should skip null and undefined values', () => {
      const configEnv = {
        TEST_NULL: null,
        TEST_UNDEFINED: undefined,
        TEST_VALID: 'valid',
      };

      start.copyEnvToProcess(configEnv);

      expect(process.env.TEST_NULL).toBeUndefined();
      expect(process.env.TEST_UNDEFINED).toBeUndefined();
      expect(process.env.TEST_VALID).toBe('valid');
    });

    test('should overwrite existing env variables', () => {
      process.env.EXISTING_VAR = 'original';

      const configEnv = {
        EXISTING_VAR: 'overwritten',
      };

      start.copyEnvToProcess(configEnv);

      expect(process.env.EXISTING_VAR).toBe('overwritten');
    });

    test('should handle complex environment configuration', () => {
      const configEnv = {
        APP_NAME: 'MyApp',
        APP_PORT: 3000,
        APP_DEBUG: true,
        APP_FEATURES: ['auth', 'logging'],
        APP_CONFIG: { timeout: 5000 },
        APP_NULL: null,
        APP_UNDEFINED: undefined,
      };

      start.copyEnvToProcess(configEnv);

      expect(process.env.APP_NAME).toBe('MyApp');
      expect(process.env.APP_PORT).toBe('3000');
      expect(process.env.APP_DEBUG).toBe('true');
      expect(process.env.APP_FEATURES).toBe('auth,logging');
      expect(process.env.APP_CONFIG).toBe('[object Object]');
      expect(process.env.APP_NULL).toBeUndefined();
      expect(process.env.APP_UNDEFINED).toBeUndefined();
    });
  });
});
