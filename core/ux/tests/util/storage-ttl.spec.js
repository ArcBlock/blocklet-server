import { describe, expect, it, spyOn, afterEach, beforeEach, afterAll } from 'bun:test';
import { getStorageWithTTL, setStorageWithTTL, removeStorageTTL, clearExpiredItems } from '../../src/util/storage-ttl';

// 在覆盖率模式下 Date.now() 可能不准确，使用 performance.now() 来修正
const originalDateNow = Date.now;
const startTime = originalDateNow();
const startPerf = performance.now();
Date.now = () => Math.floor(startTime + (performance.now() - startPerf));

// 使用 performance.now() 确保在覆盖率模式下时间准确
const sleep = (ms) =>
  new Promise((resolve) => {
    const start = performance.now();
    const check = () => {
      if (performance.now() - start >= ms) {
        resolve();
      } else {
        setTimeout(check, Math.min(50, ms / 10));
      }
    };
    setTimeout(check, Math.min(50, ms / 10));
  });

describe('Storage with TTL', () => {
  afterAll(() => {
    Date.now = originalDateNow;
  });
  let setItemSpy;
  let getItemSpy;
  let removeItemSpy;
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    setItemSpy = spyOn(Storage.prototype, 'setItem');
    getItemSpy = spyOn(Storage.prototype, 'getItem');
    removeItemSpy = spyOn(Storage.prototype, 'removeItem');
  });

  afterEach(() => {
    setItemSpy.mockRestore();
    getItemSpy.mockRestore();
    removeItemSpy.mockRestore();
    localStorage.clear();
  });

  it('gets item with TTL from localStorage if not expired', () => {
    setStorageWithTTL('testKey', 'testValue', 5000);
    const value = getStorageWithTTL('testKey');
    expect(value).toEqual('testValue');
  });

  it('returns null if item with TTL from localStorage is expired', async () => {
    setStorageWithTTL('testKey', 'testValue', 1000);
    await sleep(2000);
    const value = getStorageWithTTL('testKey');
    expect(value).toBeNull();
  });

  it('returns null immediately when TTL is 0', async () => {
    setStorageWithTTL('testKey', 'testValue', 0);
    await sleep(1);
    const value = getStorageWithTTL('testKey');
    expect(value).toBeNull();
  });

  it('returns null immediately when TTL is negative', () => {
    setStorageWithTTL('testKey', 'testValue', -5000);
    const value = getStorageWithTTL('testKey');
    expect(value).toBeNull();
  });

  it('can store and retrieve null value', () => {
    setStorageWithTTL('testKey', null, 5000);
    const value = getStorageWithTTL('testKey');
    expect(value).toBeNull();
  });

  it('returns null when value is undefined', () => {
    setStorageWithTTL('testKey', undefined, 5000);
    const value = getStorageWithTTL('testKey');
    expect(value).toBeNull();
  });

  it('removes an item with TTL from local storage', () => {
    setStorageWithTTL('testKey', 'testValue', 5000);
    removeStorageTTL('testKey');
    const value = getStorageWithTTL('testKey');
    expect(value).toBeNull();
  });

  it('clears expired items from local storage', () => {
    setStorageWithTTL('testKey1', 'testValue1', 5000);
    setStorageWithTTL('testKey2', 'testValue2', -5000); // This item is already expired

    const value1 = getStorageWithTTL('testKey1');
    const value2 = getStorageWithTTL('testKey2');

    expect(value1).toEqual('testValue1'); // This item should not be cleared
    expect(value2).toBeNull(); // This item should be cleared
  });

  it('clears expired items from local storage', () => {
    setStorageWithTTL('testKey1', 'testValue1', 5000);
    setStorageWithTTL('testKey2', 'testValue2', -5000); // This item is already expired

    clearExpiredItems(true);

    const value1 = getStorageWithTTL('testKey1');
    const value2 = localStorage.getItem('ttl-testKey2');

    expect(value1).toEqual('testValue1'); // This item should not be cleared
    expect(value2).toBeNull(); // This item should be cleared
  });

  it('clears expired items from local storage after 5 minutes', async () => {
    const now = Date.now();
    setStorageWithTTL('testKey', 'testValue', 1000);

    const valueBefore = JSON.parse(localStorage.getItem('ttl-testKey'));

    expect(valueBefore.value).toBe('testValue');
    await sleep(2000);
    expect(Date.now() - now).toBeGreaterThan(1000);
    clearExpiredItems(true, Date.now());

    const value = localStorage.getItem('ttl-testKey');

    expect(value).toBeNull(); // This item should be cleared
  });

  it('does not clear items that are not expired', () => {
    setStorageWithTTL('testKey', 'testValue', 5000);

    clearExpiredItems(true);

    const value = getStorageWithTTL('testKey');

    expect(value).toEqual('testValue'); // This item should not be cleared
  });

  it('does not clear items that do not have a TTL', () => {
    localStorage.setItem('ttl-testKey', 'testValue');

    clearExpiredItems(true);

    const value = localStorage.getItem('ttl-testKey');

    expect(value).toEqual('testValue'); // This item should not be cleared
  });

  it('does not clear items that have a TTL prefix but do not have an expiry', async () => {
    localStorage.setItem('ttl-testKey', 'testValue');

    await sleep(500);
    clearExpiredItems(true);

    const value = localStorage.getItem('ttl-testKey');

    expect(value).toEqual('testValue'); // This item should not be cleared
  });
});
