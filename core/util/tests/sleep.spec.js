const { describe, expect, test } = require('bun:test');
const sleep = require('../lib/sleep');

describe('Sleep', () => {
  test('should work as expected', async () => {
    const now = performance.now();
    await sleep(100);
    expect(performance.now() - now).toBeGreaterThan(10);
  });
});
