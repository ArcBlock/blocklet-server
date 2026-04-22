/* eslint-disable prettier/prettier */
import { BaseDBCache } from './base-db-cache';
import { BaseDBCacheOptions } from './adapter/adapter';

export default class SingleFlightDBCache extends BaseDBCache {
  private _pending: Map<string, Promise<unknown>>;

  constructor(opts: BaseDBCacheOptions) {
    super(opts);
    this._pending = new Map<string, Promise<unknown>>();
  }

  /**
   * If a request for the same key is already in flight, reuse it.
   * Otherwise, fetch, cache, and return the value.
   */
  public autoCache<T>(key: string, fn: () => Promise<T>, { ttl }: { ttl?: number } = {}): Promise<T> {
    this.initAdapter();
    // Treat empty key as bypassing cache
    if (!key) {
      return fn();
    }

    if (typeof key !== 'string') {
      throw new Error('key must be a string');
    }

    if (this._pending.has(key)) {
      return this._pending.get(key) as Promise<T>;
    }

    const task = (async (): Promise<T> => {
      try {
        const hit = (await super.get(key)) as T | null;
        if (hit !== null) {
          return hit;
        }
        const result = await fn();
        await super.set(key, result, { ttl });
        return result;
      } finally {
        this._pending.delete(key);
      }
    })();

    this._pending.set(key, task);
    return task;
  }

  /**
   * Same logic as autoCache, but for group fields (hash).
   */
  public autoCacheGroup<T>(
    key: string,
    subKey: string,
    fn: () => Promise<T>,
    { ttl }: { ttl?: number } = {},
  ): Promise<T> {
    this.initAdapter();
    // Treat missing key or subKey as bypass
    if (!key || !subKey) {
      return fn();
    }

    if (typeof key !== 'string') {
      throw new Error('key must be a string');
    }

    if (typeof subKey !== 'string') {
      throw new Error('subKey must be a string');
    }

    const pendingKey = `${key}-${subKey}`;
    if (this._pending.has(pendingKey)) {
      return this._pending.get(pendingKey) as Promise<T>;
    }

    const task = (async (): Promise<T> => {
      try {
        const hit = (await super.groupGet(key, subKey)) as T | null;
        if (hit !== null) {
          return hit;
        }
        const result = await fn();
        await super.groupSet(key, subKey, result, { ttl });
        return result;
      } finally {
        this._pending.delete(pendingKey);
      }
    })();

    this._pending.set(pendingKey, task);
    return task;
  }
}
