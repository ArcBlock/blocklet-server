# Blocklet Server Startup Flow

This document describes the complete startup sequence when `blocklet server start` is triggered.

## Overview

Blocklet Server starts multiple PM2-managed processes that work together:

```
blocklet server start
├── Event Hub (port 40407) - PM2 event communication
├── Blocklet Service (port 40406) - Unified blocklet gateway
├── Daemon (port 5554) - Main Express server + dashboard
└── Orphan Cleanup Worker - Background process cleanup
```

## 1. CLI Entry Point

**File:** `core/cli/bin/blocklet.js`

The entry point handles:
- PM2 environment setup (`PM2_HOME`, `ABT_NODE_HOME`)
- `--keep-alive` flag detection for persistent running
- Spawns subprocess with 3-minute timeout if keep-alive enabled

```javascript
const isServer = process.argv[2] === 'server';
const isStart = process.argv[3] === 'start';
const keepAlive = keepAliveParams.some((x) => process.argv.includes(x));
```

## 2. Command Registration

**File:** `core/cli/lib/commands/index.js`

Sets up environment and registers commands:
- Loads constants and internal port allocations
- Sets up uncaught exception handlers
- Registers the `server` command group

**File:** `core/cli/lib/commands/server/command.js`

Defines `server start` options:
- `-u --update-db` - Update database with latest config
- `-k --keep-alive` - Keep running after start success
- `-a --auto-init` - Auto-initialize if config missing
- `-m --force-mode` - Set server mode

## 3. Start Command Orchestration

**File:** `core/cli/lib/commands/server/start.js`

### Phase 1: Pre-flight Checks

```
1. Read node config (blocklet.yml)
2. Check running daemon instances
3. Handle daemon switching if needed
4. Validate version compatibility
5. Create start.lock file
6. Setup signal handlers (SIGINT, SIGTERM, etc.)
```

### Phase 2: Infrastructure Setup

```javascript
// Ensure Redis and Postgres
const redisUrl = await ensureDockerRedis();
const postgresUrl = await ensureDockerPostgres(dataDir);

// Create log directory
const logDir = getDaemonLogDir(dataDir);
fs.ensureDirSync(logDir);
```

### Phase 3: Node Instance Creation

```javascript
const { node, getBaseUrls, publishEvent, wallet } = await nodeLib.getNode({ dir: workingDir });
```

Initializes ABTNode with:
- Server DID credentials (sk, pk, did)
- Port configuration
- Data directory
- Routing and database configuration

### Phase 4: Event Hub Startup

**File:** `core/cli/lib/process/event-hub.js`

```javascript
const [eventHubPort, pm2EventHubPort] = await startEventHub(logDir, blockletMaxMemoryLimit, config.node.sk);
```

- Script: `./lib/process/event-hub.js`
- Port: 40407 (TCP)
- Runs in cluster mode via PM2
- Health check timeout: 5 minutes

### Phase 5: Node Initialization

```javascript
node.onReady(async () => {
  // 1. Database schema migrations
  await runSchemaMigrations({ dataDir, ... });
  await runMigrationScripts({ node, config, ... });

  // 2. Update version in config and state
  await updateVersionInConfigFileAndState(config, configFile, node);

  // 3. Check and sync config differences
  if (isConfigChanged && updateDb) {
    await node.states.node.updateNodeInfo(data);
  }

  // 4. Dashboard routing setup
  await node.ensureDashboardRouting();

  // 5. SSL certificate management
  await node.ensureWildcardCerts();
  await node.ensureServerlessCerts();

  // 6. Apply initial blocklets
  await prepareInitialData(node, latest, dataDir);
});
```

### Phase 6: Blocklet Service Startup

**File:** `core/cli/lib/process/service.js`

```javascript
await pm2StartOrReload({
  name: PROCESS_NAME_SERVICE,
  script: './lib/process/service.js',
  instances: getServiceInstanceCount(),
  execMode: 'cluster',
  // Port: 40406
});
```

