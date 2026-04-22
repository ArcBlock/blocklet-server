# Blocklet Server Environment Variables

This document describes all environment variables that can be used to customize the behavior of Blocklet Server. Environment variables prefixed with `ABT_NODE_` are used for server configuration and runtime behavior.

## Table of Contents

- [Installation and Configuration](#installation-and-configuration)
- [Network and Ports](#network-and-ports)
- [Authentication and Security](#authentication-and-security)
- [Database and Storage](#database-and-storage)
- [Docker Configuration](#docker-configuration)
- [Logging and Debugging](#logging-and-debugging)
- [Development and Testing](#development-and-testing)
- [Performance and Limits](#performance-and-limits)
- [System Generated Variables](#system-generated-variables)

---

## Installation and Configuration

### `ABT_NODE_CUSTOM_DATA_DIR`

**Purpose**: Customize the directory where Blocklet CLI stores its global configuration and PM2 data files

**Default**: `~/.arcblock`

**Example**: `/custom/path/to/data`

**What it contains**:

- `blocklet.ini` - Global configuration file
- `access-key.ini` - Access key configuration
- `abtnode/` - PM2 process management data directory
- `.is-new-server-install` - Installation tracking file

**Usage**:

```bash
# Set custom data directory
export ABT_NODE_CUSTOM_DATA_DIR=/custom/path/to/data
```

**Note**: This is different from `ABT_NODE_DATA_DIR`, which is used for individual Blocklet Server instance data created by `blocklet server init`.

---

## Network and Ports

### `ABT_NODE_PORT`

**Purpose**: Main port where the Blocklet Server daemon listens
**Default**: `8089`
**Example**: `8080`

### `ABT_NODE_SERVICE_PORT`

**Purpose**: Port for internal service communication
**Default**: `40404`
**Example**: `40405`

### `ABT_NODE_BLOCKLET_PORT`

**Purpose**: Starting port for blocklet applications
**Default**: `8090`
**Example**: `8100`

### `ABT_NODE_HTTP_PORT`

**Purpose**: HTTP port for the gateway/router
**Default**: `80`
**Example**: `8080`

### `ABT_NODE_HTTPS_PORT`

**Purpose**: HTTPS port for the gateway/router
**Default**: `443`
**Example**: `8443`

### `ABT_NODE_ROUTER_HTTP_PORT`

**Purpose**: HTTP port specifically for router provider
**Default**: Same as `ABT_NODE_HTTP_PORT`

### `ABT_NODE_ROUTER_HTTPS_PORT`

**Purpose**: HTTPS port specifically for router provider
**Default**: Same as `ABT_NODE_HTTPS_PORT`

### `ABT_NODE_UPDATER_PORT`

**Purpose**: Port for the updater service
**Default**: `40405`

### `ABT_NODE_EVENT_PORT`

**Purpose**: Port for event hub communication
**Default**: `40407`

### `ABT_NODE_HOST`

**Purpose**: Host address for the server to bind to
**Default**: `0.0.0.0`
**Example**: `127.0.0.1`

---

## Authentication and Security

### `ABT_NODE_DID`

**Purpose**: Decentralized Identifier for the server instance
**Generated**: Yes (system-generated)
**Example**: `z1muQ3xqHQK2uiACHyLQGALN2dxnE6d9CyD`

### `ABT_NODE_PK`

**Purpose**: Public key for the server's DID
**Generated**: Yes (system-generated)
**Example**: `0x04abc123...`

### `ABT_NODE_SK`

**Purpose**: Secret key for the server's DID
**Generated**: Yes (system-generated, keep secure)
**Example**: `0xdef456...`

### `ABT_NODE_SESSION_SECRET`

**Purpose**: Secret key for session encryption
**Generated**: Yes (system-generated)
**Example**: `random-secret-key-123`

### `ABT_NODE_TOKEN_SECRET`

**Purpose**: Secret key for JWT token signing
**Generated**: Yes (system-generated)
**Example**: `jwt-secret-key-456`

### `ABT_NODE_SESSION_TTL`

**Purpose**: Session time-to-live in seconds
**Default**: `3600` (1 hour)
**Example**: `7200`

### `ABT_NODE_SESSION_CACHE_TTL`

**Purpose**: Session cache time-to-live in seconds
**Default**: `300` (5 minutes)
**Example**: `600`

### `ABT_NODE_ADMIN_PATH`

**Purpose**: Path prefix for admin dashboard
**Default**: `/.well-known/service/admin`
**Example**: `/admin`

### `ABT_NODE_IP_WHITELIST`

**Purpose**: Comma-separated list of IP addresses allowed to access admin
**Default**: None (all IPs allowed)
**Example**: `127.0.0.1,192.168.1.0/24`

### `ABT_NODE_DOMAIN_WHITELIST`

**Purpose**: Comma-separated list of domains allowed for CORS
**Default**: None
**Example**: `example.com,*.example.com`

### `ABT_NODE_DOMAIN_BLACKLIST`

**Purpose**: Comma-separated list of domains to block
**Default**: None
**Example**: `malicious.com,*.spam.com`

### `ABT_NODE_DOMAIN_WHITELIST_HEADERS`

**Purpose**: Additional headers to include in CORS whitelist responses
**Default**: None
**Example**: `X-Custom-Header,X-Another-Header`

### `ABT_NODE_NO_PASSKEY_USER_VERIFY`

**Purpose**: Disable passkey user verification
**Values**: `1` (disable), `0` (enable)
**Default**: `0`

### `ABT_NODE_TRUSTED_SOURCES`

**Purpose**: Comma-separated list of trusted blocklet store URLs. In serverless mode, blocklets can only be installed from stores in the configured registry list. This environment variable allows you to trust additional store sources without modifying the registry list.

**Default**: None
**Format**: Comma-separated list of full URLs (must include protocol, e.g., `https://`)

**Examples**:

- `https://store.arcblock.io,https://dev.blocklet.io`
- `https://trusted.example.com`

**Usage**:

```bash
# .blocklet-server/config.yml
env:
 ABT_NODE_TRUSTED_SOURCES=https://store.arcblock.io,https://dev.blocklet.io
```

**Notes**:

- Only the hostname is extracted and used for validation.
- Must use full URLs with protocol (e.g., `https://`).
- This validation only applies in serverless mode.
- The trusted sources are checked before the configured registry list validation.
- Whitespace around URLs is automatically trimmed.

### `ABT_NODE_ALLOW_BLOCKLET_IFRAME_EMBEDDING`

**Purpose**: Allow blocklets running on Blocklet Server to be embedded in iframes from other domains. When enabled, disables the `X-Frame-Options` header protection.

**Values**: `1` (allow), `0` (disallow, default)
**Default**: `0`
**Security Warning**: Only enable this if you need to embed your blocklets in iframes on other websites. Disabling X-Frame-Options protection may expose your application to clickjacking attacks.

**Usage**:

```bash
# Allow blocklets to be embedded in iframes
export ABT_NODE_ALLOW_BLOCKLET_IFRAME_EMBEDDING=1
```

---

## Database and Storage

### `ABT_NODE_POSTGRES_URL`

**Purpose**: PostgreSQL connection URL for database storage
**Default**: Uses SQLite if not specified
**Example**: `postgresql://user:pass@localhost:5432/blocklet_server`

### `ABT_NODE_CACHE_SQLITE_PATH`

**Purpose**: Path to SQLite cache database file
**Default**: `{DATA_DIR}/core/db-cache.db`
**Example**: `/tmp/cache.db`

### `ABT_NODE_CACHE_REDIS_URL`

**Purpose**: Redis connection URL for caching
**Default**: None (uses in-memory cache)
**Example**: `redis://localhost:6379`

### `ABT_NODE_SQLITE_LARGE_CACHE`

**Purpose**: Enable large cache for SQLite
**Values**: `1` (enable), `0` (disable)
**Default**: `0`

### `ABT_NODE_NO_CACHE`

**Purpose**: Disable caching entirely
**Values**: `1` (disable), `0` (enable)
**Default**: `0`

### `ABT_NODE_IGNORE_USE_POSTGRES`

**Purpose**: Force use of SQLite instead of PostgreSQL
**Values**: `1` (force SQLite), `0` (use PostgreSQL if available)
**Default**: `0`

### `ABT_NODE_IGNORE_RESTART_POSTGRES`

**Purpose**: Skip restarting PostgreSQL during startup
**Values**: `1` (skip), `0` (restart)
**Default**: `0`

---

## Docker Configuration

### `ABT_NODE_NOT_ALLOW_DOCKER`

**Purpose**: Disable Docker support entirely
**Values**: `1` (disable), `0` (enable)
**Default**: `0`

### `ABT_NODE_DOCKER_MEMORY`

**Purpose**: Default memory limit for Docker containers
**Default**: `512m`
**Example**: `1g`

### `ABT_NODE_DOCKER_CPUS`

**Purpose**: Default CPU limit for Docker containers
**Default**: `1`
**Example**: `2`

### `ABT_NODE_DOCKER_DISK_SIZE`

**Purpose**: Default disk size limit for Docker containers
**Default**: `10g`
**Example**: `20g`

### `ABT_NODE_SKIP_DOCKER_CHOWN`

**Purpose**: Skip chown operations in Docker containers
**Values**: `1` (skip), `0` (perform)
**Default**: `0`

### `ABT_NODE_TEST_DOCKER`

**Purpose**: Enable Docker testing mode
**Values**: `1` (enable), `0` (disable)
**Default**: `0`

---

## Logging and Debugging

### `ABT_NODE_LOG_DIR`

**Purpose**: Directory for log files
**Default**: `{DATA_DIR}/logs/_abtnode`
**Example**: `/var/log/blocklet-server`

### `ABT_NODE_LOG_NAME`

**Purpose**: Name of the log file
**Default**: `daemon`
**Example**: `blocklet-server`

### `ABT_NODE_LOG_LEVEL`

**Purpose**: Logging level
**Values**: `error`, `warn`, `info`, `debug`
**Default**: `info`
**Example**: `debug`

### `ABT_NODE_DEBUG_AS_SERVERLESS`

**Purpose**: Enable serverless debugging mode
**Values**: `1` (enable), `0` (disable)
**Default**: `0`

### `ABT_NODE_DEV_MODE`

**Purpose**: Enable development mode with additional debugging
**Values**: `1` (enable), `0` (disable)
**Default**: `0`

---

## Development and Testing

### `ABT_NODE_BINARY_NAME`

**Purpose**: Name of the CLI binary
**Generated**: Yes (system-generated)
**Example**: `blocklet-server`

### `ABT_NODE_COMMAND_NAME`

**Purpose**: Name of the CLI command
**Generated**: Yes (system-generated)
**Example**: `blocklet-server`

### `ABT_NODE_PACKAGE_NAME`

**Purpose**: NPM package name for the server
**Generated**: Yes (system-generated)
**Example**: `@blocklet/server`

### `ABT_NODE_VERSION`

**Purpose**: Version of the Blocklet Server
**Generated**: Yes (system-generated)
**Example**: `1.16.15`

### `ABT_NODE_SKIP_VERSION_CHECK`

**Purpose**: Skip version compatibility checks
**Values**: `1` (skip), `0` (check)
**Default**: `0`

### `ABT_NODE_TEST_DNS_SERVER`

**Purpose**: DNS server for testing
**Default**: None
**Example**: `8.8.8.8`

### `ABT_NODE_TEST_MIN_CONSECUTIVE_TIME`

**Purpose**: Minimum consecutive time for test runs
**Default**: `1000` (milliseconds)
**Example**: `2000`

### `ABT_NODE_MOCK_DID_NAMES`

**Purpose**: Mock DID names for testing
**Default**: None
**Example**: `example.com,*.abtnet.io`

### `ABT_NODE_FAKE_DISK_INFO`

**Purpose**: Use fake disk information for testing
**Values**: `1` (enable), `0` (disable)
**Default**: `0`

---

## Performance and Limits

### `ABT_NODE_MAX_CLUSTER_SIZE`

**Purpose**: Maximum number of cluster instances
**Default**: `4`
**Example**: `8`

### `ABT_NODE_JOB_BACKOFF_SECONDS`

**Purpose**: Backoff time for job scheduling in seconds
**Default**: `600` (10 minutes)
**Example**: `300`

### `ABT_NODE_BLACKLIST_REFRESH_INTERVAL`

**Purpose**: Interval for refreshing blacklist in minutes
**Default**: `2`
**Example**: `5`

### `ABT_NODE_EMAIL_RATE_LIMIT`

**Purpose**: Rate limit for email operations
**Default**: `10` (per minute)
**Example**: `5`

### `ABT_NODE_EMAIL_VERIFY_RATE_LIMIT`

**Purpose**: Rate limit for email verification
**Default**: `5` (per minute)
**Example**: `3`

### `ABT_NODE_ENSURE_RUNNING_CHECK_INTERVAL`

**Purpose**: Interval for checking running blocklets in milliseconds
**Default**: `30000` (30 seconds)
**Example**: `60000`

### `ABT_NODE_ENSURE_RUNNING_HIGH_LOAD_CPU`

**Purpose**: CPU threshold for high load detection
**Default**: `80` (percent)
**Example**: `90`

### `ABT_NODE_ENSURE_RUNNING_HIGH_LOAD_MEMORY`

**Purpose**: Memory threshold for high load detection
**Default**: `80` (percent)
**Example**: `85`

### `ABT_NODE_ENSURE_RUNNING_HIGH_LOAD_DISK`

**Purpose**: Disk threshold for high load detection
**Default**: `90` (percent)
**Example**: `95`

### `ABT_NODE_ENSURE_RUNNING_SET_FAKE_RUNNING_TO_WAITING`

**Purpose**: Set fake running status to waiting
**Values**: `1` (enable), `0` (disable)
**Default**: `0`

### `ABT_NODE_ENABLE_ENSURE_BLOCKLET_RUNNING`

**Purpose**: Enable automatic blocklet running assurance
**Values**: `1` (enable), `0` (disable)
**Default**: `1`

### `ABT_NODE_RUNTIME_MONITOR_DISABLED`

**Purpose**: Disable the runtime monitor that tracks blocklet process health and performance metrics
**Values**: `1` or `true` (disable), `0`, `false`, or unset (enable)
**Default**: Not set (monitor enabled)

**Usage**:

```bash
# Disable runtime monitoring
export ABT_NODE_RUNTIME_MONITOR_DISABLED=1
```

### `ABT_NODE_AUTO_BACKUP_INTERVAL`

**Purpose**: Interval between automatic backups in seconds. Controls how frequently the system performs scheduled backups to Spaces when auto-backup is enabled for a blocklet. On resource-constrained servers, frequent backups can cause CPU spikes, memory pressure, and service degradation due to heavy disk I/O.
**Default**: `28800` (8 hours)
**Example**: `43200` (12 hours)

**Usage**:

```bash
# Set auto-backup interval to 12 hours
export ABT_NODE_AUTO_BACKUP_INTERVAL=43200
```

---

## Domain and Routing

### `ABT_NODE_DID_DOMAIN`

**Purpose**: Domain for DID-based routing
**Default**: Auto-detected
**Example**: `did.example.com`

### `ABT_NODE_SLP_DOMAIN`

**Purpose**: Domain for SLP (Service Location Protocol)
**Default**: Auto-detected
**Example**: `slp.example.com`

### `ABT_NODE_DASHBOARD_DOMAIN`

**Purpose**: Domain for admin dashboard
**Default**: Auto-detected
**Example**: `dashboard.example.com`

### `ABT_NODE_WILDCARD_CERT_HOST`

**Purpose**: Host for downloading wildcard certificates
**Default**: `https://releases.arcblock.io/certs`
**Example**: `https://custom-cert-host.com`

### `ABT_NODE_ENABLE_SLP_DOMAIN`

**Purpose**: Enable SLP domain support
**Values**: `1` (enable), `0` (disable)
**Default**: `0`

### `ABT_NODE_ENABLE_IPV6`

**Purpose**: Enable IPv6 support
**Values**: `1` (enable), `0` (disable)
**Default**: `0`

### `ABT_NODE_FORCE_INTRANET`

**Purpose**: Force intranet mode
**Values**: `1` (enable), `0` (disable)
**Default**: `0`

### `ABT_NODE_ROUTER_PROVIDER`

**Purpose**: Router provider implementation
**Values**: `nginx`, `nodejs`
**Default**: `nginx`

### `ABT_NODE_ROUTER_CONFIG`

**Purpose**: Additional router configuration
**Default**: None
**Example**: `custom-config.yml`

### `ABT_NODE_START_ROUTING`

**Purpose**: Controls the routing rebuild strategy when the server starts. Determines how much of the routing configuration is rebuilt on startup.
**Values**: `system` (minimal rebuild), `full` (complete rebuild)
**Default**: `system`

**Usage**:

```bash
# Force full routing rebuild on server start
export ABT_NODE_START_ROUTING=full
```

**Notes**:

- `system`: Only rebuilds essential system routing, faster startup
- `full`: Rebuilds all routing rules including blocklet routes, useful for recovery scenarios

---

## External Services

### `ABT_NODE_WEB_WALLET_URL`

**Purpose**: URL for the web wallet service
**Default**: `https://web.abtnetwork.io`
**Example**: `https://custom-wallet.com`

### `ABT_NODE_DID_REGISTRY`

**Purpose**: DID registry endpoint
**Default**: `https://registry.arcblock.io`
**Example**: `https://custom-registry.com`

### `ABT_NODE_LAUNCHER_DID`

**Purpose**: DID of the launcher service
**Default**: Auto-configured
**Example**: `z1muQ3xqHQK2uiACHyLQGALN2dxnE6d9CyD`

### `ABT_NODE_BLOCKLET_LAUNCHER_URL`

**Purpose**: Address for node registration
**Default**: Auto-detected
**Example**: `https://node.example.com`

### `ABT_NODE_PROVISION_TOKEN`

**Purpose**: One-time token for downloading SSL certificates in serverless mode during initial provisioning
**Generated**: Yes (provided by launcher in serverless environment)
**Usage**: Automatically consumed during serverless initialization
**Note**:

- Token is valid for 1 hour
- Token is consumed after first use and becomes invalid
- Only used in serverless mode during initialization
- For certificate updates, the system automatically uses signature-based authentication instead

### `ABT_NODE_EVENT_HOSTNAME`

**Purpose**: Hostname for event hub
**Default**: `localhost`
**Example**: `events.example.com`

---

## System Generated Variables

These variables are automatically generated by the system and should not be manually configured:

### `ABT_NODE_RESTART_RUNNING_COMPONENT`

**Purpose**: Flag indicating component restart status
**Generated**: Yes

### `ABT_NODE_OWNER_NFT_HOLDER`

**Purpose**: NFT holder information for ownership
**Generated**: Yes

### `ABT_NODE_OWNER_NFT_ISSUER`

**Purpose**: NFT issuer information for ownership
**Generated**: Yes

### `ABT_NODE_BLOCKLET_MODE`

**Purpose**: Current blocklet mode
**Generated**: Yes

### `ABT_NODE_KERNEL_MODE`

**Purpose**: Current kernel mode
**Generated**: Yes

---

## Special Purpose Variables

### `ABT_NODE_JOB_NAME`

**Purpose**: Name of the current job for cron operations
**Values**: `rotate-log-files`, `analyze-log-files`, `refresh-gateway-blacklist`, `cleanup-router-blacklist`
**Usage**: Used internally by the scheduler

### `ABT_NODE_MONITOR_GATEWAY_5XX`

**Purpose**: Enable monitoring of 5XX errors in gateway logs
**Values**: `1` (enable), `0` (disable)
**Default**: `0`

---

## Blue Green Deployment

### `ABT_NODE_DISABLE_BLUE_GREEN`

**Purpose**: Disable blue-green deployment. When enabled, the system will not perform traffic or version switching between blue and green environments during deployment.
**Values**: `1` (enable), `0` (disable)

---

## Configuration Priority

Environment variables take precedence over configuration file settings. The order of precedence is:

1. Environment variables (`ABT_NODE_*`)
2. Configuration file (`config.yml`)
3. Default values

## Security Considerations

- Use strong, randomly generated values for secret keys
- Limit access to the data directory and configuration files
- Consider using environment variable management tools for production deployments
