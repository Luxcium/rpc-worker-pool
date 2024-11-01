// src/core/RpcWorkerPool-slim.ts
import { cpus } from 'node:os';
import { Worker } from 'node:worker_threads';
import { baseRpcResponseRight } from '../server/API/RPC-serialise';
import {
  type Strategies,
  strategies,
  supportedStrategies,
} from '../server/utils';
import type {
  RpcRequest,
  RpcResponse,
  RpcResponseError,
  WorkerPool,
  WorkerPoolRpc,
} from '../types';
import { tsnodeWorkerGenerator } from './workerGenerator';

abstract class Rpc {
  private _size: number;
  private _strategy: Strategies;
  private _verbose: boolean;
  protected rr_index: number;
  protected next_job_ref: number;
  protected employeesSortedByLoad: {
    worker: Worker;
    in_flight_commands: Map<number, any>;
    employee_number: number;
  }[] = [];
  protected employees: {
    worker: Worker;
    in_flight_commands: Map<number, any>;
    employee_number: number;
  }[] = [];
  static computeSize(size: number): number {
    const coreCount = Rpc.coreCount;
    return Math.max(size < 0 ? coreCount + size : size || coreCount - 1, 1);
  }

  static handleResult(
    resolve: (value: unknown) => void,
    result: unknown,
    external_message_identifier: number | string
  ): void {
    resolve(baseRpcResponseRight(result)(external_message_identifier));
  }
  static handleError(
    reject: (reason?: unknown) => void,
    error: RpcResponseError<unknown> | null
  ): void {
    reject(error || 'An unknown error occurred');
  }
  static createCommandPromise<O>(
    employee: {
      worker: Worker;
      in_flight_commands: Map<number, any>;
      employee_number: number;
    },
    internal_job_ref: number,
    external_message_identifier: number
  ): Promise<O> {
    return new Promise<O>((resolve, reject) => {
      employee.in_flight_commands.set(internal_job_ref, {
        resolve,
        reject,
        external_message_identifier,
      });
    });
  }
  static get coreCount(): number {
    return cpus().length;
  }

  constructor(params?: {
    verbosity?: boolean;
    size?: number;
    strategy?: Strategies;
  }) {
    const { strategy = strategies.leastbusy } = params || {
      strategy: strategies.leastbusy,
    };
    this.rr_index = -1;
    this.next_job_ref = 0;
    this._verbose = params?.verbosity || false;
    this._size = Rpc.computeSize(params?.size || 1);
    this._strategy = supportedStrategies.has(strategy)
      ? strategy
      : strategies.leastbusy;

    this.employeesSortedByLoad = [];
    this.employees = [];
  }
  get size(): number {
    return this._size;
  }
  get strategy(): Strategies {
    return this._strategy;
  }
  get isVerbose(): boolean {
    return this._verbose;
  }
  set isVerbose(value: boolean) {
    this._verbose = value;
  }
}
export class RpcWorkerPool extends Rpc implements WorkerPool, WorkerPoolRpc {
  private workerGenerator: (
    dirname: string,
    employeeNumber: number,
    workerType: typeof Worker
  ) => Worker;
  private workerSelectionStrategy: WorkerSelectionStrategy;

