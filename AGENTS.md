# AGENTS.md

> This file is designed for AI Agents (Claude, Copilot, Cursor, etc.)
> It provides structured context to help AI tools understand and work with this codebase.

## Quick Context

| Attribute | Value |
|-----------|-------|
| **Purpose** | Blocklet application runtime and management platform |
| **Analogy** | Blocklet Server : Blocklets = iOS : Apps |
| **Architecture** | Monorepo with 40+ packages |
| **Tech Stack** | TypeScript, Node.js, React, Express, GraphQL |
| **Package Manager** | Bun (v1.3.6+) |
| **Build System** | Turbo + Lerna |

## Repository Structure

```
blocklet-server/
├── apps/                    # Standalone applications
│   └── static-server/       # Static file serving
│
├── blocklet/                # SDK packages for Blocklet developers
│   ├── js-sdk/              # Browser SDK (@blocklet/js-sdk)
│   ├── node-sdk/            # Node.js SDK (@blocklet/sdk)
│   ├── constant/            # Shared constants
│   ├── env/                 # Environment utilities
│   ├── logger/              # Logging utilities
│   ├── meta/                # Blocklet metadata handling
│   ├── store/               # Store connectivity
│   └── ...
│
├── core/                    # Server core modules
│   ├── cli/                 # Command-line interface (@blocklet/cli)
│   ├── webapp/              # Main server + dashboard
│   ├── auth/                # Authentication (DID-based)
│   ├── router-provider/     # Request routing (nginx)
│   ├── blocklet-services/   # Services for blocklets
│   ├── db/                  # Database layer (NeDB)
│   ├── models/              # Data models (Sequelize + SQLite)
│   ├── rbac/                # Role-based access control
│   ├── state/               # Server state management
│   └── ...
│
├── docs/                    # Documentation
│   ├── architecture/        # System design
│   ├── guides/              # User guides
│   └── contributing/        # Dev guides
│
└── intent/                  # Intent-driven development specs
```

## Key Entry Points

| Area | Directory | Description |
|------|-----------|-------------|
| CLI | `core/cli/` | `blocklet` command entry |
| Server | `core/webapp/` | Main application + GraphQL API |
| Dashboard | `core/webapp/src/client/` | React admin UI |
| JS SDK | `blocklet/js-sdk/` | Browser SDK |
| Node SDK | `blocklet/node-sdk/` | Server SDK |

## For Code Understanding

Read these in order:

1. **Architecture**: `docs/architecture/overview.md`
2. **Blocklet lifecycle**: `docs/architecture/blocklet-lifecycle.md`
3. **Routing**: `docs/architecture/blocklet-routing.md`
4. **Events**: `docs/architecture/event-system.md`

## Essential Commands

```bash
# Install
bun install

# Build
bun run build

# Lint (REQUIRED before commits)
bun turbo:lint

# Test
bun run test
bun run test <specific-file>

# Start dev
npm start
```

## Making Changes

### Pre-requisites

1. Review architecture docs for the area you're changing
2. Check `docs/development/getting-started.md` for build setup

### Code Quality Rules

- Run `bun turbo:lint` - fix ALL warnings and errors
- If tests exist for changed code, run them and fix failures
- Keep changes under 700 lines; split if larger

### Common Tasks

**Add CLI command:**
```
core/cli/src/commands/ → add command file
core/cli/src/index.js → register command
```

**Modify routing:**
```
core/router-provider/ → core routing logic
core/router-templates/ → nginx templates
```

**Extend SDK:**
```
blocklet/js-sdk/src/ → browser features
blocklet/node-sdk/src/ → server features
```

## Architecture Patterns

### Event-Driven

- Event constants: `core/constant/`
- Event hub: `core/webapp/src/libs/event-hub/`
- Blocklets receive events via SDK

### Authentication

- DID-based auth: `@arcblock/did`
- JWT sessions: `@abtnode/auth`
- RBAC: `@abtnode/rbac`

### Database

- Embedded DB: NeDB
- Models: `core/models/`
- Cache: `core/db-cache/`

## Debugging

```bash
# Verbose logging
DEBUG=@abtnode/* npm start

# Check data
ls $ABT_NODE_DATA_DIR

# Router issues
# Check nginx logs + core/router-provider/
```

## Related Resources

- [Developer Docs](https://developer.blocklet.io/docs)
- [Blocklet Spec](https://github.com/ArcBlock/blocklet-specification)
- [DID Spec](https://github.com/ArcBlock/did-spec)
