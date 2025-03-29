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