  constructor(
    size = 0,
    strategy: Strategies = strategies.leastbusy,
    verbosity = false,
    workerGenerator = tsnodeWorkerGenerator,
    workerSelectionStrategy: WorkerSelectionStrategy = new LeastBusySelectionStrategy()
  ) {
    super({ verbosity, size, strategy });
    this.workerGenerator = workerGenerator;
    this.workerSelectionStrategy = workerSelectionStrategy;
    this.createWorkers();
  }
  private createWorkers(): void {
    for (
      let employee_number = 0;
      employee_number < this.size;
      employee_number++
    ) {
      const worker = this.workerGenerator(
        __dirname,
        employee_number,
        Worker
      ).on('message', (msg: RpcResponse<unknown, unknown>) => {
        this.onMessageHandler(msg, employee_number);
      });
      const employee = {
        worker,
        in_flight_commands: new Map(),
        employee_number,
      };
      this.employees.push(employee);
      if (this.strategy === 'leastbusy') {
        this.insertEmployeeSortedByLoad(employee);
      }
    }
  }
  private insertEmployeeSortedByLoad(employee: {
    worker: Worker;
    in_flight_commands: Map<number, any>;
    employee_number: number;
  }): void {
    let index = this.employeesSortedByLoad.findIndex(
      e => e.in_flight_commands.size > employee.in_flight_commands.size
    );
    if (index === -1) {
      index = this.employeesSortedByLoad.length;
    }
    this.employeesSortedByLoad.splice(index, 0, employee);
  }
  async execRpc<ResultsType = unknown>(
    rpcRequest: RpcRequest<string[]>
  ): Promise<ResultsType> {
    return this.exec<ResultsType>(
      rpcRequest.method,
      Number(rpcRequest.id),
      ...(rpcRequest.params || [])
    );
  }
  async exec<O = unknown>(
    command_name: string,
    external_message_identifier: number,
    ...args: string[]
  ): Promise<O> {
    const internal_job_ref = this.next_job_ref++;
    const employee = this.getWorker();
    const promise = Rpc.createCommandPromise<O>(
      employee,
      internal_job_ref,
      external_message_identifier
    );
    const rpcRequest: RpcRequest<{}> = {
      jsonrpc: '2.0',
      id: Number(internal_job_ref),
      method: command_name,
      params: [
        {
          external_message_identifier,
          employee_number: employee.employee_number,
          internal_job_ref,
        },
        ...args,
      ],
    };
    let retries = 3;
    while (retries > 0) {
      try {
        employee.worker.postMessage(rpcRequest);
        break;
      } catch (error: any) {
        retries -= 1;
        console.error('Failed to post message to worker:', error);
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Delay before retry
        } else {
          throw new Error(
            `Failed to post message to worker after multiple attempts: ${error.message}`
          );
        }
      }
    }
    return promise;
  }

  private getWorker(log_message_id = -1): {
    worker: Worker;
    in_flight_commands: Map<number, any>;
    employee_number: number;
  } {
    let employee_number = this.workerSelectionStrategy.selectWorker(
      this.employees
    );
    if (super.isVerbose) {
      console.log(
        `Worker: ${employee_number + 1} Message id: ${log_message_id || 0}`
      );
    }
    return this.employees[employee_number];
  }

  private onMessageHandler(
    msg: RpcResponse<any>,
    employee_number: number
  ): void {
    const worker = this.employees[employee_number];
    const internal_job_ref = Number(msg.id);
    const internal_job = worker.in_flight_commands.get(internal_job_ref);
    if (!internal_job) {
      const error = new Error(
        `No in-flight command found for job ref: ${internal_job_ref}`
      );
      if (super.isVerbose) {
        console.error(error);
      }
      throw error;
    }
    const { resolve, reject, external_message_identifier } = internal_job;
    const result: unknown = msg?.result ?? null;
    const error: RpcResponseError | null = msg?.error || null;
    if (!error && result != null) {
      Rpc.handleResult(resolve, result, external_message_identifier);
    } else {
      Rpc.handleError(reject, error);
    }
    worker.in_flight_commands.delete(internal_job_ref);
  }
}

interface WorkerSelectionStrategy {
  selectWorker(
    workers: {
      worker: Worker;
      in_flight_commands: Map<number, any>;
      employee_number: number;
    }[]
  ): number;
}

class LeastBusySelectionStrategy implements WorkerSelectionStrategy {
  selectWorker(
    workers: {
      worker: Worker;
      in_flight_commands: Map<number, any>;
      employee_number: number;
    }[]
  ): number {
    return workers.reduce(
      (leastBusyIndex, worker, index) =>
        worker.in_flight_commands.size <
        workers[leastBusyIndex].in_flight_commands.size
          ? index
          : leastBusyIndex,
      0
    );
  }
}
export default RpcWorkerPool;
