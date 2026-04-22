import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { DBCache } from '../src';
import { ulid } from '../tools/ulid';

// 在覆盖率模式下 Date.now() 可能不准确，使用 performance.now() 来修正
const originalDateNow = Date.now;
const startTime = originalDateNow();
const startPerf = performance.now();
Date.now = () => Math.floor(startTime + (performance.now() - startPerf));

// 使用 performance.now() 确保在覆盖率模式下时间准确
const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
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

describe('DBCache', () => {
  let cache: DBCache;

  // eslint-disable-next-line no-console
  console.log(`Has REDIS_URL: ${process.env.TEST_REDIS_URL ? 'yes' : 'no'}`);

  afterAll(() => {
    Date.now = originalDateNow;
  });

  beforeAll(async () => {
    // Use a file-based SQLite DB named 'test.db'; Redis URL may be undefined
    const prefix = DBCache.randomKey();
    cache = new DBCache(() => ({
      prefix,
      ttl: 10_000,
      sqlitePath: ':memory:',
      redisUrl: process.env.TEST_REDIS_URL,
    }));
    await cache.flushAll();
  });

  test('get returns null for nonexistent key', async () => {
    await expect(cache.get('nope')).resolves.toBeNull();
  });

  test('has returns false for nonexistent key', async () => {
    await expect(cache.has('nope')).resolves.toBe(false);
  });

  test('set/get with primitive types', async () => {
    const key = DBCache.randomKey();
    await cache.set(key, 'hello', { ttl: 5000 });
    await cache.set(`${key}-num`, 123, { ttl: 5000 });
    await cache.set(`${key}-bool`, true, { ttl: 5000 });
    await cache.set(`${key}-arr`, [1, 2, 3], { ttl: 5000 });

    await expect(cache.get(key)).resolves.toBe('hello');
    await expect(cache.get(`${key}-num`)).resolves.toBe(123);
    await expect(cache.get(`${key}-bool`)).resolves.toBe(true);
    await expect(cache.get(`${key}-arr`)).resolves.toEqual([1, 2, 3]);
  });

  test('override TTL per set', async () => {
    const key = DBCache.randomKey();
    const prefix = DBCache.randomKey();
    const shortCache = new DBCache(() => ({
      prefix,
      sqlitePath: ':memory:',
      ttl: 5000,
      redisUrl: process.env.TEST_REDIS_URL,
    }));
    await shortCache.flushAll();

    await shortCache.set(`${key}-temp1`, 'val1', { ttl: 10 }); // expires quickly
    await expect(shortCache.get(`${key}-temp1`)).resolves.toBe('val1');

    await shortCache.set(`${key}-temp2`, 'val2', { ttl: 5000 }); // longer TTL
    await expect(shortCache.get(`${key}-temp2`)).resolves.toBe('val2');

    await sleep(20);

    await expect(shortCache.get(`${key}-temp1`)).resolves.toBeNull();
    await expect(shortCache.get(`${key}-temp2`)).resolves.toBe('val2');
  });

  test('persistent keys when TTL=1', async () => {
    const key = DBCache.randomKey();
    const prefix = DBCache.randomKey();
    const persistent = new DBCache(() => ({
      prefix,
      sqlitePath: ':memory:',
      ttl: 5000,
      redisUrl: process.env.TEST_REDIS_URL,
    }));
    await persistent.flushAll();

    await persistent.set(`${key}-forever`, 'stay', { ttl: 1 });
    await sleep(150);

    await expect(persistent.get(`${key}-forever`)).resolves.toBeNull();
  });

  test('persistent keys when TTL=0', async () => {
    const key = DBCache.randomKey();
    const prefix = DBCache.randomKey();
    const persistent = new DBCache(() => ({
      prefix,
      sqlitePath: ':memory:',
      ttl: 5000,
      redisUrl: process.env.TEST_REDIS_URL,
    }));
    await persistent.flushAll();

    await persistent.set(`${key}-forever`, 'stay', { ttl: 0 });
    await sleep(150);

    await expect(persistent.get(`${key}-forever`)).resolves.toBe('stay');
  });

  test('persistent keys when TTL=10', async () => {
    const key = DBCache.randomKey();
    const prefix = DBCache.randomKey();
    const persistent = new DBCache(() => ({
      prefix,
      sqlitePath: ':memory:',
      ttl: 5000,
      redisUrl: process.env.TEST_REDIS_URL,
    }));
    await persistent.flushAll();

    await persistent.set(`${key}-forever`, 'stay', { ttl: 10 });
    await sleep(300);
    const res = await persistent.get(`${key}-forever`);

    expect(res).toBeNull();
  });

  test('has removes and returns false for expired key', async () => {
    const prefix = DBCache.randomKey();
    const shortDb = new DBCache(() => ({
      prefix,
      sqlitePath: ':memory:',
      redisUrl: process.env.TEST_REDIS_URL,
      ttl: 5000,
    }));
    await shortDb.flushAll();
    const key: string = ulid();

    await shortDb.set(`${key}-hkey`, 'hval', { ttl: 1000 });
    await expect(shortDb.has(`${key}-hkey`)).resolves.toBe(true);

    // wait for expiration
    await sleep(2000);

    await expect(shortDb.has(`${key}-hkey`)).resolves.toBe(false);
  });

  test('has removes and returns false for expired key many keys', async () => {
    const prefix = DBCache.randomKey();
    const db = new DBCache(() => ({
      prefix,
      sqlitePath: ':memory:',
      redisUrl: process.env.TEST_REDIS_URL,
      ttl: 5000,
    }));
    await db.flushAll();
    const count: number = 200;
    const key: string = ulid();

    for (let i = 0; i < count; i++) {
      // eslint-disable-next-line no-await-in-loop
      await db.set(`${key}-exKey-${i}`, 'v1', { ttl: 20 });
    }

    // wait for expiration
    await sleep(150);

    for (let i = 0; i < count; i++) {
      // eslint-disable-next-line no-await-in-loop
      await expect(db.get(`${key}-exKey-${i}`)).resolves.toBeNull();
    }
  });

  test('groupSet/get/has', async () => {
    const prefix = DBCache.randomKey();
    const db = new DBCache(() => ({
      prefix,
      sqlitePath: ':memory:',
      redisUrl: process.env.TEST_REDIS_URL,
      ttl: 5000,
    }));
    await db.flushAll();
    const key: string = ulid();

    await db.groupSet(key, 'subKey1', { a: 'a', b: 'b' }, { ttl: 5000 });
    await db.groupSet(key, 'subKey2', { a: 'a', b: 'b' }, { ttl: 5000 });

    await expect(db.groupGet(key, 'subKey1')).resolves.toStrictEqual({ a: 'a', b: 'b' });
    await expect(db.groupGet(key, 'subKey2')).resolves.toStrictEqual({ a: 'a', b: 'b' });

    await expect(db.groupHas(key, 'subKey1')).resolves.toBe(true);
    await expect(db.groupHas(key, 'subKey3')).resolves.toBe(false);

    await expect(db.groupGet(key, 'subKey3')).resolves.toBeNull();
  });

  test('groupDel', async () => {
    const prefix = DBCache.randomKey();
    const db = new DBCache(() => ({
      prefix,
      sqlitePath: ':memory:',
      redisUrl: process.env.TEST_REDIS_URL,
      ttl: 5000,
    }));
    await db.flushAll();
    const key: string = ulid();

    await db.groupSet(key, 'subKey1', { a: 'a', b: 'b' }, { ttl: 5000 });
    await db.groupDel(key, 'subKey1');

    await expect(db.groupGet(key, 'subKey1')).resolves.toBeNull();
  });

  test('groupDel all subKeys', async () => {
    const prefix = DBCache.randomKey();
    const db = new DBCache(() => ({
      prefix,
      sqlitePath: ':memory:',
      redisUrl: process.env.TEST_REDIS_URL,
      ttl: 5000,
    }));
    await db.flushAll();
    const key: string = ulid();

    await db.groupSet(key, 'subKey1', { a: 'a', b: 'b' }, { ttl: 5000 });
    await db.groupSet(key, 'subKey2', { a: 'a', b: 'b' }, { ttl: 5000 });
    await db.del(key);

    await expect(db.groupGet(key, 'subKey1')).resolves.toBeNull();
    await expect(db.groupGet(key, 'subKey2')).resolves.toBeNull();
  });

  test('flushAll', async () => {
    const prefix = DBCache.randomKey();
    const db = new DBCache(() => ({
      prefix,
      sqlitePath: ':memory:',
      redisUrl: process.env.TEST_REDIS_URL,
      ttl: 5000,
    }));
    await db.flushAll();

    await db.set('key1', 'value1', { ttl: 5000 });
    await db.set('key2', 'value2', { ttl: 5000 });

    await db.flushAll();

    await expect(db.get('key1')).resolves.toBeNull();
    await expect(db.get('key2')).resolves.toBeNull();
  });

  test('flushAll with group', async () => {
    const prefix = DBCache.randomKey();
    const db = new DBCache(() => ({
      prefix,
      sqlitePath: ':memory:',
      ttl: 5000,
    }));
    await db.flushAll();
    await db.groupSet('group1', 'subKey1', 'value1', { ttl: 5000 });
    await db.groupSet('group1', 'subKey2', 'value2', { ttl: 5000 });

    await db.flushAll();

    await expect(db.groupGet('group1', 'subKey1')).resolves.toBeNull();
    await expect(db.groupGet('group1', 'subKey2')).resolves.toBeNull();
  });
});
