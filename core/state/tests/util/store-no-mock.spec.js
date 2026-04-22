const { test, expect, describe } = require('bun:test');
const path = require('path');
const fs = require('fs-extra');
const StoreUtil = require('../../lib/util/store');

describe('fixAndVerifyMetaFromStore', () => {
  test('should work as expected: valid signature', async () => {
    const meta = fs.readJSONSync(path.resolve(__dirname, '../assets/dapp-demo-1.0.0.json'));
    const result = await StoreUtil.fixAndVerifyMetaFromStore(meta);
    expect(result).toBeTruthy();
  });

  test('should work as expected: invalid signature', async () => {
    const invalid = fs.readJSONSync(path.resolve(__dirname, '../assets/dapp-demo-invalid.json'));
    await expect(StoreUtil.fixAndVerifyMetaFromStore(invalid)).rejects.toThrow();
  });
});
