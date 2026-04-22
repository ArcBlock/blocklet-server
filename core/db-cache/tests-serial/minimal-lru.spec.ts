/**
 * 最小化 LruCache 测试，用于验证覆盖率问题
 */
import { test, expect, describe } from 'bun:test';
import { LruCache } from '../src/lru-cache';

describe('LruCache minimal coverage test', () => {
  test('constructor initializes cache', () => {
    const cache = new LruCache({
      prefix: `minimal-test-${Date.now()}`,
      maxSize: 10,
      enableSync: false,
    });
    expect(cache).toBeDefined();
  });

  test('set and get basic value', () => {
    const cache = new LruCache({
      prefix: `minimal-test-${Date.now()}`,
      maxSize: 10,
      enableSync: false,
    });
    cache.set('key1', 'value1', null);
    const result = cache.get('key1');
    expect(result).toBe('value1');
  });

  test('has returns correct value', () => {
    const cache = new LruCache({
      prefix: `minimal-test-${Date.now()}`,
      maxSize: 10,
      enableSync: false,
    });
    cache.set('key1', 'value1', null);
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('nonexistent')).toBe(false);
  });

  test('del removes key', () => {
    const cache = new LruCache({
      prefix: `minimal-test-${Date.now()}`,
      maxSize: 10,
      enableSync: false,
    });
    cache.set('key1', 'value1', null);
    cache.del('key1');
    expect(cache.has('key1')).toBe(false);
  });

  test('clear removes all keys', () => {
    const cache = new LruCache({
      prefix: `minimal-test-${Date.now()}`,
      maxSize: 10,
      enableSync: false,
    });
    cache.set('key1', 'value1', null);
    cache.set('key2', 'value2', null);
    cache.clear();
    expect(cache.has('key1')).toBe(false);
    expect(cache.has('key2')).toBe(false);
  });

  test('group operations', () => {
    const cache = new LruCache({
      prefix: `minimal-test-${Date.now()}`,
      maxSize: 10,
      enableSync: false,
    });
    cache.groupSet('group1', 'sub1', 'value1', null);
    expect(cache.groupGet('group1', 'sub1')).toBe('value1');
    expect(cache.groupHas('group1', 'sub1')).toBe(true);
    cache.groupDel('group1', 'sub1');
    expect(cache.groupHas('group1', 'sub1')).toBe(false);
  });

  test('delByPrefix', () => {
    const cache = new LruCache({
      prefix: `minimal-test-${Date.now()}`,
      maxSize: 10,
      enableSync: false,
    });
    cache.set('prefix:key1', 'value1', null);
    cache.set('prefix:key2', 'value2', null);
    cache.set('other:key3', 'value3', null);
    const count = cache.delByPrefix('prefix:');
    expect(count).toBe(2);
    expect(cache.has('other:key3')).toBe(true);
  });

  test('getStats', () => {
    const cache = new LruCache({
      prefix: `minimal-test-${Date.now()}`,
      maxSize: 10,
      enableSync: false,
    });
    cache.set('key1', 'value1', null);
    const stats = cache.getStats();
    expect(stats.size).toBeGreaterThanOrEqual(1);
    expect(stats.maxSize).toBe(10);
  });

  test('close cleans up', () => {
    const cache = new LruCache({
      prefix: `minimal-test-${Date.now()}`,
      maxSize: 10,
      enableSync: false,
    });
    cache.set('key1', 'value1', null);
    cache.close();
    expect(() => cache.get('key1')).toThrow();
  });
});
