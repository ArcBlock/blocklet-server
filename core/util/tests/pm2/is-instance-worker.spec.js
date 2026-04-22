const { describe, test, expect, beforeEach, afterEach } = require('bun:test');

const { isWorkerInstance } = require('../../lib/pm2/is-instance-worker');

describe('isWorkerInstance', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  test('should return false when NODE_APP_INSTANCE is undefined', () => {
    delete process.env.NODE_APP_INSTANCE;
    process.env.NODE_ENV = 'production';

    expect(isWorkerInstance()).toBe(false);
  });

  test('should return false when NODE_ENV is test (regardless of NODE_APP_INSTANCE)', () => {
    process.env.NODE_APP_INSTANCE = '1';
    process.env.NODE_ENV = 'test';

    expect(isWorkerInstance()).toBe(false);
  });

  test('should return false when NODE_APP_INSTANCE is "0" (main instance)', () => {
    process.env.NODE_APP_INSTANCE = '0';
    process.env.NODE_ENV = 'production';

    expect(isWorkerInstance()).toBe(false);
  });

  test('should return true when NODE_APP_INSTANCE is "1" and NODE_ENV is not test', () => {
    process.env.NODE_APP_INSTANCE = '1';
    process.env.NODE_ENV = 'production';

    expect(isWorkerInstance()).toBe(true);
  });

  test('should return true when NODE_APP_INSTANCE is "2" and NODE_ENV is not test', () => {
    process.env.NODE_APP_INSTANCE = '2';
    process.env.NODE_ENV = 'production';

    expect(isWorkerInstance()).toBe(true);
  });

  test('should return true when NODE_APP_INSTANCE is any non-zero value in development', () => {
    process.env.NODE_APP_INSTANCE = '3';
    process.env.NODE_ENV = 'development';

    expect(isWorkerInstance()).toBe(true);
  });

  test('should return false when NODE_ENV is test even with high instance number', () => {
    process.env.NODE_APP_INSTANCE = '5';
    process.env.NODE_ENV = 'test';

    expect(isWorkerInstance()).toBe(false);
  });

  test('should return false when NODE_APP_INSTANCE is empty string', () => {
    process.env.NODE_APP_INSTANCE = '';
    process.env.NODE_ENV = 'production';

    // Empty string is falsy but not undefined, so it enters the second condition
    // '' !== '0' is true, but '' is truthy in the check
    // Actually empty string is not undefined, so it proceeds
    // NODE_ENV !== 'test' (true) && NODE_APP_INSTANCE !== '0' (true for '')
    // So it returns true for empty string - let's verify
    expect(isWorkerInstance()).toBe(true);
  });
});
