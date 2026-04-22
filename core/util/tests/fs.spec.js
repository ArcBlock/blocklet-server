const { test, expect, describe } = require('bun:test');
const os = require('os');
const { canReadAndWriteDir, isEmptyDir } = require('../lib/fs');

describe('FS.canReadAndWriteDir', () => {
  test('should return true for tmp', () => {
    expect(canReadAndWriteDir(os.tmpdir())).toEqual(true);
  });
});

describe('FS.isEmptyDir', () => {
  test('should return false for tmp', () => {
    expect(isEmptyDir(os.tmpdir())).toEqual(false);
  });
});
