# Blocklet Installation Workflow Analysis

This document analyzes the blocklet installation workflow (download, extraction, dependency resolution, installation, and post-installation) to identify scalability issues and propose improvements.

## Overview

The blocklet installation workflow consists of several phases:

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐    ┌──────────────────┐
│   Download  │ -> │  Extraction  │ -> │   Dependency    │ -> │ Installation │ -> │ Post-Installation│
│   Phase     │    │    Phase     │    │   Resolution    │    │    Phase     │    │     Phase        │
└─────────────┘    └──────────────┘    └─────────────────┘    └──────────────┘    └──────────────────┘
```

---

## Table of Contents

1. [Download Phase Issues](#1-download-phase-issues)
2. [Extraction Phase Issues](#2-extraction-phase-issues)
3. [Dependency Resolution Issues](#3-dependency-resolution-issues)
4. [Installation Phase Issues](#4-installation-phase-issues)
5. [Post-Installation Issues](#5-post-installation-issues)
6. [Error Handling & Rollback Issues](#6-error-handling--rollback-issues)
7. [Race Conditions](#7-race-conditions)
8. [Performance Summary](#8-performance-summary)
9. [Issue Summary Matrix](#9-issue-summary-matrix)
10. [Improvement Proposals](#10-improvement-proposals)
11. [Implementation Priority](#11-implementation-priority)
12. [Expected Outcomes](#12-expected-outcomes)

---

## 1. Download Phase Issues

### Issue 1.1: Fixed Download Concurrency

**Location:** `core/state/lib/blocklet/downloader/blocklet-downloader.js`

**Current Behavior:**

```javascript
await pAll(
  downloadList.map((meta) => {
    return () => {
      const url = meta.dist.tarball;
      return this.bundleDownloader.download(meta, did, url, {...});
    };
  }),
  4  // FIXED CONCURRENCY LIMIT
);
```

**Problem:**

- Hardcoded concurrency of 4 regardless of system resources
- Cannot utilize high-bandwidth connections
- Installing 100 blocklets: 25 rounds of downloads

**Impact:**
| Blocklets | Download Rounds | Time (est.) |
| --------- | --------------- | ----------- |
| 10 | 3 | 30s |
| 100 | 25 | 5+ min |
| 1,000 | 250 | 50+ min |

---

### Issue 1.2: Memory-Intensive Download

**Location:** `core/util/lib/download-file.js`

**Problem:**

- Axios response loaded via stream but not properly streamed to disk for large files
- No resume capability for interrupted downloads
- Fixed 20-second connection timeout regardless of file size

---

### Issue 1.3: Short Lock TTL During Download

**Location:** `core/state/lib/blocklet/downloader/bundle-downloader.js`

```javascript
const lock = new DBCache(() => ({
  prefix: 'bundle-downloader-lock',
  ttl: 1000 * 10,  // 10 seconds only!
}));
```

**Problem:**

- 10-second TTL too short for large bundle downloads
- No lock renewal mechanism during download
- Risk of concurrent downloads corrupting same bundle

---

### Issue 1.4: O(n) Bundle Cache Eviction

**Location:** `core/state/lib/blocklet/downloader/bundle-downloader.js`

```javascript
if (cacheList.length > 50) {
  let minIndex = 0;
  let min = cacheList[0];
  cacheList.forEach((x, i) => {  // O(n) linear scan
    if (x.accessAt < min.accessAt) {
      minIndex = i;
      min = x;
    }
  });
  // Remove oldest
}
```

**Problem:**

- O(n) scan instead of heap/priority queue
- Only 50 bundles cached (restrictive for large installations)
- Full scan on every cache insertion

---

## 2. Extraction Phase Issues

### Issue 2.1: Throttled Extraction

**Location:** `core/state/lib/blocklet/downloader/resolve-download.js`

```javascript
fs.createReadStream(source)
  .pipe(new Throttle({ rate: 1024 * 1024 * 20 }))  // 20MB/s throttle
  .pipe(tar.x({ C: dest, strip }))
