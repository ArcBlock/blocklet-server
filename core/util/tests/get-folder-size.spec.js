const { test, expect, describe } = require('bun:test');
const getFolderSize = require('../lib/get-folder-size');

describe('getDirSize', () => {
  test('should get dir size', async () => {
    const size = await getFolderSize(__dirname);
    expect(size > 0).toBeTruthy();
  });
});
