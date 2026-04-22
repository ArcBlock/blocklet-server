const { describe, test, expect, beforeAll, afterAll } = require('bun:test');
const CacheState = require('../../lib/states/cache');
const { setupInMemoryModels } = require('../../tools/fixture');

describe('CacheState', () => {
  let state = null;
  let models = null;

  beforeAll(async () => {
    models = await setupInMemoryModels();
    state = new CacheState(models.Cache, {});
  });

  test('should work as expected', async () => {
    expect(await state.set('key1', 1)).toBe(1);
    expect(await state.get('key1')).toBe(1);

    expect(await state.set('key2', 2)).toBe(2);
    expect(await state.get('key2')).toBe(2);

    expect(await state.set('key1', 2)).toBe(2);
    expect(await state.get('key1')).toBe(2);

    await state.delete('key1');
    expect(await state.get('key1')).toBe(undefined);

    expect(await state.get('key2')).toBe(2);
  });

  afterAll(async () => {
    await state.reset();
  });
});
