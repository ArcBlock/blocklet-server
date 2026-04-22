# Blocklet DID Document Lifecycle

This document describes how DID Documents are created, updated, and deleted across the blocklet lifecycle in Blocklet Server.

## Overview

A **W3C-compliant DID Document** is a JSON document that describes a blocklet's identity, DNS records, metadata, and cryptographic proof. It enables decentralized identity resolution and domain routing for blocklets.

## Purpose: DID DNS Resolution

The primary purpose of updating a blocklet's DID Document is to register its **DID Domain** with the **DID Registry** so that **DID DNS** can resolve it.

### How It Works

1. **DID Domain Format**: Each blocklet has a DID domain derived from its `appDid`:
   ```
   bbqaqjmrlusx5vtzhhlr75ps74eljw4w35zpqetkegu.did.abtnet.io
   └───────────────────────────────────────────────┘
                  base32(appDid)
   ```

2. **DID Registry**: A centralized DID Document repository that:
   - Stores DID Documents submitted by Blocklet Servers
   - Validates documents using cryptographic signatures (Ed25519)
   - Provides resolution endpoints for DID DNS queries

3. **DID DNS**: A centralized DNS service used by the ArcBlock Blocklet platform that:
   - Queries the DID Registry to resolve DID domains
   - Returns the server's IP/domain (from CNAME records in the DID Document)
   - Enables browser access to blocklets via their DID domains

### Resolution Flow

```
Browser requests: https://bbqaqjmrlusx5vtzhhlr75ps74eljw4w35zpqetkegu.did.abtnet.io
    │
    ▼
DID DNS receives query for: bbqaqjmrlusx5vtzhhlr75ps74eljw4w35zpqetkegu.did.abtnet.io
    │
    ▼
DID DNS queries DID Registry: GET /.well-known/did-resolver/resolve/did:abt:<appDid>
    │
    ▼
DID Registry returns DID Document with CNAME record:
    { "type": "CNAME", "rr": "<base32_appDid>", "value": "<server_did_domain>" }
    │
    ▼
DID DNS returns CNAME to browser → resolved to server IP
    │
    ▼
Browser connects to Blocklet Server → routed to blocklet
```

## DID Document Structure

```javascript
{
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "did:abt:<appPid>",
  "controller": "did:abt:<wallet_address>",
  "service": [{
    "id": "did:abt:<appPid>",
    "type": "DNSRecords",
    "records": [
      {
        "type": "CNAME",
        "rr": "<base32_encoded_appPid>",
        "value": "<daemonDidDomain>",
        "domain": "<didDomain>"
      },
      {
        "type": "CNAME",
        "rr": "<base32_encoded_slpDid>",
        "value": "<daemonDidDomain>",
        "domain": "<slpDomain>",
        "derivedFrom": "<serverDid>"  // For SLP (Serverless) DIDs
      }
    ]
  }],
  "alsoKnownAs": ["did:abt:<migrated_did>"],
  "verificationMethod": [{
    "id": "did:abt:<wallet>#key-1",
    "type": "Ed25519Signature",
    "controller": "did:abt:<wallet_address>",
    "publicKeyMultibase": "<base58_encoded_public_key>"
  }],
  "authentication": ["did:abt:<wallet>#key-1"],
  "created": "2024-12-26T12:00:00Z",
  "updated": "2024-12-26T12:00:00Z",
  "name": "Blocklet Name",
  "capabilities": {
    "blocklet": {
      "metadata": {
        "name": "App Name",
        "description": "App Description",
        "icon": "https://...",
        "tags": ["type:blocklet", "launcher:app"],
        "state": "running|stopped|installed|deleted",
        "owner": {
          "did": "did:abt:<owner_did>",
          "name": "Owner Name",
          "avatar": "https://..."
        },
        "launcher": {
          "did": "did:abt:<launcher_did>",
          "name": "Launcher Name",
          "url": "https://...",
          "userDid": "did:abt:<user_did>"
        }
      },
      "domains": [
        {
          "type": "primary|custom|internal",
          "host": "domain.name",
          "url": "https://domain.name",
          "source": "dnsRecords"
        }
      ]
    }
  },
  "proof": {
    "type": "Ed25519Signature",
    "created": "2024-12-26T12:00:00Z",
    "verificationMethod": "did:abt:<wallet>#key-1",
    "jws": "<base64_encoded_signature>"
  }
}
```

## Storage Location

DID documents are stored in a **remote DID Registry** (not locally):

| Operation | Endpoint |
|-----------|----------|
| Create/Update | `POST {didRegistryUrl}/.well-known/did-resolver/registries` |
| Resolve | `GET {didRegistryUrl}/.well-known/did-resolver/resolve/{did}` |

The registry URL is configured in `nodeInfo.didRegistry`.

## Core Functions

### Low-Level Functions (`core/util/lib/did-document.js`)

| Function | Purpose | Debounce | Retry |
|----------|---------|----------|-------|
| `update()` | Low-level POST to registry | No | No |
| `updateWithRetry()` | Debounced update with retry | 3s | 6x |
| `updateServerDocument()` | Update server's A records | Yes | Yes |
| `updateBlockletDocument()` | Full blocklet document update | Yes | Yes |
| `updateBlockletStateOnly()` | Update only state field | No | Yes |
| `getDidDocument()` | Fetch from registry | No | No |

