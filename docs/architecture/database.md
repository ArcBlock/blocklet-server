# Database Architecture in Blocklet Server

This document describes how databases are handled in blocklet-server and blocklets managed by the server.

## Overview

Blocklet Server uses a multi-database architecture:

```
blocklet-server/
├── Server Database (server.db)
│   ├── 40+ tables (users, blocklets, sessions, etc.)
│   └── SQLite (default) or PostgreSQL (enterprise)
│
├── Per-Blocklet Databases (blocklet.db)
│   ├── Isolated per blocklet
│   ├── User, Session, Passport, RBAC, etc.
│   └── Own migration system
│
└── Cache Layer
    ├── Redis (primary)
    └── SQLite (fallback)
```

## 1. Database Types

### SQLite (Default)

- **Use Case**: Standard deployments
- **Location**: `{dataDir}/core/server.db`
- **Features**: WAL mode, auto-checkpoint, busy timeout

### PostgreSQL (Enterprise)

- **Use Case**: Enterprise/high-availability deployments
- **Configuration**: Set `ABT_NODE_POSTGRES_URL` environment variable
- **Features**: Connection pooling, better concurrency

### Redis (Caching)

- **Use Case**: Distributed caching
- **Configuration**: Set `ABT_NODE_CACHE_REDIS_URL` environment variable
- **Fallback**: SQLite-based cache when Redis unavailable

## 2. Database Configuration

**File:** `core/models/lib/models/index.js:125-192`

### SQLite Performance Settings

```javascript
// Applied via PRAGMA statements
PRAGMA journal_mode = WAL;       // Write-Ahead Logging for better concurrency
PRAGMA busy_timeout = 5000;      // 5s lock timeout
PRAGMA cache_size = -2000;       // 2MB page cache (or 6000 with ABT_NODE_SQLITE_LARGE_CACHE)
PRAGMA auto_optimize = 1;        // Automatic query optimization
PRAGMA wal_autocheckpoint = 1000; // Checkpoint every 1000 pages
```

### Connection Pooling

**File:** `core/models/lib/migrate.js:18-34`

| Context | Max Connections | Min | Idle Timeout | Eviction |
|---------|-----------------|-----|--------------|----------|
| Standard | 2 | 0 | 10s | 10s |
| Migration | 1 | 0 | 3s | 3s |

### Memory Management

- Global memory cleanup runs every 10 minutes
- SQLite `PRAGMA shrink_memory` called periodically
- Configurable via `ABT_NODE_SQLITE_LARGE_CACHE` flag

## 3. Models Organization

**File:** `core/models/lib/models/index.js`

### Server Models (40+ tables)

Located in `core/models/lib/models/`:

```
AccessKey          - API access keys
AuditLog           - System audit logs
Backup             - Backup records
Blacklist          - IP/user blacklist
Blocklet           - Installed blocklets
BlockletChild      - Blocklet child components
BlockletExtra      - Extended blocklet metadata
Cache              - Persistent cache entries
ConnectedAccount   - OAuth connected accounts
Job                - Background jobs
Migration          - Migration tracking
Notification       - System notifications
Org                - Organizations
OrgResource        - Organization resources
Passport           - User passports (DIDs)
PassportLog        - Passport activity logs
Rbac               - Role-based access control
RuntimeInsight     - Runtime metrics
Server             - Server configuration
Session            - User sessions
Site               - Routing sites
Tag                - Tags
Tagging            - Tag associations
TrafficInsight     - Traffic analytics
User               - User accounts
UserOrg            - User-organization mappings
WebHook            - Webhook configurations
```

### Blocklet Models (Per-Blocklet)

**File:** `core/models/lib/models/index.js:221-252`

Each blocklet gets its own database with these models:

```
User               - Blocklet users
UserSession        - User sessions
Passport           - User passports
PassportLog        - Passport activity
ConnectedAccount   - OAuth accounts
Session            - Sessions
Rbac               - Permissions
Tag                - Tags
Tagging            - Tag associations
Project            - Projects
Release            - Releases
Notification       - Notifications
VerifyCode         - Verification codes
SecurityRule       - Security rules
AccessPolicy       - Access policies
ResponseHeaderPolicy - Response headers
WebhookEndpoint    - Webhook endpoints
WebhookAttempt     - Webhook attempts
WebhookEvent       - Webhook events
OauthClient        - OAuth clients
OauthCode          - OAuth codes
AccessKey          - API access keys
```

## 4. Migration System

**File:** `core/models/lib/migrate.js:10-47`

### Migration Framework

Uses **Umzug** for managing database migrations with 5 database groups:

| Group | Database | Purpose |
|-------|----------|---------|
| `server` | server.db | Main server tables |
| `blocklet` | blocklet.db | Per-blocklet tables |
| `service` | service.db | Service tables |
| `certificate-manager` | certs.db | SSL certificates |
| `connect` | connect.db | DID Connect |

