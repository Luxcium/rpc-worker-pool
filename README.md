# RPC Worker Pool

## Overview

The RPC Worker Pool is a robust, multi-threaded Remote Procedure Call (RPC) server implemented in Node.js and TypeScript. It is designed to handle a high volume of tasks concurrently, leveraging the power of multi-core processors to improve performance for CPU-intensive or I/O-bound tasks. The project uses the JSON-RPC 2.0 protocol for communication between the main thread and worker threads, allowing for lightweight and easy-to-use remote procedure calls.

## Key Components

### RpcWorkerPool

The RpcWorkerPool class, defined in `RpcWorkerPool.ts`, manages a pool of worker threads. It provides methods to add tasks to the pool, execute them, and terminate the pool. This class is the core of the project, coordinating the execution of tasks and the management of worker threads.

### Worker

The Worker class, defined in `worker.ts`, is responsible for executing tasks in separate threads. Each worker runs on a separate CPU core, allowing the project to take full advantage of multi-core processors.

### JSON-RPC 2.0 Specification

The project uses the JSON-RPC 2.0 protocol for communication between the main thread and worker threads. TypeScript type definitions for the JSON-RPC 2.0 specification are provided in the `json-rpc-2.0` spec folder.

### RPC-serialise

The `RPC-serialise.ts` file provides functions for serializing and deserializing JSON-RPC messages. This is a crucial part of the system, enabling the conversion of complex data structures into a format that can be easily transmitted over a network or between threads.

### RPC-errors

The `RPC-errors.ts` file defines classes for JSON-RPC errors. Each class corresponds to a specific error code in the JSON-RPC 2.0 specification. This robust error handling mechanism is essential for building reliable and resilient systems.

### Commands

The `commands.ts` file exports a map of command names to their corresponding functions. This design allows a worker to execute a task by simply providing the name of the command.

## Getting Started

To get started with the RPC Worker Pool, clone the repository and install the dependencies:

```bash
git clone https://github.com/Luxcium/rpc-worker-pool.git
cd rpc-worker-pool
npm install
```

Then, you can run the project:

```bash
npm start
```

## Dependencies

The project is written in TypeScript and uses several libraries, including:

- "chalk" for terminal string styling
- "node-fetch" for making HTTP requests
- "ws" for WebSocket communication

## Contributing

Contributions to the RPC Worker Pool are welcome. Please submit a pull request or open an issue to discuss your proposed changes.

## License

The RPC Worker Pool is licensed under the MIT License.
