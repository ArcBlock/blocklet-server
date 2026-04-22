/* eslint-disable no-console */
const { test, expect, describe } = require('bun:test');
const pm2 = require('../../lib/pm2/async-pm2');

describe('AsyncPm2', () => {
  test('should attach async methods as expected', () => {
    pm2.__asyncApiList.forEach((x) => {
      expect(typeof pm2[`${x}Async`]).toEqual('function');
    });
  });
});
