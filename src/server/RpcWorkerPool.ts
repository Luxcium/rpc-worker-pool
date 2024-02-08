'use strict';
import { existsSync } from 'node:fs';
import { cpus } from 'node:os';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';

import type {
  RpcRequest,
  RpcResponse,
  RpcResponseError,
  WorkerPool,
  WorkerPoolRpc,
} from '../types';
import { baseRpcResponseRight } from './API/RPC-serialise';
import {
  maxSize,
  type Strategies,
  strategies,
  supportedStrategies,
} from './utils';

export class RpcWorkerPool implements WorkerPool, WorkerPoolRpc {
  private readonly size: number;

  private readonly strategy: Strategies;

  private _verbose: boolean;

  private rr_index: number;

  private next_job_ref: number;

  /**
   * Represents the workers in the RPC worker pool.
   *
   * @remarks
   * This property stores an array of objects, each representing a worker in the RPC worker pool.
   * Each worker object contains a reference to the actual worker instance.
   *
   * @private @readonly
   */
  private readonly employees: {
    worker: Worker;
    in_flight_commands: Map<number, any>;
    employee_number: number;
  }[];

  constructor(
    size = 0,
    strategy: Strategies = strategies.leastbusy,
    verbosity = false
  ) {
    const CORES = cpus().length;

    // Compute the value of the size of the worker pool.
    // If the size is less than 1, use the number of CPU cores minus the size.
    // If the size is 0, use the number of CPU cores minus 1.
    // Otherwise, use the size provided.
    // The size of the worker pool must be at least 1.
    this.size = maxSize(size, CORES);

    this.strategy = supportedStrategies.has(strategy)
      ? strategy
      : strategies.leastbusy;

    this.rr_index = -1;
    this.next_job_ref = 0;
    this.employees = [];

    // Creates a worker for each employee in the worker pool.
    for (
      let employee_number = 0;
      employee_number < this.size;
      employee_number++
    ) {
      const worker = tsnodeWorkerGenerator(
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

    this._verbose = verbosity;

    return this;
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

    // The external_message_identifier is provided for feedback purpose only.
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
        // eslint-disable-next-line no-case-declarations
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
    // Each worker is represented as an object with the worker instance,
    // a map of in-flight commands, and the worker's employee_number.
    const worker = this.employees[employee_number];

    // Convert the message id to a number to use as a reference to the job.
    const internal_job_ref = Number(msg.id);

    // Get the in-flight command corresponding to the job reference.
    const internal_job = worker.in_flight_commands.get(internal_job_ref);

    // If there's no corresponding in-flight command, log an error and return.
    if (!internal_job) {
      const error = new Error(
        `No in-flight command found for job ref: ${internal_job_ref}`
      );
      this.verbosity && console.error(error);
      throw error;
    }

    const { resolve, reject, external_message_identifier } = internal_job;

    // Delete the in-flight command from the worker's map as it's being processed.
    worker.in_flight_commands.delete(internal_job_ref);

    // Process the result or error from the RPC response message.
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
    // Wrap the result in an RpcRight object and resolve the promise with it.
    resolve(baseRpcResponseRight(result)(external_message_identifier));
  }

  private handleError(
    reject: (reason?: unknown) => void,
    error: RpcResponseError<unknown> | null
  ): void {
    // Reject the promise with the error.
    reject(error || 'An unknown error occurred');
  }

  // private verbosity: boolean;
  get verbosity(): boolean {
    return this._verbose;
  }

  set verbosity(VERBOSE: boolean) {
    this._verbose = VERBOSE;
  }
}

export default RpcWorkerPool;

/**
 *
 * // HACK: This is a hack to work around the fact that the
 * // HACK: Worker constructor does not support ts_node
 * @param dirname
 * @param employee_number
 * @param worker
 * @returns
 */
function tsnodeWorkerGenerator(
  dirname: string,
  employee_number: number,
  worker: typeof Worker
): Worker {
  const SCRIPT_FILE_URI = join(
    `${dirname}/worker.${existsSync(`${dirname}/worker.ts`) ? 'ts' : 'js'}`
  );
  return new worker(
    `
  require('ts-node/register');
  require(require('worker_threads').workerData.runThisFileInTheWorker);
`,
    {
      eval: true,
      workerData: {
        runThisFileInTheWorker: SCRIPT_FILE_URI, // '/path/to/worker-script.ts'
        workerAsset: employee_number,
      },
    }
  );
}
