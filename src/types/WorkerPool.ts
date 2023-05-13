import type { Worker } from 'node:worker_threads';
import { RpcRequest, RpcResponse } from './specs';

export interface WorkerPool {
  exec: WorkerPoolExec;
  verbose: boolean;
}
export interface WorkerPoolRpc {
  execRpc: WorkerPoolExecRpcRequest;
  verbose: boolean;
} // RpcRequest

interface WorkerPoolExecRpcRequest {
  <O = unknown>(rpcRequest: RpcRequest<string[]>): Promise<
    RpcResponse<O, unknown>
  >;
}
export interface WorkerPoolExec {
  <O = unknown>(
    command_name: string,
    message_identifier: number,
    ...args: string[]
  ): Promise<RpcResponse<O, unknown>>;
}

export interface OldWorkerPool_privates {
  exec: WorkerPoolExec;
  getWorker(): {
    worker: Worker;
    in_flight_commands: Map<number, any>;
    worker_tag: number;
  };
  onMessageHandler(msg: any, worker_tag: number): void;
  verbose: boolean;
}
