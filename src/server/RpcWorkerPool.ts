'use strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { cpus } from 'os';
import { baseRpcResponseRight } from './API/RPC-serialise';
import {
  RpcRequest,
  RpcResponse,
  RpcResponseError,
  WorkerPool,
  WorkerPoolRpc,
} from '../types';
import { strategies, supportedStrategies, type Strategies } from './utils';

const CORES = cpus().length;

/**
 * Manages a pool of worker threads that can execute remote procedure calls (RPCs) on behalf of the main thread.
 * Will be used as an import to the server.ts file. Ultimately, this should be used to create a pool of worker threads.
 * @remarks
 * This class is intended to be used by the main thread of an application.
 * It creates a pool of worker threads that can execute remote procedure calls (RPCs) on behalf of the main thread.
 */
export class RpcWorkerPool implements WorkerPool, WorkerPoolRpc {
  /**
   * The number of worker threads in the pool. Defaults to the number of CPU cores.
   */
  private size: number;
  /**
   * The strategy used to allocate tasks to worker threads. Defaults to 'leastbusy'.
   * See {@link Strategies} for supported strategies.
   */
  private strategy: Strategies;
  /**
   * A boolean indicating whether logging is enabled. Defaults to false.
   * When logging is enabled, the pool will log messages to the console.
   */
  private _verbose: boolean;
  /**
   * An index used to implement round-robin scheduling of tasks. This value is incremented
   * with each call to `scheduleTask()` and is used to select a worker thread to execute the task.
   * It is also used to correlate the result of a command execution with the original command.
   * Each worker thread maintains a map of its in-flight commands, which is used to track
   * the progress of the commands.
   */
  private rr_index: number;
  /**
   * The ID of the next command execution. This value is incremented with each call to
   * `scheduleTask()` and is used to track which worker thread is executing a given command.
   * It is also used to correlate the result of a command execution with the original command.
   * Each worker thread maintains a map of its in-flight commands, which is used to track
   * the progress of the commands.
   * The in-flight commands map is keyed by the `internal_job_ref` of the command.
   * The value of the in-flight command map is the `resolve` function used to resolve the
   * promise returned by the `scheduleTask()` method.
   */
  private next_job_ref: number;
  /**
   * An array containing objects representing the worker threads in the pool.
   * Each object contains the worker thread itself, a map of its in-flight commands, and the worker ID.
   * The in-flight commands map is keyed by the `internal_job_ref` of the command.
   * The value of the in-flight command map is the `resolve` function used to resolve the
   * promise returned by the `scheduleTask()` method. The worker ID is an integer in the range [0, size - 1].
   */
  private workers: {
    worker: Worker;
    in_flight_commands: Map<number, any>;
    employee_number: number;
  }[];
  // The URI of the worker script file.
  // The number of worker threads to spawn.
  // The strategy for handling incoming requests.
  // Whether or not to enable verbose output.
  /**
   * Creates a new RpcWorkerPool object.
   * @param pathURI - The file path of the worker thread code.
   * @param size - The number of worker threads to create. Defaults to the number of CPU cores.
   * @param strategy - The strategy used to allocate tasks to worker threads. Defaults to 'leastbusy'.
   * @param verbosity - A boolean indicating whether logging is enabled. Defaults to false.
   * When logging is enabled, the pool will log messages to the console.
   */
  constructor(
    pathURI: null,
    size: number = 0,
    strategy: Strategies = strategies.leastbusy,
    verbosity = false
  ) {
    this.size = size < 0 ? Math.max(CORES + size, 1) : size || CORES;
    this.strategy = supportedStrategies.has(strategy)
      ? strategy
      : strategies.leastbusy;
    this._verbose = verbosity;
    const SCRIPT_FILE_URI = join(
      `${__dirname}/worker.${
        existsSync(`${__dirname}/worker.ts`) ? 'ts' : 'js'
      }`
    );
    void pathURI;
    this.rr_index = -1;
    this.next_job_ref = 0;
    this.workers = [];
    for (
      let employee_number = 0;
      employee_number < this.size;
      employee_number++
    ) {
      // HACK: This is a hack to work around the fact that the Worker constructor does not support ts_node
      const worker = new Worker(
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

      // const worker = new Worker(path);
      this.workers.push({
        worker,
        in_flight_commands: new Map(),
        employee_number,
      });

      worker.on('message', (msg: RpcResponse<unknown, unknown>) => {
        this.onMessageHandler(msg, employee_number);
      });
    }
  }
  async execRpc<R = unknown>(rpcRequest: RpcRequest<string[]>): Promise<R> {
    return this.exec<R>(
      rpcRequest.method,
      Number(rpcRequest.id),
      ...(rpcRequest.params || [])
    );
  }
  // ++ --------------------------------------------------------------
  /**
   * Sends a command to a worker thread for execution.
   * @param command_name - The name of the command to execute.
   * @param external_message_identifier - A message ID to associate with the command.
   * @param args - Optional arguments for the command.
   * @returns A promise that resolves to the result of the command execution.
   */
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
  // ++ --------------------------------------------------------------
  /**
   * Returns the worker thread to which the next command should be sent.
   * @param external_message_identifier - A message ID to associate with the command.
   * @returns An object representing the worker thread to use.
   */
  private getWorker(log_message_id = -1): {
    worker: Worker;
    in_flight_commands: Map<number, any>;
    employee_number: number;
  } {
    let employee_number: number = 0;
    switch (this.strategy) {
      case 'random':
        employee_number = Math.floor(Math.random() * this.size);
        break;
      case 'roundrobin':
        this.rr_index++;
        if (this.rr_index >= this.size) this.rr_index = 0;
        employee_number = this.rr_index;
        break;
      case 'leastbusy':
      default:
        let min = Infinity;
        for (let i = 0; i < this.size; i++) {
          let worker = this.workers[i];
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

    return this.workers[employee_number];
  }
  // ++ --------------------------------------------------------------

  /**
   * This class method is used to handle incoming RPC messages from a worker.
   *
   * @param msg The RPC response message to be processed.
   * @param employee_number The identifier for the worker that sent the message.
   */
  private onMessageHandler(
    msg: RpcResponse<any>,
    employee_number: number
  ): void {
    // Each worker is represented as an object with the worker instance,
    // a map of in-flight commands, and the worker's employee_number.
    const worker = this.workers[employee_number];

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
    const error: RpcResponseError<any> | null = msg?.error || null;
    if (!error && result != null) {
      this.handleResult(resolve, result, external_message_identifier);
    } else {
      this.handleError(reject, error);
    }
  }

  /**
   * Handle the result of the RPC response.
   *
   * @param resolve The resolve function of the promise associated with the job.
   * @param result The result data from the RPC response.
   * @param external_message_identifier The identifier for the external message.
   */
  private handleResult(
    resolve: (value: unknown) => void,
    result: unknown,
    external_message_identifier: number | string
  ): void {
    // Wrap the result in an RpcRight object and resolve the promise with it.
    resolve(baseRpcResponseRight(result)(external_message_identifier));
  }

  /**
   * Handle the error of the RPC response.
   *
   * @param reject The reject function of the promise associated with the job.
   * @param error The error data from the RPC response.
   */
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