### Migration Files Location

```
core/models/lib/migrations/
├── server/
│   ├── 20230422000000-genesis.js      # Initial schema
│   ├── 20230501000000-backup.js       # Backup tables
│   ├── 20240101000000-tokens.js       # Token tables
│   └── ... (20+ migration files)
│
├── blocklet/
│   ├── 20230422000000-genesis.js      # Initial blocklet schema
│   ├── 20230601000000-tags.js         # Tags support
│   └── ... (migration files)
│
└── common/
    └── ... (shared migrations)
```

### Safe Migration Utilities

**File:** `core/models/lib/migrate.js:48-130`

```javascript
// Idempotent column changes
safeApplyColumnChanges(queryInterface, tableName, columns)

// Safe index creation with prefix support
safeAddIndex(queryInterface, tableName, columns, options)

// Safe table creation
createTableIfNotExists(queryInterface, tableName, schema)

// Safe table removal
dropTableIfExists(queryInterface, tableName)

// Safe table introspection
safeDescribeTable(queryInterface, tableName)
```

### Running Migrations

Migrations run automatically during:
1. Server startup (version upgrade detection)
2. Blocklet installation
3. Blocklet upgrade

```javascript
// Example: Run server migrations
await doSchemaMigration(databasePath, 'server');

// Example: Run blocklet migrations
await doSchemaMigration(blockletDbPath, 'blocklet');
```

## 5. State Management

**File:** `core/state/lib/states/index.js`

### State Factory Pattern

```javascript
const createStates = (node) => {
  const models = getModels(databasePath);

  return {
    node: new NodeState(models),
    blocklet: new BlockletState(models),
    user: new UserState(models),
    session: new SessionState(models),
    routing: new RoutingState(models),
    rbac: new RbacState(models),
    passport: new PassportState(models),
    notification: new NotificationState(models),
    auditLog: new AuditLogState(models),
    // ... 15+ state managers
  };
};
```

### Key State Classes

| State Class | File | Purpose |
|-------------|------|---------|
| `NodeState` | `states/node.js:30-96` | Server configuration, metadata |
| `BlockletState` | `states/blocklet.js:30-100` | Installed blocklets, port assignment |
| `UserState` | `states/user.js` | User management, authentication |
| `RoutingState` | `states/routing.js` | Route rules, sites |
| `RbacState` | `states/rbac.js` | Roles, permissions |
| `SessionState` | `states/session.js` | Session management |
| `PassportState` | `states/passport.js` | DID passports |

### Base State Class

**File:** `core/models/lib/states/base.js`

All state classes extend `BaseState` which provides:
- Model access
- Caching integration
- Common CRUD operations
- Count caching (2-minute TTL)

## 6. Per-Blocklet Database Creation

**File:** `core/state/lib/team/manager.js`

### Database Creation Flow

```
1. Blocklet installed or first accessed
       ↓
2. TeamManager.initModel(blockletDid)
   (lines 1010-1027)
       ↓
3. Determine database path
   Path: {BLOCKLET_DATA_DIR}/blocklet.db
   (lines 996-1008)
       ↓
4. Create new Sequelize instance
       ↓
5. Acquire distributed lock
   (prevent race conditions)
       ↓
6. Run migrations
   doSchemaMigration(dbPath, 'blocklet')
   (lines 1029-1045)
       ↓
7. Create state instances
   (User, Passport, Session, Rbac, etc.)
       ↓
8. Database ready for use
```

### Data Directory Structure

```
{dataDir}/
├── core/
│   ├── server.db              # Server database
│   └── db-cache.db            # SQLite cache (fallback)
│
└── data/
    ├── blocklet-a/
    │   ├── blocklet.db        # Blocklet A's database
    │   └── .cache/            # Blocklet A's cache
    │
    └── blocklet-b/
        ├── blocklet.db        # Blocklet B's database
        └── .cache/            # Blocklet B's cache
```

### Team State Creation

**File:** `core/state/lib/team/manager.js:742-750`

```javascript
const createTeamState = async (did) => {
  const models = await initModels(did);

  return {
    user: new UserState(models),
    tag: new TagState(models),
    passport: new PassportState(models),
    session: new SessionState(models),
    rbac: createRBAC({
      storage: new SequelizeStorage(models)
    }),
  };
};
```

## 7. Caching Layer

**File:** `core/db-cache/src/index.ts:12-24`

### Architecture

```
Application Request
       ↓
   DBCache API
       ↓
┌──────────────────┐
│  Redis (primary) │ ← ABT_NODE_CACHE_REDIS_URL
└────────┬─────────┘
         │ fallback
         ↓
┌──────────────────┐
│ SQLite (backup)  │ ← ABT_NODE_CACHE_SQLITE_PATH
└──────────────────┘
```

### Cache Configuration

