/* eslint-disable require-await */
/* eslint-disable no-promise-executor-return */
import { test, expect, describe, beforeAll, mock } from 'bun:test';
import { DBCache } from '../src';
import { ulid } from '../tools/ulid';

describe('SingleFlightDBCache', () => {
  let cache: DBCache;

  beforeAll(async () => {
    cache = new DBCache(() => ({
      prefix: DBCache.randomKey(),
      sqlitePath: ':memory:',
      redisUrl: process.env.TEST_REDIS_URL,
      ttl: 1000,
    }));
    // Trigger first initialization
    const key: string = ulid();
    await cache.set(key, 'ok', { ttl: 1000 });
  });

  test('并发同 key 只调用一次 fn', async () => {
    const key: string = ulid();
    const spyFn = mock(async (): Promise<string> => {
      // Simulate a small delay
      await new Promise<void>((r) => setTimeout(r, 50));
      return 'VALUE';
    });

    // Launch 3 concurrent requests for the same key
    const [r1, r2, r3] = await Promise.all([
      cache.autoCache(key, spyFn),
      cache.autoCache(key, spyFn),
      cache.autoCache(key, spyFn),
    ]);

    expect(r1).toBe('VALUE');
    expect(r2).toBe('VALUE');
    expect(r3).toBe('VALUE');
    // spyFn should be called only once
    expect(spyFn).toHaveBeenCalledTimes(1);
  });

  test('第一次跑完后缓存命中，不再调用 fn', async () => {
    const spyFn = mock(async (): Promise<string> => 'SECOND');
    const key: string = ulid();

    const result = await cache.autoCache(key, spyFn);
    const result2 = await cache.autoCache(key, spyFn);
    const result3 = await cache.autoCache(key, spyFn);

    expect(result).toBe('SECOND');
    expect(result2).toBe('SECOND');
    expect(result3).toBe('SECOND');
    expect(spyFn).toHaveBeenCalledTimes(1);
  });

  test('fn 抛错后 pending 会被清理，下次再执行会重新调用 fn', async () => {
    const key: string = ulid();
    const errorFn = mock(async (): Promise<never> => {
      throw new Error('oops');
    });

    // First concurrent attempt throws
    await expect(cache.autoCache(key, errorFn)).rejects.toThrow('oops');

    // Although it threw, pending should be cleared
    interface PendingCache {
      _pending: Map<string, Promise<unknown>>;
    }
    const pendingCache = cache as unknown as PendingCache;
    expect(pendingCache._pending.has(key)).toBe(false);

    // Next call succeeds
    const okFn = mock(async (): Promise<string> => 'OK');
    const r: string = await cache.autoCache(key, okFn);
    expect(r).toBe('OK');
    expect(okFn).toHaveBeenCalledTimes(1);
  });

  test('auto-group', async () => {
    const key: string = ulid();
    let count: number = 0;
    const fn = async (): Promise<{ a: string; b: string }> => {
      count++;
      return { a: 'a', b: 'b' };
    };

    const result = await cache.autoCacheGroup(key, 'subKey1', fn);
    const result2 = await cache.autoCacheGroup(key, 'subKey1', fn);
    const result3 = await cache.autoCacheGroup(key, 'subKey1', fn);
    const result4 = await cache.autoCacheGroup(key, 'subKey1', fn);

    expect(result).toStrictEqual({ a: 'a', b: 'b' });
    expect(result2).toStrictEqual({ a: 'a', b: 'b' });
    expect(result3).toStrictEqual({ a: 'a', b: 'b' });
    expect(result4).toStrictEqual({ a: 'a', b: 'b' });
    expect(count).toBe(1);
  });

  test('auto-group array', async () => {
    const key: string = ulid();
    const fn = async (): Promise<Array<{ a: string; b: string }>> => {
      return [
        { a: 'a', b: 'b' },
        { a: 'a', b: 'b' },
      ];
    };

    const result = await cache.autoCacheGroup(key, 'subKey1', fn);
    expect(result).toStrictEqual([
      { a: 'a', b: 'b' },
      { a: 'a', b: 'b' },
    ]);
  });

  test('auto-group undefined', async () => {
    const key: string = ulid();
    const fn = async (): Promise<undefined> => {
      return undefined;
    };

    const result = await cache.autoCacheGroup(key, 'subKey1', fn);
    expect(result).toBeUndefined();
  });

  test('auto-group boolean', async () => {
    const key: string = ulid();
    const fn = async (): Promise<boolean> => {
      return true;
    };

    const result = await cache.autoCacheGroup(key, 'subKey1', fn);
    expect(result).toBe(true);
  });

  test('auto-group number', async () => {
    const key: string = ulid();
    const fn = async (): Promise<number> => {
      return 1;
    };

    const result = await cache.autoCacheGroup(key, 'subKey1', fn);
    expect(result).toBe(1);
  });

  test('auto-group null', async () => {
    const key: string = ulid();
    const fn = async (): Promise<null> => {
      return null;
    };

    const result = await cache.autoCacheGroup(key, 'subKey1', fn);
    expect(result).toBeNull();
  });

  test('auto-group throw error', async () => {
    const key: string = ulid();
    const fn = async (): Promise<never> => {
      throw new Error('oops');
    };

    try {
      await cache.autoCacheGroup(key, 'subKey1', fn);
      throw new Error('should not reach here');
    } catch (error) {
      expect((error as Error).message).toMatch('oops');
    }
  });

  test('no cache with empty key', async () => {
    const fn = async (): Promise<string> => 'ok';
    const result = await cache.autoCacheGroup('', 'subKey1', fn);
    expect(result).toBe('ok');
  });

  test('no cache with empty subKey', async () => {
    const key: string = ulid();
    const fn = async (): Promise<string> => 'ok';
    const result = await cache.autoCacheGroup(key, '', fn);
    expect(result).toBe('ok');
  });

  test('no cache with non-string key', async () => {
    try {
      await cache.autoCacheGroup(true as unknown as string, 'subKey1', async () => 'ok');
      throw new Error('should not reach here');
    } catch (error) {
      expect((error as Error).message).toMatch('key must be a string');
    }
  });

  test('no cache with non-string subKey', async () => {
    const key: string = ulid();
    try {
      await cache.autoCacheGroup(key, 2 as unknown as string, async () => 'ok');
      throw new Error('should not reach here');
    } catch (error) {
      expect((error as Error).message).toMatch('subKey must be a string');
    }
  });
});
