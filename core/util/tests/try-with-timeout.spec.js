const { describe, expect, test } = require('bun:test');
const tryWithTimeout = require('../lib/try-with-timeout');

describe('tryWithTimeout', () => {
  test('should throw wit invalid args', async () => {
    try {
      await tryWithTimeout(null, 10);
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });

  test('should resolve expected result within timeout', async () => {
    const result = await tryWithTimeout(() => true, 50);
    expect(result).toEqual(true);
  });

  test('should resolve expected result within timeout', async () => {
    try {
      // eslint-disable-next-line no-promise-executor-return
      await tryWithTimeout(() => new Promise((resolve) => setTimeout(() => resolve(true), 60)), 50);
    } catch (err) {
      expect(err).toBeTruthy();
      expect(err.message).toContain('Operation timed out after 50 ms');
    }
  });
});
