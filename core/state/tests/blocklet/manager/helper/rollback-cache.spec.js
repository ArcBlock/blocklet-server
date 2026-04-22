const { test, expect, describe } = require('bun:test');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const RollbackCache = require('../../../../lib/blocklet/manager/helper/rollback-cache');

describe('RollbackCache', () => {
  test('should work without dek', async () => {
    const rollbackCache = new RollbackCache({ dir: path.join(os.tmpdir(), Date.now().toString()) });

    const oldBlocklet = { meta: { xxxxx: 'xxxxx' } };

    await rollbackCache.backup({ did: 'did123', action: 'install', oldBlocklet });

    const data1 = await rollbackCache.restore({ did: 'did123' });
    expect(data1.action).toBe('install');
    expect(data1.oldBlocklet).toEqual(oldBlocklet);

    const data2 = await rollbackCache.restore({ did: 'not exist' });
    expect(data2).toBeFalsy();
  });

  test('should work with dek', async () => {
    const rollbackCache = new RollbackCache({
      dir: path.join(os.tmpdir(), Date.now().toString()),
      dek: crypto.randomBytes(32),
    });

    const oldBlocklet = { meta: { xxxxx: 'xxxxx' } };

    await rollbackCache.backup({ did: 'did123', action: 'install', oldBlocklet });

    const data1 = await rollbackCache.restore({ did: 'did123' });
    expect(data1.action).toBe('install');
    expect(data1.oldBlocklet).toEqual(oldBlocklet);

    const data2 = await rollbackCache.restore({ did: 'not exist' });
    expect(data2).toBeFalsy();
  });
});
