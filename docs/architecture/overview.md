# App and Component Model

This document describes the entity model for apps and components (blocklets) running in Blocklet Server.

## Conceptual Overview

Blocklet Server follows an iOS-like architecture:

| Concept   | Blocklet Server           | iOS Equivalent       |
| --------- | ------------------------- | -------------------- |
| Runtime   | Blocklet Server           | iOS                  |
| App       | Blocklet (App)            | iOS App              |
| Extension | BlockletChild (Component) | App Extension/Widget |
| App Store | Blocklet Store            | App Store            |

## Entity Hierarchy

```
Server (Node)
└── Blocklet (App)
     ├── BlockletExtra (metadata/settings)
     ├── BlockletChild (Component)
     │    └── BlockletChild (recursive nesting)
     └── Site (routing/domain)
```

## Core Entities

### Server

The root entity representing the Blocklet Server instance.

| Field         | Type    | Description                       |
| ------------- | ------- | --------------------------------- |
| `did`         | string  | Server's unique DID (primary key) |
| `pk`          | string  | Public key                        |
| `sk`          | string  | Secret key                        |
| `version`     | string  | Server version                    |
| `port`        | number  | Main listening port               |
| `routing`     | object  | Routing configuration             |
| `mode`        | string  | Operational mode                  |
| `initialized` | boolean | Setup status                      |

### Blocklet (App)

The main application entity installed on the server.

| Field          | Type          | Description                                                  |
| -------------- | ------------- | ------------------------------------------------------------ |
| `id`           | string        | Primary key (generated UUID, internal use only)              |
| `appDid`       | string        | Wallet address from `blockletInfo.wallet.address` (indexed)  |
| `appPid`       | string        | Equals `meta.did`, the primary blocklet identifier (indexed) |
| `mode`         | string        | "production", "development", etc.                            |
| `meta`         | TBlockletMeta | Blocklet metadata from blocklet.yml                          |
| `meta.did`     | string        | Blocklet DID, same as `appPid`                               |
| `status`       | number        | BlockletStatus enum                                          |
| `source`       | number        | BlockletSource enum                                          |
| `bundleSource` | object        | Bundle information                                           |
| `port`         | number        | Service port                                                 |
| `ports`        | object        | Multiple ports mapping                                       |
| `deployedFrom` | string        | Source URL                                                   |
| `environments` | array         | Environment variables                                        |
| `createdAt`    | Date          | Creation timestamp                                           |
| `installedAt`  | Date          | Installation timestamp                                       |
| `startedAt`    | Date          | Last start timestamp                                         |
| `stoppedAt`    | Date          | Last stop timestamp                                          |

**Key Identity Fields:**

- `id`: Database UUID, for internal foreign key relationships only
- `appDid`: Wallet address, used for signing DID-based transactions
- `appPid`: Primary identifier (`= meta.did`), used for blocklet operations and team scoping
- `meta.did`: Blocklet DID from blocklet.yml, equals `appPid`

### BlockletChild (Component)

Child blocklets/components nested within a parent blocklet.

| Field               | Type   | Description                                         |
| ------------------- | ------ | --------------------------------------------------- |
| `id`                | string | Primary key (generated UUID, internal use only)     |
| `parentBlockletId`  | string | FK to parent Blocklet.id (UUID)                     |
| `parentBlockletDid` | string | Parent's `appPid` (= parent's `meta.did`) (indexed) |
| `childDid`          | string | Child's DID from `child.meta.did` (indexed)         |
| `mountPoint`        | string | Path where child is mounted                         |
| `meta`              | object | Child metadata from blocklet.yml                    |
| `meta.did`          | string | Child's DID, same as `childDid`                     |
| `bundleSource`      | object | Bundle info                                         |
| `source`            | number | Source type                                         |
| `deployedFrom`      | string | Deployment URL                                      |
| `mode`              | string | Operational mode                                    |
| `status`            | number | Status enum                                         |
| `ports`             | object | Port mappings                                       |
| `environments`      | array  | Environment variables                               |
| `installedAt`       | Date   | Installation timestamp                              |
| `startedAt`         | Date   | Last start timestamp                                |
| `stoppedAt`         | Date   | Last stop timestamp                                 |
| `greenStatus`       | number | Health status                                       |
| `greenPorts`        | object | Health-checked ports                                |

**Key Identity Fields:**

- `id`: Database UUID for internal relationships
- `parentBlockletId`: References parent's `Blocklet.id` (UUID)
- `parentBlockletDid`: References parent's `appPid` (DID)
- `childDid`: Component's DID (`= meta.did`), used for component identification
- `meta.did`: Original component DID, equals `childDid`

> **Note**: Children can be nested recursively (self-referential relationships through `hasMany` association).

### BlockletExtra

Metadata and configuration container for blocklets.

