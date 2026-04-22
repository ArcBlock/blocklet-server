/* eslint-disable no-await-in-loop */
import { Worker } from 'worker_threads';
import { test, describe } from 'bun:test';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { DBCache } from '../src';
import { ulid } from '../tools/ulid';

describe('DBCache init lock', () => {
  test('same thread with function opts', async () => {
    // Use unique identifiers to prevent race conditions when tests run concurrently
    const uniqueId = `${ulid()}-${process.pid}`;
    const caches = [];
    const prefix = `test-${uniqueId}-${DBCache.randomKey()}`;
    for (let i = 0; i < 20; i++) {
      caches.push(
        new DBCache(() => {
          return {
            prefix,
            ttl: 1000,
            sqlitePath: path.join(os.tmpdir(), `test-sqlite-worker-init-${uniqueId}.db`),
            redisUrl: process.env.TEST_REDIS_URL,
          };
        })
      );
    }

    await Promise.all(caches.map((cache) => cache.set('test', 'test')));
    await Promise.all(caches.map((cache) => cache.get('test')));
  });

  test('same thread', async () => {
    // Use unique identifiers to prevent race conditions when tests run concurrently
    const uniqueId = `${ulid()}-${process.pid}`;
    const caches = [];
    const prefix = `test-${uniqueId}-${DBCache.randomKey()}`;
    for (let i = 0; i < 20; i++) {
      caches.push(
        new DBCache(() => ({
          prefix,
          ttl: 100000,
          sqlitePath: path.join(os.tmpdir(), `test-worker-${uniqueId}.db`),
          redisUrl: process.env.TEST_REDIS_URL,
        }))
      );
    }

    await Promise.all(caches.map((cache) => cache.set('test', 'test')));
    await Promise.all(caches.map((cache) => cache.get('test')));
  });

  test('different workers', async () => {
    const distPath = path.resolve(__dirname, '../dist/index.cjs');
    if (!fs.existsSync(distPath)) {
      throw new Error('dist/index.cjs not found, please run `npm run build` first');
    }
    // 我们启动 N 个 Worker，每个 Worker 都新建一个 DBCache 实例并做 set/get
    // Use unique identifiers to prevent race conditions when tests run concurrently
    const uniqueId = `${ulid()}-${process.pid}`;
    const workerCount = 4;
    const sqlitePath = path.join(os.tmpdir(), `test-worker-init-${uniqueId}.db`);
    const promises: Promise<void>[] = [];
    const prefix = `test-${uniqueId}-${ulid()}`;

    for (let i = 0; i < workerCount; i++) {
      const redisUrl = process.env.TEST_REDIS_URL;
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 200 * i));
      promises.push(
        new Promise((resolve, reject) => {
          // inline worker 脚本，通过 `eval: true` 把它当成 JS 代码片段执行
          const workerCode = `
            const { parentPort, workerData } = require('worker_threads');
            const { DBCache } = require('${require.resolve('../dist/index.cjs')}');

            (async () => {
              try {
                // 每个 Worker 内创建自己的 DBCache 实例
                const cache = new DBCache(()=>({
                  prefix: workerData.prefix,
                  ttl: 100000,
                  sqlitePath: workerData.sqlitePath,
                  ${redisUrl ? 'redisUrl: workerData.redisUrl,' : ''}
                }));

                // 先 set
                await cache.set('test-worker', 'hello-from-worker');
                // 再 get
                const val = await cache.get('test-worker');

                if (val !== 'hello-from-worker') {
                  throw new Error('Worker 读取到的值不正确: ' + val);
                }

                // 完成后通知主线程
                parentPort.postMessage({ success: true });
              } catch (err) {
                parentPort.postMessage({ success: false, error: err.message });
              }
            })();
          `;

          const worker = new Worker(workerCode, {
            eval: true,
            workerData: { sqlitePath, redisUrl, prefix },
          });

          // 接收 Worker 回传消息
          worker.once('message', (msg) => {
            if (msg.success) {
              resolve();
            } else {
              reject(new Error(`Worker 错误: ${msg.error}`));
            }
          });

          // 如果 Worker 报错
          worker.once('error', (err) => {
            reject(err);
          });
        })
      );
    }

    // 等待所有 Worker 全部完成
    await Promise.all(promises);
  });
});
