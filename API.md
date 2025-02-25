# RPC Worker Pool API Documentation

## Overview

The RPC Worker Pool provides a JSON-RPC 2.0 compliant API for task execution and worker pool management. This document outlines the available APIs, their usage, and provides examples.

## JSON-RPC 2.0 Interface

### Request Format

```typescript
interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: any;
  id?: number | string;
}
```

### Response Format

```typescript
interface JsonRpcResponse {
  jsonrpc: "2.0";
  result?: any;
  error?: JsonRpcError;
  id: number | string | null;
}
```

### Error Format

```typescript
interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}
```

## Core APIs

### Worker Pool Management

#### createPool

Creates a new worker pool with specified configuration.

```typescript
// Request
{
  "jsonrpc": "2.0",
  "method": "createPool",
  "params": {
    "poolSize": 4,
    "taskTimeout": 30000,
    "retryAttempts": 3
  },
  "id": 1
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "poolId": "pool_abc123",
    "workerCount": 4,
    "status": "ready"
  },
  "id": 1
}
```

#### submitTask

Submits a task to the worker pool for execution.

```typescript
// Request
{
  "jsonrpc": "2.0",
  "method": "submitTask",
  "params": {
    "poolId": "pool_abc123",
    "task": {
      "type": "computation",
      "data": {
        "operation": "multiply",
        "values": [2, 3]
      }
    }
  },
  "id": 2
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "taskId": "task_xyz789",
    "status": "completed",
    "result": 6
  },
  "id": 2
}
```

### Pipeline Operations

#### createPipeline

Creates a new processing pipeline.

```typescript
// Request
{
  "jsonrpc": "2.0",
  "method": "createPipeline",
  "params": {
    "stages": [
      {
        "name": "validate",
        "type": "validator"
      },
      {
        "name": "transform",
        "type": "transformer"
      },
      {
        "name": "process",
        "type": "processor"
      }
    ]
  },
  "id": 3
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "pipelineId": "pipe_def456",
    "stages": 3,
    "status": "ready"
  },
  "id": 3
}
```

## Command System

### Registering Commands

#### registerCommand

Registers a new command in the system.

```typescript
// Request
{
  "jsonrpc": "2.0",
  "method": "registerCommand",
  "params": {
    "name": "calculateSum",
    "handler": "function(args) { return args.reduce((a, b) => a + b, 0); }",
    "validate": "function(args) { return Array.isArray(args); }"
  },
  "id": 4
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "commandId": "cmd_789xyz",
    "status": "registered"
  },
  "id": 4
}
```

### Executing Commands

#### executeCommand

Executes a registered command.

```typescript
// Request
{
  "jsonrpc": "2.0",
  "method": "executeCommand",
  "params": {
    "command": "calculateSum",
    "args": [1, 2, 3, 4, 5]
  },
  "id": 5
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "value": 15,
    "executionTime": "0.5ms"
  },
  "id": 5
}
```

## Error Handling

### Common Error Codes

```typescript
const ErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  WORKER_ERROR: -32000,
  POOL_ERROR: -32001,
  TASK_ERROR: -32002
};
```

### Error Examples

#### Invalid Request

```typescript
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32600,
    "message": "Invalid Request",
    "data": "Method name must be a string"
  },
  "id": null
}
```

#### Worker Error

```typescript
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "Worker Error",
    "data": {
      "workerId": "worker_123",
      "reason": "Memory limit exceeded"
    }
  },
  "id": 6
}
```

## Usage Examples

### Basic Task Execution

```typescript
// Create a worker pool
const pool = await rpc.call("createPool", {
  poolSize: 4,
  taskTimeout: 30000
});

// Submit a task
const task = await rpc.call("submitTask", {
  poolId: pool.result.poolId,
  task: {
    type: "computation",
    data: {
      operation: "factorial",
      value: 5
    }
  }
});

console.log(task.result); // 120
```

### Pipeline Processing

```typescript
// Create a pipeline
const pipeline = await rpc.call("createPipeline", {
  stages: [
    {
      name: "validate",
      type: "validator",
      config: {
        schema: {
          type: "object",
          required: ["input"],
          properties: {
            input: { type: "number" }
          }
        }
      }
    },
    {
      name: "process",
      type: "transformer",
      config: {
        transform: "value => value * 2"
      }
    }
  ]
});

// Process data through pipeline
const result = await rpc.call("processPipeline", {
  pipelineId: pipeline.result.pipelineId,
  data: {
    input: 5
  }
});

console.log(result); // { input: 10 }
```

## Best Practices

1. **Error Handling**
   - Always check for error responses
   - Implement proper error recovery
   - Log error details for debugging

2. **Performance**
   - Batch related tasks when possible
   - Monitor task execution times
   - Implement proper timeouts

3. **Resource Management**
   - Close unused worker pools
   - Monitor resource usage
   - Implement proper cleanup

## WebSocket Connection

The RPC Worker Pool also supports WebSocket connections for real-time communication:

```typescript
const ws = new WebSocket('ws://localhost:8080');

ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  console.log('Received:', response);
};

ws.send(JSON.stringify({
  jsonrpc: "2.0",
  method: "submitTask",
  params: {
    // task parameters
  },
  id: 1
}));
