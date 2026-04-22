import { test, expect, describe, beforeEach } from 'bun:test';
import { LruCache } from '../src/lru-cache';
import { DBCache } from '../src';

const sleep = async (ms: number) => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
};

describe('LruCache', () => {
  let cache: LruCache;

  beforeEach(() => {
    cache = new LruCache({
      prefix: `test-${Math.random().toString(36).substring(2, 15)}`,
      maxSize: 100,
      enableSync: false, // 测试环境下禁用同步
    });
  });

  describe('Basic operations', () => {
    test('set and get value', () => {
      cache.set('key1', JSON.stringify({ v: 'value1' }), null);
      const result = cache.get('key1');
      expect(result).toBe(JSON.stringify({ v: 'value1' }));
    });

    test('get returns null for non-existent key', () => {
      const result = cache.get('nonexistent');
      expect(result).toBeNull();
    });

    test('has returns true for existing key', () => {
      cache.set('key1', JSON.stringify({ v: 'value1' }), null);
      expect(cache.has('key1')).toBe(true);
    });

    test('has returns false for non-existent key', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    test('del removes key', () => {
      cache.set('key1', JSON.stringify({ v: 'value1' }), null);
      cache.del('key1');
      expect(cache.has('key1')).toBe(false);
      expect(cache.get('key1')).toBeNull();
    });

    test('clear removes all keys', () => {
      cache.set('key1', JSON.stringify({ v: 'value1' }), null);
      cache.set('key2', JSON.stringify({ v: 'value2' }), null);
      cache.clear();
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('TTL expiration', () => {
    test('key expires after TTL', async () => {
      const expiresAt = Date.now() + 50; // 50ms TTL
      cache.set('tempKey', JSON.stringify({ v: 'tempValue' }), expiresAt);

      // 立即检查，应该存在
      expect(cache.has('tempKey')).toBe(true);
      expect(cache.get('tempKey')).toBe(JSON.stringify({ v: 'tempValue' }));

      // 等待过期
      await sleep(100);

      // 检查应该返回 false 并自动删除
      expect(cache.has('tempKey')).toBe(false);
      expect(cache.get('tempKey')).toBeNull();
    });

    test('key with null expiresAt never expires', async () => {
      cache.set('persistKey', JSON.stringify({ v: 'persistValue' }), null);

      await sleep(100);

      expect(cache.has('persistKey')).toBe(true);
      expect(cache.get('persistKey')).toBe(JSON.stringify({ v: 'persistValue' }));
    });

    test('multiple keys with different TTL', async () => {
      cache.set('short', JSON.stringify({ v: 'shortValue' }), Date.now() + 30);
      cache.set('long', JSON.stringify({ v: 'longValue' }), Date.now() + 200);

      await sleep(60);

      expect(cache.has('short')).toBe(false);
      expect(cache.has('long')).toBe(true);
    });
  });

  describe('Group operations', () => {
    test('groupSet and groupGet', () => {
      cache.groupSet('group1', 'subKey1', JSON.stringify({ v: 'value1' }), null);
      cache.groupSet('group1', 'subKey2', JSON.stringify({ v: 'value2' }), null);

      expect(cache.groupGet('group1', 'subKey1')).toBe(JSON.stringify({ v: 'value1' }));
      expect(cache.groupGet('group1', 'subKey2')).toBe(JSON.stringify({ v: 'value2' }));
    });

    test('groupGet returns null for non-existent group', () => {
      expect(cache.groupGet('nonexistent', 'subKey1')).toBeNull();
    });

    test('groupGet returns null for non-existent subKey', () => {
      cache.groupSet('group1', 'subKey1', JSON.stringify({ v: 'value1' }), null);
      expect(cache.groupGet('group1', 'nonexistent')).toBeNull();
    });

    test('groupHas returns true for existing subKey', () => {
      cache.groupSet('group1', 'subKey1', JSON.stringify({ v: 'value1' }), null);
      expect(cache.groupHas('group1', 'subKey1')).toBe(true);
    });

    test('groupHas returns false for non-existent group', () => {
      expect(cache.groupHas('nonexistent', 'subKey1')).toBe(false);
    });

    test('groupHas returns false for non-existent subKey', () => {
      cache.groupSet('group1', 'subKey1', JSON.stringify({ v: 'value1' }), null);
      expect(cache.groupHas('group1', 'nonexistent')).toBe(false);
    });

    test('groupDel removes subKey', () => {
      cache.groupSet('group1', 'subKey1', JSON.stringify({ v: 'value1' }), null);
      cache.groupSet('group1', 'subKey2', JSON.stringify({ v: 'value2' }), null);

      cache.groupDel('group1', 'subKey1');

      expect(cache.groupHas('group1', 'subKey1')).toBe(false);
      expect(cache.groupHas('group1', 'subKey2')).toBe(true);
    });

    test('groupDel on non-existent group does not throw', () => {
      expect(() => {
        cache.groupDel('nonexistent', 'subKey1');
      }).not.toThrow();
    });

    test('group entries expire after TTL', async () => {
      const expiresAt = Date.now() + 50;
      cache.groupSet('group1', 'tempSub', JSON.stringify({ v: 'tempValue' }), expiresAt);

      expect(cache.groupHas('group1', 'tempSub')).toBe(true);

      await sleep(100);

      expect(cache.groupHas('group1', 'tempSub')).toBe(false);
      expect(cache.groupGet('group1', 'tempSub')).toBeNull();
    });

    test('del removes all subKeys in group', () => {
      cache.groupSet('group1', 'subKey1', JSON.stringify({ v: 'value1' }), null);
      cache.groupSet('group1', 'subKey2', JSON.stringify({ v: 'value2' }), null);

      cache.del('group1');

      expect(cache.groupHas('group1', 'subKey1')).toBe(false);
      expect(cache.groupHas('group1', 'subKey2')).toBe(false);
    });

    test('clear removes all groups', () => {
      cache.groupSet('group1', 'subKey1', JSON.stringify({ v: 'value1' }), null);
      cache.groupSet('group2', 'subKey1', JSON.stringify({ v: 'value2' }), null);

      cache.clear();

      expect(cache.groupHas('group1', 'subKey1')).toBe(false);
      expect(cache.groupHas('group2', 'subKey1')).toBe(false);
    });
  });

  describe('Prefix deletion', () => {
    test('delByPrefix removes matching keys', () => {
      cache.set('prefix:key1', JSON.stringify({ v: 'value1' }), null);
      cache.set('prefix:key2', JSON.stringify({ v: 'value2' }), null);
      cache.set('other:key3', JSON.stringify({ v: 'value3' }), null);

      const count = cache.delByPrefix('prefix:');

      expect(count).toBe(2);
      expect(cache.has('prefix:key1')).toBe(false);
      expect(cache.has('prefix:key2')).toBe(false);
      expect(cache.has('other:key3')).toBe(true);
    });

    test('delByPrefix removes matching group caches', () => {
      cache.groupSet('prefix:group1', 'subKey1', JSON.stringify({ v: 'value1' }), null);
      cache.groupSet('prefix:group2', 'subKey2', JSON.stringify({ v: 'value2' }), null);
      cache.groupSet('other:group3', 'subKey3', JSON.stringify({ v: 'value3' }), null);

      cache.delByPrefix('prefix:');

      expect(cache.groupHas('prefix:group1', 'subKey1')).toBe(false);
      expect(cache.groupHas('prefix:group2', 'subKey2')).toBe(false);
      expect(cache.groupHas('other:group3', 'subKey3')).toBe(true);
    });

    test('delByPrefix returns 0 when no matches', () => {
      cache.set('key1', JSON.stringify({ v: 'value1' }), null);

      const count = cache.delByPrefix('nonexistent:');

      expect(count).toBe(0);
      expect(cache.has('key1')).toBe(true);
    });
  });

  describe('Statistics', () => {
    test('getStats returns correct counts', () => {
      cache.set('key1', JSON.stringify({ v: 'value1' }), null);
      cache.set('key2', JSON.stringify({ v: 'value2' }), null);
      cache.groupSet('group1', 'subKey1', JSON.stringify({ v: 'value3' }), null);
      cache.groupSet('group1', 'subKey2', JSON.stringify({ v: 'value4' }), null);
      cache.groupSet('group2', 'subKey1', JSON.stringify({ v: 'value5' }), null);

      const stats = cache.getStats();

      expect(stats.size).toBe(2); // 2 普通缓存
      expect(stats.groupCount).toBe(3); // 3 分组缓存
      expect(stats.maxSize).toBe(100);
    });

    test('getStats returns zero counts for empty cache', () => {
      const stats = cache.getStats();

      expect(stats.size).toBe(0);
      expect(stats.groupCount).toBe(0);
      expect(stats.maxSize).toBe(100);
    });

    test('getStats updates after operations', () => {
      cache.set('key1', JSON.stringify({ v: 'value1' }), null);
      expect(cache.getStats().size).toBe(1);

      cache.del('key1');
      expect(cache.getStats().size).toBe(0);

      cache.groupSet('group1', 'subKey1', JSON.stringify({ v: 'value1' }), null);
      expect(cache.getStats().groupCount).toBe(1);

      cache.clear();
      expect(cache.getStats().size).toBe(0);
      expect(cache.getStats().groupCount).toBe(0);
    });
  });

  describe('Cache instance sharing', () => {
    test('same prefix shares cache data', () => {
      const prefix = `shared-${Math.random().toString(36).substring(2, 15)}`;
      const cache1 = new LruCache({ prefix, maxSize: 100, enableSync: false });
      const cache2 = new LruCache({ prefix, maxSize: 100, enableSync: false });

      cache1.set('key1', JSON.stringify({ v: 'value1' }), null);

      // cache2 应该能读到 cache1 写入的数据
      expect(cache2.get('key1')).toBe(JSON.stringify({ v: 'value1' }));
    });

    test('different prefix has separate cache data', () => {
      const cache1 = new LruCache({
        prefix: `prefix1-${Math.random().toString(36).substring(2, 15)}`,
        maxSize: 100,
        enableSync: false,
      });
      const cache2 = new LruCache({
        prefix: `prefix2-${Math.random().toString(36).substring(2, 15)}`,
        maxSize: 100,
        enableSync: false,
      });

      cache1.set('key1', JSON.stringify({ v: 'value1' }), null);

      // cache2 不应该能读到 cache1 的数据
      expect(cache2.get('key1')).toBeNull();
    });
  });

  describe('Close', () => {
    test('close cleans up resources', () => {
      cache.set('key1', JSON.stringify({ v: 'value1' }), null);
      cache.close();

      // 关闭后尝试操作应该抛出错误
      expect(() => {
        cache.get('key1');
      }).toThrow('LRU cache not initialized');
    });
  });

  describe('LRU eviction', () => {
    test('evicts least recently used entries when maxSize reached', () => {
      const smallCache = new LruCache({
        prefix: `small-${Math.random().toString(36).substring(2, 15)}`,
        maxSize: 3,
        enableSync: false,
      });

      // 写入 3 个条目
      smallCache.set('key1', JSON.stringify({ v: 'value1' }), null);
      smallCache.set('key2', JSON.stringify({ v: 'value2' }), null);
      smallCache.set('key3', JSON.stringify({ v: 'value3' }), null);

      expect(smallCache.getStats().size).toBe(3);

      // 写入第 4 个条目，应该淘汰最早的 key1
      smallCache.set('key4', JSON.stringify({ v: 'value4' }), null);

      expect(smallCache.getStats().size).toBe(3);
      expect(smallCache.has('key1')).toBe(false);
      expect(smallCache.has('key2')).toBe(true);
      expect(smallCache.has('key3')).toBe(true);
      expect(smallCache.has('key4')).toBe(true);
    });

    test('accessing key updates LRU order', () => {
      const smallCache = new LruCache({
        prefix: `small-${Math.random().toString(36).substring(2, 15)}`,
        maxSize: 3,
        enableSync: false,
      });

      smallCache.set('key1', JSON.stringify({ v: 'value1' }), null);
      smallCache.set('key2', JSON.stringify({ v: 'value2' }), null);
      smallCache.set('key3', JSON.stringify({ v: 'value3' }), null);

      // 访问 key1，使其成为最近使用的
      smallCache.get('key1');

      // 写入第 4 个条目，应该淘汰 key2（最早未被访问的）
      smallCache.set('key4', JSON.stringify({ v: 'value4' }), null);

      expect(smallCache.has('key1')).toBe(true);
      expect(smallCache.has('key2')).toBe(false);
      expect(smallCache.has('key3')).toBe(true);
      expect(smallCache.has('key4')).toBe(true);
    });
  });
});

describe('DBCache with LruCache integration', () => {
  test('SQLite adapter with enableLruCache=true', async () => {
    const prefix = DBCache.randomKey();
    const db = new DBCache(() => ({
      prefix,
      sqlitePath: ':memory:',
      ttl: 5000,
      enableLruCache: true,
      lruMaxSize: 50,
      enableSync: false,
    }));

    await db.flushAll();

    // 写入数据
    await db.set('key1', 'value1', { ttl: 5000 });

    // 第一次读取（从 L2 数据库）
    const value1 = await db.get('key1');
    expect(value1).toBe('value1');

    // 第二次读取（从 L1 LRU 缓存）
    const value2 = await db.get('key1');
    expect(value2).toBe('value1');

    // 验证 LRU 缓存统计
    const stats = db.getLruCacheStats();
    expect(stats).not.toBeNull();
    expect(stats!.size).toBeGreaterThanOrEqual(1);
    expect(stats!.maxSize).toBe(50);

    await db.close();
  });

  test('SQLite adapter with enableLruCache=false', async () => {
    const prefix = DBCache.randomKey();
    const db = new DBCache(() => ({
      prefix,
      sqlitePath: ':memory:',
      ttl: 5000,
      enableLruCache: false,
    }));

    await db.flushAll();

    await db.set('key1', 'value1', { ttl: 5000 });
    const value = await db.get('key1');
    expect(value).toBe('value1');

    // LRU 缓存统计应该返回 null
    const stats = db.getLruCacheStats();
    expect(stats).toBeNull();

    await db.close();
  });

  test('Redis adapter returns null for LRU cache stats', async () => {
    // 如果没有 TEST_REDIS_URL，跳过此测试
    if (!process.env.TEST_REDIS_URL) {
      console.log('Skipping Redis test: TEST_REDIS_URL not set');
      return;
    }

    const prefix = DBCache.randomKey();
    const db = new DBCache(() => ({
      prefix,
      sqlitePath: ':memory:',
      ttl: 5000,
      redisUrl: process.env.TEST_REDIS_URL,
      enableLruCache: true, // Redis 不使用 LRU 缓存
    }));

    await db.flushAll();

    await db.set('key1', 'value1', { ttl: 5000 });
    const value = await db.get('key1');
    expect(value).toBe('value1');

    // Redis adapter 应该返回 null
    const stats = db.getLruCacheStats();
    expect(stats).toBeNull();

    await db.close();
  });

  test('SQLite adapter with group operations and LRU cache', async () => {
    const prefix = DBCache.randomKey();
    const db = new DBCache(() => ({
      prefix,
      sqlitePath: ':memory:',
      ttl: 5000,
      enableLruCache: true,
      lruMaxSize: 50,
      enableSync: false,
    }));

    await db.flushAll();

    // 写入分组数据
    await db.groupSet('group1', 'subKey1', { a: 'a', b: 'b' }, { ttl: 5000 });
    await db.groupSet('group1', 'subKey2', { c: 'c', d: 'd' }, { ttl: 5000 });

    // 读取分组数据
    const value1 = await db.groupGet('group1', 'subKey1');
    const value2 = await db.groupGet('group1', 'subKey2');

    expect(value1).toStrictEqual({ a: 'a', b: 'b' });
    expect(value2).toStrictEqual({ c: 'c', d: 'd' });

    // 验证 LRU 缓存统计（应该包含分组数据）
    const stats = db.getLruCacheStats();
    expect(stats).not.toBeNull();
    expect(stats!.groupCount).toBeGreaterThanOrEqual(2);

    await db.close();
  });

  test('SQLite adapter LRU cache respects maxSize limit', async () => {
    const prefix = DBCache.randomKey();
    const db = new DBCache(() => ({
      prefix,
      sqlitePath: ':memory:',
      ttl: 5000,
      enableLruCache: true,
      lruMaxSize: 150, // 超过 MAX_LRU_CACHE_SIZE=100，应该使用 100
      enableSync: false,
    }));

    await db.flushAll();

    const stats = db.getLruCacheStats();
    expect(stats).not.toBeNull();
    expect(stats!.maxSize).toBe(100); // 应该被限制为 100

    await db.close();
  });
});