```

**Problem:**

- 20MB/s rate limit during extraction
- Could be 10-100x faster without throttle
- Applied uniformly regardless of disk I/O capacity

**Impact:**
| Bundle Size | Extraction Time (throttled) | Potential Time |
| ----------- | --------------------------- | -------------- |
| 100MB | 5s | 0.5s |
| 500MB | 25s | 2.5s |
| 1GB | 50s | 5s |

---

### Issue 2.2: No Disk Space Pre-check

**Location:** `core/state/lib/blocklet/downloader/resolve-download.js`

**Problem:**

- No validation of available disk space before extraction
- Could fail mid-extraction with ENOSPC error
- Leaves partial files requiring cleanup

---

### Issue 2.3: Sequential File Operations for Diff Updates

**Location:** `core/state/lib/blocklet/downloader/resolve-download.js`

```javascript
for (const file of deleteSet) {
  await fs.remove(path.join(downloadDir, file));  // SEQUENTIAL
}

const walkDiff = async (dir) => {
  const files = await asyncFs.readdir(dir);
  for (const file of files) {
    // ... sequential stat and move operations
    await fs.move(p, path.join(downloadDir, path.relative(diffDir, p)), { overwrite: true });
  }
};
```

**Problem:**

- Sequential deletion and file moves
- For 1000+ files, could take 10+ minutes
- No parallelization of file operations

---

### Issue 2.4: Lock Expiration During Long Extraction

**Location:** `core/state/lib/blocklet/downloader/resolve-download.js`

```javascript
const removeLock = new DBCache(() => ({
  prefix: 'resolve-download-lock',
  ttl: 1000 * 60 * 5,  // 5 minutes
}));
```

**Problem:**

- 5-minute TTL for extraction lock
- Large bundles on slow storage may exceed this
- No lock renewal during extraction
- Race condition if lock expires mid-extraction

---

## 3. Dependency Resolution Issues

### Issue 3.1: No Circular Dependency Detection

**Location:** `core/state/lib/blocklet/manager/disk.js`

```javascript
async _getChildrenForInstallation(component) {
  const { dynamicComponents } = await parseComponents(component);
  // No cycle detection!
  const children = filterDuplicateComponents(dynamicComponents);
  checkVersionCompatibility(children);
  return children;
}
```

**Problem:**

- `parseComponents` doesn't check for circular references
- Could infinitely recurse on circular dependencies
- No depth limit on component tree traversal

---

### Issue 3.2: O(n) Linear Cache Lookup

**Location:** `core/state/lib/blocklet/downloader/blocklet-downloader.js`

```javascript
const needDownload = (component, { cachedBundles = [] }) => {
  const cachedBundle = cachedBundles.find(x => x.bundleId === bundleId);  // O(n)
  // ...
};
```

**Problem:**

- Linear search through cached bundles for each component
- 100 components × 50 cached bundles = 5,000 comparisons
- No Map/Set-based O(1) lookup

---

### Issue 3.3: Synchronous Component Traversal

**Location:** `core/state/lib/blocklet/downloader/blocklet-downloader.js`

```javascript
forEachComponentV2Sync(blocklet, handle);  // SYNCHRONOUS
```

**Problem:**

- Blocks event loop during component tree traversal
- For deep component trees, could freeze server
- No async iteration option used

---

## 4. Installation Phase Issues

### Issue 4.1: Sequential Database Writes

**Location:** `core/state/lib/blocklet/manager/disk.js`

```javascript
const blocklet = await states.blocklet.addBlocklet(params);
await states.blockletExtras.setConfigs(blocklet.meta.did, [chainTypeEnv]);  // Write 1
await states.blockletExtras.setSettings(blocklet.meta.did, { ... });  // Write 2
```

**Problem:**

- Sequential `await` without parallelization
- No transaction wrapping (not atomic)
- If second write fails, first is not rolled back

---

### Issue 4.2: N+1 Query Pattern in Config Population

**Location:** `core/state/lib/blocklet/manager/disk.js`

```javascript
await forEachComponentV2(blocklet, async (component) => {
  const envsInApp = await states.blockletExtras.getConfigs([blocklet.meta.did]);  // Re-read!
  const envsInComponent = await states.blockletExtras.getConfigs([app.meta.did, component.meta.did]);
  await states.blockletExtras.setConfigs(app.meta.did, configs);  // Write
});
```

**Problem:**

- For each component, re-reads all configs
- Sequential iteration with `await` inside loop
- 10 components = 30+ sequential database operations

---

### Issue 4.3: Blocking Dependency Installation

**Location:** `core/state/lib/util/install-external-dependencies.js`

```javascript
const packageJson = fs.readJsonSync(packageJsonPath);  // SYNCHRONOUS
// ...
await fs.remove(path.join(appDir, 'node_modules'));  // BLOCKING DELETE
// ...
const child = spawn(bunPath, ['install'], {
  stdio: 'inherit',  // BLOCKS STDIO
  // No timeout configured!
});
```

**Problem:**

- Synchronous JSON read blocks event loop
- No timeout for `bun install` (could hang indefinitely)
- Sequential per-blocklet, not parallelized

---

### Issue 4.4: Low Migration Concurrency

**Location:** `core/state/lib/blocklet/manager/disk.js`

```javascript
await forEachComponentV2(blocklet, runMigration, {
  parallel,
  concurrencyLimit: parallel ? 4 : 1,  // Only 4 concurrent!
});
```

**Problem:**

- Maximum 4 concurrent migrations regardless of system capacity
- 20 components = 5 sequential rounds
- 120-second per-migration timeout may be insufficient

---

## 5. Post-Installation Issues

### Issue 5.1: Sequential Port Checks

**Location:** `core/state/lib/util/blocklet.js`

```javascript
await forEachComponentV2(blocklet, async (b) => {
  for (const port of Object.values(targetPorts)) {
    currentOccupied = await isPortTaken(port);  // Sequential per port!
    if (currentOccupied) break;
  }
});
```

**Problem:**

- Each port checked individually and sequentially
- 10 components × 5 ports = 50 sequential port checks
- TOCTOU race: port could be taken between check and bind

**Impact:**
| Components | Ports/Component | Port Checks | Time (est.) |
| ---------- | --------------- | ----------- | ----------- |
| 5 | 3 | 15 | 1.5s |
| 20 | 5 | 100 | 10s |
| 50 | 5 | 250 | 25s |

---

### Issue 5.2: Fixed Retry Logic for Health Checks

**Location:** `core/state/lib/blocklet/manager/ensure-blocklet-running.js`

```javascript
for (let attempt = 0; attempt < 10; attempt++) {
  await this.isBlockletPortHealthy(blocklet, {
    minConsecutiveTime: 3000,
    timeout: 6000,
  });
  await sleep(this.everyBlockletCheckInterval);  // Fixed 2 seconds
}
```

**Problem:**

- Fixed 10 retries with 2-second sleep (no exponential backoff)
- Maximum wait: 10 × (6s + 2s) = 80 seconds
- No adaptive timeout based on blocklet complexity

---

### Issue 5.3: Fixed Startup Concurrency

**Location:** `core/state/lib/blocklet/manager/disk.js`

```javascript
await pAll(tasks, { concurrency: 6 });  // Hardcoded
```

**Problem:**

- Fixed 6 concurrent starts regardless of system resources
- Could overload system with 6 large blocklets
- No backpressure based on CPU/memory load

---

## 6. Error Handling & Rollback Issues

### Issue 6.1: Blocking Rollback Serialization

**Location:** `core/state/lib/blocklet/manager/helper/rollback-cache.js`

```javascript
async backup({ did, action, oldBlocklet }) {
  const data = this.dek ? security.encrypt(JSON.stringify(oldBlocklet), did, this.dek) : oldBlocklet;
  await fs.outputJSON(file, { action, oldBlocklet: data });  // Large JSON.stringify
}
```

**Problem:**

- `JSON.stringify` on large blocklet objects blocks event loop
- No streaming serialization for large objects
- 10MB blocklet could block for 1+ second

---

### Issue 6.2: Non-Atomic Rollback

**Location:** `core/state/lib/blocklet/manager/disk.js`

```javascript
async _rollback(action, did, oldBlocklet) {
  if (extraState) {
    await states.blockletExtras.update({ did }, extraState);  // Update 1
  }
  await states.blocklet.updateBlocklet(did, blocklet);  // Update 2
  await states.blockletExtras.update({ did: blocklet.meta.did }, extraState);  // Update 3
}
```

**Problem:**

- Multiple sequential updates not wrapped in transaction
- If second update fails, first is not rolled back
- Blocklet left in inconsistent state on partial failure

---

### Issue 6.3: Missing Error Scenarios

**Problem areas:**

| Error Type | Location | Current Handling |
| ---------- | -------- | ---------------- |
| EACCES (permission) | disk.js:3491 | Docker chown only |
| ENOSPC (disk full) | resolve-download.js | None |
| ETIMEDOUT (network) | download-file.js | No retry/backoff |
| Partial download | bundle-downloader.js | No resume |

---

## 7. Race Conditions

| Scenario | Location | Risk |
| -------- | -------- | ---- |
| Port assignment race | blocklet.js:2682 | Two processes select same port |
| Cache expiration | bundle-downloader.js:19 | Lock expires during download |
| TOCTOU in bundle check | resolve-download.js:87-88 | File deleted by another process |
| Concurrent component install | disk.js | Overwrite each other's bundles |
| Queue race | disk.js:2745 | Duplicate jobs queued |

---

## 8. Performance Summary

**For Installing 100 Blocklets Concurrently:**

| Phase | Concurrency | Rounds | Time (est.) |
| ----- | ----------- | ------ | ----------- |
| Download | 4 | 25 | 5+ min |
| Extraction | 1 (throttled) | 100 | 10-20 min |
| Config setup | 1 (sequential) | 100 | 5+ min |
| Migration | 4 | 25 | 30+ min |
| Health check | 6 | 17 | 10+ min |
| **Total** | - | - | **60+ min** |

---

## 9. Issue Summary Matrix

| Category | Issue | Location | Complexity | Severity | Impact at Scale |
| -------- | ----- | -------- | ---------- | -------- | --------------- |
| **Download** | Fixed concurrency | blocklet-downloader.js | O(n) | High | 50+ min for 1000 |
| **Download** | Short lock TTL | bundle-downloader.js | - | High | Race conditions |
| **Download** | No resume support | download-file.js | - | Medium | Full re-download |
| **Download** | O(n) cache eviction | bundle-downloader.js | O(n) | Medium | CPU overhead |
| **Extract** | Throttled extraction | resolve-download.js | O(n) | High | 10-100x slower |
| **Extract** | No disk space check | resolve-download.js | - | Medium | ENOSPC mid-extraction |
| **Extract** | Sequential file ops | resolve-download.js | O(n) | Medium | 10+ min for 1000 files |
| **Extract** | Lock expiration | resolve-download.js | - | Medium | Race conditions |
| **Resolution** | No circular dep check | disk.js | - | Medium | Infinite recursion |
| **Resolution** | O(n) cache lookup | blocklet-downloader.js | O(n²) | Medium | 5000+ comparisons |
| **Resolution** | Sync traversal | blocklet-downloader.js | - | Medium | Event loop block |
| **Install** | Sequential DB writes | disk.js | O(n) | Medium | Not atomic |
| **Install** | N+1 config queries | disk.js | O(n) | High | 30+ queries/component |
| **Install** | Blocking dep install | install-external-deps.js | - | Medium | No timeout, hangs |
| **Install** | Low migration concurrency | disk.js | O(n) | Medium | 5 rounds for 20 components |
| **Post-Install** | Sequential port checks | blocklet.js | O(n) | Medium | 25s for 50 components |
| **Post-Install** | Fixed health check retry | ensure-blocklet-running.js | - | Low | 80s max wait |
| **Post-Install** | Fixed startup concurrency | disk.js | - | Low | Resource contention |
| **Rollback** | Non-atomic rollback | disk.js | - | High | Inconsistent state |
| **Rollback** | Blocking serialization | rollback-cache.js | - | Medium | Event loop block |

---

## 10. Improvement Proposals

### 10.1: Adaptive Download Concurrency

**Current:** Fixed concurrency of 4
**Proposed:** Dynamic concurrency based on system resources and bandwidth

```javascript
// Before
await pAll(downloadList.map(fn), 4);

