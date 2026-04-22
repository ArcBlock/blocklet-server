# Blocklet Lifecycle

This document provides a comprehensive guide to the blocklet lifecycle management in Blocklet Server, including status definitions, state transitions, hooks, events, and process management.

## Table of Contents

- [Status Definitions](#status-definitions)
- [State Transition Diagram](#state-transition-diagram)
- [Lifecycle Operations](#lifecycle-operations)
  - [Installation](#installation)
  - [Upgrade](#upgrade)
  - [Start](#start)
  - [Stop](#stop)
  - [Restart](#restart)
  - [Remove](#remove)
- [Hooks System](#hooks-system)
- [Events System](#events-system)
- [Component Lifecycle](#component-lifecycle)
- [Blue-Green Deployment](#blue-green-deployment)
- [Process Management](#process-management)
- [Error Handling and Recovery](#error-handling-and-recovery)
- [State Persistence](#state-persistence)

---

## Status Definitions

Blocklets can exist in the following states:

| Status        | Value | Description                                                 |
| ------------- | ----- | ----------------------------------------------------------- |
| `added`       | 0     | Blocklet record created in database, before download begins |
| `downloading` | 1     | Blocklet bundle/archive is being downloaded                 |
| `downloaded`  | 2     | Download completed (deprecated)                             |
| `installing`  | 3     | Installation in progress (deprecated)                       |
| `installed`   | 4     | Installation completed, ready to start                      |
| `starting`    | 5     | Start process in progress                                   |
| `running`     | 6     | Blocklet is running and healthy                             |
| `stopping`    | 7     | Stop process in progress                                    |
| `stopped`     | 8     | Blocklet is stopped                                         |
| `error`       | 9     | Error state (install/start/upgrade failed)                  |
| `upgrading`   | 10    | Upgrade process in progress                                 |
| `restarting`  | 11    | Restart in progress (deprecated)                            |
| `corrupted`   | 12    | Corrupted state (deprecated)                                |
| `waiting`     | 13    | Waiting in queue for download                               |
| `deleted`     | 14    | Marked as deleted                                           |

### Controller Status

Blocklets can also have a controller status for authorization:

| Controller Status | Value | Description                                   |
| ----------------- | ----- | --------------------------------------------- |
| `normal`          | 0     | Normal operation                              |
| `suspended`       | 10    | Blocklet is suspended (e.g., license expired) |

---

## State Transition Diagram

```
                                    ┌─────────────────────────────────────┐
                                    │                                     │
                                    ▼                                     │
┌─────────┐    ┌─────────┐    ┌─────────────┐    ┌────────────┐    ┌─────────────┐
│  added  │───▶│ waiting │───▶│ downloading │───▶│ installing │───▶│  installed  │
└─────────┘    └─────────┘    └─────────────┘    └────────────┘    └─────────────┘
                                    │                                     │
                                    │ (error)                             │ start
                                    ▼                                     ▼
                              ┌─────────┐                           ┌──────────┐
                              │  error  │◀──────────────────────────│ starting │
                              └─────────┘                           └──────────┘
                                    ▲                                     │
                                    │ (error)                             │ (success)
                                    │                                     ▼
┌─────────┐    ┌──────────┐    ┌──────────┐                         ┌─────────┐
│ deleted │◀───│ stopping │◀───│  running │◀────────────────────────│ running │
└─────────┘    └──────────┘    └──────────┘                         └─────────┘
                    │               │                                     ▲
                    │               │ upgrade                             │
                    ▼               ▼                                     │
              ┌─────────┐    ┌───────────┐                                │
              │ stopped │───▶│ upgrading │────────────────────────────────┘
              └─────────┘    └───────────┘
                    │
                    │ start
                    ▼
              ┌──────────┐
              │ starting │
              └──────────┘
```

### Valid State Transitions

| From State  | To State    | Trigger                     |
| ----------- | ----------- | --------------------------- |
| (none)      | added       | Install request             |
| added       | waiting     | Download queued             |
| waiting     | downloading | Download starts             |
| downloading | installing  | Download completes          |
| installing  | installed   | Installation completes      |
| installing  | error       | Installation fails          |
| installed   | starting    | Start request               |
| starting    | running     | Process starts successfully |
| starting    | error       | Start fails                 |
| running     | stopping    | Stop request                |
| stopping    | stopped     | Process stops               |
| stopped     | starting    | Start request               |
| stopped     | deleted     | Delete request              |
| running     | upgrading   | Upgrade request             |
| upgrading   | running     | Upgrade completes           |
| upgrading   | error       | Upgrade fails               |
| error       | starting    | Retry start                 |
| error       | deleted     | Delete request              |

---

## Lifecycle Operations

### Installation

Installation is the process of adding a new blocklet to the server.

**Flow:**

```
install(params)
    │
    ▼
┌─────────────────────────────────────┐
│ Determine install type:             │
│ - RESTORE: from backup              │
│ - URL/STORE: from bundle URL        │
│ - CREATE: new blocklet              │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ _addBlocklet()                      │
│ - Create database record            │
│ - Status: added                     │
│ - Emit: BlockletEvents.added        │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ _downloadAndInstall()               │
│ - Status: added → waiting           │
│ - Status: waiting → downloading     │
│ - Download bundle                   │
│ - Status: downloading → installing  │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ _installBlocklet()                  │
│ - Delete existing process (if any)  │
│ - Update environment variables      │
│ - Run preInstall hook               │
│ - Run postInstall hook              │
│ - Run preFlight hook                │
│ - Status: installing → installed    │
│ - Emit: BlockletEvents.installed    │
│ - Initialize team                   │
└─────────────────────────────────────┘
```

**Key Files:**

- `core/state/lib/blocklet/manager/disk.js`
- `core/state/lib/blocklet/manager/helper/install-application-from-general.js`
- `core/state/lib/blocklet/manager/helper/install-application-from-backup.js`

---

### Upgrade

Upgrade replaces an existing blocklet with a new version.

**Flow:**

```
upgrade(params)
    │
    ▼
┌─────────────────────────────────────┐
│ _downloadAndInstall() with UPGRADE  │
│ - Status: current → waiting         │
│ - Status: waiting → downloading     │
│ - Download new version bundle       │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ _onUpgrade()                        │
│ - Stop existing blocklet process    │
│ - Status: → upgrading               │
│ - Run migration scripts             │
│ - Replace bundle with new version   │
│ - Status: upgrading → installed     │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Post-upgrade                        │
│ - Emit: BlockletEvents.upgraded     │
│ - Refresh routing                   │
│ - Optionally auto-start             │
└─────────────────────────────────────┘
```

**Key Files:**

- `core/state/lib/blocklet/manager/disk.js`
- `core/state/lib/blocklet/manager/helper/upgrade-components.js`
- `core/state/lib/blocklet/manager/helper/blue-green-upgrade-blocklet.js`

---

### Start

Start launches a blocklet process.

**Flow:**

```
start({ did, componentDids, ... })
    │
    ▼
┌─────────────────────────────────────┐
│ Acquire start lock                  │
│ - Prevents concurrent starts        │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Validation                          │
│ - Check blocklet exists             │
│ - Check controller status           │
│ - Check required environments       │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Separate components                 │
│ - Entry components (with engines)   │
│ - Non-entry components (resources)  │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Run preStart hook                   │
│ - Validates required environments   │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Start entry components              │
│ - Sync component config             │
│ - Start blocklet process (PM2)      │
│ - Status: starting → running        │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Start non-entry components          │
│ - Status: installed → running       │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Health check                        │
│ - checkBlockletProcessHealthy()     │
│ - Timeout per health check config   │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Blue-green deployment (if enabled)  │
│ - Emit: blueOrGreenStarted          │
│ - Update router for green instances │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Emit events                         │
│ - BlockletEvents.statusChange       │
│ - BlockletEvents.started            │
└─────────────────────────────────────┘
```

**Key Files:**

- `core/state/lib/blocklet/manager/disk.js` (lines 791-1060)
- `core/state/lib/util/blocklet.js`

---

### Stop

Stop gracefully shuts down a blocklet process.

**Flow:**

```
stop({ did, updateStatus, componentDids, reason, ... })
    │
    ▼
┌─────────────────────────────────────┐
│ Check current status                │
│ - If already stopped, return early  │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Status: running → stopping          │
│ - Emit: BlockletEvents.statusChange │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ deleteBlockletProcess()             │
│ - Stop PM2 process gracefully       │
│ - Wait for process termination      │
│ - Run preStop hook                  │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Status: stopping → stopped          │
│ - Emit: BlockletEvents.statusChange │
│ - Emit: BlockletEvents.stopped      │
└─────────────────────────────────────┘
```

**Key Files:**

- `core/state/lib/blocklet/manager/disk.js` (lines 1277-1365)

---

### Restart

Restart stops and then starts a blocklet.

**Flow:**

```
restart({ did, ... })
    │
    ▼
┌─────────────────────────────────────┐
│ Stop blocklet                       │
│ - Status: running → stopping        │
│ - Wait for process to stop          │
│ - Status: stopping → stopped        │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Start blocklet                      │
│ - Status: stopped → starting        │
│ - Wait for process to start         │
│ - Status: starting → running        │
└─────────────────────────────────────┘
```

---

### Remove

Remove deletes a blocklet from the server.

**Flow:**

```
delete({ did, keepData, keepLogsDir, keepConfigs })
    │
    ▼
┌─────────────────────────────────────┐
│ Validate blocklet is deletable      │
│ - Check isDeletableBlocklet         │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ deleteBlockletProcess()             │
│ - Run preUninstall hook             │
│ - Stop PM2 process                  │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ _deleteBlocklet()                   │
│ - Status: → deleted                 │
│ - Cleanup database records          │
│ - Cleanup file system:              │
│   - Cache directory (if !keepData)  │
│   - Data directory (if !keepData)   │
│   - Logs directory (if !keepLogsDir)│
│   - Configs (if !keepConfigs)       │
│ - Remove team data                  │
│ - Delete Docker network             │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Emit: BlockletEvents.removed        │
│ - Cleanup Docker image (optional)   │
└─────────────────────────────────────┘
```

**Key Files:**

- `core/state/lib/blocklet/manager/disk.js` (lines 1530-1618)

---

## Hooks System

Hooks allow blocklets to execute custom scripts at specific lifecycle points.

### Available Hooks

| Hook           | When Executed                     | Purpose                                    | Exit on Error |
| -------------- | --------------------------------- | ------------------------------------------ | ------------- |
| `preInstall`   | Before installation starts        | Prepare environment, download dependencies | Yes           |
| `postInstall`  | After successful installation     | Post-install configuration                 | No            |
| `preFlight`    | After install, before first start | Final validation before running            | Yes           |
| `preStart`     | Before starting blocklet          | Validate required environments, setup      | Yes           |
| `postStart`    | After successful start            | Initialize services                        | No            |
| `preStop`      | Before stopping blocklet          | Graceful shutdown preparation              | No            |
| `preUninstall` | Before uninstallation/deletion    | Cleanup operations, data migration         | No            |
| `preConfig`    | Before configuration update       | Validate config changes                    | Yes           |

### Hook Configuration

Hooks are defined in `blocklet.yml`:

```yaml
hooks:
  preInstall: scripts/pre-install.sh
  postInstall: scripts/post-install.sh
  preFlight: scripts/pre-flight.sh
  preStart: scripts/pre-start.sh
  postStart: scripts/post-start.sh
  preStop: scripts/pre-stop.sh
  preUninstall: scripts/pre-uninstall.sh
```

### Hook Environment

When hooks execute, they receive:

- `BLOCKLET_HOOK_NAME`: Name of the current hook
- `NODE_OPTIONS`: Security options
- All blocklet environment variables

### Hook Execution

```javascript
// Hook execution flow
const runUserHook = async (label, hookName, args) => {
  // 1. Get hook from blocklet.meta.hooks or blocklet.meta.scripts
  const hook = get(hooks, `[${hookName}]`);

  // 2. Run script with environment
  // 3. Handle errors based on exitOnError setting
  // 4. Create notification on failure
};
```

**Key File:** `core/state/lib/blocklet/hooks.js`

---

## Events System

Events are emitted at various lifecycle points for monitoring and integration.

### Blocklet Events

| Event                         | When Emitted            | Payload                      |
| ----------------------------- | ----------------------- | ---------------------------- |
| `blocklet.added`              | Blocklet record created | `{ did, meta }`              |
| `blocklet.downloadFailed`     | Download failed         | `{ did, error }`             |
| `blocklet.installed`          | Installation complete   | `{ did, meta }`              |
| `blocklet.installFailed`      | Installation failed     | `{ did, error }`             |
| `blocklet.upgraded`           | Upgrade complete        | `{ did, meta, oldVersion }`  |
| `blocklet.removed`            | Blocklet removed        | `{ did }`                    |
| `blocklet.started`            | Started successfully    | `{ did }`                    |
| `blocklet.startFailed`        | Start failed            | `{ did, error }`             |
| `blocklet.stopped`            | Stopped                 | `{ did, reason }`            |
| `blocklet.statusChange`       | Status updated          | `{ did, status, oldStatus }` |
| `blocklet.updated`            | State changed           | `{ did, changes }`           |
| `blocklet.blueOrGreenStarted` | Blue-green deploy       | `{ did, isGreen }`           |

### Component Events

| Event                             | When Emitted             |
| --------------------------------- | ------------------------ |
| `blocklet.componentInstalled`     | Component installed      |
| `blocklet.componentInstallFailed` | Component install failed |
| `blocklet.componentUpgraded`      | Component upgraded       |
| `blocklet.componentUpgradeFailed` | Component upgrade failed |
| `blocklet.componentRemoved`       | Component removed        |

### Internal Events

Internal events are used for inter-process communication:

| Event                              | Purpose                    |
| ---------------------------------- | -------------------------- |
| `blocklet.appConfigChanged`        | App configuration changed  |
| `blocklet.appSettingChanged`       | App setting changed        |
| `blocklet._componentInstalled`     | Internal component install |
| `blocklet._componentUpgraded`      | Internal component upgrade |
| `blocklet._componentUpdated`       | Internal component update  |
| `blocklet._componentStarted`       | Internal component start   |
| `blocklet._componentStopped`       | Internal component stop    |
| `blocklet._componentRemoved`       | Internal component remove  |
| `blocklet._componentConfigChanged` | Internal config change     |
| `blocklet.componentsUpdated`       | Components updated         |

### Event Handlers

Key event handlers and their actions:

| Event                         | Handler Action                                       |
| ----------------------------- | ---------------------------------------------------- |
| `blocklet.added`              | Early routing setup for DNS warm-up                  |
| `blocklet.installed`          | Full routing setup + DID document update             |
| `blocklet.upgraded`           | Backup sites, update routing                         |
| `blocklet.removed`            | Cleanup routing, set DID document state to "deleted" |
| `blocklet.started`            | Update DID document state + runtime monitoring       |
| `blocklet.stopped`            | Update DID document state                            |
| `blocklet.blueOrGreenStarted` | Update routing for green instances                   |

**Key File:** `core/state/lib/event/index.js`

---

## Component Lifecycle

Components are child blocklets that run within a parent blocklet.

### Component Structure

```javascript
blocklet.children = [
  {
    meta: {
      did: 'component-did',
      name: 'component-name',
      title: 'Component Title',
      version: '1.0.0',
      // ... other metadata
    },
    status: BlockletStatus.running,
    greenStatus: BlockletStatus.running, // for blue-green
    mountPoint: '/api/component',
    environments: [
      { key: 'BLOCKLET_APP_DIR', value: '/path/to/app' },
      // ... other env vars
    ],
    ports: {
      BLOCKLET_PORT: 8090,
    },
  },
];
```

### Component Installation

```
installComponent({ rootDid, mountPoint, url|file, ... })
    │
    ▼
┌─────────────────────────────────────┐
│ Choose source:                      │
│ - installComponentFromUpload()      │
│ - installComponentFromUrl()         │
│ - installComponentFromDev()         │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Download component bundle           │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Extract and validate metadata       │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Register as child in parent blocklet│
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Emit events:                        │
│ - BlockletEvents.componentInstalled │
│ - BlockletInternalEvents            │
└─────────────────────────────────────┘
```

### Component Status Aggregation

Parent blocklet status is computed from children:

- If any child is `error` → parent is `error`
- If any child is `running` → parent is `running`
- If all children are `stopped` → parent is `stopped`
- Otherwise → parent inherits most significant child status

### Component Deletion

```
deleteComponent({ did, rootDid, keepData, keepState })
    │
    ▼
┌─────────────────────────────────────┐
│ Remove from blocklet.children array │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Optionally keep metadata in         │
│ "deleted children" list             │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Cleanup directories (if !keepData)  │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Emit events:                        │
│ - BlockletEvents.componentRemoved   │
│ - BlockletInternalEvents            │
└─────────────────────────────────────┘
```

**Key Files:**

- `core/state/lib/blocklet/manager/disk.js`
- `core/state/lib/blocklet/manager/helper/install-component-*.js`

---

## Blue-Green Deployment

Blue-green deployment enables zero-downtime upgrades by running two versions simultaneously.

### Concept

```
Traditional Deployment:
  v1 (blue) ← all traffic

Blue-Green Deployment:
  v1 (blue)  ← current traffic
  v2 (green) ← prepared, testing

After validation:
  v1 (blue)  ← backup/rollback
  v2 (green) ← all traffic
```

### State Storage

```javascript
blocklet = {
  status: BlockletStatus.running, // blue instance status
  greenStatus: BlockletStatus.running, // green instance status
  children: [
    {
      status: BlockletStatus.running, // blue
      greenStatus: BlockletStatus.running, // green
      ports: { BLOCKLET_PORT: 8090 }, // blue ports
      greenPorts: { BLOCKLET_PORT: 8091 }, // green ports
    },
  ],
};
```

### Deployment Flow

```
Blue-Green Upgrade Flow:
    │
    ▼
┌─────────────────────────────────────┐
│ Download new bundle                 │
│ - greenStatus: downloading          │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Extract & prepare green instance    │
│ - greenStatus: installing           │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Validate health check               │
│ - greenStatus: installed            │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Start green instance                │
│ - greenStatus: running              │
│ - Emit: blueOrGreenStarted          │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Router switches traffic to green    │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Optionally:                         │
│ - Keep blue as fallback             │
│ - Or shut down blue                 │
└─────────────────────────────────────┘
```

### Configuration

Disable blue-green deployment:

```bash
export ABT_NODE_DISABLE_BLUE_GREEN=1
```

**Key Files:**

- `core/state/lib/blocklet/manager/helper/blue-green-start-blocklet.js`
- `core/state/lib/blocklet/manager/helper/blue-green-upgrade-blocklet.js`
- `core/state/lib/blocklet/manager/helper/blue-green-get-componentids.js`

---

## Process Management

Blocklet Server uses PM2 for process lifecycle management.

### PM2 Integration

```javascript
// Process configuration
{
  name: "blocklet-{did}",
  script: "blocklet.js",           // entry file
  cwd: "/path/to/blocklet/app",
  env: {
    // All blocklet environment variables
    BLOCKLET_APP_DIR: "/path/to/app",
    BLOCKLET_DATA_DIR: "/path/to/data",
    BLOCKLET_LOG_DIR: "/path/to/logs",
    // ... more env vars
  },
  error_file: "/path/to/logs/error.log",
  out_file: "/path/to/logs/out.log",
  max_memory_restart: "512M"       // from blocklet.meta
}
```

### Process Operations

```javascript
// Start process
startBlockletProcess({ blocklet, component, env, ... })
  - Prepare environment variables
  - Create PM2 process configuration
  - Execute start command via PM2
  - Return process info

// Stop process
stopBlockletProcess({ blocklet, ... })
  - Send SIGTERM to process
  - Wait for graceful shutdown (timeout: 30s)
  - If timeout, send SIGKILL
  - Remove PM2 process entry

// Health check
checkBlockletProcessHealthy({ blocklet, timeout })
  - Check process status via PM2
  - Verify process is running
  - Return health status
```

### Process State Tracking

- State stored in database (Sequelize model)
- Real-time status via PM2 queries
- Status calculated from children component status
- Utility: `getBlockletStatus()` computes aggregate status

**Key Files:**

- `core/state/lib/util/blocklet.js`
- `core/state/lib/blocklet/manager/disk.js`

---

## Error Handling and Recovery

### Error Handling by Phase

| Phase        | Error Action                         | Recovery                  |
| ------------ | ------------------------------------ | ------------------------- |
| Download     | Emit `downloadFailed`, rollback      | Restore to previous state |
| Installation | Emit `installFailed`, cleanup        | Retry install             |
| Start        | Emit `startFailed`, set error status | Retry start               |
| Upgrade      | Emit `upgradeFailed`, rollback       | Restore previous version  |
| Delete       | Log error, continue cleanup          | Manual cleanup if needed  |

### Rollback Mechanism

```javascript
_rollback(action, did, oldBlocklet) {
  // 1. Restore blocklet to previous state (if oldBlocklet provided)
  // 2. Update database status back to previous
  // 3. Emit rollback completion event
  // 4. Create notification about rollback
  // 5. Keep backup for recovery
}

// RollbackCache class
class RollbackCache {
  // Stores backup of blocklet before upgrade
  // Can restore: database state, bundle files
  // Cleanup after successful completion
}
```

### Transactional Safety

```javascript
// Status Lock (DBCache)
{
  prefix: 'blocklet-status-lock',
  TTL: 120, // seconds
  // Prevents concurrent status updates
  // Ensures consistency during async operations
}

// Port Assignment Lock
{
  // Prevents duplicate port assignment
  // Validates port availability atomically
  // Hash-based deterministic allocation
}
```

**Key Files:**

- `core/state/lib/blocklet/manager/disk.js`
- `core/state/lib/blocklet/manager/helper/rollback-cache.js`

---

## State Persistence

### Database Model

Blocklet state is persisted using Sequelize ORM:

```javascript
Blocklet = {
  id: Integer, // Primary key
  appPid: String, // Application DID
  meta: JSON, // Blocklet metadata
  status: Integer, // Current status (BlockletStatus)
  greenStatus: Integer, // Green deployment status
  environments: JSON, // Environment variables array
  children: JSON, // Child components array
  settings: JSON, // Configuration/preferences
  ports: JSON, // Assigned ports mapping
  migratedFrom: JSON, // Migration history
  controller: JSON, // Authorization info
  tokens: JSON, // Download tokens
};
```

### Related Tables

| Table             | Purpose                |
| ----------------- | ---------------------- |
| `blocklet`        | Main blocklet records  |
| `blocklet_children` | Child component state  |
| `blocklet_extras` | Extra settings/configs |

### State Management Methods

```javascript
// Set blocklet status
setBlockletStatus(did, status, { componentDids, operator, isGreen });
// Updates blocklet.status or blocklet.greenStatus
// Updates child.status if componentDids provided
// Validates status transition
// Logs operation for audit

// Get blocklet status
getBlockletStatus(did);
// Calculates aggregate status from children
// Returns computed status

// Get full blocklet
getBlocklet(did);
// Loads blocklet with all children
// Loads blocklet extras (settings)
// Decrypts sensitive data
// Returns full blocklet state

// Update blocklet
updateBlocklet(did, updates);
// Merge updates into blocklet record
// Validates integrity
// Saves to database

// Add new blocklet
addBlocklet(params);
// Create new blocklet record
// Assign ports
// Initialize environments
// Return new blocklet
```

### Encryption

Sensitive data is encrypted at rest:

- `appSk` (application secret key)
- API keys in environments
- Configuration values

Encryption uses a Data Encryption Key (DEK) derived from node configuration.

### Persistence Guarantees

- **Atomicity**: Status updates use locks
- **Consistency**: Validation on save
- **Isolation**: DBCache locks prevent conflicts
- **Durability**: SQLite/PostgreSQL persistence

**Key File:** `core/state/lib/states/blocklet.js`

---

## Quick Reference

### Lifecycle Summary Table

| Operation | Status Flow                                            | Hooks                              | Events                                                   |
| --------- | ------------------------------------------------------ | ---------------------------------- | -------------------------------------------------------- |
| Install   | added → waiting → downloading → installing → installed | preInstall, postInstall, preFlight | added, downloading, installing, installed, installFailed |
| Upgrade   | current → downloading → upgrading → installed          | preInstall, postInstall            | downloading, upgrading, upgraded, upgradeFailed          |
| Start     | installed/stopped → starting → running                 | preStart, postStart                | starting, started, startFailed                           |
| Stop      | running → stopping → stopped                           | preStop                            | stopping, stopped                                        |
| Restart   | running → stopping → starting → running                | preStop, preStart                  | stopping, starting, started                              |
| Remove    | any → deleted                                          | preUninstall                       | removed                                                  |
| Config    | installed/stopped                                      | preConfig                          | updated                                                  |

### Key Files Reference

| Component         | File Path                                                |
| ----------------- | -------------------------------------------------------- |
| Status/Constants  | `blocklet/constant/index.js`                             |
| Lifecycle Manager | `core/state/lib/blocklet/manager/disk.js`                |
| Event Handler     | `core/state/lib/event/index.js`                          |
| State Storage     | `core/state/lib/states/blocklet.js`                      |
| Hooks System      | `core/state/lib/blocklet/hooks.js`                       |
| Install Helpers   | `core/state/lib/blocklet/manager/helper/`                |
| Blue-Green Deploy | `core/state/lib/blocklet/manager/helper/blue-green-*.js` |
| Downloader        | `core/state/lib/blocklet/downloader/`                    |
| Process Utilities | `core/state/lib/util/blocklet.js`                        |
