// eslint-disable-next-line import/no-unresolved
const { describe, test, expect, beforeAll, afterAll } = require('bun:test');
/* eslint-disable global-require */
const os = require('os');

describe('@blocklet/logger', () => {
  test('should throw error if process.env.BLOCKLET_LOG_DIR is not set', () => {
    expect(() => require('../lib')).toThrow(/valid BLOCKLET_LOG_DIR env is required by logger/i);
  });

  describe('should export correct function', () => {
    let oldLogDir = process.env.BLOCKLET_LOG_DIR;
    beforeAll(() => {
      oldLogDir = process.env.BLOCKLET_LOG_DIR;
      process.env.BLOCKLET_LOG_DIR = os.homedir();
    });

    afterAll(() => {
      process.env.BLOCKLET_LOG_DIR = oldLogDir;
    });

    test('should export a factory function by default', () => {
      const logger = require('../lib')('test');

      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    test('should export getAccessLogStream function', () => {
      const logger = require('../lib');

      expect(typeof logger.getAccessLogStream).toBe('function');
    });
  });
});
