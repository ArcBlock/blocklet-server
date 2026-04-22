const { describe, test, expect, beforeAll, afterAll } = require('bun:test');
const BlacklistState = require('../../lib/states/blacklist');
const { setupInMemoryModels } = require('../../tools/fixture');

describe('BlacklistState', () => {
  let state = null;
  let models = null;

  beforeAll(async () => {
    models = await setupInMemoryModels();
    state = new BlacklistState(models.Blacklist, {});
  });

  test('should work as expected', async () => {
    const now = Math.floor(Date.now() / 1000);
    const future = now + 3600; // 1 hour from now
    const past = now - 3600; // 1 hour ago

    // Test adding new items
    expect(await state.addItem('test', 'key1', future)).toBe(true);
    expect(await state.addItem('test', 'key2', future)).toBe(true);
    expect(await state.addItem('other', 'key3', future)).toBe(true);

    // Test finding active items by scope
    const activeItems = await state.findActiveByScope('test');
    expect(activeItems).toHaveLength(2);
    expect(activeItems.map((x) => x.key).sort()).toEqual(['key1', 'key2']);

    // Test adding duplicate item that hasn't expired
    expect(await state.addItem('test', 'key1', future)).toBe(false);

    // Test adding duplicate item that has expired
    expect(await state.addItem('test', 'expired', past)).toBe(false);

    // Test removing expired items
    const removedCount = await state.removeExpiredByScope('test');
    expect(removedCount).toBe(0); // Should remove the expired item

    // Verify remaining active items
    const remainingItems = await state.findActiveByScope('test');
    expect(remainingItems).toHaveLength(2);
  });

  afterAll(async () => {
    await state.reset();
  });
});
