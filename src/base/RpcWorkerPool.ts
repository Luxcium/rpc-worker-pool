'use strict';
// src/base/RpcWorkerPool.ts
import { cpus } from 'node:os';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';

import { baseRpcResponseRight } from './API';
import type {
  RpcRequest,
  RpcResponse,
  RpcResponseError,
  WorkerPool,
  WorkerPoolRpc,
} from './types';
import { maxSize, Strategies, strategies, supportedStrategies } from './utils';

/**
 * RPC Worker Pool implementation using the Actor Model pattern.
 *
 * This class manages a pool of worker threads and distributes RPC requests
 * across them according to the selected strategy (round-robin, random, or least-busy).
 * It handles communication between clients and worker threads, error handling,
 * and result collection.
 *
 * @remarks
 * The worker pool is designed with performance and scalability in mind.
 * It automatically adjusts the number of worker threads based on available CPU cores
 * if not explicitly specified.
 *
 * @example
 * ```typescript
 * const pool = RpcWorkerPool.create(4, 'roundrobin', true);
 * const result = await pool.exec('helloWorld', 1, 'World');
 * console.log(result); // "Hello, World!"
 * ```
 *
 * @internal
 * Architecture note: This class implements the Actor Model pattern where actors
 * (worker threads) communicate through message passing. The main thread acts as
 * a coordinator, routing messages to and from the workers.
 */
export class RpcWorkerPool implements WorkerPool, WorkerPoolRpc {
  /**
   * The number of worker threads in the pool.
   * @private
   */
  private readonly size: number;

  /**
   * The strategy used to distribute tasks among workers.
   * @private
   */
  private readonly strategy: Strategies;

  /**
   * Whether to enable verbose logging.
   * @private
   */
  private _verbose: boolean;

  /**
   * Index for round-robin task distribution.
   * @private
   */
  private rr_index: number;

  /**
   * Reference counter for job IDs.
   * @private
   */
  private next_job_ref: number;

  /**
   * Array of worker information objects.
   * @private
   */
  private readonly employees: {
    worker: Worker;
    in_flight_commands: Map<number, any>;
    employee_number: number;
  }[];

  /**
   * Creates a new RPC Worker Pool instance.
   *
   * @param size - The number of worker threads to create (defaults to number of CPU cores)
   * @param strategy - The strategy for distributing tasks (defaults to 'leastbusy')
   * @param verbosity - Whether to enable verbose logging
   * @returns A new RpcWorkerPool instance
   */
  public static create(
    size = 0,
    strategy: Strategies = strategies.leastbusy,
    verbosity = false
  ): RpcWorkerPool {
    return new RpcWorkerPool(size, strategy, verbosity);
  }

  protected constructor(
    size = 0,
    strategy: Strategies = strategies.leastbusy,
    verbosity = false
  ) {
    const CORES = cpus().length;
    this.size = maxSize(size, CORES);
    this.strategy = supportedStrategies.has(strategy)
      ? strategy
      : strategies.leastbusy;
    this.rr_index = -1;
    this.next_job_ref = 0;
    this.employees = [];
    this._verbose = verbosity;

    for (
      let employee_number = 0;
      employee_number < this.size;
      employee_number++
    ) {
      const worker = this.tsnodeWorkerGenerator(
        __dirname,
        employee_number,
        Worker
      ).on('message', (msg: RpcResponse<unknown, unknown>) => {
        this.onMessageHandler(msg, employee_number);
      });

      this.employees.push({
        worker,
        in_flight_commands: new Map(),
        employee_number,
      });
    }
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
    const promise = new Promise<O>((resolve, reject) => {
      employee.in_flight_commands.set(internal_job_ref, {
        resolve,
        reject,
        external_message_identifier,
      });
    });

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
    employee.worker.postMessage(rpcRequest);

    return promise;
  }

  private getWorker(log_message_id = -1): {
    worker: Worker;
    in_flight_commands: Map<number, any>;
    employee_number: number;
  } {
    let employee_number = 0;
    switch (this.strategy) {
      case 'random':
        employee_number = Math.floor(Math.random() * this.size);
        break;
      case 'roundrobin':
        this.rr_index++;
        if (this.rr_index >= this.size) {
          this.rr_index = 0;
        }
        employee_number = this.rr_index;
        break;
      case 'leastbusy':
      default:
        let min = Number.POSITIVE_INFINITY;
        for (let i = 0; i < this.size; i++) {
          const worker = this.employees[i];
          if (worker.in_flight_commands.size < min) {
            min = worker.in_flight_commands.size;
            employee_number = i;
          }
        }
    }
    this._verbose &&
      console.log(
        `Worker: ${employee_number + 1} Message id: ${log_message_id || 0}`
      );

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
      this._verbose && console.error(error);
      throw error;
    }

    const { resolve, reject, external_message_identifier } = internal_job;
    worker.in_flight_commands.delete(internal_job_ref);

    const result: unknown = msg?.result ?? null;
    const error: RpcResponseError | null = msg?.error || null;
    if (!error && result != null) {
      this.handleResult(resolve, result, external_message_identifier);
    } else {
      this.handleError(reject, error);
    }
  }

  private handleResult(
    resolve: (value: unknown) => void,
    result: unknown,
    external_message_identifier: number | string
  ): void {
    resolve(baseRpcResponseRight(result)(external_message_identifier));
  }

  private handleError(
    reject: (reason?: unknown) => void,
    error: RpcResponseError<unknown> | null
  ): void {
    reject(error || 'An unknown error occurred');
  }

  private tsnodeWorkerGenerator(
    dirname: string,
    employee_number: number,
    worker: typeof Worker
  ): Worker {
    const workerPath = join(dirname, 'worker.ts');
    return new worker(
      `
      require('ts-node/register');
      require(require('worker_threads').workerData.runThisFileInTheWorker);
      `,
      {
        eval: true,
        workerData: {
          runThisFileInTheWorker: workerPath,
          workerAsset: employee_number,
        },
      }
    );
  }
}

export default RpcWorkerPool;
