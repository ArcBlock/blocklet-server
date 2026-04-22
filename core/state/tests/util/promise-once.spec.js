const { test, expect, describe } = require('bun:test');
const promiseOnce = require('../../lib/util/promise-once');

describe('wrapWithDebounceAndSingleExec', () => {
  test('should work as expected', async () => {
    let count = 0;
    const fn = () => {
      count++;
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve('done');
        }, 500);
      });
    };
    const onceFn = promiseOnce(fn, 100);

    await onceFn();
    await onceFn();
    await onceFn();

    expect(count).toBe(1);
  });
});
