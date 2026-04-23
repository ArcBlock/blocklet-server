# Blocklet Server

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![docs](https://img.shields.io/badge/powered%20by-arcblock-green.svg)](https://developer.blocklet.io/docs)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

Blocklet Server is a comprehensive platform for deploying, managing, and running Blocklet applications. It provides a complete runtime environment with built-in authentication, routing, and lifecycle management.

## Table of Contents

- [Blocklet Server](#blocklet-server)
  - [Table of Contents](#table-of-contents)
  - [Quick Start](#quick-start)
    - [Using Docker (Recommended)](#using-docker-recommended)
    - [Using npm](#using-npm)
  - [System Requirements](#system-requirements)
    - [Supported Platforms](#supported-platforms)
  - [Installation](#installation)
    - [Docker](#docker)
    - [From Source](#from-source)
  - [Packages](#packages)
    - [Core Packages](#core-packages)
    - [Server Components](#server-components)
    - [Utilities](#utilities)
  - [Documentation](#documentation)
  - [Contributing](#contributing)
  - [Getting Help](#getting-help)
  - [License](#license)

## Quick Start

### Using Docker (Recommended)

```bash
docker pull arcblock/blocklet-server
docker run -d -p 80:80 -p 443:443 -v ~/blocklet-data:/data arcblock/blocklet-server
```

Then open http://localhost to access the Blocklet Server dashboard.

### Using npm

```bash
npm install -g @blocklet/cli
blocklet server start -a
```

## System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | 22.x | 22.x or later |
| Memory | 2 GB | 4 GB or more |
| Disk Space | 10 GB | 50 GB or more |
| OS | Linux, macOS, Windows (Docker) | Linux (Ubuntu 20.04+) |

### Supported Platforms

- **Linux**: Ubuntu 18.04+, Debian 10+, CentOS 7+
- **macOS**: 10.15+
- **Windows**: Windows 10+ (via Docker or WSL2)

## Installation

### Docker

We provide Docker images from multiple registries:

```bash
# Docker Hub (default)
docker pull arcblock/blocklet-server

# GitHub Container Registry
docker pull ghcr.io/arcblock/blocklet-server:latest

# AWS ECR
docker pull public.ecr.aws/i0s0w0c9/blocklet-server:latest
```

Run with persistent data:

```bash
docker run -d \
  -p 80:80 \
  -p 443:443 \
  -v /path/to/your/data:/data \
  arcblock/blocklet-server
```

### From Source

Requirements: Node.js v22+, Bun v1.3.6+, lerna, nginx v1.18+

```bash
git clone https://github.com/ArcBlock/blocklet-server.git
cd blocklet-server

# First time only: install lerna and bun globally, then install deps
make init

# (Subsequent times: make dep is enough)

# Build the full server
make build

# Link the local CLI (use -sf to overwrite if already exists)
ln -sf $(pwd)/core/cli/bin/blocklet.js /usr/local/bin/bn

# Initialize and start in a new data directory
mkdir ~/my-blocklet-server && cd ~/my-blocklet-server
bn server init
bn server start
```

See [Development Guide](./docs/development/getting-started.md) for full details on production and development modes.

## Packages

This monorepo contains the following packages:

### Core Packages

| Package | Description |
|---------|-------------|
| [@blocklet/cli](https://www.npmjs.com/package/@blocklet/cli) | Command-line interface |
| [@blocklet/sdk](https://www.npmjs.com/package/@blocklet/sdk) | Node.js SDK for Blocklet development |
| [@blocklet/js-sdk](https://www.npmjs.com/package/@blocklet/js-sdk) | Browser SDK |

### Server Components

| Package | Description |
|---------|-------------|
| [@abtnode/core](https://www.npmjs.com/package/@abtnode/core) | Core server functionality |
| [@abtnode/webapp](https://www.npmjs.com/package/@abtnode/webapp) | Web dashboard |
| [@abtnode/auth](https://www.npmjs.com/package/@abtnode/auth) | Authentication system |
| [@abtnode/router-provider](https://www.npmjs.com/package/@abtnode/router-provider) | Request routing |

### Utilities

| Package | Description |
|---------|-------------|
| [@blocklet/logger](https://www.npmjs.com/package/@blocklet/logger) | Logging utilities |
| [@blocklet/store](https://www.npmjs.com/package/@blocklet/store) | State management |
| [@blocklet/meta](https://www.npmjs.com/package/@blocklet/meta) | Blocklet metadata |

[View all packages on npm →](https://www.npmjs.com/search?q=%40blocklet)

## Documentation

- [Getting Started](https://developer.blocklet.io/docs/quick-start)
- [Architecture Overview](./docs/architecture/overview.md)
- [API Reference](https://developer.blocklet.io/docs/reference)
- [Development Guide](./docs/development/getting-started.md)

## Security

- [Security Policy](SECURITY.md)

## Getting Help

- [Documentation](https://developer.blocklet.io/docs)
- [GitHub Issues](https://github.com/ArcBlock/blocklet-server/issues)
- [Community Forum](https://community.arcblock.io)

## License

Copyright 2018-2026 ArcBlock

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
