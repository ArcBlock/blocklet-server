/* eslint-disable prettier/prettier */
/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-explicit-any */

import eventHubCluster from '@arcblock/event-hub';
import eventHubSingle from '@arcblock/event-hub/single';
import { LRUCache } from 'lru-cache';

const isTestEnv = process.env.NODE_ENV === 'test';

// 根据环境选择 event-hub 版本：测试环境使用单进程版本，生产环境使用集群版本
const eventHub = isTestEnv ? eventHubSingle : eventHubCluster;

const LRU_CACHE_SYNC_EVENT = 'db-cache:lru:sync';
const LRU_CACHE_DELETE_EVENT = 'db-cache:lru:delete';
const LRU_CACHE_CLEAR_EVENT = 'db-cache:lru:clear';

interface CacheEntry {
  value: string;
  expiresAt: number | null;
}

// LRU 缓存实例类型
type LRUCacheInstance = LRUCache<string, CacheEntry>;

interface SyncEventPayload {
  channel: string;
  key: string;
  value: string;
  expiresAt: number | null;
  isGroup?: boolean;
  subKey?: string;
}

interface DeleteEventPayload {
  channel: string;
  keys: string[];
  isGroup?: boolean;
  groupKey?: string;
}

interface ClearEventPayload {
  channel: string;
}

/**
 * 判断是否需要跨 worker 同步
 * - 测试环境不需要同步
 * - 非 cluster 模式（NODE_APP_INSTANCE 未定义）不需要同步
 */
const shouldEnableSync = (): boolean => {
  if (isTestEnv) {
    return false;
  }
  // NODE_APP_INSTANCE 由 PM2 在 cluster 模式下设置
  return process.env.NODE_APP_INSTANCE !== undefined;
};

export interface LruCacheOptions {
  /** 缓存前缀，用于区分不同的缓存实例 */
  prefix: string;
  /** 最大缓存条数，默认 10000 */
  maxSize?: number;
  /** 是否启用跨 worker 同步，默认 true（在支持的环境中） */
  enableSync?: boolean;
}

/**
 * LRU 内存缓存工具类
 *
 * 特点：
 * 1. 基于 LRU 算法的内存缓存
 * 2. 支持 TTL 过期
 * 3. 支持 Node.js 集群模式下的跨 worker 同步
 * 4. 可单独使用，也可作为 Redis/SQLite 适配器的 L1 缓存层
 *
 * CLUSTER MODE NOTE:
 * 当运行在 cluster 模式下时，缓存数据会通过 event hub 广播给所有 worker，
 * 确保所有 worker 的内存缓存数据一致。
 */
export class LruCache {
  private static caches: Map<string, LRUCacheInstance> = new Map();

  private static groupCaches: Map<string, Map<string, LRUCacheInstance>> = new Map();

  private static listenerSetup: Map<string, boolean> = new Map();

  private cacheKey: string;

  private maxSize: number;

  private enableSync: boolean;

  constructor(options: LruCacheOptions) {
    this.cacheKey = `lru:${options.prefix}`;
    this.maxSize = options.maxSize ?? 10000;
    this.enableSync = (options.enableSync ?? true) && shouldEnableSync();

    if (!LruCache.caches.has(this.cacheKey)) {
      LruCache.caches.set(
        this.cacheKey,
        new LRUCache({
          max: this.maxSize,
          ttl: 0, // 我们自己管理 TTL
        })
      );
      LruCache.groupCaches.set(this.cacheKey, new Map());

      // 设置同步监听器
      if (this.enableSync && !LruCache.listenerSetup.has(this.cacheKey)) {
        this._setupSyncListener();
        LruCache.listenerSetup.set(this.cacheKey, true);
      }
    }
  }

  private getCache(): LRUCacheInstance {
    const cache = LruCache.caches.get(this.cacheKey);
    if (!cache) {
      throw new Error('LRU cache not initialized');
    }
    return cache;
  }

  private getGroupCaches(): Map<string, LRUCacheInstance> {
    const groupCaches = LruCache.groupCaches.get(this.cacheKey);
    if (!groupCaches) {
      throw new Error('LRU group cache not initialized');
    }
    return groupCaches;
  }