// After
const os = require('os');
const cpuCount = os.cpus().length;
const memGB = os.totalmem() / 1024 / 1024 / 1024;
const concurrency = Math.min(
  Math.max(4, cpuCount),
  Math.floor(memGB / 2),
  16  // Max cap
);

await pAll(downloadList.map(fn), concurrency);
```

**Potential Gain:**

- 2-4x faster downloads on high-capacity systems
- Auto-throttle on low-resource systems
- Better bandwidth utilization

---

### 10.2: Remove Extraction Throttle

**Current:** 20MB/s throttle during extraction
**Proposed:** Remove throttle, use async I/O

```javascript
// Before
fs.createReadStream(source)
  .pipe(new Throttle({ rate: 1024 * 1024 * 20 }))
  .pipe(tar.x({ C: dest, strip }));

// After
fs.createReadStream(source)
  .pipe(tar.x({ C: dest, strip }));
```

**Potential Gain:**

- 10-100x faster extraction
- Better SSD utilization
- Reduced installation time

---

### 10.3: Disk Space Pre-check

**Current:** No pre-flight check
**Proposed:** Check available space before extraction

```javascript
// Before: Extract and hope for the best

// After
const checkDiskSpace = require('check-disk-space').default;

async function ensureDiskSpace(path, requiredBytes) {
  const { free } = await checkDiskSpace(path);
  const buffer = requiredBytes * 1.5;  // 50% safety margin

  if (free < buffer) {
    throw new Error(`Insufficient disk space: need ${buffer}, have ${free}`);
  }
}

