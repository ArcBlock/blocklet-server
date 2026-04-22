/* eslint-disable no-promise-executor-return */
/* eslint-disable @typescript-eslint/no-loop-func */
/* eslint-disable no-await-in-loop */
/* eslint-disable require-await */
import { beforeAll, describe, expect, it } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ulid } from '../tools/ulid';

export function runLocalDbCacheThreadTest(forceType: 'redis' | 'sqlite') {
  describe('LockingDBCache Multithread - Prevent Duplicate Task Execution', () => {
    const distPath = path.resolve(__dirname, '../dist/index.cjs');
    // Generate a highly unique ID to prevent conflicts when multiple test files run concurrently
    // Includes: timestamp, multiple random strings, process ID, and forceType for extra uniqueness
    const uniqueId = `${ulid()}-${process.pid}-${forceType}`;
    const sqlitePath: string = path.join(os.tmpdir(), `test-lock-db-cache-multithread-task-${uniqueId}.db`);
    const redisUrl: string | undefined = process.env.TEST_REDIS_URL;
    // Use unique prefix to prevent race conditions when tests run concurrently
    const prefix = `test-${uniqueId}-${ulid()}`;
    if (!redisUrl) {
      // eslint-disable-next-line no-console
      console.log('TEST_REDIS_URL is not set, use sqlite lock-db-cache-mulitihread tests');
      // return;
    }

    beforeAll(async () => {
      if (!fs.existsSync(distPath)) {
        throw new Error('dist/index.cjs not found, please run `npm run build` first');
      }
      if (fs.existsSync(sqlitePath)) {
        fs.unlinkSync(sqlitePath);
      }
      // If using Redis, verify connection is ready before running tests
      if (forceType === 'redis' && redisUrl) {
        const { DBCache } = require('../dist/index.cjs');
        const testCache = new DBCache(() => ({
          prefix: `test-connection-${uniqueId}`,
          sqlitePath,
          forceType: 'redis',
          redisUrl,
          ttl: 25_000,
        }));
        // Try to connect with retries
        let connected = false;
        for (let i = 0; i < 10; i++) {
          try {
            await testCache.set('connection-test', 'ok', { ttl: 25_000 });
            const value = await testCache.get('connection-test');
            if (value === 'ok') {
              connected = true;
              break;
            }
          } catch (err) {
            // Wait before retry
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
        if (!connected) {
          throw new Error('Redis connection failed after retries');
        }
        await testCache.close();
      }
    });

    interface WorkerResult {
      error?: string;
      executed?: boolean;
      threadId?: number;
    }

    const workerScriptPath = path.resolve(__dirname, 'local-db-cache-worker-script.js');

    function runWorker(
      id: number,
      lockName: string,
      taskId: string,
      options: {
        sqlitePath: string;
        redisUrl?: string;
        prefix: string;
        ttl?: number;
      }
    ): Promise<WorkerResult> {
      return new Promise<WorkerResult>((resolve, reject) => {
        const workerData = {
          id,
          lockName,
          taskId,
          prefix: options.prefix,
          sqlitePath: options.sqlitePath,
          redisUrl: options.redisUrl,
          ttl: options.ttl || 25_000,
          forceType,
        };

        // 使用 spawn 创建子进程
        const child = spawn('node', [workerScriptPath], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env },
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('error', (err: Error) => {
          reject(err);
        });

        child.on('exit', (code: number) => {
          // 尝试解析 stdout 中的结果（即使退出码非 0，也可能有 JSON 格式的错误信息）
          if (stdout.trim()) {
            try {
              const result: WorkerResult = JSON.parse(stdout.trim());
              resolve(result);
              return;
            } catch (err) {
              // JSON 解析失败，继续使用错误处理
            }
          }

          // 如果没有有效的 stdout 输出，则使用错误信息
          if (code !== 0) {
            reject(new Error(`Process ${id} exited with code ${code}: ${stderr || 'No output'}`));
          } else {
            reject(new Error(`Process ${id} exited successfully but produced no output`));
          }
        });

        // 发送数据到子进程的 stdin
        child.stdin.write(JSON.stringify(workerData));
        child.stdin.end();
      });
    }

    it('should prevent duplicate task execution across multiple threads', async () => {
      // 测试目的：检测锁机制是否能防止多个线程重复执行同一个任务
      // 如果锁失效，多个线程都会执行任务，测试会失败并显示实际执行次数
      // 重复运行 3 次，确保每次都通过
      const testRuns = 3;
      const threadCount = Math.max(os.cpus().length - 1, 5);

      for (let run = 0; run < testRuns; run++) {
        // Include uniqueId in lockName and taskId to prevent conflicts when multiple test files run concurrently
        const lockName = `task-execution-lock-${uniqueId}-${run}`;
        const taskId = `task-${uniqueId}-${ulid()}-${run}`;
        const currentRedisUrl = redisUrl;

        // 启动所有 Worker 线程，它们会同时尝试执行同一个任务
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        const workers = Array.from({ length: threadCount }, (_, i) =>
          runWorker(i, lockName, taskId, {
            sqlitePath,
            redisUrl: currentRedisUrl,
            prefix,
            ttl: 25_000,
          })
        );

        // 等待所有线程完成
        const results = await Promise.all(workers);

        // 验证没有错误
        const errors = results.filter((r) => r.error);
        expect(errors).toHaveLength(0);

        // 关键验证：只有一个线程执行了任务
        // 如果锁失效，这里会失败，显示实际执行次数（可能 > 1）
        const executedResults = results.filter((r) => r.executed === true);
        if (executedResults.length !== 1) {
          // eslint-disable-next-line no-console
          console.error(`Run ${run} failed: expected 1 execution, got ${executedResults.length}`);
          // eslint-disable-next-line no-console
          console.error(
            'Executed thread IDs:',
            executedResults.map((r) => r.threadId)
          );
        }
        expect(executedResults).toHaveLength(1);

        // 验证其他线程都没有执行任务
        const notExecutedResults = results.filter((r) => r.executed === false);
        expect(notExecutedResults).toHaveLength(threadCount - 1);

        // 验证执行任务的线程 ID
        const executedThreadId = executedResults[0]?.threadId;
        expect(executedThreadId).toBeDefined();
        expect(executedThreadId).toBeGreaterThanOrEqual(0);
        expect(executedThreadId).toBeLessThan(threadCount);
      }
    });

    it('should prevent duplicate task execution with concurrent access', async () => {
      // 测试目的：检测高并发场景下锁机制是否能防止任务重复执行
      // 模拟真实的高并发场景，如果锁失效会在高并发时暴露问题
      // 重复运行 3 次，确保每次都通过
      const testRuns = 3;
      const threadCount = 10;

      for (let run = 0; run < testRuns; run++) {
        // Include uniqueId in lockName and taskId to prevent conflicts when multiple test files run concurrently
        const lockName = `concurrent-task-lock-${uniqueId}-${run}-${forceType}`;
        const taskId = `concurrent-task-${uniqueId}-${ulid()}-${run}`;
        const currentRedisUrl = redisUrl;

        // 同时启动所有线程，模拟高并发场景
        const startTime = Date.now();
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        const workers = Array.from({ length: threadCount }, (_, i) =>
          runWorker(i, lockName, taskId, {
            sqlitePath,
            redisUrl: currentRedisUrl,
            prefix,
            ttl: 25_000,
          })
        );

        const results = await Promise.all(workers);
        const elapsed = Date.now() - startTime;

        // 验证没有错误
        const errors = results.filter((r) => r.error);
        expect(errors).toHaveLength(0);

        // 关键验证：高并发下只有一个线程执行了任务
        // 如果锁在高并发时失效，这里会失败
        const executedResults = results.filter((r) => r.executed === true);
        expect(executedResults).toHaveLength(1);

        // 验证其他线程都正确识别任务已执行
        const notExecutedResults = results.filter((r) => r.executed === false);
        expect(notExecutedResults).toHaveLength(threadCount - 1);

        // 验证执行时间（应该串行执行，所以时间应该 >= 100ms）
        expect(elapsed).toBeGreaterThanOrEqual(80);
      }
    });

    it('should handle multiple different tasks independently', async () => {
      // 测试目的：检测多个独立任务之间是否相互影响
      // 如果锁机制有问题，不同任务之间可能会相互干扰，导致某些任务被执行多次
      // 重复运行 3 次，确保每次都通过
      const baseLockName = `independent-task-lock-${forceType}`;
      const taskCount = 3;
      const threadCountPerTask = 5;

      // 每次组测试之间等待 1 秒，不然经常会有 require(redis) 失败的情况
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const allResults: WorkerResult[] = [];
      const baseTime = Date.now();
      // Include uniqueId in prefix to prevent conflicts when multiple test files run concurrently
      const currentPrefix = `test-${uniqueId}-${ulid()}`;

      // 为每个任务启动多个线程，每个任务使用不同的锁名
      for (let taskIndex = 0; taskIndex < taskCount; taskIndex++) {
        // Include uniqueId in taskId and lockName to prevent conflicts when multiple test files run concurrently
        const taskId = `task-${uniqueId}-${taskIndex}-${baseTime}-${ulid()}`;
        const lockName = `${baseLockName}-${uniqueId}-${taskIndex}`;

        // eslint-disable-next-line @typescript-eslint/no-loop-func
        const workers = Array.from({ length: threadCountPerTask }, (_, i) =>
          runWorker(taskIndex * threadCountPerTask + i, lockName, taskId, {
            sqlitePath,
            redisUrl,
            prefix: currentPrefix,
            ttl: 25_000,
          })
        );

        const results = await Promise.all(workers);
        allResults.push(...results);
      }

      // 验证没有错误
      const errors = allResults.filter((r) => r.error);
      if (errors.length > 0) {
        console.error('Run Errors:', errors);
      }
      expect(errors).toHaveLength(0);

      // 关键验证：每个任务都只执行了一次
      // 如果不同任务之间相互影响，这里会失败（执行次数可能不等于 taskCount）
      // 如果测试失败，说明锁机制存在问题，需要修复
      const executedResults = allResults.filter((r) => r.executed === true);
      expect(executedResults).toHaveLength(taskCount);

      // 验证其他线程都正确识别任务已执行
      const notExecutedResults = allResults.filter((r) => r.executed === false);
      expect(notExecutedResults).toHaveLength(taskCount * threadCountPerTask - taskCount);
    }, 30_000);
  });
}
