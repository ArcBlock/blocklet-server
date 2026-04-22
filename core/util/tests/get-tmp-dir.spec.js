/* eslint-disable no-console */
const { describe, test, expect } = require('bun:test');
const getTmpDir = require('../lib/get-tmp-directory');

describe('getTmpDir', () => {
  test('should work as expected', () => {
    const now = Date.now();
    expect(getTmpDir()).toBeTruthy();
    expect(getTmpDir(now).indexOf(now) > 0).toBeTruthy();
  });
});