await ensureDiskSpace(installDir, bundleSize);
await extractBundle(source, dest);
```

**Potential Gain:**

- Fail fast before partial extraction
- Clear error messages
- No orphaned partial files

---

### 10.4: Lock Renewal During Long Operations

**Current:** Fixed TTL, no renewal
**Proposed:** Periodic lock renewal with heartbeat

```javascript
// Before
const lock = new DBCache({ ttl: 1000 * 10 });
await lock.acquire(key);
// ... long operation
await lock.release(key);

// After
class RenewableLock {
  async acquire(key, ttl = 30000) {
    await this.cache.acquire(key, ttl);
    this.renewInterval = setInterval(async () => {
      await this.cache.extend(key, ttl);
    }, ttl / 2);
  }

  async release(key) {
    clearInterval(this.renewInterval);
    await this.cache.release(key);
  }
}
```

**Potential Gain:**

- No lock expiration during long downloads/extractions
- Eliminate race conditions
- Safe concurrent operations

---

### 10.5: Parallel File Operations

**Current:** Sequential file deletions and moves
**Proposed:** Parallel with concurrency control

```javascript
// Before
for (const file of deleteSet) {
  await fs.remove(path.join(dir, file));
}

// After
const pMap = require('p-map');

await pMap(
  deleteSet,
  file => fs.remove(path.join(dir, file)),
  { concurrency: 20 }
);
```

**Potential Gain:**

- 10-20x faster for large file counts
- Better I/O utilization
- Reduced installation time

---

### 10.6: Map-based Cache Lookup

**Current:** O(n) linear search through cache
**Proposed:** O(1) Map-based lookup

```javascript
// Before
const cachedBundle = cachedBundles.find(x => x.bundleId === bundleId);

