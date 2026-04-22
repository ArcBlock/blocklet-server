const { describe, expect, test, beforeEach, afterEach } = require('bun:test');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const ini = require('ini');
const Config = require('../../../lib/util/blocklet/config');

describe('Config', () => {
  const TEST_FILE = path.join(os.tmpdir(), `blocklet-util-config-test-${Date.now()}.ini`);

  beforeEach(() => {
    fs.removeSync(TEST_FILE);
  });

  afterEach(() => {
    fs.removeSync(TEST_FILE);
  });

  describe('initialize', () => {
    test('should create config file', () => {
      const temp = new Config({ configFile: TEST_FILE });
      expect(fs.existsSync(TEST_FILE)).toBe(true);
      expect(temp.configFile).toEqual(TEST_FILE);
    });

    test('should throw error is configFile is empty', () => {
      expect(() => new Config()).toThrow(/configFile argument is required/);
    });

    test('should set section', () => {
      const temp1 = new Config({ configFile: TEST_FILE });
      expect(temp1.section).toBe(undefined);
      const temp2 = new Config({ configFile: TEST_FILE, section: 'test' });
      expect(temp2.section).toBe('test');
    });

    test('should load config correctly', () => {
      fs.ensureFileSync(TEST_FILE);
      fs.writeFileSync(TEST_FILE, 'registry=https://booster.registry.arcblock.io');
      const temp = new Config({ configFile: TEST_FILE });
      expect(temp.config).toEqual(ini.parse(fs.readFileSync(TEST_FILE).toString()));
    });
  });

  describe('set', () => {
    test('should set config correctly with section', () => {
      const config = new Config({ configFile: TEST_FILE, section: 'blocklet' });
      config.set('test1', 1);
      expect(config.get('test1')).toEqual(1);
      expect(config.get('test2')).toEqual(undefined);
    });

    test('should set config correctly without section', () => {
      const config = new Config({ configFile: TEST_FILE });
      config.set('test3', 1);
      expect(config.get('test3')).toEqual(1);
      expect(config.get('test2')).toEqual(undefined);
    });
  });

  describe('get', () => {
    test('should return the config specified by key', () => {
      const config = new Config({ configFile: TEST_FILE });
      config.set('test1', 1);
      config.set('test2', 2);
      config.set('test3', 3);

      expect(config.get('test2')).toEqual(2);
    });

    test('should return all config without key', () => {
      const config = new Config({ configFile: TEST_FILE });
      config.set('test1', 1);
      config.set('test2', 2);
      config.set('test3', 3);

      expect(config.get()).toEqual({ test1: 1, test2: 2, test3: 3 });
    });

    test('should return undefined the key does not exist', () => {
      const config = new Config({ configFile: TEST_FILE });

      expect(config.get('nonexistentkey')).toBeUndefined();
    });
  });

  describe('setSection', () => {
    const config = new Config({ configFile: TEST_FILE, section: 'section1' });
    expect(config.section).toBe('section1');

    config.setSection('section2');
    expect(config.section).toBe('section2');
  });

  describe('stringify', () => {
    test('should return origin value if argument is string type', () => {
      expect(Config.stringify('test')).toEqual('test');
      expect(Config.stringify({ test: 1 })).toEqual(ini.stringify({ test: 1 }));
    });
  });
});