  private getOrCreateGroupCache(key: string): LRUCacheInstance {
    const groupCaches = this.getGroupCaches();
    if (!groupCaches.has(key)) {
      groupCaches.set(
        key,
        new LRUCache({
          max: this.maxSize,
          ttl: 0,
        })
      );
    }
    return groupCaches.get(key)!;
  }

  /**
   * 设置同步监听器，接收其他 worker 广播的缓存数据
   */
  private _setupSyncListener(): void {
    const { cacheKey, maxSize } = this;

    // @ts-ignore
    eventHub.on(LRU_CACHE_SYNC_EVENT, (payload: SyncEventPayload) => {
      const { channel, key, value, expiresAt, isGroup, subKey } = payload;
      if (channel !== cacheKey) return;

      const entry: CacheEntry = { value, expiresAt };

      if (isGroup && subKey !== undefined) {
        const groupCaches = LruCache.groupCaches.get(cacheKey);
        if (groupCaches) {
          const groupCache = groupCaches.get(key) || new LRUCache({ max: maxSize, ttl: 0 });
          groupCache.set(subKey, entry);
          groupCaches.set(key, groupCache);
        }
      } else {
        const cache = LruCache.caches.get(cacheKey);
        if (cache) {
          cache.set(key, entry);
        }
      }
    });

    // @ts-ignore
    eventHub.on(LRU_CACHE_DELETE_EVENT, (payload: DeleteEventPayload) => {
      const { channel, keys, isGroup, groupKey } = payload;
      if (channel !== cacheKey) return;

      if (isGroup && groupKey !== undefined) {
        const groupCaches = LruCache.groupCaches.get(cacheKey);
        if (groupCaches) {
          const groupCache = groupCaches.get(groupKey);
          if (groupCache) {
            for (const key of keys) {
              groupCache.delete(key);
            }
          }
        }
      } else {
        const cache = LruCache.caches.get(cacheKey);
        if (cache) {
          for (const key of keys) {
            cache.delete(key);
            // 同时删除相关的 group cache
            const groupCaches = LruCache.groupCaches.get(cacheKey);
            if (groupCaches) {
              groupCaches.delete(key);
            }
          }
        }
      }
    });

    // @ts-ignore
    eventHub.on(LRU_CACHE_CLEAR_EVENT, (payload: ClearEventPayload) => {
      const { channel } = payload;
      if (channel !== cacheKey) return;

      const cache = LruCache.caches.get(cacheKey);
      if (cache) {
        cache.clear();
      }
      const groupCaches = LruCache.groupCaches.get(cacheKey);
      if (groupCaches) {
        groupCaches.clear();
      }
    });
  }

  /**
   * 广播缓存数据给其他 worker
   */
  private _broadcastSync(key: string, value: string, expiresAt: number | null, isGroup = false, subKey?: string): void {
    if (this.enableSync) {
      eventHub.broadcast(LRU_CACHE_SYNC_EVENT, {
        channel: this.cacheKey,
        key,
        value,
        expiresAt,
        isGroup,
        subKey,
      });
    }
  }

  /**
   * 广播删除缓存给其他 worker
   */
  private _broadcastDelete(keys: string[], isGroup = false, groupKey?: string): void {
    if (this.enableSync && keys.length > 0) {
      eventHub.broadcast(LRU_CACHE_DELETE_EVENT, {
        channel: this.cacheKey,
        keys,
        isGroup,
        groupKey,
      });
    }
  }

  /**
   * 广播清空缓存给其他 worker
   */
  private _broadcastClear(): void {
    if (this.enableSync) {
      eventHub.broadcast(LRU_CACHE_CLEAR_EVENT, {
        channel: this.cacheKey,
      });
    }
  }