// After
class BundleCache {
  constructor() {
    this.map = new Map();
  }

  get(bundleId) {
    return this.map.get(bundleId);  // O(1)
  }

  set(bundleId, bundle) {
    this.map.set(bundleId, bundle);
  }
}
```

**Potential Gain:**

- O(1) instead of O(n) lookup
- 50x faster for 50-item cache
- Reduced CPU usage

---

### 10.7: Batch Database Operations

**Current:** Sequential N+1 queries
**Proposed:** Batch queries with single round-trip

```javascript
// Before
for (const component of components) {
  const config = await getConfigs([component.did]);
  await setConfigs(component.did, merged);
}

// After
const allConfigs = await getConfigsBatch(components.map(c => c.did));
const updates = components.map(c => ({
  did: c.did,
  config: mergeConfigs(allConfigs[c.did], c.environments)
}));
await setConfigsBatch(updates);
```

**Potential Gain:**

- 1 query instead of N
- 10-100x faster for many components
- Reduced database load

---

### 10.8: Download Resume Support

**Current:** Full re-download on failure
**Proposed:** Resume from last byte

```javascript
// Before
await downloadFile(url, dest);

// After
async function resumableDownload(url, dest) {
  let startByte = 0;

  if (await fs.pathExists(dest)) {
    const stats = await fs.stat(dest);
    startByte = stats.size;
  }

  const response = await axios.get(url, {
    headers: startByte > 0 ? { Range: `bytes=${startByte}-` } : {},
    responseType: 'stream'
  });

  const writer = fs.createWriteStream(dest, {
    flags: startByte > 0 ? 'a' : 'w'
  });

  response.data.pipe(writer);
}
```

**Potential Gain:**

- Resume interrupted downloads
- Save bandwidth on failures
- Faster recovery from network issues

---

### 10.9: Atomic Rollback with Transactions

**Current:** Sequential updates, non-atomic
**Proposed:** Transaction-wrapped rollback

```javascript
// Before
await states.blockletExtras.update({ did }, extraState);
await states.blocklet.updateBlocklet(did, blocklet);

