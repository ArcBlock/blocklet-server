# DB Cache

Use Redis or Sqlite3 LRC cache, multithread safe

**Convention:** DB Cache must not be the sole source of truth. We must assume that cache data can be released at any time during development.

**No limit on the number of caches:**

For Redis, we configure it with a max memory limit and enable automatic LRU (Least Recently Used) eviction when full.  
For SQLite, since it's disk-based, there's no need to limit the size.

## Redis Startup Configuration

- Redis bound to the internal network only
- No persistence
- Max memory: 512MB
- Eviction policy: allkeys-lru (LRU for all keys)

```bash
docker run -d \
  --name db-cache-redis \
  -p 127.0.0.1:40409:6379 \
  redis:8.0.2 \
  redis-server \
    --save "" \
    --appendonly no \
    --maxmemory 512mb \
    --maxmemory-policy allkeys-lru
```

## Usage

```bash
yarn add @abtnode/db-cache
```

Then:

```javascript
const { DBCache } = require('@abtnode/db-cache');

// Configuration will only be read on first use
const dbCache = new DBCache(() => ({
  prefix: 'the prefix key',
  ttl: 60 * 1000,
  sqlitePath: 'test.db',
  redisURL: process.env.REDIS_URL,
}));

await dbCache.set('key', { foo: 'bar' });
await dbCache.set('key', { foo: 'bar' }, { ttl: 1000 * 60 * 10 });
await dbCache.get('key');
await dbCache.delete('key');
await dbCache.has('key');
```

## Group set/get usage

```javascript
const cache = new DBCache(() => ({
  prefix: 'the prefix key',
  ttl: 5 * 1000,
  sqlitePath: 'test.db',
  redisURL: process.env.REDIS_URL,
}));

await cache.groupSet('group-key', 'sub-key', { a: 'b' });
const data = await cache.groupGet('group-key', 'sub-key');
await cache.groupDel('group-key', 'sub-key');
await cache.del('group-key'); // delete all keys under the group
```

## Auto Cache

`autoCache` or `autoCacheGroup`:

If the value is cached, return it; otherwise, compute and cache it

Errors during computation won't be cached

```javascript
const cache = new DBCache(() => ({
  prefix: 'the prefix key',
  ttl: 5 * 1000,
  sqlitePath: 'test.db',
  redisURL: process.env.REDIS_URL,
}));

await cache.autoCache('key', async () => {
  return 'want to cache data';
});

await cache.autoCacheGroup('group-key', 'sub-key', async () => {
  return 'want to cache data';
});
```

## Lock usage

```javascript
const lock = new DBCache(() => ({
  prefix: 'the prefix key',
  ttl: 5 * 1000,
  sqlitePath: 'test.db',
  redisURL: process.env.REDIS_URL,
}));

await lock.acquire('key name');
// do something or wait for TTL to auto-release the lock
await lock.releaseLock('key name');
```

## SQLite Performance

**SQLite auto set WAL mode**

```sql
PRAGMA journal_mode = WAL;          -- Enable Write-Ahead Logging for parallel reads/writes
PRAGMA synchronous = OFF;           -- Skip fsync for performance
PRAGMA busy_timeout = 10000;        -- Wait up to 10 seconds on lock conflict
PRAGMA wal_autocheckpoint = 2000;   -- Auto-checkpoint after every 2000 writes
```

### Benchmark Results

```
=== SQLite Backend Benchmark ===
SET  50000 ops in 5.36s -> 9325 ops/sec
GET  50000 ops in 5.83s -> 8582 ops/sec

=== Redis Backend Benchmark ===
SET  50000 ops in 0.14s -> 370370 ops/sec
GET  50000 ops in 0.14s -> 349650 ops/sec
```

### Disk or Memory Usage

Example with 100,000 entries. Sample data:

```json
{
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
}
```

```
=== Redis Memory Info ===
# Memory
used_memory_rss_human:57.41M

SQLite file size: 31.63 MB
```

Concurrency is safe and depends on `busy_timeout` and the level of concurrency.

**Conclusion:** Redis is roughly 20–40x faster than SQLite. However, SQLite will not be the QPS bottleneck in most business use cases. It's a cost-effective choice for trading disk space for memory in scenarios with moderate RPS demands.

---

### Group Implementation Differences

- Redis: groups are implemented via hash sets — performance is very good.
- SQLite: implemented with dual-key lookups — still performs well.

**Group set/get performance:**

```
=== SQLite Backend Benchmark ===
SET  50000 ops in 5.75s -> 8703 ops/sec
GET  50000 ops in 3.11s -> 16077 ops/sec

=== Redis Backend Benchmark ===
SET  50000 ops in 0.22s -> 230415 ops/sec
GET  50000 ops in 0.08s -> 649351 ops/sec
```

---

### CI Redis Testing

If the `TEST_REDIS_URL` environment variable is set, tests will run in Redis mode.  
If not, tests will fall back to SQLite mode.

Example:

```bash
TEST_REDIS_URL="redis://:the_password@127.0.0.1:6379"
```
