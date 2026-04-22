# Blocklet Routing Workflow During Installation

This document provides a comprehensive analysis of the app routing site and routing rule handling workflow during blocklet installation in Blocklet Server.

## High-Level Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           BLOCKLET INSTALLATION FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ 1. INSTALL ENTRY                                                                     │
│    core/state/lib/blocklet/manager/disk.js                                           │
│    install() → installApplicationFromGeneral() → _installBlocklet()                  │
└──────────────────────────────────────────────────────────────────────────────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              ▼                         │                         ▼
┌─────────────────────────────┐         │         ┌─────────────────────────────────────┐
│ 2a. EARLY: BlockletEvents.  │         │         │ 2b. COMPLETE: BlockletEvents.       │
│     added                   │    (downloading)  │     installed                        │
│     (before download)       │         │         │     (after install complete)         │
└─────────────────────────────┘         │         └─────────────────────────────────────┘
              │                         │                         │
              ▼                         │                         ▼
┌─────────────────────────────┐         │         ┌─────────────────────────────────────┐
│ 3a. handleBlockletAdded()   │         │         │ 3b. handleBlockletInstall()          │
│  - ensureBlockletRouting()  │         │         │  - ensureBlockletRouting() (verify)  │
│  - handleBlockletRouting()  │         │         │  - handleBlockletRouting()           │
│  - updateDidDocument()      │         │         │  - refreshInterfacePermissions()     │
│  (Early DNS warm-up)        │         │         │  - updateDidDocument() (full)        │
└─────────────────────────────┘         │         └─────────────────────────────────────┘
              │                         │                         │
              └─────────────────────────┼─────────────────────────┘
                                        ▼
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
┌─────────────────────────────────┐   ┌─────────────────────────────────────────────────┐
│ 4a. DATABASE UPDATE             │   │ 4b. NGINX UPDATE                                │
│  (Synchronous)                  │   │  (Async Batched)                                │
│                                 │   │                                                 │
│ ensureBlockletRouting()         │   │ handleBlockletRouting()                         │
│ └→ _ensureBlockletSites()       │   │ └→ queueChange('global')                        │
│    └→ routerManager.            │   │ └→ queueChange('blocklet', did)                 │
│       addRoutingSite()          │   │ └→ debouncedProcessBatch()                      │
│    └→ states.site.add()         │   │    └→ _processBatch() [1s debounce]             │
└─────────────────────────────────┘   │       └→ getBlockletRoutingParams(did)          │
                                      │       └→ provider.updateSingleBlocklet()        │
                                      │       └→ provider.reload() [nginx -s reload]    │
                                      └─────────────────────────────────────────────────┘
```

## Early Routing Setup (Optimization)

Routing is set up as early as possible at the `added` event (before download completes) to enable:
- Early DID document publishing for DNS warm-up
- DNS resolution while installation is still in progress
- Faster "time to first access" after install completes

The `installed` event handler verifies and completes the routing setup.

## Phase 1: Installation Entry Point

**File:** `core/state/lib/blocklet/manager/disk.js`

```javascript
// Line 548-588
async install(params, context = {}) {
  const type = getTypeFromInstallParams(params);

  // Route to appropriate installer based on type
  if (type === BLOCKLET_INSTALL_TYPE.RESTORE) {
    return installApplicationFromBackup({...});
  }
  if ([BLOCKLET_INSTALL_TYPE.URL, BLOCKLET_INSTALL_TYPE.STORE, BLOCKLET_INSTALL_TYPE.CREATE].includes(type)) {
    return installApplicationFromGeneral({...});  // Most common path
  }
}
```

The `installApplicationFromGeneral()` function (`core/state/lib/blocklet/manager/helper/install-application-from-general.js`) handles:
1. Downloads blocklet metadata from store/URL
2. Creates app wallet (DID)
3. Adds blocklet record to database
4. Triggers bundle download
5. Calls `_installBlocklet()` to complete installation

## Phase 2: Event Emission

**File:** `core/state/lib/blocklet/manager/disk.js`

```javascript
// Early event - emitted when blocklet record is added to database (before download)
this.emit(BlockletEvents.added, { blocklet, context });

