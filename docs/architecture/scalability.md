# Scalability Analysis Report: Blocklet Server at 1000+ Blocklets

## Executive Summary

This report identifies critical scalability issues that emerge when running thousands of blocklets on a single Blocklet Server instance. While the system performs well with few blocklets, architectural patterns and implementation choices create severe bottlenecks at scale.

**Key Findings:**

- **Database Layer**: 20,000+ Sequelize instances with unbounded connection pools
- **Memory**: Potential 30-50GB memory consumption from process overhead
- **Routing**: O(n²) configuration regeneration on every change
- **Frontend**: UI freezing from unvirtualized lists and O(n²) merge operations
- **Real-time**: Event flooding causing cascade refreshes

---

## Table of Contents

1. [Backend Issues](#1-backend-issues)
   - [Database Layer](#11-database-layer)
   - [Process Management](#12-process-management)
   - [Routing Layer](#13-routing-layer)
   - [Caching Layer](#14-caching-layer)
   - [API Layer](#15-api-layer)
2. [Frontend Issues](#2-frontend-issues)
   - [Dashboard Rendering](#21-dashboard-rendering)
   - [State Management](#22-state-management)
   - [Real-time Updates](#23-real-time-updates)
3. [Issue Summary Matrix](#3-issue-summary-matrix)
4. [Improvement Proposals](#4-improvement-proposals)
5. [Implementation Priority](#5-implementation-priority)

> **Note:** Installation workflow analysis has been moved to a separate document: [Blocklet Installation Workflow](./blocklet-installation.md)

---

## 1. Backend Issues

### 1.1 Database Layer

#### Issue 1.1.1: Per-Blocklet Sequelize Instance Explosion

**Location:** `core/state/lib/team/manager.js`

**Current Behavior:**

```javascript
async createState(did, key) {
  const models = await this.getModels(did);  // Creates new Sequelize instance
  const state = new States[key](models[key], {}, models);
  return state;
}
```

**Problem:**

- Each blocklet creates separate Sequelize instances for 20+ state types
- 1000 blocklets × 20 states = **20,000+ Sequelize instances**
- Each instance has its own connection pool (default 2-10 connections)
- **Result:** 40,000-200,000 database connections attempted

**Impact:**
| Blocklets | Sequelize Instances | Potential Connections | Memory (est.) |
| --------- | ------------------- | --------------------- | ------------- |
| 10 | 200 | 2,000 | 200MB |
| 100 | 2,000 | 20,000 | 2GB |
| 1,000 | 20,000 | 200,000 | 20GB |

**Cause:** Architecture assumes isolated per-blocklet databases without shared connection pooling.

---

#### Issue 1.1.2: SQLite File Descriptor Exhaustion

**Location:** `core/state/lib/team/manager.js`

**Problem:**

- Each blocklet maintains separate SQLite database file
- 1000 blocklets = 1000+ open file handles
- Linux default file descriptor limit: 1024-4096
- **Result:** System crashes with "Too many open files"

**Impact:**

```
Error: EMFILE: too many open files, open '/data/blocklet-999/blocklet.db'
```

---

#### Issue 1.1.3: Unbounded TeamManager Cache

**Location:** `core/state/lib/team/manager.js`

**Current Behavior:**

```javascript
this.cache = {}; // Plain object, no limits

// States added but never removed
this.cache[pid][key] = state;
```

**Problem:**

- No size limits or eviction policy
- States never garbage collected
- Memory grows indefinitely

**Impact:**
| Blocklets | Cached States | Memory Retained |
| --------- | ------------- | --------------- |
| 100 | 2,000 | 500MB |
| 1,000 | 20,000 | 5GB+ |

---

### 1.2 Process Management

#### Issue 1.2.1: PM2 Process Overhead

**Location:** `core/state/lib/blocklet/manager/disk.js`

**Problem:**

- Each blocklet runs as separate PM2 process
- PM2 becomes unstable beyond 100-200 processes
- Memory overhead: 30-50MB per process

**Impact:**
| Blocklets | Processes | Memory Overhead |
| --------- | --------- | --------------- |
| 100 | 100+ | 3-5GB |
| 1,000 | 1,000+ | 30-50GB |

---

#### Issue 1.2.2: Inefficient Port Allocation

**Location:** `core/state/lib/states/blocklet.js`

**Current Behavior:**

```javascript
while (!found && attempts < maxAttempts) {
  const randomPort = Math.floor(Math.random() * (portRange[1] - portRange[0])) + portRange[0];

  if (!usedPorts.includes(randomPort)) {
    // O(n) lookup!
    const isTaken = await isPortTaken(randomPort); // Network call
    // ...
  }
  attempts++;
}
```

**Problem:**

- Random port selection with O(n) collision check
- Global lock serializes all port allocation
- 100 max attempts per port, each with network call

**Complexity:** O(n²) for n blocklets

**Impact:**
| Blocklets | Port Checks (worst case) | Time (est.) |
| --------- | ------------------------ | ----------- |
| 100 | 10,000 | 10s |
| 1,000 | 100,000 | 100s+ |

---

### 1.3 Routing Layer

#### Issue 1.3.1: Full Nginx Config Regeneration

**Location:** `core/router-provider/lib/nginx/index.js`

**Current Behavior:**

```javascript
for (const site of sites) {
  // Write certificates to disk for EVERY site
  certificates.forEach((item) => {
    fs.writeFileSync(crtPath, item.certificate);  // Sync I/O!
    fs.writeFileSync(keyPath, item.privateKey);
  });

  this._addHttpsServer({ ... });
}
```

**Problem:**

- Entire Nginx config regenerated on any blocklet change
- Synchronous certificate file writes
- No incremental updates

**Impact:**
| Blocklets | Config Size | Regeneration Time |
| --------- | ----------- | ----------------- |
| 100 | 500KB | 1-2s |
| 1,000 | 5MB+ | 10-30s |

---

#### Issue 1.3.2: Routing Snapshot Size

**Location:** `core/state/lib/index.js`

**Problem:**

- All routing data serialized to single snapshot file
- Written on every routing change
- Large JSON serialization blocks event loop

**Impact:**
| Blocklets | Snapshot Size | Serialization Time |
| --------- | ------------- | ------------------ |
| 100 | 500KB | 50ms |
| 1,000 | 5MB+ | 500ms+ |

---

### 1.4 Caching Layer

#### Issue 1.4.1: Cache Invalidation Stampede

**Location:** `core/state/lib/blocklet/manager/disk.js`

**Current Behavior:**

```javascript
// Multiple full list queries on startup
this.list({ useCache: false });
const blocklets = await states.blocklet.getBlocklets();
const blocklets = await states.blocklet.getBlocklets();
```

**Problem:**

- Single blocklet change invalidates entire cache
- All threads reload simultaneously
- No selective invalidation

**Impact:** Cache stampede causes 10-100x load spike on database.

---

### 1.5 API Layer

#### Issue 1.5.1: N+1 Query Patterns

**Location:** `core/state/lib/blocklet/manager/disk.js`

**Current Behavior:**

```javascript
const blocklets = await this.getBlocklets({}, { id: 1, meta: 1, ports: 1 });
await Promise.all(
  blocklets.map(
    (blocklet) => this._updateBlockletCertificate(blocklet.meta.did) // Individual query per blocklet!
  )
);
```

**Problem:**

- 1 query to get all blocklets
- N queries to update certificates
- **Total:** 1 + N queries

**Impact:**
| Blocklets | Database Queries |
| --------- | ---------------- |
| 100 | 101 |
| 1,000 | 1,001 |

---

#### Issue 1.5.2: Unbounded Promise.all

**Location:** `core/state/lib/states/user.js`, `core/state/lib/blocklet/manager/disk.js`

**Problem:**

- `Promise.all()` without concurrency limits
- 1000 concurrent database queries
- Connection pool exhaustion

**Solution:** Use `p-limit` or `p-map` with concurrency control.

---

#### Issue 1.5.3: Missing Pagination

**Location:** `core/state/lib/blocklet/manager/disk.js`

**Current Behavior:**

```javascript
const blocklets = await states.blocklet.getBlocklets(); // ALL blocklets!
```

**Problem:**

- No default pagination
- 1000+ objects loaded into memory
- \~10KB per blocklet = 10MB+ per query

---

## 2. Frontend Issues

### 2.1 Dashboard Rendering

#### Issue 2.1.1: Unvirtualized Blocklet List

**Location:** `core/webapp/src/pages/blocklets/index.jsx`

**Problem:**

- All blocklets rendered to DOM simultaneously
- No virtual scrolling implementation
- React reconciliation for 1000+ DOM nodes

**Impact:**
| Blocklets | DOM Nodes | Render Time |
| --------- | --------- | ---------------- |
| 100 | ~1,000 | 100ms |
| 1,000 | ~10,000 | 2-5s (frozen UI) |

---

#### Issue 2.1.2: Expensive Column Recomputation

**Location:** `core/webapp/src/pages/blocklets/index.jsx`

**Current Behavior:**

```javascript
const setColumnsFun = useCallback(() => {
  const statusFilterValues = Array.from(new Set(rows.map(row => row.status)));  // O(n)
  const _columns = [ ... ];  // Redefines columns every time
  setColumns(_columns);
}, [deletingBlocklets, locale, onActionComplete, onActionStart, rows, t, tab, uiTheme]);
```

**Problem:**

- 8 dependencies trigger recomputation
- O(n) status extraction on every render
- Column definitions recreated unnecessarily

---

#### Issue 2.1.3: O(n×m) Search Filtering

**Location:** `core/webapp/src/pages/blocklets/index.jsx`

**Current Behavior:**

```javascript
displayRows = displayRows.filter((d) => {
  const componentDids = d.children?.map((c) => c.meta?.did?.toLocaleLowerCase());
  return (
    d.appDid?.includes(lowerSearchText) ||
    componentDids.some((v) => v?.includes(lowerSearchText)) || // O(m) per blocklet
    domainAliases.some((domain) => domain.value?.includes(lowerSearchText))
  );
});
```

**Problem:**

- O(n) blocklets × O(m) children = O(n×m) complexity
- 300ms debounce insufficient for 1000+ items

---

### 2.2 State Management

#### Issue 2.2.1: O(n²) Merge Algorithm

**Location:** `core/webapp/src/contexts/blocklets.jsx`

**Current Behavior:**

```javascript
const mergeBlocklets = (oldList, newList, updates) => {
  return oldList.map((old) => {
    const cur = newList.find((x) => x.meta.did === old.meta.did); // O(n) find!
    // ...
  });
};
```

**Problem:**

- `.find()` inside `.map()` = O(n²)
- Called on every blocklet fetch
- Creates new object for every item

**Impact:**
| Blocklets | Comparisons | Time |
| --------- | ----------- | ---- |
| 100 | 10,000 | 10ms |
| 1,000 | 1,000,000 | 1-2s |

---

#### Issue 2.2.2: Synchronous Post-fetch Processing

**Location:** `core/webapp/src/contexts/blocklets.jsx`

**Current Behavior:**

```javascript
for (const blocklet of data) {
  await fixBlocklet(blocklet, { getIP }); // Blocking loop!
}
const internals = data.filter((x) => !isExternalBlocklet(x)); // O(n)
const externals = data.filter(isExternalBlocklet); // O(n) again
```

**Problem:**

- Sequential await blocks main thread
- Two full O(n) filter passes
- Browser freezes during processing

---

### 2.3 Real-time Updates

#### Issue 2.3.1: WebSocket Event Flooding

**Location:** `core/webapp/src/contexts/blocklets.jsx`

**Current Behavior:**

```javascript
useSubscription(BlockletEvents.statusChange, updateBlockletStatus);
useSubscription(BlockletEvents.removed, (blocklet) => {
  node.refresh(); // Refetches ALL blocklets!
});
```

**Problem:**

- Each status change triggers state update
- No debouncing or batching
- Single removal triggers full refresh

**Impact:**
| Concurrent Updates | State Updates | Re-renders |
| ------------------ | ------------- | ---------------- |
| 10 | 10 | 10 |
| 100 | 100 | 100 (UI freezes) |
| 1,000 | 1,000 | Crash |

---

#### Issue 2.3.2: Runtime Info O(n²) Lookup

**Location:** `core/webapp/src/components/analytics/runtime.jsx`

**Current Behavior:**

```javascript
setMonitList((list) => {
  return list.map((proc) => {
    const item = res.find((y) => y.componentId === proc.id); // O(n) find!
    // ...
  });
});
```

**Problem:**

- O(n²) lookup on every runtime update
- Updates arrive every few seconds
- Continuous performance degradation

---

## 3. Issue Summary Matrix

| Category     | Issue                        | Location            | Complexity | Severity | Impact at 1000 Blocklets |
| ------------ | ---------------------------- | ------------------- | ---------- | -------- | ------------------------ |
| **Database** | Sequelize instance explosion | team/manager.js     | O(n)       | Critical | 20,000+ instances, OOM   |
| **Database** | File descriptor exhaustion   | team/manager.js     | O(n)       | Critical | System crash             |
| **Database** | Unbounded cache              | team/manager.js     | O(n)       | High     | 5GB+ memory leak         |
| **Process**  | PM2 overhead                 | disk.js             | O(n)       | Critical | 30-50GB memory           |
| **Process**  | Port allocation              | blocklet.js         | O(n²)      | High     | 100s+ startup            |
| **Routing**  | Full config regen            | nginx/index.js      | O(n²)      | High     | 10-30s per change        |
| **Routing**  | Snapshot size                | index.js            | O(n)       | Medium   | 500ms+ serialization     |
| **Cache**    | Invalidation stampede        | disk.js             | O(n)       | High     | 10-100x load spike       |
| **API**      | N+1 queries                  | disk.js             | O(n)       | High     | 1001 queries             |
| **API**      | Unbounded Promise.all        | user.js             | O(n)       | High     | Connection exhaustion    |
| **API**      | Missing pagination           | disk.js             | O(n)       | Medium   | 10MB+ per query          |
| **Frontend** | Unvirtualized list           | index.jsx           | O(n)       | Critical | 2-5s frozen UI           |
| **Frontend** | Column recomputation         | index.jsx           | O(n)       | Medium   | Constant re-renders      |
| **Frontend** | O(n²) merge                  | blocklets.jsx       | O(n²)      | High     | 1-2s per fetch           |
| **Frontend** | Event flooding               | blocklets.jsx       | O(n)       | High     | UI crash                 |
| **Frontend** | Runtime O(n²)                | runtime.jsx         | O(n²)      | Medium   | Animation lag            |

> **Note:** Installation workflow issues are documented separately in [Blocklet Installation Workflow](./blocklet-installation.md)

---

## 4. Improvement Proposals

### 4.1 Database Layer Improvements

#### Proposal 4.1.1: Shared Connection Pool

**Current:** Per-blocklet Sequelize instances
**Proposed:** Single shared connection pool with tenant isolation

```javascript
// Before
async getModels(did) {
  return new Sequelize(blockletDbPath);  // New instance per blocklet
}

// After
class SharedConnectionPool {
  constructor() {
    this.pool = new Sequelize(serverDbPath, {
      pool: { max: 50, min: 5, idle: 10000 }
    });
  }

  getConnection(blockletDid) {
    // Use schema or table prefix for isolation
    return this.pool.withSchema(blockletDid);
  }
}
```

**Potential Gain:**

- Reduce from 20,000+ to 50 connections
- Memory savings: 15-20GB
- Eliminate file descriptor exhaustion

---

#### Proposal 4.1.2: LRU State Cache

**Current:** Unbounded plain object cache
**Proposed:** Bounded LRU cache with TTL

```javascript
// Before
this.cache = {};

// After
const LRU = require('lru-cache');
this.cache = new LRU({
  max: 500, // Max 500 blocklet states
  ttl: 1000 * 60 * 30, // 30 minute TTL
  dispose: (value, key) => {
    value.close(); // Cleanup connections
  },
});
```

**Potential Gain:**

- Bounded memory usage
- Automatic cleanup of inactive blocklets
- Memory savings: 3-5GB

---

### 4.2 Process Management Improvements

#### Proposal 4.2.1: Hash-based Port Allocation

**Current:** Random port with O(n) collision check
**Proposed:** Deterministic hash-based allocation

```javascript
// Before
while (!found && attempts < maxAttempts) {
  const randomPort = Math.random() * range;
  if (!usedPorts.includes(randomPort)) { ... }  // O(n)
}

// After
function allocatePort(blockletDid, portRange) {
  const hash = crypto.createHash('md5').update(blockletDid).digest('hex');
  const basePort = portRange[0] + (parseInt(hash.slice(0, 8), 16) % (portRange[1] - portRange[0]));

  // Use Set for O(1) lookup
  const usedPortsSet = new Set(usedPorts);

  for (let offset = 0; offset < 1000; offset++) {
    const port = basePort + offset;
    if (!usedPortsSet.has(port)) {
      return port;
    }
  }
}
```

**Potential Gain:**

- O(1) collision check instead of O(n)
- Deterministic allocation (same blocklet gets same port)
- 100x faster port allocation

---

### 4.3 Routing Layer Improvements

#### Proposal 4.3.1: Incremental Nginx Updates

**Current:** Full config regeneration
**Proposed:** Incremental updates with config diffing

```javascript
// Before
for (const site of sites) {
  this._addHttpsServer(site); // Regenerate everything
}

// After
class IncrementalNginxConfig {
  async updateSite(site) {
    const siteConfigPath = path.join(this.sitesDir, `${site.domain}.conf`);
    const newConfig = this.generateSiteConfig(site);

    if (await this.hasChanged(siteConfigPath, newConfig)) {
      await fs.writeFile(siteConfigPath, newConfig);
      await this.reloadNginx(); // Graceful reload
    }
  }
}
```

**Potential Gain:**

- Update only changed sites
- 10-100x faster routing updates
- Reduced disk I/O

---

#### Proposal 4.3.2: Async Certificate Writes

**Current:** Synchronous file writes
**Proposed:** Async with batching

```javascript
// Before
certificates.forEach((item) => {
  fs.writeFileSync(crtPath, item.certificate);
});

// After
const pLimit = require('p-limit');
const limit = pLimit(10);

await Promise.all(certificates.map((item) => limit(() => fs.promises.writeFile(crtPath, item.certificate))));
```

**Potential Gain:**

- Non-blocking I/O
- Controlled concurrency
- 5-10x faster certificate updates

---

### 4.4 API Layer Improvements

#### Proposal 4.4.1: Batch Operations with Concurrency Limits

**Current:** Unbounded Promise.all
**Proposed:** Controlled concurrency with p-map

```javascript
// Before
await Promise.all(blocklets.map((b) => updateCertificate(b)));

// After
const pMap = require('p-map');

await pMap(blocklets, (blocklet) => updateCertificate(blocklet), { concurrency: 10 });
```

**Potential Gain:**

- Prevent connection pool exhaustion
- Predictable resource usage
- Better error handling

---

#### Proposal 4.4.2: Default Pagination

**Current:** No pagination defaults
**Proposed:** Cursor-based pagination with defaults

```javascript
// Before
async getBlocklets(query = {}) {
  return this.find(query);  // Returns ALL
}

// After
async getBlocklets(query = {}, options = {}) {
  const { limit = 100, cursor } = options;

  if (cursor) {
    query._id = { $gt: cursor };
  }

  const results = await this.find(query).limit(limit + 1);
  const hasMore = results.length > limit;

  return {
    data: results.slice(0, limit),
    nextCursor: hasMore ? results[limit - 1]._id : null
  };
}
```

**Potential Gain:**

- Bounded memory usage per query
- Consistent response times
- Better UX with progressive loading

---

### 4.5 Frontend Improvements

#### Proposal 4.5.1: Virtual Scrolling

**Current:** Render all blocklets to DOM
**Proposed:** React-window virtualization

```jsx
// Before
<Datatable data={rows} />;

// After
import { FixedSizeList } from 'react-window';

<FixedSizeList height={600} itemCount={rows.length} itemSize={60}>
  {({ index, style }) => <BlockletRow data={rows[index]} style={style} />}
</FixedSizeList>;
```

**Potential Gain:**

- Only render visible items (~20 vs 1000)
- Constant render time regardless of list size
- Smooth scrolling at any scale

---

#### Proposal 4.5.2: Map-based O(1) Merge

**Current:** O(n²) find-based merge
**Proposed:** Map-based O(n) merge

```javascript
// Before
return oldList.map((old) => {
  const cur = newList.find((x) => x.meta.did === old.meta.did); // O(n)
});

// After
const mergeBlocklets = (oldList, newList, updates) => {
  const newMap = new Map(newList.map((x) => [x.meta.did, x])); // O(n)

  return oldList.map((old) => {
    const cur = newMap.get(old.meta.did); // O(1)
    if (!cur) return old;
    if (!updates) return cur;

    return { ...old, ...pick(cur, updates) };
  });
};
```

**Potential Gain:**

- O(n) instead of O(n²)
- 1000x faster for 1000 blocklets
- Smoother UI updates

---

#### Proposal 4.5.3: Debounced Event Batching

**Current:** Immediate state update per event
**Proposed:** Batched updates with debouncing

```javascript
// Before
useSubscription(BlockletEvents.statusChange, updateBlockletStatus);

// After
const pendingUpdates = useRef(new Map());

useSubscription(BlockletEvents.statusChange, (blocklet) => {
  pendingUpdates.current.set(blocklet.meta.did, blocklet);
  debouncedFlush();
});

const debouncedFlush = useMemo(
  () =>
    debounce(() => {
      const updates = Array.from(pendingUpdates.current.values());
      pendingUpdates.current.clear();
      batchUpdateBlocklets(updates);
    }, 100),
  []
);
```

**Potential Gain:**

- Coalesce rapid updates
- Single re-render for batch
- Prevent UI freezing during mass updates

---

> **Note:** Installation workflow improvements are documented separately in [Blocklet Installation Workflow](./blocklet-installation.md)

---

## 5. Implementation Priority

### Phase 1: Critical Fixes (Week 1-2)

| Priority | Issue               | Proposal               | Effort | Impact   |
| -------- | ------------------- | ---------------------- | ------ | -------- |
| P0       | Sequelize explosion | Shared connection pool | High   | Critical |
| P0       | Unvirtualized list  | React-window           | Medium | Critical |
| P0       | O(n²) merge         | Map-based merge        | Low    | High     |
| P0       | Event flooding      | Debounced batching     | Low    | High     |

### Phase 2: High Priority (Week 3-4)

| Priority | Issue             | Proposal              | Effort | Impact |
| -------- | ----------------- | --------------------- | ------ | ------ |
| P1       | Port allocation   | Hash-based allocation | Medium | High   |
| P1       | Full config regen | Incremental updates   | High   | High   |
| P1       | Unbounded cache   | LRU cache             | Low    | Medium |
| P1       | N+1 queries       | Batch operations      | Medium | High   |

### Phase 3: Medium Priority (Week 5-6)

| Priority | Issue              | Proposal               | Effort | Impact |
| -------- | ------------------ | ---------------------- | ------ | ------ |
| P2       | Missing pagination | Default pagination     | Medium | Medium |
| P2       | Cache stampede     | Selective invalidation | Medium | Medium |
| P2       | Sync cert writes   | Async with batching    | Low    | Medium |
| P2       | Runtime O(n²)      | Map-based lookup       | Low    | Low    |

### Phase 4: Long-term (Month 2+)

| Priority | Issue               | Proposal                  | Effort    | Impact   |
| -------- | ------------------- | ------------------------- | --------- | -------- |
| P3       | PM2 overhead        | Container-based isolation | Very High | Critical |
| P3       | SQLite per-blocklet | PostgreSQL schemas        | Very High | Critical |
| P3       | Routing snapshot    | Distributed config        | High      | Medium   |

> **Note:** Installation workflow implementation priorities are documented in [Blocklet Installation Workflow](./blocklet-installation.md)

---

## Expected Outcomes

After implementing all proposals:

| Metric               | Current (1000 blocklets) | After Optimization |
| -------------------- | ------------------------ | ------------------ |
| Memory usage         | 30-50GB                  | 5-10GB             |
| Startup time         | 5-10 minutes             | 30-60 seconds      |
| Routing update       | 10-30 seconds            | <1 second          |
| UI responsiveness    | 2-5s freeze              | <100ms             |
| Database connections | 20,000+                  | 50-100             |
| Port allocation      | 100+ seconds             | <1 second          |

> **Note:** Installation workflow expected outcomes are documented in [Blocklet Installation Workflow](./blocklet-installation.md)

---

## Conclusion

The current architecture was designed for small-scale deployments and exhibits critical scalability issues at 1000+ blocklets. The proposed improvements focus on:

1. **Resource pooling** - Share connections instead of per-blocklet isolation
2. **Algorithmic optimization** - Replace O(n²) with O(n) or O(1) operations
3. **Bounded resources** - Implement limits, pagination, and eviction
4. **Async operations** - Remove blocking operations from critical paths
5. **Smart batching** - Coalesce rapid operations to reduce overhead

Implementing Phase 1 fixes alone should enable stable operation at 1000+ blocklets, with subsequent phases improving performance and resource efficiency further.

---

## Related Documentation

- [Blocklet Installation Workflow](./blocklet-installation.md) - Installation workflow analysis and improvements
- [Database Architecture](./database.md) - Database layer documentation
- [Server Startup Flow](./server-startup.md) - Server initialization sequence
