import { test, expect, describe } from 'bun:test';
import { DBCache } from '../src';
import { BaseDBCacheParams } from '../src/adapter/adapter';

describe('DBCache Params', () => {
  test('should be able to set ttl', async () => {
    try {
      const cache = new DBCache(
        () =>
          ({
            prefix: DBCache.randomKey(),
            ttl: 1000,
          }) as BaseDBCacheParams
      );
      await cache.set('test', 'test');
      throw new Error('should not be here');
    } catch (e) {
      const err = e as Error;
      expect(err.message).toContain('sqlitePath is required');
    }
  });

  test('should be able to set cleanupInterval', async () => {
    try {
      const cache = new DBCache(
        () =>
          ({
            prefix: DBCache.randomKey(),
            sqlitePath: ':memory:',
            cleanupInterval: 1000,
            ttl: 1000,
          }) as BaseDBCacheParams
      );
      await cache.set('test', 'test');
      throw new Error('should not be here');
    } catch (e) {
      const err = e as Error;
      expect(err.message).toContain('cleanupInterval must be at least 5 minutes');
    }
  });

  test('should be able to set prefix', async () => {
    try {
      const cache = new DBCache(
        () =>
          ({
            prefix: '',
            sqlitePath: ':memory:',
            ttl: 1000,
          }) as BaseDBCacheParams
      );
      await cache.set('test', 'test');
      throw new Error('should not be here');
    } catch (e) {
      const err = e as Error;
      expect(err.message).toContain('prefix is required');
    }
  });

  test('should be able to set ttl', async () => {
    try {
      const cache = new DBCache(
        () =>
          ({
            prefix: DBCache.randomKey(),
            sqlitePath: ':memory:',
          }) as BaseDBCacheParams
      );
      await cache.set('test', 'test');
      throw new Error('should not be here');
    } catch (e) {
      const err = e as Error;
      expect(err.message).toContain('ttl must be a non-negative number');
    }
  });

  test('should be able to set ttl to negative number', async () => {
    try {
      const cache = new DBCache(
        () =>
          ({
            prefix: DBCache.randomKey(),
            sqlitePath: ':memory:',
            ttl: -1,
          }) as BaseDBCacheParams
      );
      await cache.set('test', 'test');

      throw new Error('should not be here');
    } catch (e) {
      const err = e as Error;
      expect(err.message).toContain('ttl must be a non-negative number');
    }
  });

  test('should be able to set ttl to 0', () => {
    // eslint-disable-next-line
    void new DBCache(
      () =>
        ({
          prefix: DBCache.randomKey(),
          sqlitePath: ':memory:',
          ttl: 0,
        }) as BaseDBCacheParams
    );
    expect(true).toBe(true);
  });
});
