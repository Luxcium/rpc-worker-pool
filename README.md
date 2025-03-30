# RPC Worker Pool

A high-performance, scalable RPC worker pool service implementing the Actor Model for distributed task processing.

## Overview

The RPC Worker Pool provides a way to distribute computational tasks across multiple worker threads, improving performance and resource utilization. It supports multiple load balancing strategies and provides a JSON-RPC 2.0 compatible interface.

## Features

- Multiple worker threads for parallel task processing
- Several load balancing strategies (round-robin, random, least-busy)
- JSON-RPC 2.0 compatible API
- HTTP and TCP interfaces
- Type-safe implementations with TypeScript

## Installation

This package is part of the monorepo-one repository. To use it:

```bash
# From the monorepo root
# IMPORTANT: Always use Rush commands within monorepo-one
rush update
rush build
```

> **IMPORTANT: Package Manager Policy**
>
> - Inside monorepo-one: Use ONLY Rush commands (rush add -m -p, rush update)
> - Outside monorepo-one: Use ONLY pnpm/pnpx commands (pnpm add, pnpx)
> - NEVER use npm, yarn, or npx anywhere
> - NEVER use pnpm directly inside monorepo-one when a rush command exists for the same purpose

## Usage

### Starting the Server

```bash
rushx server <http-endpoint:port> <actor-endpoint:port> <threads> <strategy>
```

Example:

```bash
rushx server 0.0.0.0:8010 0.0.0.0:7010 4 roundrobin
```

### Making RPC Requests

You can make HTTP requests to the server:

```bash
curl "http://localhost:8010/helloWorld/World"
```

Or use the provided client:

```bash
rushx ts-node src/base/client.ts localhost 8010 helloWorld World
```

## Available Commands

- `helloWorld`: Returns a greeting message
- `echo`: Returns the parameters it received
- `status`: Returns the server's operational status
- `info`: Returns information about the server

## Architecture

This service implements the Actor Model pattern where actors communicate through message passing. See [architecture.md](docs/internal/architecture.md) for more details.

## Development

### Scripts

- `rushx server`: Start the server
- `rushx client`: Run the test client
- `rushx test:commands`: Run tests for all available commands

### Documentation

- [API Reference](docs/public/api-reference.md)
- [Usage Examples](docs/public/usage-examples.md)
- [Internal Architecture](docs/internal/architecture.md)
- [Design Decisions](docs/internal/design-decisions.md)

## License

MIT