### Wrapper Functions (`core/state/lib/util/blocklet.js`)

| Function | Purpose |
|----------|---------|
| `publishDidDocument()` | Assembles blocklet data and calls `updateBlockletDocument()` |
| `updateDidDocument()` | Fetches blocklet from DB and calls `publishDidDocument()` |
| `updateDidDocumentStateOnly()` | Updates only state field |

### Update Types

There are two types of DID Document updates:

1. **Full Update**: Reconstructs the entire document with all DNS records, metadata, and domains. Used when structural changes occur (new blocklet, domain changes, config changes).

2. **State-Only Update**: Fetches the current document, modifies only the `state` field, re-signs, and posts back. More efficient for status changes.

## Complete Lifecycle

The lifecycle is optimized for early DNS resolution - the full DID Document is sent at the `added` event (before download completes), allowing DNS to warm up while installation proceeds. A second full update is sent after installation to capture complete metadata, while subsequent state changes use lightweight state-only updates.

```
─────────────────────────────────────────────────────────────────────────────►
│                                                                             │
│  added     downloading...     installed        started                      │
│    │            │                 │               │                         │
│    ▼            ▼                 ▼               ▼                         │
│  Full Doc     (DNS            Full Doc      State-only                      │
│  sent #1    propagating)      sent #2        update                         │
│    │            │            (complete)      (running)                      │
│    └────────────┴─► DNS resolvable (warm)         │                         │
│                                                                             │
│  User waits: ════════════════►  (can access immediately after install)     │
```

### 1. Added Phase (Early DNS Warm-up)

The DID Document is published as early as possible for DNS warm-up. The `BlockletEvents.added` event is emitted from:
- `install-application-from-general.js` - for store/URL installs
- `install-application-from-backup.js` - for backup restores

```
emit(BlockletEvents.added)                    [install-application-from-*.js]
    │
    ▼
handleBlockletAdded()                         [event/index.js]
    │
    ▼
ensureBlockletRouting(blocklet, context)      [router/helper.js]
    │  - Creates or retrieves site configuration
    │  - Sets up routing for the blocklet
    │
    ▼
updateDidDocument()                           [called by ensureBlockletRouting]
    │
    ▼
publishDidDocument({ blocklet, ownerInfo, nodeInfo })
    │                                         [blocklet.js]
    │  - Generates alsoKnownAs (migrated DIDs)
    │  - Gets SLP DID if serverless mode
    │  - Builds domains from site.domainAliases
    │  - Gets owner info from teamManager
    │  - Gets launcher info from controller
    │
    ▼
didDocument.updateBlockletDocument({...})
    │                                         [did-document.js]
    │  - Builds DNSRecords service with CNAME entries
    │  - Assembles capabilities.blocklet structure
    │
    ▼
POST to {didRegistryUrl}/.well-known/did-resolver/registries
    │
    ├─► DNS can now resolve blocklet's DID domain
    │
    ▼
checkDnsAndCname(blockletDidDomain)           [non-blocking]
    │  - Triggers DNS lookup to warm up cache
    │  - Runs in background, doesn't block install
    │
    ▼
(download continues in parallel)
```

### 2. Install Phase (Full Update)

After installation completes, a full DID document is sent to capture any metadata populated during installation:

```
emit(BlockletEvents.installed)
    │
    ▼
handleBlockletInstall()                       [event/index.js]
    │
    ▼
updateDidDocument({ did, nodeInfo, teamManager, states })
    │
    ▼
publishDidDocument({ blocklet, ownerInfo, nodeInfo })
    │                                         [blocklet.js]
    │  - Complete metadata now available
    │  - Owner info, launcher info populated
    │  - All domain aliases configured
    │
    ▼
didDocument.updateBlockletDocument({...})
    │                                         [did-document.js]
    │  - Rebuilds complete document
    │  - state: "installed"
    │
    ▼
POST to {didRegistryUrl}/.well-known/did-resolver/registries
```

### 3. Start Phase (State-Only)

```
emit(BlockletEvents.started)
    │
    ▼
handleBlockletEvent()                         [event/index.js]
    │
    ▼
updateDidDocumentStateOnly({
  did: blocklet.appPid,
  blocklet,
  state: 'running',
  nodeInfo
})
    │
    ▼
Document updated with state: "running"
```

### 4. Stop Phase (State-Only)

```
emit(BlockletEvents.stopped)
    │
    ▼
handleBlockletEvent()                         [event/index.js]
    │
    ▼
updateDidDocumentStateOnly({
  did: blocklet.appPid,
  blocklet,
  state: 'stopped',
  nodeInfo
})
    │
    ▼
Document updated with state: "stopped"
```

### 5. Config Change Phase (Full Update)

When APP_SK configuration changes, a full update is required:

