const { describe, test, expect, beforeAll, afterAll } = require('bun:test');
const MigrationState = require('../../lib/states/migration');
const { setupInMemoryModels } = require('../../tools/fixture');

describe('MigrationState', () => {
  let store = null;
  let models = null;

  beforeAll(async () => {
    models = await setupInMemoryModels();
    store = new MigrationState(models.Migration, {});
  });

  test('should work as expected', async () => {
    let result = await store.isExecuted({ script: '1', version: '1' });
    expect(result).toEqual(false);

    result = await store.markExecuted({ script: '1', version: '1' });
    expect(result.executedAt).toBeTruthy();

    result = await store.isExecuted({ script: '1', version: '1' });
    expect(result).toEqual(true);
  });

  afterAll(async () => {
    await store.reset();
  });
});