Service process responsibilities:
- Creates ABTNode instance with `service: true`
- Creates server using `createServer()` from `@abtnode/blocklet-services`
- Unified gateway for all blocklet requests

### Phase 7: Daemon Startup

**File:** `core/cli/lib/process/daemon.js`

```javascript
await pm2StartOrReload({
  name: PROCESS_NAME_DAEMON,
  script: './lib/process/daemon.js',
  instances: getDaemonInstanceCount(),
  execMode: 'cluster',
  // Port: ABT_NODE_PORT (default 5554)
});
```

Daemon process responsibilities:
- Creates ABTNode instance with `daemon: true`
- Creates Express server from `@abtnode/webapp/blocklet`
- Sets up routing via `node.handleRouting(info)`
- Restarts blocklets that were running before shutdown

### Phase 8: Post-Startup Tasks

```javascript
// Publish NODE_STARTED event
await publishEvent(EVENTS.NODE_STARTED, {});

// Print access URLs
const accessUrls = await util.getDaemonAccessUrls({ info, wallet, getBaseUrls });
printAccessUrls(accessUrls);

// Start orphan cleanup worker
pm2StartOrReload({
  name: PROCESS_NAME_ORPHAN_CLEANUP,
  script: './lib/process/orphan-cleanup-worker.js',
});
```

## 4. Port Allocation

**File:** `core/cli/lib/port.js`

| Process | Port | Purpose |
|---------|------|---------|
| Proxy | 40404 | Nginx/Node proxy |
| Updater | 40405 | Auto-updater |
| Service | 40406 | Blocklet services |
| Event Hub | 40407 | Event messaging |
| PM2 Event Hub | 40411 | PM2 event hub |
| Daemon | 5554+ | Main server (configurable) |
| Blocklets | 5555+ | Starting port for blocklets |

## 5. Environment Variables

**Set during startup:**

```javascript
const environments = {
  // Node configuration
  ABT_NODE_SK: config.node.sk,
  ABT_NODE_DID: config.node.did,
  ABT_NODE_PORT: config.node.port,
  ABT_NODE_DATA_DIR: dataDir,

  // Service ports
  ABT_NODE_SERVICE_PORT: 40406,
  ABT_NODE_EVENT_PORT: 40407,

  // Blocklet configuration
  ABT_NODE_BLOCKLET_PORT: config.blocklet.port,

  // Database
  ABT_NODE_CACHE_REDIS_URL: redisUrl,
  ABT_NODE_POSTGRES_URL: postgresUrl,

  // Custom environment from config
  ...(config.env || {}),
};
```

## 6. Daemon Server Creation

**File:** `core/webapp/api/index.js`

### Middleware Chain

| Order | Middleware | Purpose |
|-------|------------|---------|
| 1 | CORS | Cross-origin requests |
| 2 | Cookie Parser | Parse cookies |
| 3 | Body Parser | JSON/URL-encoded bodies |
| 4 | Auth (JWT) | User login sessions |
| 5 | Auth (AccessKey) | SDK request signing |
| 6 | Auth (Launcher) | App launcher integration |
| 7 | Auth Routes | Login, passport, connect |
| 8 | API Routes | Session, blocklet-info, proxy |
| 9 | GraphQL | `/api/gql` endpoint |
| 10 | WebSocket | Upgrade handler |
| 11 | Static Files | Serve dashboard assets |
| 12 | SPA Fallback | `index.html` for HTML requests |

## 7. Routing Engine

**File:** `core/state/lib/router/helper.js`

### Provider Selection

```javascript
// nginx (Linux/Mac) or default (Windows/fallback)
const provider = getProvider(providerName);
provider.reload(routingParams);
```

### Routing Parameters

- **Sites Config** - Domain + path prefix mapping
- **Static Serving** - Direct Nginx serving for static blocklets
- **Cache Rules** - Blocklet resource caching
- **Well-known Routes** - DID resolver, OAuth, ACME
- **SSL Certificates** - HTTPS if enabled

