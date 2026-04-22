# Router Update/Reload Timing

This document describes when the nginx router is updated or reloaded in Blocklet Server.

## Overview

The router handles nginx configuration updates for blocklet routing. Updates can be triggered by various events, each with different performance characteristics.

## Trigger Categories

| Category | Events | Strategy | Needs `_getUpdateParams()` |
|----------|--------|----------|---------------------------|
| **Blocklet Lifecycle** | install, upgrade, remove | `blocklet` | Yes - expensive O(N) |
| **Certificates** | add, update, remove, issued | `incremental` | Yes via `incrementalReload()` |
| **Node Config** | enableWelcomePage, gateway policy | `global` | Yes - full recalc |
| **Routing Mutations** | add/update/delete site or rule | `blocklet` | Yes - cascading |
| **Security** | WAF, blacklist, auto-blocking | `global` | Yes - needs all sites |
| **Domain Changes** | domain alias add/remove | `blocklet` | Yes |

## Detailed Breakdown

### 1. Blocklet Lifecycle Events

**Location:** `lib/event/index.js:370-430`

| Event | Trigger | What Happens |
|-------|---------|--------------|
| `BlockletEvents.installed` | Blocklet installation | Full routing setup via `ensureBlockletRouting()` |
| `BlockletEvents.upgraded` | Blocklet upgrade | Refresh with custom routing via `ensureBlockletRoutingForUpgrade()` |
| `BlockletEvents.removed` | Blocklet removal | Cleanup routing via `removeBlockletRouting()` |
| `BlockletEvents.appDidChanged` | App DID change | Re-register DID routes |
| `BlockletEvents.spaceConnected` | Space connection | Setup space routing |
| `BlockletEvents.blueOrGreenStarted` | Blue/green deployment | Conditional routing if multiple interfaces |

### 2. Certificate Events

**Location:** `lib/router/helper.js:1909-1917`

```javascript
[
  BlockletEvents.certIssued,
  EVENTS.CERT_ADDED,
  EVENTS.CERT_REMOVED,
  EVENTS.CERT_ISSUED,
  EVENTS.CERT_UPDATED,
].forEach((event) => {
  certManager.on(event, () => providers[providerName].incrementalReload());
});
```

All certificate changes trigger `incrementalReload()` which uses hash-based change detection.

### 3. Node/Gateway Configuration

**Location:** `lib/event/index.js:719-737`

| Event | Trigger | Action |
|-------|---------|--------|
| `NODE_UPDATED` | Server settings change (e.g., enableWelcomePage) | `handleRouting()` |
| `RELOAD_GATEWAY` | Explicit gateway reload request | `handleRouting()` |

### 4. Routing Manager Operations

**Location:** `lib/router/helper.js:2080-2104`

These operations automatically trigger routing updates via `_proxyToRouterManager()`:

- `addRoutingSite()`, `updateRoutingSite()`, `deleteRoutingSite()`
- `addRoutingRule()`, `updateRoutingRule()`, `deleteRoutingRule()`
- `addRoutingRuleToDefaultSite()`
- `addDomainAlias()`, `deleteDomainAlias()`

Pattern:
```javascript
const _proxyToRouterManager = (fnName) => async (...args) => {
  const res = await routerManager[fnName](...args);
  await handleRouting({ message: fnName, appDid: did, strategy: 'blocklet' });
  return res;
};
```

### 5. Security & Blocking Operations

**Location:** `lib/router/helper.js:1726-1787`

| Operation | Trigger | Strategy |
|-----------|---------|----------|
| Auto IP blocking | Security scanner detection | `queueChange('global')` |
| Blacklist expiration | Scheduled timeout | `queueChange('global')` |
| Blacklist refresh | Cron (every 2 min) | Via `nodeState.updateGateway()` |

### 6. Security Config Changes

**Location:** `lib/event/index.js:773-783`

```javascript
listen(securityAPI, BlockletEvents.securityConfigUpdated, (eventName, data) => {
  if (daemon) {
    handleRouting({
      message: 'Security config changed',
      appDid: data?.did,
      strategy: 'blocklet'
    });
  }
});
```

### 7. Dashboard & System Routing

**Location:** `lib/router/helper.js:1189-1280`

| Operation | When |
|-----------|------|
| Ensure dashboard sites | Server initialization |
| Well-known site setup | First-time setup |
| IP/Default site setup | Startup |

## Performance Classification

| Operation Type | Method | Cost | Use Case |
|----------------|--------|------|----------|
| **Heavy** (O(N)) | `_getUpdateParams()` | 5-10s with 10K+ blocklets | Full reload, global changes |
| **Light** (O(1)) | `getBlockletRoutingParams(did)` | 50-100ms per blocklet | Single blocklet update |
| **Batch** | `_processBatch()` | Debounced 1s wait, 5s max | Rapid successive changes |

## Batching Mechanism

**Location:** `lib/router/index.js:487-632`

The router uses a batching system to optimize rapid changes:

```javascript
queueChange(changeType, did = undefined) {
  // changeType: 'global', 'blocklet', or 'blocklet-remove'
  if (changeType === 'global') {
    this.pendingChanges.global = true;
  } else if (changeType === 'blocklet' && did) {
    this.pendingChanges.blocklets.add(did);
  } else if (changeType === 'blocklet-remove' && did) {
    this.pendingChanges.blockletsRemoved.add(did);
  }
  this.debouncedProcessBatch(); // 1000ms wait, 5000ms maxWait
}
```

### Batch Processing Logic

1. **Global changes**: Uses full `_getUpdateParams()` - expensive but necessary
2. **Blocklet-only changes**: Uses O(1) `getBlockletRoutingParams()` per blocklet
3. **Blocklet removals**: Calls `_removeBlockletConfig()` directly

## Optimization Recommendations

### Current Issues

1. Most event handlers call `handleRouting()` which triggers `_getUpdateParams()` even for single-blocklet changes
2. The O(N) database query becomes a bottleneck with many blocklets

### Recommended Approach

For events that only affect a single blocklet, use `queueChange('blocklet', did)` directly:

```javascript
// Instead of:
await handleRouting({ message: 'blocklet updated', appDid: did, strategy: 'blocklet' });

// Use:
providers[providerName].queueChange('blocklet', did);
```

This skips the expensive `_getUpdateParams()` call and uses the O(1) path.

### Events Safe for O(1) Updates

- Single blocklet install/upgrade (after initial setup)
- Single blocklet removal
- Domain alias changes for specific blocklet
- Security config changes for specific blocklet

### Events Requiring Full Update

- Global policy changes (WAF, rate limit, block policy)
- Certificate changes (may affect multiple blocklets)
- Node configuration changes
- Dashboard/system site changes