// After
const sequelize = getSequelizeInstance();

await sequelize.transaction(async (transaction) => {
  await states.blockletExtras.update({ did }, extraState, { transaction });
  await states.blocklet.updateBlocklet(did, blocklet, { transaction });
});
```

**Potential Gain:**

- Atomic rollback operations
- No inconsistent states
- Safe error recovery

---

### 10.10: Circular Dependency Detection

**Current:** No cycle detection
**Proposed:** Graph-based cycle detection

```javascript
// Before
async function parseComponents(component) {
  // No cycle check - could infinite loop
}

// After
function detectCycles(component, visited = new Set(), path = []) {
  if (path.includes(component.did)) {
    throw new Error(`Circular dependency: ${[...path, component.did].join(' -> ')}`);
  }

  if (visited.has(component.did)) return;
  visited.add(component.did);

  for (const child of component.children || []) {
    detectCycles(child, visited, [...path, component.did]);
  }
}
```

**Potential Gain:**

- Prevent infinite recursion
- Clear error messages for invalid dependencies
- Faster failure detection

---

### 10.11: Parallel Port Checks

**Current:** Sequential port checking
**Proposed:** Batch port checking with parallel requests

```javascript
// Before
for (const port of ports) {
  await isPortTaken(port);
}

// After
const pMap = require('p-map');

const results = await pMap(
  ports,
  port => isPortTaken(port),
  { concurrency: 10 }
);

const takenPorts = ports.filter((_, i) => results[i]);
```

**Potential Gain:**

- 10x faster for many ports
- Reduced installation time
- Better resource utilization

---

### 10.12: Exponential Backoff for Health Checks

**Current:** Fixed 2-second retry interval
**Proposed:** Exponential backoff with jitter

```javascript
// Before
for (let attempt = 0; attempt < 10; attempt++) {
  await check();
  await sleep(2000);
}