```javascript
const cache = new DBCache({
  redisUrl: process.env.ABT_NODE_CACHE_REDIS_URL,
  sqlitePath: process.env.ABT_NODE_CACHE_SQLITE_PATH ||
              `${dataDir}/core/db-cache.db`,
  ttl: 3600000, // 1 hour default
});
```

### Cache Usage Examples

```javascript
// Node state: server config caching
const nodeInfo = await cache.get('node:info', async () => {
  return await models.Server.findOne();
}, { ttl: SERVER_CACHE_TTL });

// Blocklet state: port assignment with distributed lock
const portLock = await cache.lock(`port:${port}`, 30000);
try {
  // Assign port
} finally {
  await portLock.release();
}

// General caching
await cache.set('key', value, { ttl: 60000 });
const value = await cache.get('key');
await cache.del('key');
```

### Cache TTLs by Context

| Context | TTL | Purpose |
|---------|-----|---------|
| Node info | 1 hour | Server configuration |
| Blocklet info | 1 hour | Blocklet metadata |
| Security config | 24 hours | Access policies |
| Session token | 1 hour | Login tokens |
| Port lock | 30 seconds | Port assignment |
| Count cache | 2 minutes | Record counts |

## 8. Transaction Handling

### Sequelize Transactions

```javascript
// Example from migration
const transaction = await sequelize.transaction();

try {
  await queryInterface.addColumn('users', 'newField', {
    type: DataTypes.STRING,
  }, { transaction });

  await queryInterface.addIndex('users', ['newField'], { transaction });

  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

### Distributed Locking

**File:** `core/state/lib/states/blocklet.js:62-100`

```javascript
// Port assignment with distributed lock
const assignPort = async (blockletDid) => {
  const lockKey = `blocklet:port:assign`;
  const lock = await cache.lock(lockKey, 30000);

  try {
    const port = await findAvailablePort();
    await models.Blocklet.update({ port }, { where: { did: blockletDid } });
    return port;
  } finally {
    await lock.release();
  }
};
```

## 9. Blocklet Migration Handling

**File:** `core/state/lib/blocklet/migration.js`

### Upgrade Migration Flow

```
1. Blocklet upgrade triggered
       ↓
2. Backup current database
   (lines 44-50)
       ↓
3. Run blocklet migration scripts
   (from blocklet's app directory)
       ↓
4. On success: continue
   On failure: restore backup
   (lines 70-77)
       ↓
5. Update migration version
```

### Blocklet-Specific Migrations

Blocklets can define their own migrations in:
```
{blocklet-app-dir}/migrations/
├── 001-initial.js
├── 002-add-feature.js
└── ...
```

## 10. Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `ABT_NODE_POSTGRES_URL` | PostgreSQL connection string | None (uses SQLite) |
| `ABT_NODE_CACHE_REDIS_URL` | Redis URL for caching | None (uses SQLite) |
| `ABT_NODE_CACHE_SQLITE_PATH` | SQLite cache database path | `{dataDir}/core/db-cache.db` |
| `ABT_NODE_NO_CACHE` | Disable caching (ttl=1) | false |
| `ABT_NODE_SQLITE_LARGE_CACHE` | Increase SQLite page cache | false |
| `BLOCKLET_DATA_DIR` | Blocklet's data directory | Set by server |
| `NODE_ENV` | Environment (test uses :memory:) | production |

## 11. Key Files Reference

| File | Purpose |
|------|---------|
| `core/models/lib/models/index.js` | Model definitions (40+ models) |
| `core/models/lib/migrate.js` | Migration orchestration |
| `core/models/lib/util.js` | Database utilities |
| `core/state/lib/states/index.js` | Server state factory |
| `core/state/lib/states/node.js` | Node state management |
| `core/state/lib/states/blocklet.js` | Blocklet state management |
| `core/state/lib/team/manager.js` | Per-blocklet DB management |
| `core/db-cache/src/index.ts` | Caching infrastructure |
| `core/models/lib/migrations/` | Migration scripts |

## 12. Best Practices

### For Server Development

1. **Always use migrations** for schema changes
2. **Use safe migration utilities** for idempotent operations
3. **Leverage caching** for frequently accessed data
4. **Use transactions** for multi-step operations
5. **Respect connection pool limits** in concurrent operations

### For Blocklet Development

1. **Use blocklet SDK** for database access (not direct Sequelize)
2. **Define migrations** for schema changes
3. **Respect data isolation** - don't access other blocklets' data
4. **Use provided state managers** for user/session management

## 13. Architecture Benefits

| Feature | Benefit |
|---------|---------|
| Per-blocklet databases | Complete data isolation |
| SQLite default | Zero configuration, portable |
| PostgreSQL option | Enterprise scalability |
| Migration system | Safe schema evolution |
| Caching layer | Improved performance |
| State pattern | Clean separation of concerns |
| Distributed locks | Safe concurrent access |
