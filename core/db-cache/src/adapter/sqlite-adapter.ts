/* eslint-disable require-await */
/* eslint-disable prettier/prettier */
/* eslint-disable no-promise-executor-return */
/* eslint-disable max-classes-per-file */
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/comma-dangle */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';
import sqlite3, { type Database } from 'sqlite3';
import { withRetry } from '../with-retry';
import type { BaseDBCacheParams, IDBAdapter } from './adapter';
import { LruCache } from '../lru-cache';

const retryOptions = {
  needRetry: (err: Error) => err.message?.includes('SQLITE_BUSY') || err.message?.includes('disk I/O'),
};

const dbRun = (db: sqlite3.Database, sql: string, params?: unknown[]) => {
  return withRetry(() => {
    return new Promise<void>((res, rej) => {
      db.run(sql, params, (err: Error | null) => (err ? rej(err) : res()));
    });
  }, retryOptions);
};

const dbExec = (db: sqlite3.Database, sql: string) => {
  return withRetry(() => {
    return new Promise<void>((res, rej) => {
      db.exec(sql, (err: Error | null) => (err ? rej(err) : res()));
    });
  }, retryOptions);
};

const dbGet = <T>(db: sqlite3.Database, sql: string, params?: unknown[]) => {
  return withRetry(() => {
    return new Promise<T>((res, rej) => {
      db.get(sql, params, (err: Error | null, result: unknown) => (err ? rej(err) : res(result as T)));
    });
  }, retryOptions);
};

async function initSqliteWithRetry(db: sqlite3.Database) {
  db.configure('busyTimeout', 5000);

  try {
    await dbExec(
      db,
      `
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = normal;
        PRAGMA wal_autocheckpoint = 5000;
        PRAGMA busy_timeout = 5000;
      `
    );

    await dbRun(
      db,
      `
        CREATE TABLE IF NOT EXISTS kvcache (
          key TEXT NOT NULL,
          subKey TEXT NOT NULL,
          value TEXT NOT NULL,
          expiresAt INTEGER,
          PRIMARY KEY (key, subKey)
        )
      `
    );
  } catch (err) {
    throw new Error(`SQLite init failed: ${err}`);
  }
}

export class SqliteAdapter implements IDBAdapter {
  public opts: BaseDBCacheParams = null as unknown as BaseDBCacheParams;

  private static clients: Map<string, Database> = new Map();

  private static initPromises: Map<string, Promise<void>> = new Map();

  private static cleanupTimers: Map<string, NodeJS.Timeout> = new Map();

  private static lruCaches: Map<string, LruCache> = new Map();

  /** LRU 缓存的最大条数上限 */
  private static readonly MAX_LRU_CACHE_SIZE = 100;

  public prefix: string = '';

  public defaultTtl: number = 1000 * 60 * 60;

  private cleanupInterval: number = 5 * 60 * 1000;

  private dbPath: string = '';

  private enableLruCache: boolean = false;

  private lruCache: LruCache | null = null;

  /* ------------------------------- init ------------------------------- */

  public async ensure(): Promise<void> {
    const isMemory = this.opts.sqlitePath === ':memory:';
    if (!this.dbPath) {
      this.dbPath = isMemory ? ':memory:' : path.resolve(this.opts.sqlitePath);
      this.prefix = this.opts.prefix;
      this.defaultTtl = this.opts.ttl;
      this.cleanupInterval = this.opts.cleanupInterval ?? 5 * 60 * 1000;
      this.enableLruCache = this.opts.enableLruCache ?? false;
    }

    // 初始化 LRU 缓存层
    if (this.enableLruCache && !this.lruCache) {
      const lruCacheKey = `sqlite:${this.dbPath}:${this.prefix}`;
      if (!SqliteAdapter.lruCaches.has(lruCacheKey)) {
        const requestedSize = this.opts.lruMaxSize ?? 100;
        const actualSize = Math.min(requestedSize, SqliteAdapter.MAX_LRU_CACHE_SIZE);

        if (requestedSize > SqliteAdapter.MAX_LRU_CACHE_SIZE) {
          console.warn(
            `[SqliteAdapter] Requested LRU cache size ${requestedSize} exceeds maximum ${SqliteAdapter.MAX_LRU_CACHE_SIZE}, using ${actualSize} instead`
          );
        }

        SqliteAdapter.lruCaches.set(
          lruCacheKey,
          new LruCache({
            prefix: lruCacheKey,
            maxSize: actualSize,
            enableSync: this.opts.enableSync ?? true,
          })
        );
      }
      this.lruCache = SqliteAdapter.lruCaches.get(lruCacheKey)!;
    }

    if (SqliteAdapter.clients.has(this.dbPath)) return;

    if (!SqliteAdapter.initPromises.has(this.dbPath)) {
      if (!isMemory) {
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }

      SqliteAdapter.initPromises.set(
        this.dbPath,
        (async () => {
          const db = new sqlite3.Database(this.dbPath);
          await initSqliteWithRetry(db);

          SqliteAdapter.clients.set(this.dbPath, db);
          SqliteAdapter.cleanupTimers.set(
            this.dbPath,
            setInterval(
              () => {
                this.cleanup().catch(console.error);
              },
              this.cleanupInterval + Math.random() * 30000
            )
          );
        })()
      );
    }

    await SqliteAdapter.initPromises.get(this.dbPath);
  }