### Static Serving Conditions

A blocklet gets direct Nginx static serving when:
1. Uses `blocklet` interpreter (static-server engine)
2. Built-in static-server, not custom engine
3. Public access policy for all paths
4. Valid `staticRoot` path exists

## 8. Blocklet Service

**File:** `core/blocklet-services/api/index.js`

### Core Services

```javascript
const authMiddlewares = initAuth({ node });
const notificationService = initNotification({ node });
const kycService = initKyc({ node });
const relayService = initRelay({ node });
const imageService = initImageService({ node });
const dashboardService = initDashboard({ node });
```

### Request Flow

```
Router Provider (Port 80/443)
        ↓
    [Inject x-* Headers]
    - x-blocklet-did
    - x-blocklet-component-id
    - x-path-prefix
        ↓
Blocklet Service (Port 40406)
        ↓
    ┌─────────────────────────────┐
    │ 1. attachSharedUtils        │
    │ 2. Security Headers (CSP)   │
    │ 3. Auth (JWT/AccessKey)     │
    │ 4. Service API Routes       │
    │ 5. checkRunning             │
    │ 6. checkAuth + checkKyc     │
    │ 7. serveStaticEngine        │
    │    OR proxyToBlocklet       │
    └─────────────────────────────┘
        ↓
Blocklet Process (localhost:port)
```

### Built-in Service Routes

| Route | Service |
|-------|---------|
| `/notification/*` | Push, email, webhook notifications |
| `/relay/*` | Relay service |
| `/auth/*` | OAuth, sessions, access keys |
| `/analytics/*` | Usage analytics |
| `/did-space/*` | DID Space |
| `/kyc/*` | KYC verification |
| `/media/*` | Media handling |

### Caching Layer

| Cache | TTL | Purpose |
|-------|-----|---------|
| `blockletInfo` | 1h | Metadata with secrets/wallet |
| `cacheBlocklet` | 1h | Full blocklet structure |
| `securityConfig` | 24h | Access/response policies |
| `sessionToken` | 1h | Encrypted login tokens |

## 9. Key Files Reference

| File | Purpose |
|------|---------|
| `core/cli/bin/blocklet.js` | CLI entry point |
| `core/cli/lib/commands/server/start.js` | Main orchestrator |
| `core/cli/lib/process/daemon.js` | Dashboard & API server |
| `core/cli/lib/process/service.js` | Blocklet services |
| `core/cli/lib/process/event-hub.js` | Event messaging |
| `core/webapp/api/index.js` | Daemon server creation |
| `core/blocklet-services/api/index.js` | Service server creation |
| `core/state/lib/router/helper.js` | Routing initialization |
| `core/router-provider/lib/nginx/index.js` | Nginx config generation |

## 10. Startup Sequence Diagram

```
User: blocklet server start [options]
  │
  ├─→ bin/blocklet.js (entry)
  │     └─→ Parse --keep-alive flag
  │
  ├─→ lib/commands/server/start.js (orchestrator)
  │     │
  │     ├─ Parse config (blocklet.yml)
  │     ├─ Validate version compatibility
  │     ├─ Create start.lock file
  │     ├─ Setup signal handlers
  │     ├─ Ensure Redis & Postgres
  │     ├─ Initialize ABTNode instance
  │     │
  │     ├─ Start Event Hub (PM2)
  │     │   └─ Port 40407
  │     │
  │     ├─ Wait for Node ready
  │     │   ├─ Run DB migrations
  │     │   ├─ Setup routing & SSL
  │     │   └─ Apply initial blocklets
  │     │
  │     ├─ Start Blocklet Service (PM2)
  │     │   └─ Port 40406
  │     │
  │     ├─ Start Daemon (PM2)
  │     │   └─ Port 5554
  │     │
  │     ├─ Publish NODE_STARTED event
  │     ├─ Print access URLs
  │     └─ Start orphan cleanup worker
  │
  └─→ Exit with code 0
```
