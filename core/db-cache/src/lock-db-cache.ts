/* eslint-disable no-await-in-loop */
import { ulid } from '../tools/ulid';
import SingleFlightDBCache from './single-flight-db-cache';

export default class LockDBCache extends SingleFlightDBCache {
  private _inFlight: Map<string, number> = new Map();

  public async createLock(lockName: string): Promise<boolean> {
    this.initAdapter();
    if (!lockName) {
      return false;
    }
    const key = this._formatLockKey(lockName);

    // 如果本地标记已经在进行"抢锁"操作，直接返回 false
    // 注意：这只是本地优化，真正的锁在 Redis/SQLite 中
    const lastLockTime = this._inFlight.get(key);
    if (lastLockTime && Date.now() - lastLockTime < this.defaultTtl) {
      return false;
    }

    // 标记正在抢锁
    this._inFlight.set(key, Date.now());

    try {
      // 直接使用 SET NX 原子操作来获取锁，不需要先检查再设置
      // SET key value NX PX ttl 是原子操作：
      // - 如果 key 不存在，设置成功并返回 "OK"
      // - 如果 key 已存在，不设置并返回 null
      // 这样可以避免 Check-Then-Act 竞态条件
      const result = await this.set(key, ulid(), { ttl: this.defaultTtl, nx: true });
      return result;
    } finally {
      // 无论成功或失败，一定要把 inFlight 标记删除
      this._inFlight.delete(key);
      // 清空过期时间
      for (const [key2, value] of this._inFlight.entries()) {
        if (Date.now() - value > this.defaultTtl) {
          this._inFlight.delete(key2);
        }
      }
    }
  }

  /**
   * 检查锁是否已经过期：只要缓存层面已经没有该 key，就代表已过期或从未创建。
   *
   * @param lockName    锁的名称
   * @returns           如果锁不存在或已过期，返回 true；否则返回 false
   */
  public async hasExpired(lockName: string): Promise<boolean> {
    this.initAdapter();
    if (!lockName) {
      return true;
    }
    const key = this._formatLockKey(lockName);
    const exists = await this.has(key);
    return !exists;
  }

  /**
   * 主动释放锁：删除对应的缓存 key
   *
   * @param lockName    锁的名称
   */
  public async releaseLock(lockName: string): Promise<void> {
    this.initAdapter();
    if (!lockName) {
      return;
    }
    const key = this._formatLockKey(lockName);
    await this.del(key);
  }

  /**
   * 等待锁释放或超时。每隔 100ms 检查一次缓存层面是否仍存在该锁 key。
   * 如果在 timeoutMs 毫秒内 key 不再存在，则 resolve(true)。否则 resolve(false)。
   *
   * @param lockName     锁的名称
   * @param timeoutMs    等待超时时间（毫秒），默认使用构造时传入的 this._timeout
   * @returns            如果锁被释放或过期，resolve(true)；等待到超时还没释放，则 resolve(false)
   */
  // eslint-disable-next-line require-await
  public async waitUnLock(lockName: string, timeoutMs: number = this.defaultTtl): Promise<boolean> {
    this.initAdapter();

    if (!lockName) {
      return true;
    }
    const key = this._formatLockKey(lockName);
    const start = Date.now();

    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        const exists = await this.has(key);
        if (!exists) {
          clearInterval(interval);
          resolve(true);
        } else if (Date.now() - start >= timeoutMs) {
          clearInterval(interval);
          resolve(false);
        }
        // 否则继续等待
      }, 100);
    });
  }

  /**
   * 获取锁的流程：
   *  1. 先尝试 createLock(lockName)：
   *     - 如果立刻拿到（createLock 返回 true），直接返回；
   *     - 如果没拿到，就等待 waitUnLock(lockName)。
   *  2. 等待到释放/过期后，再次尝试 createLock(lockName)。
   *
   * @param lockName    锁的名称
   */
  public async acquire(lockName: string): Promise<void> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const acquired = await this.createLock(lockName);
      if (acquired) {
        return;
      }
      await this.waitUnLock(lockName);
    }
  }

  private _formatLockKey(lockName: string): string {
    return `lock:${this.prefix}:${lockName}`;
  }
}