```
config({ did, configs, skipDidDocument: false })
    │
    ▼
willAppSkChange?                              [disk.js]
    │
    ▼ (only if APP_SK changed)
_updateDidDocument(blocklet)
    │
    ▼
updateBlockletDocument({...})                 (full document rebuild)
```

### 6. Domain Alias Update Phase (Full Update)

When domains are added or removed, a full update is required:

```
routerManager.addDomainAlias() or deleteDomainAlias()
    │
    ▼
emit(EVENTS.UPDATE_DOMAIN_ALIAS, did)         [manager.js]
    │
    ▼
updateDidDocument({ did, nodeInfo, teamManager, states })
    │                                         [event/index.js]
    ▼
(full document update with new domain list)
```

### 7. Remove Phase (State-Only)

```
emit(BlockletEvents.removed)
    │
    ▼
handleBlockletRemove()                        [event/index.js]
    │
    ▼
updateDidDocumentStateOnly({
  did: blocklet.appPid,
  blocklet,
  state: 'deleted',
  nodeInfo
})
    │
    ▼
Document preserved with state: "deleted"
```

## Trigger Points Summary

| Event/Trigger | Location | Update Type | Purpose |
|---------------|----------|-------------|---------|
| `BlockletEvents.added` | event/index.js | Full | Early DNS warm-up during download |
| `BlockletEvents.installed` | event/index.js | Full | Capture complete metadata after install |
| `BlockletEvents.started` | event/index.js | State-only | Mark blocklet running |
| `BlockletEvents.stopped` | event/index.js | State-only | Mark blocklet stopped |
| `BlockletEvents.removed` | event/index.js | State-only | Mark blocklet deleted |
| `EVENTS.UPDATE_DOMAIN_ALIAS` | event/index.js | Full | Domain list changed |
| `config()` with APP_SK change | disk.js | Full | Cryptographic identity changed |

## Built-in Optimizations

### 1. Early DID Document Publishing

The DID Document is sent at the `added` event (before download completes), enabling:
- DNS resolution while installation is still in progress
- Users can access the blocklet immediately after install completes
- Reduced perceived latency for "time to first access"

After the DID document is sent, a DNS lookup is triggered to warm up the DNS cache:

```javascript
// Trigger DNS lookup to warm up cache (non-blocking)
const blockletDidDomain = `${encode(blocklet.meta.did)}.${didDomain}`;
checkDnsAndCname(blockletDidDomain);
```

This proactive lookup populates DNS caches along the resolution path, further reducing latency when users first access the blocklet.

### 2. State-Only Updates

For lifecycle state changes (started, stopped, deleted), only the state field is updated rather than rebuilding the entire document. This:
- Reduces payload size
- Preserves the complete document structure for audit trails
- Minimizes network overhead

### 3. Debouncing

```javascript
// did-document.js
const pendingUpdates = new Map();
const updateTimers = new Map();

const updateWithRetry = (...args) => {
  const did = toDid(params.id);

  // Cancel pending update for same DID
  if (updateTimers.has(did)) {
    clearTimeout(updateTimers.get(did));
  }

  // Schedule new update after debounce time
  const timer = setTimeout(async () => {
    // Execute update with retry
  }, getDebounceTime());  // Default: 3000ms
};
```

- **Debounce Time**: 3 seconds (configurable via `ABT_NODE_DID_DOCUMENT_DEBOUNCE_TIME`)
- Multiple updates within 3s are coalesced into one

### 4. Retry Logic

```javascript
// did-document.js
const result = await pRetry(() => update(...pending.args), {
  retries: getRetryCount(),  // Default: 6
  onFailedAttempt: async (error) => {
    await sleep(10 * 1000);  // Wait 10 seconds between retries
  },
});
```

- **Retry Count**: 6 times (configurable via `ABT_NODE_UPDATE_DID_DOCUMENT_RETRY_COUNT`)
- **Retry Interval**: 10 seconds

### 5. Disable Flag

```javascript
if (['0', 'false', 0, false].includes(process.env.ABT_NODE_DID_DOCUMENT_UPDATE)) {
  throw new Error('Did Document update is disabled');
}
```

Set `ABT_NODE_DID_DOCUMENT_UPDATE=false` to disable all updates.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ABT_NODE_DID_DOCUMENT_UPDATE` | enabled | Set to `false` to disable all updates |
| `ABT_NODE_DID_DOCUMENT_DEBOUNCE_TIME` | 3000 | Debounce time in milliseconds |
| `ABT_NODE_UPDATE_DID_DOCUMENT_RETRY_COUNT` | 6 | Number of retry attempts |

## File References

| File | Purpose |
|------|---------|
| `core/util/lib/did-document.js` | Core DID document functions |
| `core/state/lib/util/blocklet.js` | Blocklet-specific wrapper functions |
| `core/state/lib/event/index.js` | Event handlers triggering updates |
| `core/state/lib/router/helper.js` | `ensureBlockletRouting` with early DID document publishing |
| `core/state/lib/util/check-dns.js` | DNS lookup for cache warm-up |
| `core/state/lib/blocklet/manager/disk.js` | Config-triggered updates |
| `core/state/lib/router/manager.js` | Domain alias event emissions |