  private getClient(): Database {
    if (!this.dbPath || !SqliteAdapter.clients.has(this.dbPath)) {
      throw new Error('SQLite not initialized');
    }
    return SqliteAdapter.clients.get(this.dbPath)!;
  }

  /* ------------------------------- cleanup ------------------------------- */

  private async cleanup(): Promise<void> {
    const client = this.getClient();
    await dbRun(client, 'DELETE FROM kvcache WHERE expiresAt IS NOT NULL AND expiresAt <= ?', [Date.now()]);
  }

  /* ------------------------------- core ------------------------------- */

  private prefixKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  public serialize(value: unknown): string {
    return JSON.stringify({ v: value });
  }

  public deserialize(raw: string | null | undefined): unknown {
    if (raw === null || raw === undefined) return null;
    try {
      return (JSON.parse(raw) as { v: unknown }).v;
    } catch {
      return null;
    }
  }

  public async set(key: string, value: unknown, opts: { ttl?: number; nx?: boolean }): Promise<boolean> {
    const client = this.getClient();
    const storageKey = this.prefixKey(key);
    const effectiveTtl = opts.ttl !== undefined ? opts.ttl : this.defaultTtl;
    const expiresAt = effectiveTtl > 0 ? Date.now() + effectiveTtl : null;
    const serializedValue = this.serialize(value);

    // 对于 NX 选项，先检查 key 是否存在
    if (opts.nx) {
      // 先检查 L1 缓存
      if (this.lruCache?.has(storageKey)) {
        return false;
      }
      // 再检查 L2 数据库
      const existing = await dbGet<{ value: string }>(
        client,
        'SELECT value FROM kvcache WHERE key = ? AND subKey = ?',
        [storageKey, '']
      );
      if (existing) {
        return false;
      }
    }

    // 写入 L2 数据库
    await dbRun(
      client,
      `
      INSERT INTO kvcache (key, subKey, value, expiresAt)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(key, subKey) DO UPDATE SET
        value = excluded.value,
        expiresAt = excluded.expiresAt
    `,
      [storageKey, '', serializedValue, expiresAt]
    );

    // 写入 L1 缓存
    if (this.lruCache) {
      this.lruCache.set(storageKey, serializedValue, expiresAt);
    }

    return true;
  }

  public async get(key: string): Promise<unknown> {
    const storageKey = this.prefixKey(key);

    // 先查 L1 缓存
    if (this.lruCache) {
      const cached = this.lruCache.get(storageKey);
      if (cached !== null) {
        return this.deserialize(cached);
      }
    }

    // L1 未命中，查 L2 数据库
    const client = this.getClient();
    const row = await dbGet<{ value: string; expiresAt: number | null }>(
      client,
      'SELECT value, "expiresAt" FROM kvcache WHERE key = ? AND subKey = ?',
      [storageKey, '']
    );

    if (!row) return null;
    if (row.expiresAt !== null && Date.now() > row.expiresAt) {
      await this.del(key);
      return null;
    }

    // 写入 L1 缓存（回填）
    if (this.lruCache) {
      this.lruCache.set(storageKey, row.value, row.expiresAt);
    }

    return this.deserialize(row.value);
  }

  public async del(key: string): Promise<void> {
    const storageKey = this.prefixKey(key);

    // 删除 L1 缓存
    if (this.lruCache) {
      this.lruCache.del(storageKey);
    }

    // 删除 L2 数据库
    const client = this.getClient();
    await dbRun(client, 'DELETE FROM kvcache WHERE key = ?', [storageKey]);
  }

  public async has(key: string): Promise<boolean> {
    const storageKey = this.prefixKey(key);

    // 先查 L1 缓存
    if (this.lruCache?.has(storageKey)) {
      return true;
    }

    // L1 未命中，查 L2 数据库
    const client = this.getClient();
    const row = await dbGet<{ expiresAt: number | null }>(
      client,
      'SELECT "expiresAt" FROM kvcache WHERE key = ? AND subKey = ?',
      [storageKey, '']
    );

    if (!row) return false;
    if (row.expiresAt !== null && Date.now() > row.expiresAt) {
      await this.del(key);
      return false;
    }

    return true;
  }

