/* eslint-disable prettier/prettier */
// base-db-cache.ts
import { RedisAdapter } from './adapter/redis-adapter';
import { SqliteAdapter } from './adapter/sqlite-adapter';
import { BaseDBCacheOptions, IDBAdapter } from './adapter/adapter';

export class BaseDBCache {
  private adapter: IDBAdapter = null as unknown as IDBAdapter;

  public prefix: string = '';

  public type: string = '';

  public defaultTtl: number = 0;

  private getOpts: BaseDBCacheOptions;

  private _initdAdapter: boolean = false;

  constructor(opts: BaseDBCacheOptions) {
    this.getOpts = opts;
  }

  protected initAdapter(): void {
    if (this._initdAdapter) {
      return;
    }


    if (typeof this.getOpts !== 'function') {
      throw new Error('getOpts must be a function');
    }

    const opts = this.getOpts();

    if (!opts.prefix || typeof opts.prefix !== 'string' || opts.prefix.trim() === '') {
      throw new Error('prefix is required');
    }
    if (!opts.sqlitePath || typeof opts.sqlitePath !== 'string') {
      throw new Error('sqlitePath is required');
    }
    if (typeof opts.ttl !== 'number' || opts.ttl < 0) {
      throw new Error('ttl must be a non-negative number');
    }

    if (opts.cleanupInterval && opts.cleanupInterval < 1000 * 60 * 5) {
      console.error('cleanupInterval must be at least 5 minutes');
      throw new Error('cleanupInterval must be at least 5 minutes');
    }

    this.type = opts.forceType || (opts.redisUrl ? 'redis' : 'sqlite');

    this.prefix = opts.prefix;
    this.defaultTtl = opts.ttl;

    switch (this.type) {
      case 'redis':
        this.adapter = new RedisAdapter();
        this.adapter.opts = opts;
        break;
      case 'sqlite':
        this.adapter = new SqliteAdapter();
        this.adapter.opts = opts;
        break;
      default:
        throw new Error(`Unsupported backend: ${this.type}`);
    }

    this._initdAdapter = true;

  }

  static randomKey(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  public async set(key: string, value: unknown, opts: { ttl?: number; nx?: boolean } = {}): Promise<boolean> {
    this.initAdapter();

    if (typeof key !== 'string') {
      console.error('key must be a string');
      return Promise.resolve(false);
    }
    // Determine TTL: provided or default
    const effectiveTtl = opts.ttl !== undefined ? opts.ttl : this.defaultTtl;
    if (typeof effectiveTtl !== 'number' || effectiveTtl < 0) {
      console.error('ttl must be a non-negative number');
      throw new Error('ttl must be a non-negative number');
    }
    await this.adapter.ensure();
    return this.adapter.set(key, value, { ttl: effectiveTtl, nx: opts.nx });
  }

  public async get(key: string): Promise<unknown> {
    this.initAdapter();
    if (typeof key !== 'string') {
      console.error('key must be a string');
      return Promise.resolve();
    }

    await this.adapter.ensure();
    return this.adapter.get(key);
  }

  public async del(key: string): Promise<void> {
    this.initAdapter();
    if (typeof key !== 'string') {
      console.error('key must be a string');
      return Promise.resolve();
    }
    await this.adapter.ensure();
    return this.adapter.del(key);
  }

  public async has(key: string): Promise<boolean> {
    this.initAdapter();

    if (typeof key !== 'string') {
      console.error('key must be a string');
      return Promise.resolve(false);
    }
    await this.adapter.ensure();
    return this.adapter.has(key);
  }

  public async groupSet(
    key: string,
    subKey: string,
    value: unknown,
    opts: { ttl?: number; nx?: boolean } = {},
  ): Promise<void> {
    this.initAdapter();

    if (typeof key !== 'string' || typeof subKey !== 'string') {
      return Promise.resolve();
    }
    // Determine TTL: provided or default
    const effectiveTtl = opts.ttl !== undefined ? opts.ttl : this.defaultTtl;
    if (typeof effectiveTtl !== 'number' || effectiveTtl < 0) {
      console.error('ttl must be a non-negative number');
      throw new Error('ttl must be a non-negative number');
    }
    await this.adapter.ensure();
    return this.adapter.groupSet(key, subKey, value, { ttl: effectiveTtl, nx: opts.nx });
  }

  public async groupGet(key: string, subKey: string): Promise<unknown> {
    this.initAdapter();

    if (typeof key !== 'string' || typeof subKey !== 'string') {
      console.error('key must be a string');
      return null;
    }
    await this.adapter.ensure();
    return this.adapter.groupGet(key, subKey);
  }

  public async groupHas(key: string, subKey: string): Promise<boolean> {
    this.initAdapter();

    if (typeof key !== 'string') {
      throw new Error('key must be a string');
    }
    if (typeof subKey !== 'string') {
      throw new Error('subKey must be a string');
    }

    await this.adapter.ensure();
    return this.adapter.groupHas(key, subKey);
  }

  public async groupDel(key: string, subKey: string): Promise<void> {
    this.initAdapter();

    if (!key || !subKey) {
      return Promise.resolve();
    }
    await this.adapter.ensure();

    return this.adapter.groupDel(key, subKey);
  }

  public async close(): Promise<void> {
    this.initAdapter();

    await this.adapter.ensure();

    return this.adapter.close();
  }

  public async flushAll(): Promise<void> {
    this.initAdapter();
    await this.adapter.ensure();
    return this.adapter.flushAll();
  }

  /**
   * 获取 LRU 缓存统计信息
   * @returns 缓存统计信息，如果未启用 LRU 缓存则返回 null
   */
  public getLruCacheStats(): { size: number; groupCount: number; maxSize: number } | null {
    this.initAdapter();
    return this.adapter.getLruCacheStats();
  }
}
