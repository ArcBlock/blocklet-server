/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
require('dotenv-flow').config();
const fs = require('fs');
const redis = require('redis');
const { DBCache } = require('../dist/index.cjs');

/**
 * Run a list of async tasks with a concurrency limit.
 * @param {Function[]} tasks - array of functions returning a Promise
 * @param {number} concurrency - max concurrent tasks
 */
async function runTasks(tasks, concurrency) {
  let index = 0;
  const results = [];

  async function worker() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const i = index++;
      if (i >= tasks.length) break;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: concurrency }).map(worker);
  await Promise.all(workers);
  return results;
}

async function bench(cache, name, totalOps, concurrency) {
  console.log(`\n=== ${name} Backend Benchmark ===`);
  const keys = Array.from({ length: totalOps }, (_, i) => `key${i}`);
  const values = keys.map((_, i) => ({
    idx: i,
    v: `value-${i}`,
    other: `other-${i}`,
    other2: `other2-${i}`,
    other3: `other3-${i}`,
    other4: `other4-${i}`,
    other5: `other5-${i}`,
    other6: `other6-${i}`,
    other7: `other7-${i}`,
    other8: `other8-${i}`,
    other9: `other9-${i}`,
    other10: `other10-${i}`,
  }));

  // Warm-up
  for (let i = 0; i < Math.min(100, totalOps); i++) {
    await cache.set(keys[i], values[i], { ttl: 60000 });
  }

  // SET benchmark
  const setTasks = keys.map((key, i) => () => cache.set(key, values[i], { ttl: 60000 }));
  const t0Set = Date.now();
  await runTasks(setTasks, concurrency);
  const dtSet = (Date.now() - t0Set) / 1000;
  console.log(`SET  ${totalOps} ops in ${dtSet.toFixed(2)}s -> ${(totalOps / dtSet).toFixed(0)} ops/sec`);

  // GET benchmark
  const getTasks = keys.map((key) => () => cache.get(key));
  const t0Get = Date.now();
  await runTasks(getTasks, concurrency);
  const dtGet = (Date.now() - t0Get) / 1000;
  console.log(`GET  ${totalOps} ops in ${dtGet.toFixed(2)}s -> ${(totalOps / dtGet).toFixed(0)} ops/sec`);
}

(async () => {
  const totalOps = parseInt(process.argv[2], 10) || 50000;
  const concurrency = parseInt(process.argv[3], 10) || 1000;
  const sqlitePath = 'test.db';

  // --- Cleanup start ---
  if (fs.existsSync(sqlitePath)) {
    fs.unlinkSync(sqlitePath);
    console.log('Cleared existing SQLite file:', sqlitePath);
  }

  const redisUrl = process.env.TEST_REDIS_URL;
  let redisClient;
  if (redisUrl) {
    redisClient = redis.createClient({ url: redisUrl });
    await redisClient.connect();
    await redisClient.flushDb();
    console.log('Flushed Redis database');
  }
  // --- Cleanup end ---

  const sqliteCache = new DBCache(() => ({ sqlitePath, prefix: 'bench:a', ttl: 60000 }));
  await bench(sqliteCache, 'SQLite', totalOps, concurrency);
  await sqliteCache.close();

  if (redisClient) {
    const redisCache = new DBCache(() => ({ sqlitePath, prefix: 'bench:b', ttl: 60000, redisUrl }));
    await bench(redisCache, 'Redis', totalOps, concurrency);
    await redisCache.close();
  }

  // --- Report resource usage ---
  if (redisClient) {
    const info = await redisClient.info('memory');
    console.log('\n=== Redis Memory Info ===');
    console.log(info);
    await redisClient.quit();
  }

  // SQLite file size in MB
  if (fs.existsSync(sqlitePath)) {
    const { size } = fs.statSync(sqlitePath);
    const sizeMb = size / (1024 * 1024);
    console.log(`\nSQLite file size: ${sizeMb.toFixed(2)} MB`);
  }
})();
