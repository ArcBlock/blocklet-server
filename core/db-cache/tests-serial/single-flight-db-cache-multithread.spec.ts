import path from 'path';
import fs from 'fs';
import os from 'os';
import { Worker } from 'worker_threads';
import { test, expect, describe } from 'bun:test';
import { DBCache } from '../src';
import { ulid } from '../tools/ulid';

describe('SingleFlightDBCache Multithread Safety', () => {
  test('concurrent autoCache from multiple threads', async () => {
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
    const opsPerThread: number = 50;
    const sqlitePath: string = path.join(os.tmpdir(), `test-single-flight-db-cache-multithread-${uniqueId}.db`);
    if (fs.existsSync(sqlitePath)) {
      fs.unlinkSync(sqlitePath);
    }
    const redisUrl: string | undefined = process.env.TEST_REDIS_URL;
    const prefix = `test-${uniqueId}-${ulid()}`;

    interface WorkerData {
      prefix: string;
      id: number;
      ops: number;
      sqlitePath: string;
      redisUrl?: string;
    }

    function runWorker(id: number): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        const workerCode: string = `
          const { parentPort, workerData } = require('worker_threads');
          const { DBCache } = require('${require.resolve('../dist/index.cjs')}');

          (async () => {
            const cache = new DBCache(()=>({
              prefix: workerData.prefix,
              sqlitePath: workerData.sqlitePath,
              ${redisUrl ? 'redisUrl: workerData.redisUrl,' : ''}
              ttl: 20000,
            }));

            for (let i = 0; i < workerData.ops; i++) {
              const key = \`thread-\${workerData.id}-key-\${i}\`;

              const fn = async () => {
                return workerData.id;
              };

              const [v1, v2, v3] = await Promise.all([
                cache.autoCache(key, fn),
                cache.autoCache(key, fn),
                cache.autoCache(key, fn),
              ]);

              if (v1 !== workerData.id || v2 !== workerData.id || v3 !== workerData.id) {
                throw new Error(\`Expected all values to be \${workerData.id}, got [\${v1},\${v2},\${v3}]\`);
              }
            }

            parentPort.postMessage('done');
          })().catch(err => {
            parentPort.postMessage({ error: (err).message });
          });
        `;

        const worker = new Worker(workerCode, {
          eval: true,
          workerData: { id, ops: opsPerThread, sqlitePath, redisUrl, prefix } as WorkerData,
        });

        worker.on('message', (msg: string | { error: string }) => {
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

    // Launch all workers concurrently
    await Promise.all(Array.from({ length: threadCount }, (_v, idx) => runWorker(idx)));

    // Verify all keys written by workers
    const verifyCache = new DBCache(() => ({
      prefix,
      sqlitePath,
      redisUrl,
      ttl: 20000,
    }));

    for (let id = 0; id < threadCount; id++) {
      for (let i = 0; i < opsPerThread; i++) {
        const key: string = `thread-${id}-key-${i}`;
        // eslint-disable-next-line no-await-in-loop
        const v = await verifyCache.get(key);
        expect(v).toBe(id);
      }
    }
  });
});
