const { test, describe, expect } = require('bun:test');
const { PROCESS_NAME_UPDATER } = require('@abtnode/constant');
const { getInternalPort: getPort } = require('../lib/port');

describe('getPort', () => {
  test('should assign new port when nothing in env and pm2', () => {
    const port = getPort(PROCESS_NAME_UPDATER);
    expect(port).toEqual(40405);
  });
});
