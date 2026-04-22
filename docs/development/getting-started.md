# Getting Started

## Requirements

| Tool | Version |
|------|---------|
| Node.js | v22+ |
| Bun | v1.3.6+ |
| lerna | latest |
| nginx | v1.18.0+ |

Install lerna if you don't have it:

```shell
npm install -g lerna
```

---

## Step 1: Build from Source

This is required for both production and development mode.

```shell
git clone https://github.com/ArcBlock/blocklet-server.git
cd blocklet-server

# First time: installs lerna + bun globally, then installs all dependencies
make init

# Subsequent times (tools already installed):
# make dep

# Build the full server (dashboard + daemon + all packages)
make build
```

> `make init` = `make install` (installs lerna + bun) + `make dep` (installs npm deps + builds internal packages) + `make build-services`. Run it once on a fresh clone.

---

## Production Mode

Run your locally-built server the same way end users run the published CLI.

Refer to [`core/webapp/README.md — How to run as production from your local source`](../../core/webapp/README.md) for the full walkthrough. The key steps are:

1. **Link the local CLI** — symlink `core/cli/bin/blocklet.js` to a name on your PATH (conventionally `bn`):

   ```shell
   ln -sf /path/to/blocklet-server/core/cli/bin/blocklet.js /usr/local/bin/bn
   ```

2. **Initialize and start**:

   ```shell
   mkdir ~/my-blocklet-server && cd ~/my-blocklet-server
   bn server init
   bn server start
   ```

   The server prints its dashboard URL on startup.

3. **Stop**:

   ```shell
   bn server stop
   ```

---

## Development Mode

Run with hot-reloading for iterating on the dashboard or daemon code.

### 1. Generate a server secret key

You need a unique secret key for your local instance. Generate one:

```shell
node -e "const {fromRandom} = require('@ocap/wallet'); console.log(fromRandom().secretKey)"
```

### 2. Create `.env.development`

```shell
cd core/webapp
touch .env.development
```

Paste the following into `.env.development`, filling in your values:

```ini
SKIP_PREFLIGHT_CHECK=true

# Directory where server data is stored — use an absolute path
ABT_NODE_DATA_DIR="/path/to/.blocklet-server"

# Your local LAN IP (e.g. 192.168.1.2) — needed for wallet QR code scanning
ABT_NODE_BASE_URL="http://<YOUR_LAN_IP>:3030"

# Secret key generated above
ABT_NODE_SK="<GENERATED_SK>"

ABT_NODE_SESSION_SECRET="49bcf865c77a15993d87245b124bbc5125d2c3997437d1fda3"
ABT_NODE_SESSION_TTL="1d"
ABT_NODE_PORT="3030"
ABT_NODE_NAME="Blocklet Server (Dev)"
ABT_NODE_DESCRIPTION="Web Interface to manage your Blocklet Server"
ABT_NODE_LOG_LEVEL="info"
DISABLE_SQLITE_LOG=1
ABT_NODE_SERVICE_FE_PORT="3040"
```

### 3. Start all processes

Option A — one command (recommended, requires tmux):

```shell
npm run start
```

Option B — four separate terminals:

```shell
# Terminal 1: database + message queue
cd core/webapp && npm run start:hub

# Terminal 2: server daemon
cd core/webapp && DEBUG=@abtnode/* npm run start:daemon

# Terminal 3: blocklet service
cd core/webapp && DEBUG=@abtnode/* npm run start:service

# Terminal 4: dashboard UI (hot reload)
cd core/webapp && npm run start:client
```

Stop everything:

```shell
npm run stop
```

---

## Testing

```shell
# All unit tests
npm run test

# Fast tests only (< 1 min)
npm run test:fast

# With coverage
npm run coverage
```

---

## Development under Windows

Use WSL2. Install Node.js v22+, Bun, lerna, and nginx inside WSL2, then follow the Linux/macOS steps above.
