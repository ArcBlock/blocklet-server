import path from 'path';
import { BaseDBCacheParams } from './adapter/adapter';
import DBCache from './lock-db-cache';
import { withRetry } from './with-retry';
import { LruCache } from './lru-cache';

export type { BaseDBCacheOptions, IDBAdapter, ForceType } from './adapter/adapter';
export { LruCache };

const isJestTest = () => {
  return process.env.NODE_ENV === 'test' || process.env.BABEL_ENV === 'test';
};

export const getAbtNodeRedisAndSQLiteUrl = () => {
  const blockletCacheDir = process.env.BLOCKLET_DATA_DIR
    ? path.join(process.env.BLOCKLET_DATA_DIR, '__default-cache-store.db')
    : undefined;
  const params = {
    redisUrl: process.env.ABT_NODE_CACHE_REDIS_URL,
    sqlitePath: isJestTest() ? ':memory:' : blockletCacheDir || process.env.ABT_NODE_CACHE_SQLITE_PATH,
  };
  if (process.env.ABT_NODE_NO_CACHE === 'true') {
    (params as unknown as BaseDBCacheParams).ttl = 1;
  }
  return params;
};

export { DBCache, withRetry };
