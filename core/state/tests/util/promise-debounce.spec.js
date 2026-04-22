const { test, expect, describe } = require('bun:test');
const promiseDebounce = require('../../lib/util/promise-debounce');

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
    const debouncedFn = promiseDebounce(fn, 100);

    debouncedFn();
    debouncedFn();
    await debouncedFn();

    expect(count).toBe(1);
  });
});