// ... download and installation proceeds ...

// Complete event - emitted at end of _installBlocklet()
this.emit(BlockletEvents.installed, { blocklet, context });
```

Two events trigger routing setup at different stages.

## Phase 3a: Early Routing Setup (Added Event)

**File:** `core/state/lib/event/index.js`

```javascript
/**
 * Handle BlockletEvents.added - set up routing early for DNS warm-up
 * This is called as soon as blocklet is added to database, before download/install completes
 */
const handleBlockletAdded = async (name, { blocklet, context }) => {
  try {
    const changed = await ensureBlockletRouting(blocklet, context);
    if (changed) {
      await handleBlockletRouting({
        did: blocklet.meta.did,
        message: 'Added blocklet (early routing setup)',
      });
    }
    // DID document is also sent early via ensureBlockletRouting for DNS warm-up
  } catch (error) {
    // Non-blocking - don't fail the install if early routing setup fails
    // It will be retried at installed event
    logger.error('early routing setup failed after added', { ... });
  }
};
```

## Phase 3b: Complete Routing Setup (Installed Event)

**File:** `core/state/lib/event/index.js`

```javascript
const handleBlockletInstall = async (name, { blocklet, context }) => {
  try {
    // Step 1: Verify/complete routing (may already be set up at 'added' event)
    const changed = await ensureBlockletRouting(blocklet, context);
    if (changed) {
      await handleBlockletRouting({
        did: blocklet.meta.did,
        message: 'Install blocklet',
      });
    }

    // Step 2: Refresh RBAC permissions for interfaces
    await teamAPI.refreshBlockletInterfacePermissions(blocklet.meta);

    // Step 3: Send full DID document update (captures complete metadata)
    await updateDidDocument({ did: blocklet.appPid, nodeInfo, teamManager, states });

  } catch (error) {
    // Create notification for failed routing setup
    teamManager.createNotification({
      title: 'Blocklet URL Mapping Error',
      description: `Failed to create URL mapping for blocklet ${blocklet.meta.title}`,
      severity: 'error',
    });
  }
};
```

## Phase 4a: Database Update (Site & Rule Creation)

### ensureBlockletRouting()

**File:** `core/state/lib/router/helper.js`

```javascript
const ensureBlockletRouting = async (blocklet, context = {}) => {
  const lockName = `ensure-blocklet-routing-${blocklet.meta.did}`;

  // Acquire lock to prevent concurrent routing operations
  await ensureBlockletRoutingLock.acquire(lockName);

  try {
    const nodeInfo = await nodeState.read();
    return await _ensureBlockletRouting(blocklet, nodeInfo, context);
  } finally {
    await ensureBlockletRoutingLock.releaseLock(lockName);
  }
};
```

### _ensureBlockletRouting() - Core Logic

**File:** `core/state/lib/router/helper.js`

```javascript
const _ensureBlockletRouting = async (blocklet, nodeInfo, context = {}) => {
  // 1. Find the web interface from blocklet metadata
  const webInterface = (blocklet.meta.interfaces || [])
    .find((x) => x.type === BLOCKLET_INTERFACE_TYPE_WEB);
  if (!webInterface) return false;  // No web interface = no routing needed

  // 2. Generate domain group name: {blockletDid}@blocklet-site-group
  const domainGroup = getBlockletDomainGroupName(blocklet.meta.did);

  // 3. Create routing rule pointing to blocklet's web interface
  const pathPrefix = getPrefix(webInterface.prefix);  // e.g., "/" or "/api"
  const rule = {
    from: { pathPrefix },
    to: {
      port: findInterfacePortByName(blocklet, webInterface.name),
      did: blocklet.meta.did,
      type: ROUTING_RULE_TYPES.BLOCKLET,
      interfaceName: webInterface.name,
    },
    isProtected: true,
  };

  // 4. Check if site already exists
  const existSite = await states.site.findOne({ domain: domainGroup });

  if (!existSite) {
    // 5a. NEW SITE: Create with domain aliases
    const domainAliases = getBlockletDidDomainList(blocklet, nodeInfo);
    domainAliases.push({ value: getIpDnsDomainForBlocklet(blocklet), isProtected: true });

    const rules = [rule];

    // Inject rules from pack config (if any)
    const config = await getPackConfig(blocklet);
    rules.push(...(config?.site?.rules || []).map(x => ({...x, to: {...x.to, did: blocklet.meta.did}})));

    // Create site in database
    await routerManager.addRoutingSite({
      site: {
        domain: domainGroup,
        domainAliases,
        isProtected: true,
        rules,
      },
      skipCheckDynamicBlacklist: true,
      skipValidation: true,
    }, context);

    return true;  // Routing changed
  }

  // 5b. EXISTING SITE: Update domain aliases and rules
  await updateSiteDomainAliases(existSite, blocklet, nodeInfo);

  const existRule = existSite.rules.find(y => y.from.pathPrefix === pathPrefix);
  if (existRule) {
    await routerManager.updateRoutingRule({...});
  } else {
    await routerManager.addRoutingRule({...});
  }

  return true;
};
```

### RouterManager.addRoutingSite()

**File:** `core/state/lib/router/manager.js`

```javascript
async addRoutingSite({ site, skipCheckDynamicBlacklist = false, skipValidation = false }, context = {}) {
  // 1. Validate site configuration
  let newSite = skipValidation ? site : await validateAddSite(site, context);

  // 2. Check domain uniqueness
  if (await states.site.domainExists(newSite.domain)) {
    throw new Error(`Site ${newSite.domain} already exists`);
  }

  // 3. Process rules (expand to include child component rules)
  const rules = [];
  for (const rule of newSite.rules) {
    this.fixRootBlockletRule(rule);
    checkPathPrefixInBlackList(rule.from.pathPrefix, dynamicPathBlackList);
    rules.push(...(await this.getRulesForMutation(rule)));  // Expands child rules
  }
  newSite.rules = rules;

  // 4. Validate path prefixes for conflicts
  await this.validatePathPrefix(newSite.rules);

  // 5. Validate with nginx (dry-run config test)
  await this.validateRouterConfig('addRoutingSite', { site: newSite });

  // 6. Persist to SQLite database
  const result = await states.site.add(newSite);

  // 7. Emit event for listeners
  this.emit('router.site.created', result);
  return result;
}
```

## Phase 4b: Nginx Configuration Update

### handleBlockletRouting()

**File:** `core/state/lib/router/helper.js`

```javascript
const handleBlockletRouting = async ({ did, message = '', isRemoval = false }) => {
  const nodeInfo = await nodeState.read();
  const providerName = get(nodeInfo, 'routing.provider', null);  // Usually 'nginx'

  if (!providers[providerName]) {
    // Fallback to legacy full update if provider not initialized
    return handleRouting({ message, appDid: did, strategy: 'blocklet', isRemoval });
  }

  // Queue changes for batched processing (optimized O(1) path)
  const changeType = isRemoval ? 'blocklet-remove' : 'blocklet';
  providers[providerName].queueChange('global');  // Global configs (services, etc.)
  providers[providerName].queueChange(changeType, did);  // Specific blocklet config
};
```

### Router.queueChange()

**File:** `core/state/lib/router/index.js`

```javascript
queueChange(changeType, did = undefined) {
  if (changeType === 'global') {
    this.pendingChanges.global = true;
  } else if (changeType === 'blocklet' && did) {
    this.pendingChanges.blocklets.add(did);
    this.pendingChanges.blockletsRemoved.delete(did);  // Remove from delete queue
  } else if (changeType === 'blocklet-remove' && did) {
    this.pendingChanges.blockletsRemoved.add(did);
    this.pendingChanges.blocklets.delete(did);  // Remove from update queue
  }

  // Trigger debounced batch processing
  // wait: 1000ms, maxWait: 5000ms
  this.debouncedProcessBatch();
}
```

### Router._processBatch()

**File:** `core/state/lib/router/index.js`

```javascript
async _processBatch() {
  // Prevent concurrent processing
  if (this._processingBatch) {
    this.debouncedProcessBatch();
    return;
  }
  this._processingBatch = true;

  // Snapshot and clear pending changes
  const { global: globalChanged, blocklets, blockletsRemoved } = this.pendingChanges;
  const blockletsToUpdate = [...blocklets];
  const blockletsToRemove = [...blockletsRemoved];
  this.pendingChanges = { global: false, blocklets: new Set(), blockletsRemoved: new Set() };

  try {
    let needsReload = false;

    // 1. Get global/system params (O(1) - just node config, policies)
    let globalParams = await this._getUpdateParams('getSystemRoutingParams');

    // 2. Update global config if changed
    if (globalChanged) {
      await this.provider.update({ ...globalParams, skipBlockletSites: true });
      needsReload = true;
    }

    // 3. Update individual blocklets (O(1) per blocklet)
    for (const did of blockletsToUpdate) {
      const rawParams = await this.getBlockletRoutingParams(did);  // O(1) query
      if (rawParams?.sites?.length > 0) {
        const blockletParams = {
          routingTable: getRoutingTable({ sites: rawParams.sites, nodeInfo }),
          certificates: rawParams.certificates,
          commonHeaders: rawParams.headers,
          nodeInfo: pick(rawParams.nodeInfo, [...]),
        };
        await this.provider.updateSingleBlocklet(did, blockletParams);
        needsReload = true;
      }
    }

    // 4. Remove deleted blocklets
    for (const did of blockletsToRemove) {
      this.provider._removeBlockletConfig(did);
      needsReload = true;
    }

    // 5. Single nginx reload for all changes
    if (needsReload) {
      await this.provider.reload();  // nginx -s reload
    }

  } finally {
    this._processingBatch = false;
  }
}
```

## Phase 5: Nginx Configuration Generation

### NginxProvider.update()

**File:** `core/router-provider/lib/nginx/index.js`

```javascript
async update({
  routingTable = [],
  certificates = [],
  commonHeaders,
  services = [],
  nodeInfo = {},
  requestLimit,
  blockPolicy,
  wafPolicy,
  skipBlockletSites = false,  // When true, only update global config
  ...
} = {}) {

  // 1. Create main nginx.conf from template
  const confTemplate = this.getConfTemplate(proxyPolicy);
  const conf = await NginxConfFile.createFromSource(confTemplate);

  // 2. Add global configs
  conf.nginx.http._add('server_tokens', 'off');
  this._addCommonResHeaders(conf.nginx.http, commonHeaders);
  this._addExposeServices(conf, services);
  this.addRequestLimiting(conf.nginx.http, requestLimit);
  this.updateBlacklist(blockPolicy?.blacklist || []);
  this._addModSecurity(conf, wafPolicy);

  // 3. Separate sites by type
  const blockletSitesMap = new Map();  // blockletDid -> sites[]
  const systemSites = [];

  for (const site of sites) {
    if (site.blockletDid) {
      blockletSitesMap.get(site.blockletDid)?.push(site)
        || blockletSitesMap.set(site.blockletDid, [site]);
    } else {
      systemSites.push(site);
    }
  }

  // 4. Add system sites to main nginx.conf
  for (const site of systemSites) {
    if (certificate) {
      this._addHttpsServer({...});
    } else {
      this._addHttpServer({...});
    }
  }

  // 5. Generate separate conf files per blocklet (if not skipped)
  if (!skipBlockletSites) {
    this._cleanupSiteConfFiles([...blockletSitesMap.keys()]);
    await Promise.all([...blockletSitesMap.entries()].map(
      ([did, sites]) => this._generateBlockletSiteConfFile({
        blockletDid: did,
        sites,
        certificates,
        nodeInfo,
        commonHeaders,
      })
    ));
  }

  // 6. Include all blocklet conf files
  conf.nginx.http._add('include', `${this.sitesDir}/*.conf`);

  // Write main nginx.conf
  conf.live(this.configPath);
}
```

### _generateBlockletSiteConfFile()

**File:** `core/router-provider/lib/nginx/index.js`

Generates individual nginx conf file per blocklet at `sites/{blockletDid}.conf`:

```nginx
# Example generated content for sites/z8iZrkWY....conf

