# RPC Worker Pool Architecture

## Overview

The RPC Worker Pool implements the Actor Model pattern to distribute computational tasks across multiple worker threads. This document explains the internal architecture and component interactions.

## Core Components

### RpcWorkerPool Class

The main class responsible for managing worker threads and distributing tasks. It handles:

- Worker thread creation and management
- Task distribution according to selected strategy
- Communication between clients and worker threads
- Error handling and result collection

### Worker Threads

Each worker thread:

- Receives tasks via message passing
- Processes tasks independently
- Returns results back to the main thread
- Uses a common protocol for communication

### Server Components

- **HTTP Server**: Handles incoming HTTP requests and converts them to RPC requests
- **TCP Server**: Provides a TCP interface for actor communication

## Message Flow

1. Client sends request to HTTP or TCP server
2. Server parses request and extracts command and parameters
3. Request is forwarded to the RpcWorkerPool
4. RpcWorkerPool selects a worker thread based on the chosen strategy
5. Worker thread processes the request
6. Result is sent back to the RpcWorkerPool
7. RpcWorkerPool forwards the result to the server
8. Server sends response to the client

## Load Balancing Strategies

The RPC Worker Pool supports three load balancing strategies:

- **Round Robin**: Distributes tasks in a circular order
- **Random**: Randomly selects a worker for each task
- **Least Busy**: Assigns tasks to the worker with the fewest in-flight commands

## Thread Communication

Communication between the main thread and worker threads uses Node.js `worker_threads` module with a message-passing approach:

1. Main thread sends a message object to the worker
2. Worker processes the message and sends a response object back
3. Main thread handles the response and forwards it to the client

## Performance Considerations

- **Worker Pooling**: Reusing worker threads avoids the overhead of thread creation
- **Load Balancing**: Proper strategy selection ensures efficient resource utilization
- **Asynchronous Processing**: All operations are non-blocking for maximum throughput
- **State Management**: Workers maintain minimal state to avoid memory issues