  /* ------------------------------- group APIs ------------------------------- */

  public async groupSet(
    key: string,
    subKey: string,
    value: unknown,
    opts: { ttl?: number; nx?: boolean }
  ): Promise<void> {
    const client = this.getClient();
    const storageKey = this.prefixKey(key);
    const effectiveTtl = opts.ttl !== undefined ? opts.ttl : this.defaultTtl;
    const expiresAt = effectiveTtl > 0 ? Date.now() + effectiveTtl : null;
    const serializedValue = this.serialize(value);

    // 写入 L2 数据库（UPSERT）
    await dbRun(
      client,
      `
        INSERT INTO kvcache (key, subKey, value, expiresAt)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(key, subKey) DO UPDATE SET
          value = excluded.value,
          expiresAt = excluded.expiresAt
      `,
      [storageKey, subKey, serializedValue, expiresAt]
    );

    // 写入 L1 缓存
    if (this.lruCache) {
      this.lruCache.groupSet(storageKey, subKey, serializedValue, expiresAt);
    }
  }

  public async groupGet(key: string, subKey: string): Promise<unknown> {
    const storageKey = this.prefixKey(key);

    // 先查 L1 缓存
    if (this.lruCache) {
      const cached = this.lruCache.groupGet(storageKey, subKey);
      if (cached !== null) {
        return this.deserialize(cached);
      }
    }

    // L1 未命中，查 L2 数据库
    const client = this.getClient();
    const row = await dbGet<{ value: string; expiresAt: number | null }>(
      client,
      'SELECT value, "expiresAt" FROM kvcache WHERE key = ? AND subKey = ?',
      [storageKey, subKey]
    );

    if (!row) return null;
    if (row.expiresAt !== null && Date.now() > row.expiresAt) {
      await this.groupDel(key, subKey);
      return null;
    }

    // 写入 L1 缓存（回填）
    if (this.lruCache) {
      this.lruCache.groupSet(storageKey, subKey, row.value, row.expiresAt);
    }

    return this.deserialize(row.value);
  }

  public async groupHas(key: string, subKey: string): Promise<boolean> {
    const storageKey = this.prefixKey(key);

    // 先查 L1 缓存
    if (this.lruCache?.groupHas(storageKey, subKey)) {
      return true;
    }

    // L1 未命中，查 L2 数据库
    const client = this.getClient();
    const row = await dbGet<{ expiresAt: number | null }>(
      client,
      'SELECT "expiresAt" FROM kvcache WHERE key = ? AND subKey = ?',
      [storageKey, subKey]
    );

    if (!row) return false;
    if (row.expiresAt !== null && Date.now() > row.expiresAt) {
      await this.groupDel(key, subKey);
      return false;
    }

    return true;
  }

  public async groupDel(key: string, subKey: string): Promise<void> {
    const storageKey = this.prefixKey(key);

    // 删除 L1 缓存
    if (this.lruCache) {
      this.lruCache.groupDel(storageKey, subKey);
    }

    // 删除 L2 数据库
    const client = this.getClient();
    await dbRun(client, 'DELETE FROM kvcache WHERE key = ? AND subKey = ?', [storageKey, subKey]);
  }

  /* ------------------------------- misc ------------------------------- */

  public async close(): Promise<void> {
    // 关闭 LRU 缓存
    if (this.lruCache) {
      this.lruCache.close();
      const lruCacheKey = `sqlite:${this.dbPath}:${this.prefix}`;
      SqliteAdapter.lruCaches.delete(lruCacheKey);
      this.lruCache = null;
    }

    if (this.dbPath) {
      const timer = SqliteAdapter.cleanupTimers.get(this.dbPath);
      if (timer) {
        clearInterval(timer);
        SqliteAdapter.cleanupTimers.delete(this.dbPath);
      }

      const client = SqliteAdapter.clients.get(this.dbPath);
      if (client) {
        client.close();
        SqliteAdapter.clients.delete(this.dbPath);
        SqliteAdapter.initPromises.delete(this.dbPath);
      }
    }
  }

  public async flushAll(): Promise<void> {
    // 清空 L1 缓存
    if (this.lruCache) {
      this.lruCache.clear();
    }

    // 清空 L2 数据库
    const client = this.getClient();
    const run = promisify(client.run.bind(client));
    await run('DELETE FROM kvcache');
  }

  /**
   * 获取 LRU 缓存统计信息
   */
  public getLruCacheStats(): { size: number; groupCount: number; maxSize: number } | null {
    if (!this.lruCache) {
      return null;
    }
    return this.lruCache.getStats();
  }
}