  private isExpired(entry: CacheEntry | undefined): boolean {
    if (!entry) return true;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      return true;
    }
    return false;
  }

  /* ---------------------- 基础 API ---------------------- */

  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 序列化后的值
   * @param expiresAt 过期时间戳，null 表示永不过期
   */
  set(key: string, value: string, expiresAt: number | null): void {
    const cache = this.getCache();
    const entry: CacheEntry = { value, expiresAt };
    cache.set(key, entry);
    this._broadcastSync(key, value, expiresAt);
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 序列化的值，未命中或过期返回 null
   */
  get(key: string): string | null {
    const cache = this.getCache();
    const entry = cache.get(key) as CacheEntry | undefined;

    if (!entry) return null;
    if (this.isExpired(entry)) {
      cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * 检查缓存是否存在且未过期
   */
  has(key: string): boolean {
    const cache = this.getCache();
    const entry = cache.get(key) as CacheEntry | undefined;

    if (!entry) return false;
    if (this.isExpired(entry)) {
      cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 删除缓存
   */
  del(key: string): void {
    const cache = this.getCache();
    cache.delete(key);

    // 同时删除相关的 group cache
    const groupCaches = this.getGroupCaches();
    groupCaches.delete(key);

    this._broadcastDelete([key]);
  }

  /**
   * 按前缀删除缓存
   * @returns 删除的数量
   */
  delByPrefix(prefix: string): number {
    const cache = this.getCache();
    const deletedKeys: string[] = [];

    for (const key of cache.keys()) {
      if ((key as string).startsWith(prefix)) {
        cache.delete(key);
        deletedKeys.push(key as string);
      }
    }

    // 同时删除匹配前缀的 group caches
    const groupCaches = this.getGroupCaches();
    for (const key of groupCaches.keys()) {
      if (key.startsWith(prefix)) {
        groupCaches.delete(key);
      }
    }

    this._broadcastDelete(deletedKeys);
    return deletedKeys.length;
  }

  /* ---------------------- 分组 API ---------------------- */

  /**
   * 设置分组缓存
   */
  groupSet(key: string, subKey: string, value: string, expiresAt: number | null): void {
    const groupCache = this.getOrCreateGroupCache(key);
    const entry: CacheEntry = { value, expiresAt };
    groupCache.set(subKey, entry);
    this._broadcastSync(key, value, expiresAt, true, subKey);
  }

  /**
   * 获取分组缓存
   */
  groupGet(key: string, subKey: string): string | null {
    const groupCaches = this.getGroupCaches();
    const groupCache = groupCaches.get(key);

    if (!groupCache) return null;

    const entry = groupCache.get(subKey) as CacheEntry | undefined;
    if (!entry) return null;
    if (this.isExpired(entry)) {
      groupCache.delete(subKey);
      return null;
    }

    return entry.value;
  }

  /**
   * 检查分组缓存是否存在
   */
  groupHas(key: string, subKey: string): boolean {
    const groupCaches = this.getGroupCaches();
    const groupCache = groupCaches.get(key);

    if (!groupCache) return false;

    const entry = groupCache.get(subKey) as CacheEntry | undefined;
    if (!entry) return false;
    if (this.isExpired(entry)) {
      groupCache.delete(subKey);
      return false;
    }

    return true;
  }

  /**
   * 删除分组缓存
   */
  groupDel(key: string, subKey: string): void {
    const groupCaches = this.getGroupCaches();
    const groupCache = groupCaches.get(key);

    if (groupCache) {
      groupCache.delete(subKey);
      this._broadcastDelete([subKey], true, key);
    }
  }

  /* ---------------------- 管理 API ---------------------- */

  /**
   * 清空所有缓存
   */
  clear(): void {
    const cache = this.getCache();
    cache.clear();

    const groupCaches = this.getGroupCaches();
    groupCaches.clear();

    this._broadcastClear();
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { size: number; groupCount: number; maxSize: number } {
    const cache = this.getCache();
    const groupCaches = this.getGroupCaches();

    let totalGroupSize = 0;
    for (const groupCache of groupCaches.values()) {
      totalGroupSize += groupCache.size;
    }

    return {
      size: cache.size,              // 普通缓存条目数
      groupCount: totalGroupSize,    // 分组缓存条目数
      maxSize: this.maxSize,         // 最大容量
    };
  }

  /**
   * 关闭缓存（清理资源）
   *
   * 注意：不会广播 close 事件给其他 worker，因为每个 worker 有独立的生命周期
   */
  close(): void {
    // 移除 event listeners（避免内存泄漏）
    // 注意：eventHub 可能没有提供 off 方法，这取决于具体实现
    // 如果没有 off 方法，listeners 会在进程结束时自动清理

    LruCache.caches.delete(this.cacheKey);
    LruCache.groupCaches.delete(this.cacheKey);
    LruCache.listenerSetup.delete(this.cacheKey);
  }
}
