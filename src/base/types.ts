// src/base/types.ts
/**
 * Declares all shared types (config interfaces, data structures).
 */

export interface IArgsConfigs {
  argv0?: string;
  argv1?: string;
  httpConnParam?: string;
  connecParam?: string;
  threadsParam?: string;
  strategyParam?: string;
  scriptFilePath?: string;
  splits: {
    httpEndpointParam?: string;
    httpPortParam?: string;
    endpointParam?: string;
    portParam?: string;
  };
}

export interface IEnvConfigs {
  httpEndpointEnv: string;
  httpPortEnv: string;
  endpointEnv: string;
  portEnv: string;
  threadsEnv: number;
  strategyEnv: string;
  scriptFileEnv: string;
  runInDockerFlag: boolean;
}

export interface IDefaultsConfigs {
  HTTP_ENDPOINT: string;
  HTTP_PORT: string;
  ENDPOINT: string;
  PORT: string;
  THREADS: number;
  STRATEGY: string;
}

export interface IPriorities {
  httpEndpoint: string;
  httpPort: string;
  actorEndpoint: string;
  actorPort: string;
  threads: number;
  strategy_: string;
  strategy: string;
  runInDocker: boolean;
}

// Data structure for passing messages between components
export interface Data {
  messageSeq: number;
  command_name: string;
  args: string[];
}

/**
 * Base types for RPC worker pool implementation
 */

/**
 * JSON-RPC 2.0 request object
 */
export interface RpcRequest<T = unknown> {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: T;
}

/**
 * JSON-RPC 2.0 error object
 */
export interface RpcResponseError<T = unknown> {
  code: number;
  message: string;
  data?: T;
}

/**
 * JSON-RPC 2.0 response object
 */
export interface RpcResponse<T = unknown, E = unknown> {
  jsonrpc: '2.0';
  id: number | string;
  result?: T;
  error?: RpcResponseError<E>;
}

/**
 * Object containing IDs for tracking messages
 */
export interface IdsObject {
  external_message_identifier: number | string;
  employee_number: number;
  internal_job_ref: number;
}

/**
 * Interface for worker pool implementations
 */
export interface WorkerPool {
  exec<O = unknown>(
    command_name: string,
    external_message_identifier: number,
    ...args: string[]
  ): Promise<O>;
}

/**
 * Interface for RPC worker pool implementations
 */
export interface WorkerPoolRpc {
  execRpc<ResultsType = unknown>(
    rpcRequest: RpcRequest<string[]>
  ): Promise<ResultsType>;
}