| Field        | Type                 | Description                                                              |
| ------------ | -------------------- | ------------------------------------------------------------------------ |
| `did`        | string               | Primary key (blocklet's DID, equals `meta.did`)                          |
| `appDid`     | string               | **Actually stores `appPid`** (= blocklet `meta.did`), not wallet address |
| `meta`       | TSimpleBlockletMeta  | Simplified metadata                                                      |
| `controller` | TBlockletController  | NFT controller info                                                      |
| `configs`    | TConfigEntry[]       | Configuration entries                                                    |
| `children`   | TChildExtraConfigs[] | Child configurations                                                     |
| `settings`   | TBlockletSettings    | Settings for blocklet                                                    |
| `expiredAt`  | string               | Expiration date                                                          |

> **Important**: Despite its name, `BlockletExtra.appDid` actually stores the blocklet's `appPid` (which equals `meta.did`), not the wallet address. This is a historical naming inconsistency in the schema.

### Site

Domain and routing configuration.

| Field                | Type           | Description                  |
| -------------------- | -------------- | ---------------------------- |
| `id`                 | string         | Primary key (generated UUID) |
| `domain`             | string         | Main domain (unique)         |
| `domainAliases`      | string[]       | Alternative domains          |
| `name`               | string         | Display name                 |
| `isProtected`        | boolean        | Protection status            |
| `rules`              | TRoutingRule[] | Routing rules                |
| `port`               | number         | Listening port               |
| `corsAllowedOrigins` | string[]       | CORS configuration           |

## DID Identification System

All entities are identified using DIDs (Decentralized Identifiers):

| DID Type        | Location                          | Source/Derivation               | Purpose                                      |
| --------------- | --------------------------------- | ------------------------------- | -------------------------------------------- |
| **Server DID**  | `Server.did`                      | Server's DID Wallet             | Identifies the entire node                   |
| **App DID**     | `Blocklet.appDid`                 | `blockletInfo.wallet.address`   | Blocklet's wallet address (for transactions) |
| **App PID**     | `Blocklet.appPid`                 | `blocklet.meta.did`             | Blocklet's DID (primary identifier)          |
| **Team DID**    | Used in APIs                      | `= blocklet.appPid`             | Scoping identifier for team-based resources  |
| **Meta DID**    | `blocklet.meta.did`               | Blocklet metadata               | Original blocklet DID from blocklet.yml      |
| **Child DID**   | `BlockletChild.childDid`          | `child.meta.did`                | Identifies child components                  |
| **Parent DID**  | `BlockletChild.parentBlockletDid` | Parent's `appPid` or `meta.did` | Links child to parent                        |
| **Database ID** | `Blocklet.id`                     | Auto-generated UUID             | Database primary key (internal use only)     |

### Key Relationships

```javascript
// Core identities for a Blocklet App
blocklet.id; // UUID - database primary key (e.g., "a1b2c3d4-...")
blocklet.appDid; // Wallet address (e.g., "z1abc...") - for signing transactions
blocklet.appPid; // = blocklet.meta.did - primary DID identifier
blocklet.meta.did; // Original DID from blocklet.yml (e.g., "z8iZrkWY...")

// Team scoping
teamDid = blocklet.appPid; // Used in teamManager.getAgentState(teamDid)

// Component identification
component.meta.did; // Component's DID (used as childDid in BlockletChild table)
child.childDid; // = component.meta.did
child.parentBlockletDid; // = parent.appPid (or parent.meta.did)
```

### Usage Patterns

1. **Primary Identifier**: Use `appPid` (which equals `meta.did`) for identifying blocklets in most contexts
2. **Wallet Operations**: Use `appDid` (wallet address) when signing transactions or DID-based authentication
3. **Database Queries**: Use `id` (UUID) for internal database relationships and foreign keys
4. **Team Scoping**: Use `teamDid` (equals `appPid`) when accessing team-scoped resources via `teamManager`
5. **Component References**: Use `meta.did` for both parent and child component identification

## Parent-Child Relationship

```
┌──────────────────────────────────────────────────────────────┐
│ Blocklet (Parent App)                                        │
│ ├── id: "uuid-123" (DB primary key)                         │
│ ├── appDid: "z1wallet..." (wallet address)                  │
│ ├── appPid: "z8iZrkWY..." (= meta.did, primary identifier)  │
│ └── meta.did: "z8iZrkWY..." (from blocklet.yml)             │
│      │                                                       │
│      ├── BlockletChild (Component A)                         │
│      │   ├── id: "uuid-456" (DB primary key)                │
│      │   ├── parentBlockletId: "uuid-123"                   │
│      │   ├── parentBlockletDid: "z8iZrkWY..."               │
│      │   ├── childDid: "z8iZabc..." (= child.meta.did)      │
│      │   ├── meta.did: "z8iZabc..."                         │
│      │   └── mountPoint: "/api"                             │
│      │                                                       │
│      └── BlockletChild (Component B)                         │
│          ├── id: "uuid-789" (DB primary key)                │
│          ├── parentBlockletId: "uuid-123"                   │
│          ├── parentBlockletDid: "z8iZrkWY..."               │
│          ├── childDid: "z8iZdef..." (= child.meta.did)      │
│          ├── meta.did: "z8iZdef..."                         │
│          └── mountPoint: "/admin"                           │
└──────────────────────────────────────────────────────────────┘
```

**Note**: The relationship shows that:

- Parent's `appPid` equals parent's `meta.did` ("z8iZrkWY...")
- This becomes the `parentBlockletDid` for children
- Each child's `childDid` equals that child's `meta.did`
- Database relationships use UUID `id` fields, not DIDs

## Identifier Selection Guide

When writing code that references blocklets, choose the appropriate identifier:

| Scenario                          | Use This Identifier           | Example                                               |
| --------------------------------- | ----------------------------- | ----------------------------------------------------- |
| **Querying blocklet in database** | `appPid` or `meta.did`        | `blockletManager.detail({ did: appPid })`             |
| **Accessing team-scoped state**   | `teamDid` (= `appPid`)        | `teamManager.getAgentState(teamDid)`                  |
| **Wallet/DID transactions**       | `appDid` (wallet address)     | `{ appDid: wallet.address, appSk: wallet.secretKey }` |
| **Database foreign keys**         | `id` (UUID)                   | `parentBlockletId: blocklet.id`                       |
| **Component lifecycle events**    | `componentDid` (= `meta.did`) | `{ componentDid: child.meta.did }`                    |
| **Backup/Restore operations**     | Both `appDid` and `appPid`    | `new SpacesBackup({ appDid, appPid })`                |
| **Router configuration**          | `did` (typically `appPid`)    | `routing.to.did`                                      |

### Code Examples

```javascript
// ✅ Correct: Use appPid for blocklet operations
const blocklet = await blockletManager.detail({ did: blocklet.appPid });

// ✅ Correct: Use teamDid (= appPid) for team-scoped resources
const agentState = await teamManager.getAgentState(blocklet.appPid);

// ✅ Correct: Use appDid for wallet operations
const sender = {
  appDid: blockletInfo.wallet.address, // This is appDid
  appSk: blockletInfo.wallet.secretKey,
};

// ✅ Correct: Use id for database relationships
await BlockletChild.findAll({
  where: { parentBlockletId: blocklet.id }, // Use UUID id, not DID
});

// ✅ Correct: Use meta.did for component identification
const componentDid = child.meta.did;
await processComponentInstall({ appPid, componentDid, children });

// ❌ Wrong: Don't use id (UUID) for external APIs
// Bad: blockletManager.detail({ did: blocklet.id })  // UUID won't work

// ❌ Wrong: Don't use appDid for team scoping
// Bad: teamManager.getAgentState(blocklet.appDid)  // Use appPid instead
```

## Routing Architecture

Sites route incoming requests to blocklets via routing rules:

```typescript
interface TRoutingRule {
  id: string;
  from: {
    pathPrefix: string; // URL path match
    header: TRoutingRuleHeader[]; // Header matching
  };
  to: {
    port: number; // Target port
    type: BackendServiceType; // Type of service
    did: string; // Target blocklet DID
    url: string; // Direct URL
    redirectCode: number; // HTTP redirect code
    interfaceName: string; // Interface name
    componentId: string; // Component ID
    pageGroup: string; // Page group
  };
  isProtected: boolean; // Authentication required
}
```

## Database Tables

| Table               | Primary Key | Indexes                                                       |
| ------------------- | ----------- | ------------------------------------------------------------- |
| `servers`           | `did`       | -                                                             |
| `blocklets`         | `id`        | `appDid`, `appPid`                                            |
| `blocklet_children` | `id`        | `parentBlockletId`, `parentBlockletDid`, `childDid`, `status` |
| `blocklet_extras`   | `did`       | `appDid`, `createdAt`                                         |
| `sites`             | `id`        | `domain` (unique)                                             |

## App Uptime Tracking

The parent blocklet's `startedAt` and `stoppedAt` fields track when the app starts and stops:

- **App is running**: At least 1 child component has `status === running` or `greenStatus === running`
- **App is stopped**: All children are not running

### State Transitions

| Transition            | Trigger                  | Action                                           |
| --------------------- | ------------------------ | ------------------------------------------------ |
| Not running → Running | First child starts       | Set parent `startedAt = now`, `stoppedAt = null` |
| Running → Not running | Last running child stops | Set parent `stoppedAt = now`, `startedAt = null` |

### Implementation

The `syncUptimeStatus` method in `BlockletState` handles this synchronization:

1. Called automatically from `setBlockletStatus` after child status updates
2. Called on server startup (first cycle of `EnsureBlockletRunning`) to handle crash recovery

## Historical Note

The `blocklet_children` table was introduced in migration `20251205000000-blocklet-children-split` to improve performance. Previously, children were stored as a JSON array in `Blocklet.children`. The dedicated table enables:

- Indexed queries on parent/child relationships
- Better status tracking with composite indexes
- Improved data integrity through relational structure
