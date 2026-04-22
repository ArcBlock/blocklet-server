export type ForceType = 'redis' | 'sqlite';

export interface BaseDBCacheParams {
  /** Required non-empty prefix for all stored keys */
  prefix: string;
  /** Filesystem path for SQLite DB (also used to derive LMDB path) */
  sqlitePath: string;
  /** Default TTL (ms) */
  ttl: number;
  /** Maximum size for LRU cache */
  lruMaxSize?: number;
  /** Enable LRU cache */
  enableLruCache?: boolean;
  /** Enable sync */
  enableSync?: boolean;
  /** Cleanup interval (ms) for expired rows in SQLite */
  cleanupInterval?: number;
  /** URL for Redis (falls back to process.env.REDIS_URL if undefined) */
  redisUrl?: string;
  forceType?: ForceType;
}

export type BaseDBCacheOptions = () => BaseDBCacheParams;

export interface IDBAdapter {
  opts: BaseDBCacheParams;
  ensure(): Promise<void>;
  set(key: string, value: unknown, opts: { ttl?: number; nx?: boolean }): Promise<boolean>;
  get(key: string): Promise<unknown>;
  del(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  groupSet(key: string, subKey: string, value: unknown, opts: { ttl?: number; nx?: boolean }): Promise<void>;
  groupGet(key: string, subKey: string): Promise<unknown>;
  groupHas(key: string, subKey: string): Promise<boolean>;
  groupDel(key: string, subKey: string): Promise<void>;
  serialize(value: unknown): string;
  deserialize(raw: string | null | undefined): unknown;
  close(): Promise<void>;
  flushAll(): Promise<void>;
  getLruCacheStats(): { size: number; groupCount: number; maxSize: number } | null;
}
