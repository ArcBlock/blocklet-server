/* eslint-disable no-promise-executor-return */
import os from 'os';
import { Worker } from 'worker_threads';
import path from 'path';
import { test, expect, describe } from 'bun:test';
import fs from 'fs';
import { DBCache } from '../src';
import { ulid } from '../tools/ulid';

describe('DBCache Multithread Safety', () => {
  test('concurrent access from multiple threads', async () => {
    const distPath = path.resolve(__dirname, '../dist/index.cjs');
    if (!fs.existsSync(distPath)) {
      throw new Error('dist/index.cjs not found, please run `npm run build` first');
    }
    let threadCount: number = Math.max(os.cpus().length - 1, 4);
    if (threadCount === 0) {
      threadCount = 1;
    }
    // Use unique identifiers to prevent race conditions when tests run concurrently
    const uniqueId = `${ulid()}-${process.pid}`;
    const prefix = `test-${uniqueId}-${ulid()}`;
    const opsPerThread: number = 15;
    const sqlitePath: string = path.join(os.tmpdir(), `test-db-cache-multithread-${uniqueId}.db`);
    if (fs.existsSync(sqlitePath)) {
      fs.unlinkSync(sqlitePath);
    }
    const redisUrl: string | undefined = process.env.TEST_REDIS_URL;

    interface WorkerResult {
      error?: string;
    }

    async function runWorker(id: number): Promise<void> {
      await new Promise((resolve) => setTimeout(resolve, 500 * id));
      return new Promise<void>((resolve, reject) => {
        const worker = new Worker(
          `
            const { parentPort, workerData } = require('worker_threads');
            const { DBCache } = require('${require.resolve('../dist/index.cjs')}');
            (async () => {
              const cache = new DBCache(()=>({
                prefix: workerData.prefix,
                ttl: 20000,
                sqlitePath: workerData.sqlitePath,
                redisUrl: workerData.redisUrl,
              }));
              for (let i = 0; i < workerData.ops; i++) {
                const key = \`thread-\${workerData.id}-key-\${i}\`;
                await cache.set(key, workerData.id);
                const v = await cache.get(key);
                if (v !== workerData.id) {
                  throw new Error(\`Expected \${workerData.id} but got \${v}\`);
                }
              }
              parentPort.postMessage('done');
            })().catch(err => {
              parentPort.postMessage({ error: err.message });
            });
          `,
          {
            eval: true,
            workerData: {
              id,
              ops: opsPerThread,
              prefix,
              sqlitePath,
              redisUrl,
            },
            // eslint-disable-next-line @typescript-eslint/comma-dangle
          }
        );

        worker.on('message', (msg: string | WorkerResult) => {
          if (msg === 'done') {
            resolve();
          } else if (typeof msg === 'object' && 'error' in msg) {
            reject(new Error(msg.error));
          }
        });

        worker.on('error', (err: Error) => {
          reject(err);
        });

        worker.on('exit', (code: number) => {
          if (code !== 0) {
            reject(new Error(`Worker ${id} exited with code ${code}`));
          }
        });
      });
    }

    await Promise.all(Array.from({ length: threadCount }, (_v, idx) => runWorker(idx)));
    await new Promise((resolve) => setTimeout(resolve, 500));
    const verifyCache = new DBCache(() => ({
      prefix,
      ttl: 20000,
      sqlitePath,
      redisUrl,
    }));

    for (let id = 0; id < threadCount; id++) {
      for (let i = 0; i < opsPerThread; i++) {
        const key: string = `thread-${id}-key-${i}`;
        // eslint-disable-next-line no-await-in-loop
        const value = await verifyCache.get(key);
        expect(value).toBe(id);
      }
    }
  });
});
