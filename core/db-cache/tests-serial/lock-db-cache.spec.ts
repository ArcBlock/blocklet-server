/* eslint-disable no-await-in-loop */
/* eslint-disable require-await */
import { describe, it, expect, beforeAll } from 'bun:test';
import os from 'os';
import { DBCache } from '../src';
import type { BaseDBCacheParams } from '../src/adapter/adapter';
import { ulid } from '../tools/ulid';

// 使用 performance.now() 确保在覆盖率模式下时间准确
const sleep = (ms: number) =>
  new Promise((resolve) => {
    const start = performance.now();
    const check = () => {
      if (performance.now() - start >= ms) {
        resolve(undefined);
      } else {
        setTimeout(check, Math.min(50, ms / 10));
      }
    };
    setTimeout(check, Math.min(50, ms / 10));
  });

describe('LockingDBCache', () => {
  let lockingCache: DBCache;
  const prefix = ulid();
  const options: BaseDBCacheParams = {
    prefix,
    sqlitePath: `${os.tmpdir()}/test-lock-db-cache-${process.pid}-${ulid()}.db`,
    ttl: 2000,
  };

  beforeAll(async () => {
    lockingCache = new DBCache(() => options);
    await lockingCache.flushAll();
  });

  it('should return false when lockName is empty', async () => {
    const result = await lockingCache.createLock('');
    expect(result).toBe(false);
  });

  it('should create and release lock', async () => {
    const lockName = 'test-lock' + ulid();
    const created = await lockingCache.createLock(lockName);
    expect(created).toBe(true);

    const expiredAfterCreate = await lockingCache.hasExpired(lockName);
    expect(expiredAfterCreate).toBe(false);

    await lockingCache.releaseLock(lockName);

    const expiredAfterRelease = await lockingCache.hasExpired(lockName);
    expect(expiredAfterRelease).toBe(true);
  });

  it('should not create lock if already exists', async () => {
    const lockName = 'duplicate-lock';
    const first = await lockingCache.createLock(lockName);
    expect(first).toBe(true);
    const second = await lockingCache.createLock(lockName);
    expect(second).toBe(false);
  });

  it('should identify expired lock after manual release', async () => {
    const lockName = 'expire-lock';
    await lockingCache.createLock(lockName);
    await lockingCache.releaseLock(lockName);
    const expired = await lockingCache.hasExpired(lockName);
    expect(expired).toBe(true);
  });

  it('should not consider valid lock as expired', async () => {
    const lockName = 'valid-lock';
    await lockingCache.createLock(lockName);
    const expired = await lockingCache.hasExpired(lockName);
    expect(expired).toBe(false);
  });

  it('should release lock and allow recreation', async () => {
    const lockName = 'recreate-lock';
    await lockingCache.createLock(lockName);
    await lockingCache.releaseLock(lockName);
    const recreated = await lockingCache.createLock(lockName);
    expect(recreated).toBe(true);
  });

  it('should handle expired lock by recreating it', async () => {
    const lockName = 'autoexpire-lock';
    await lockingCache.createLock(lockName);
    await lockingCache.releaseLock(lockName);
    const retried = await lockingCache.createLock(lockName);
    expect(retried).toBe(true);
    expect(await lockingCache.hasExpired(lockName)).toBe(false);
  });

  it('should not allow createLock if valid lock exists', async () => {
    const lockName = 'occupied-lock';
    await lockingCache.createLock(lockName);
    const second = await lockingCache.createLock(lockName);
    expect(second).toBe(false);
  });

  it('should create separate locks for different names', async () => {
    const lockA = 'lock-A';
    const lockB = 'lock-B';
    expect(await lockingCache.createLock(lockA)).toBe(true);
    expect(await lockingCache.createLock(lockB)).toBe(true);
    expect(await lockingCache.hasExpired(lockA)).toBe(false);
    expect(await lockingCache.hasExpired(lockB)).toBe(false);
    await lockingCache.releaseLock(lockA);
    await lockingCache.releaseLock(lockB);
    expect(await lockingCache.hasExpired(lockA)).toBe(true);
    expect(await lockingCache.hasExpired(lockB)).toBe(true);
  });

  it('should wait until a lock is released', async () => {
    const lockName = 'waiting-lock';
    await lockingCache.createLock(lockName);
    setTimeout(async () => {
      await lockingCache.releaseLock(lockName);
    }, 500);

    const start = performance.now();
    const result = await lockingCache.waitUnLock(lockName, 2000);
    const elapsed = performance.now() - start;
    expect(result).toBe(true);
    expect(elapsed).toBeGreaterThanOrEqual(400);
  });

  it('should fail if the lock is not released within the timeout', async () => {
    const lockName = 'never-release-lock';
    await lockingCache.createLock(lockName);
    const start = performance.now();
    const result = await lockingCache.waitUnLock(lockName, 1000);
    const elapsed = performance.now() - start;
    expect(result).toBe(false);
    expect(elapsed).toBeGreaterThanOrEqual(500);
  });

  it('should succeed immediately if the lock does not exist', async () => {
    const start = performance.now();
    const result = await lockingCache.waitUnLock('non-existent-lock', 1000);
    const elapsed = performance.now() - start;
    expect(result).toBe(true);
    expect(elapsed).toBeLessThan(3000);
  });

  it('acquire', async () => {
    const lockName = 'acquire-lock';
    await lockingCache.acquire(lockName);
    let count = 0;
    lockingCache.acquire(lockName).then(() => {
      count++;
    });
    await sleep(300);
    expect(count).toBe(0);
    lockingCache.releaseLock(lockName);
    await sleep(300);
    expect(count).toBe(1);
  });

  it('concurrent lock acquisition with multiple locks', async () => {
    const lockNames = ['concurrent-lock-1', 'concurrent-lock-2', 'concurrent-lock-3'];
    const results: string[] = [];
    const errors: Error[] = [];

    const tasks = lockNames.map(async (name, i) => {
      try {
        await lockingCache.acquire(name);
        await sleep(100);
        results.push(`Task ${i + 1} acquired ${name}`);
        await lockingCache.releaseLock(name);
        results.push(`Task ${i + 1} released ${name}`);
      } catch (e) {
        errors.push(e as Error);
      }
    });

    await Promise.all(tasks);
    expect(errors).toHaveLength(0);
    expect(results.filter((r) => r.includes('acquired'))).toHaveLength(3);
    expect(results.filter((r) => r.includes('released'))).toHaveLength(3);
  });

  it('concurrent access to same lock with blocking', async () => {
    const lockName = 'blocking-lock';
    const results: number[] = [];
    const order: number[] = [];
    const start = performance.now();

    const longTask = async () => {
      await lockingCache.acquire(lockName);
      order.push(1);
      await sleep(300);
      results.push(1);
      await lockingCache.releaseLock(lockName);
    };
    const blockedTask = async () => {
      await lockingCache.acquire(lockName);
      order.push(2);
      await sleep(100);
      results.push(2);
      await lockingCache.releaseLock(lockName);
    };

    await Promise.all([longTask(), blockedTask()]);
    const elapsed = performance.now() - start;

    expect(results).toEqual([1, 2]);
    expect(order).toEqual([1, 2]);
    expect(elapsed).toBeGreaterThanOrEqual(350);
  });

  it('concurrent lock contention with multiple threads', async () => {
    const lockName = 'contention-lock';
    const threads = 10;
    const order: number[] = [];
    const start = performance.now();

    const tasks = Array.from({ length: threads }, (_, i) => async () => {
      await lockingCache.acquire(lockName);
      order.push(i + 1);
      await sleep(50);
      await lockingCache.releaseLock(lockName);
    });

    await Promise.all(tasks.map((fn) => fn()));
    const elapsed = performance.now() - start;
    expect(order).toHaveLength(threads);
    expect([...new Set(order)]).toHaveLength(threads);
    expect(elapsed).toBeGreaterThanOrEqual(threads * 40);
  });

  // 增加模拟 setBlockletStatus 的并发测试
  it('concurrent setBlockletStatus with multiple threads', async () => {
    const lockName = 'contention-lock';
    const threads = 10;
    let order: Record<string, number> = {};
    const start = performance.now();
    const setStatus = async (did: string, index: number) => {
      const current = { ...order };
      await sleep(100);
      current[did] = index + 1;
      order = current;
      await sleep(100);
    };
    const fn = async (did: string, index: number) => {
      await lockingCache.acquire(lockName);
      try {
        await setStatus(did, index);
        if (Math.random() > 0.5) {
          throw new Error('test');
        }
      } catch (e) {
        console.error(e);
      } finally {
        await lockingCache.releaseLock(lockName);
      }
    };

    const tasks = Array.from({ length: threads }, (_, i) => fn(`thread-${i}`, i));
    await Promise.all(tasks);

    const elapsed = performance.now() - start;
    expect(order['thread-0']).toEqual(1);
    expect(order['thread-1']).toEqual(2);
    expect(order['thread-2']).toEqual(3);
    expect(order['thread-3']).toEqual(4);
    expect(order['thread-4']).toEqual(5);
    expect(order['thread-5']).toEqual(6);
    expect(order['thread-6']).toEqual(7);
    expect(order['thread-7']).toEqual(8);
    expect(order['thread-8']).toEqual(9);
    expect(order['thread-9']).toEqual(10);
    expect(elapsed).toBeGreaterThanOrEqual(threads * 100);
  });

  // 增加锁嵌套测试
  it('should handle nested lock acquisition (no reentrancy)', async () => {
    const lockName = 'nested-lock';
    let phase = 0;

    const task = async () => {
      await lockingCache.acquire(lockName);
      phase = 1;

      // 尝试再次获取同一个锁（嵌套锁）
      const nestedPromise = lockingCache.acquire(lockName).then(() => {
        phase = 2;
      });

      // 500ms 后释放外层锁
      setTimeout(async () => {
        await lockingCache.releaseLock(lockName);
      }, 500);

      // 等待内层锁完成
      await nestedPromise;

      // 再释放内层锁
      await lockingCache.releaseLock(lockName);
      phase = 3;
    };

    const start = performance.now();
    await task();
    const elapsed = performance.now() - start;

    expect(phase).toBe(3);
    expect(elapsed).toBeGreaterThanOrEqual(400);
  });

  it('acquire auto release', async () => {
    const lockName = 'acquire-auto-release';
    await lockingCache.acquire(lockName);
    let count = 0;
    lockingCache.acquire(lockName).then(() => {
      count++;
    });
    await sleep(300);
    expect(count).toBe(0);
    await sleep(3500);
    expect(count).toBe(1);
  });
});
