/* eslint-disable prettier/prettier */
// eslint-disable-next-line max-classes-per-file
import { createClient, type RedisClientType } from 'redis';
import type { BaseDBCacheParams, IDBAdapter } from './adapter';

export class RedisAdapter implements IDBAdapter {
  clearAll(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public opts: BaseDBCacheParams = null as unknown as BaseDBCacheParams;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static clients: Map<string, RedisClientType<any, any>> = new Map();

  private static initPromises: Map<string, Promise<void>> = new Map();

  public defaultTtl: number = 1000 * 60 * 60;

  private url = '';

  public prefix: string = '';

  private prefixKey = (key: string) => `${this.prefix}:${key}`;

  private prefixKeyGroup = (key: string) => `${this.prefix}:group:${key}`;

  public async ensure(): Promise<void> {
    if (!this.url) {
      this.url = this.opts.redisUrl || '';
      this.prefix = this.opts.prefix;
      this.defaultTtl = this.opts.ttl;
    }

    if (RedisAdapter.clients.has(this.url)) {
      return;
    }

    if (!RedisAdapter.initPromises.has(this.url)) {
      RedisAdapter.initPromises.set(
        this.url,
        (async () => {
          const { url } = this;
          if (!url) {
            throw new Error('Redis URL is not set');
          }
          const cli = createClient({ url });
          cli.on('error', console.error);
          await cli.connect();
          await cli.ping();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          RedisAdapter.clients.set(url, cli as RedisClientType<any, any>);
        })()
      );
    }

    await RedisAdapter.initPromises.get(this.url);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getClient(): RedisClientType<any, any> {
    if (!this.url || !RedisAdapter.clients.has(this.url)) {
      throw new Error('Redis not initialized');
    }
    const client = RedisAdapter.clients.get(this.url);
    if (!client) {
      throw new Error('Redis client not found');
    }
    return client;
  }

  public serialize(value: unknown): string {
    return JSON.stringify({ v: value });
  }

  public deserialize(raw: string | null | undefined): unknown {
    if (raw === null || raw === undefined) return null;
    try {
      const obj = JSON.parse(raw);
      return (obj as { v: unknown }).v;
    } catch {
      return null;
    }
  }

  public async set(key: string, value: unknown, { ttl, nx }: { ttl?: number; nx?: boolean }): Promise<boolean> {
    const client = this.getClient();
    const storageKey = this.prefixKey(key);
    const effectiveTtl = ttl !== undefined ? ttl : this.defaultTtl;

    /* ----------- NX via both file-lock and Redis NX ------------ */
    let result: string | null;
    if (effectiveTtl && effectiveTtl > 0) {
      result = await client.set(storageKey, this.serialize(value), { PX: effectiveTtl, NX: nx });
    } else {
      result = await client.set(storageKey, this.serialize(value), { NX: nx });
    }

    if (result !== 'OK') {
      const storedValue = await client.get(storageKey);
      if (storedValue === this.serialize(value)) {
        // ghost success
        return true;
      }
      return false;
    }

    return result === 'OK';
  }

  public async get(key: string): Promise<unknown> {
    const client = this.getClient();
    const storageKey = this.prefixKey(key);
    const raw = await client.get(storageKey);
    return this.deserialize(raw);
  }

  public async del(key: string): Promise<void> {
    const client = this.getClient();
    const storageKey = this.prefixKey(key);
    const storageKeyGroup = this.prefixKeyGroup(key);
    await client.del(storageKey);
    await client.del(storageKeyGroup);
  }

  public async has(key: string): Promise<boolean> {
    const client = this.getClient();
    const storageKey = this.prefixKey(key);
    const exists = await client.exists(storageKey);
    if (exists === 0) return false;
    const raw = await client.get(storageKey);
    if (!raw) return false;
    const data = JSON.parse(raw) as { v: unknown; e: number | null };
    if (data.e && Date.now() > data.e) {
      await this.del(key);
      return false;
    }
    return true;
  }

  public async groupSet(key: string, subKey: string, value: unknown, { ttl }: { ttl?: number }): Promise<void> {
    const client = this.getClient();
    const storageKey = this.prefixKeyGroup(key);
    await client.hSet(storageKey, subKey, this.serialize(value));
    const effectiveTtl = ttl !== undefined ? ttl : this.defaultTtl;
    if (effectiveTtl > 0) {
      await client.expire(storageKey, Math.ceil(effectiveTtl / 1000));
    }
  }

  public async groupGet(key: string, subKey: string): Promise<unknown> {
    const client = this.getClient();
    const storageKey = this.prefixKeyGroup(key);
    const raw = await client.hGet(storageKey, subKey);
    return this.deserialize(raw);
  }

  public async groupHas(key: string, subKey: string): Promise<boolean> {
    const client = this.getClient();
    const storageKey = this.prefixKeyGroup(key);
    return (await client.hExists(storageKey, subKey)) === 1;
  }

  public async groupDel(key: string, subKey: string): Promise<void> {
    const client = this.getClient();
    const storageKey = this.prefixKeyGroup(key);
    await client.hDel(storageKey, subKey);
  }

  public async close(): Promise<void> {
    if (this.url && RedisAdapter.clients.has(this.url)) {
      const client = RedisAdapter.clients.get(this.url);
      if (client) {
        await client.quit();
        RedisAdapter.clients.delete(this.url);
        RedisAdapter.initPromises.delete(this.url);
      }
    }
  }

  public async flushAll(): Promise<void> {
    const client = this.getClient();
    await client.flushAll();
  }

  /**
   * 获取 LRU 缓存统计信息（Redis 不使用 LRU 缓存）
   */
  public getLruCacheStats(): { size: number; groupCount: number; maxSize: number } | null {
    return null;
  }
}
