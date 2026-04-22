/* eslint-disable no-console */
const { test, expect, describe, mock } = require('bun:test');
const getIp = require('../lib/get-ip.js');

describe('getIp', () => {
  test('should return ip as expected', async () => {
    const result = await getIp({
      timeout: 500,
      includeV6: true,
      checkIsEC2: mock(() => Promise.resolve(false)),
      checkIsGCP: mock(() => Promise.resolve(false)),
    });
    expect(result.internal).toBeTruthy();
  });

  test('should not return external ip', async () => {
    const result = await getIp({
      timeout: 500,
      includeV6: true,
      includeExternal: false,
      checkIsEC2: mock(() => Promise.resolve(false)),
      checkIsGCP: mock(() => Promise.resolve(false)),
    });
    expect(result.internal).toBeTruthy();
    expect(result.external).toBeFalsy();
    expect(result.externalV6).toBeFalsy();
  });
});