server {
    listen 80;
    server_name app.example.com z8iZrkWY.did.abtnet.io;

    location / {
        proxy_set_header X-Blocklet-Did "z8iZrkWY...";
        proxy_set_header X-Path-Prefix "/";
        include includes/proxy;
        proxy_pass http://127.0.0.1:8091;
    }
}
```

## Data Model

### Site Entity

**File:** `core/models/lib/models/site.js`

| Field | Type | Description |
|-------|------|-------------|
| `id` | STRING(80) | Primary key (UUID) |
| `domain` | STRING(255) | Domain group: `{did}@blocklet-site-group` |
| `domainAliases` | JSON | Array of `{value, isProtected, certificateId}` |
| `rules` | JSON | Array of routing rules |
| `isProtected` | BOOLEAN | System protection flag |
| `corsAllowedOrigins` | JSON | CORS configuration |

### Routing Rule Structure

```typescript
interface TRoutingRule {
  id: string;
  from: {
    pathPrefix: string;       // e.g., "/" or "/api"
    groupPathPrefix?: string; // For component grouping
    pathSuffix?: string;      // For special routes like /__blocklet__.js
  };
  to: {
    port: number;             // Target port (e.g., 8091)
    type: 'blocklet' | 'daemon' | 'service' | 'redirect';
    did: string;              // Target blocklet DID
    interfaceName?: string;   // Interface name from metadata
    componentId?: string;     // Child component ID
  };
  isProtected: boolean;       // Auth required
}
```

## Performance Characteristics

| Operation | Complexity | Description |
|-----------|------------|-------------|
| Single blocklet install | O(1) | Uses `getBlockletRoutingParams(did)` |
| Batch processing | O(k) | k = number of changed blocklets |
| Full regeneration | O(N) | N = total blocklets (startup/manual rebuild) |
| Debounce wait | 1000ms | Batches rapid successive changes |
| Max wait | 5000ms | Forces processing even with continuous changes |

## Key Files Reference

| File | Purpose |
|------|---------|
| `core/state/lib/blocklet/manager/disk.js` | Blocklet installation orchestration |
| `core/state/lib/event/index.js` | Event handlers connecting install to routing |
| `core/state/lib/router/helper.js` | Routing setup logic (`ensureBlockletRouting`) |
| `core/state/lib/router/manager.js` | Site/rule CRUD operations |
| `core/state/lib/router/index.js` | Batching/queueing mechanism |
| `core/state/lib/states/site.js` | Site database state wrapper |
| `core/models/lib/models/site.js` | Sequelize model definition |
| `core/router-provider/lib/nginx/index.js` | Nginx config generation |

## Dynamic Rules Added by Router.formatSites()

**File:** `core/state/lib/router/index.js`

The `formatSites()` function adds dynamic rules to sites before nginx config generation:

1. **robots.txt/sitemap.xml** - Proxied to daemon for SEO
2. **favicon.ico** - Proxied to service
3. **/__blocklet__.js** - Runtime blocklet metadata injection
4. **/.blocklet/proxy** - Cross-blocklet proxy endpoint

These rules are marked with `dynamic: true` and generated per-site.

## Upgrade vs Install Workflow

For upgrades (`BlockletEvents.upgraded`), the flow uses `ensureBlockletRoutingForUpgrade()` instead:

1. Backs up existing site configuration
2. Removes stale interface rules (from old version)
3. Updates rules for new interfaces
4. Handles custom routing rules preservation
5. Restores on failure

See `handleBlockletUpgrade()` in `core/state/lib/event/index.js`.

## Error Handling

Failed routing operations create user notifications via `teamManager.createNotification()` with:
- `entityType: 'blocklet'`
- `entityId: blocklet.meta.did`
- `severity: 'error'`

This ensures users are informed of routing failures without blocking the installation.
