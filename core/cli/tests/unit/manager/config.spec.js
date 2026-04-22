const { describe, expect, test } = require('bun:test');
const path = require('path');
const os = require('os');
const fs = require('fs-extra');

const { verifyDataDirectory, joinConfigDir } = require('../../../lib/manager/config');

describe('configManager', () => {
  describe('verifyDataDirectory', () => {
    test('should throw error if the dir param is empty', () => {
      expect(() => verifyDataDirectory(null)).toThrow('dir should not be empty');
      expect(() => verifyDataDirectory(undefined)).toThrow('dir should not be empty');
      expect(() => verifyDataDirectory('')).toThrow('dir should not be empty');
    });

    test('should throw error if the directory does not exit', () => {
      const pathDoesNotExists = path.join(os.tmpdir(), 'abtnode-unit-test', String(Date.now()));
      expect(() => verifyDataDirectory(pathDoesNotExists)).toThrow(/does not exist/);
    });

    test('should throw error if the directory does not exit', () => {
      const configDir = path.join(os.tmpdir(), 'abtnode-unit-test', String(Date.now()));
      fs.mkdirSync(joinConfigDir(configDir), { recursive: true });
      expect(() => verifyDataDirectory(configDir)).toThrow(/the config file does not exist in/);
      fs.removeSync(configDir);
    });
  });
});