// After
async function healthCheckWithBackoff(check, options = {}) {
  const { maxAttempts = 10, baseDelay = 1000, maxDelay = 30000 } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await check();
    } catch (error) {
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );
      await sleep(delay);
    }
  }
  throw new Error('Health check failed after max attempts');
}
```

**Potential Gain:**

- Faster success on healthy blocklets
- Reduced load on slow-starting blocklets
- Better resource utilization

---

## 11. Implementation Priority

### Phase 1: Critical Fixes (Immediate)

| Priority | Issue | Proposal | Effort | Impact |
| -------- | ----- | -------- | ------ | ------ |
| P0 | Extraction throttle | Remove throttle (10.2) | Low | High |
| P0 | Short lock TTL | Lock renewal (10.4) | Medium | High |
| P0 | Non-atomic rollback | Transaction wrap (10.9) | Medium | High |

### Phase 2: High Priority (Week 1-2)

| Priority | Issue | Proposal | Effort | Impact |
| -------- | ----- | -------- | ------ | ------ |
| P1 | Fixed download concurrency | Adaptive concurrency (10.1) | Low | High |
| P1 | N+1 config queries | Batch DB operations (10.7) | Medium | High |
| P1 | O(n) cache lookup | Map-based cache (10.6) | Low | Medium |
| P1 | Sequential file ops | Parallel file ops (10.5) | Low | Medium |

### Phase 3: Medium Priority (Week 3-4)

| Priority | Issue | Proposal | Effort | Impact |
| -------- | ----- | -------- | ------ | ------ |
| P2 | No disk space check | Disk space pre-check (10.3) | Low | Medium |
| P2 | No download resume | Resume support (10.8) | Medium | Medium |
| P2 | Sequential port checks | Parallel port checks (10.11) | Low | Medium |
| P2 | Fixed health check retry | Exponential backoff (10.12) | Low | Low |

### Phase 4: Long-term (Month 2+)

| Priority | Issue | Proposal | Effort | Impact |
| -------- | ----- | -------- | ------ | ------ |
| P3 | No circular dep check | Cycle detection (10.10) | Medium | Medium |
| P3 | Blocking dep install | Parallel with timeout | High | Medium |
| P3 | Low migration concurrency | Adaptive concurrency | Medium | Low |

---

## 12. Expected Outcomes

After implementing all proposals:

| Metric | Current (100 blocklets) | After Optimization |
| ------ | ----------------------- | ------------------ |
| Download phase | 5+ minutes | 1-2 minutes |
| Extraction phase | 10-20 minutes | 1-2 minutes |
| Config setup | 5+ minutes | 30 seconds |
| Migration phase | 30+ minutes | 5-10 minutes |
| Health check | 10+ minutes | 3-5 minutes |
| **Total** | **60+ minutes** | **10-20 minutes** |

**Additional Benefits:**

- Fail-fast on disk space issues (no partial extractions)
- Resume interrupted downloads (bandwidth savings)
- Atomic rollback (no inconsistent states)
- Eliminated race conditions (lock renewal)
- Clear error messages for circular dependencies

---

## Conclusion

The current installation workflow has several bottlenecks that become severe when installing many blocklets:

1. **Fixed concurrency limits** prevent utilizing available system resources
2. **Artificial throttling** (extraction) slows down operations 10-100x
3. **Short lock TTLs** cause race conditions during long operations
4. **Sequential operations** (file I/O, DB queries) don't scale
5. **Missing safety checks** (disk space, circular deps) cause hard-to-debug failures

Implementing the Phase 1 critical fixes alone should reduce installation time by 50%+. The full set of improvements can bring 100-blocklet installation from 60+ minutes down to 10-20 minutes.

---

## Related Documentation

- [Scalability Analysis Report](./scalability.md) - Overall system scalability analysis
- [Database Architecture](./database.md) - Database layer documentation
- [Server Startup Flow](./server-startup.md) - Server initialization sequence
