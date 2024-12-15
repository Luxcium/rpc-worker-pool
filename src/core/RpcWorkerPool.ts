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
import { MCPRequest, MCPResponse } from '../types/specs/mcp-bridge';

// RpcWorkerPool class implements WorkerPool and WorkerPoolRpc
export class RpcWorkerPool implements WorkerPool, WorkerPoolRpc {
  // Size of the worker pool (computed based on CPU cores or user-provided value)
  private readonly size: number;

  // Strategy used to assign jobs to workers (e.g., 'leastbusy', 'roundrobin', 'random')
  private readonly strategy: Strategies;

  // Verbosity flag for logging details during execution
  private _verbose: boolean;

  // Index to track round-robin worker selection
  private rr_index: number;

  // Internal job reference counter for uniquely identifying jobs
  private next_job_ref: number;

  /**
   * Represents the workers in the RPC worker pool.
   * Each worker object includes the following:
   * - `worker`: The worker thread instance.
   * - `in_flight_commands`: A map to track ongoing commands for each worker.
   * - `employee_number`: Identifier for each worker instance.
   */
  private readonly employees: {
    worker: Worker;
    in_flight_commands: Map<number, any>;
    employee_number: number;
  }[];

  private computeSize(size: number): number {
    const coreCount = RpcWorkerPool.coreCount;
    return Math.max(size < 0 ? coreCount + size : size || coreCount - 1, 1);
  }
  // A sorted list of employees by in-flight commands for least busy strategy
  private employeesSortedByLoad: {
    worker: Worker;
    in_flight_commands: Map<number, any>;
    employee_number: number;
  }[] = [];

  // Constructor for initializing the worker pool with given size, strategy, and verbosity
  constructor(
    size = 0,
    strategy: Strategies = strategies.leastbusy,
    verbosity = false
  ) {
    // Compute the size of the worker pool based on provided size or CPU cores

    this.size = this.computeSize(size);

    // Determine strategy based on supported strategies or default to 'leastbusy'
    this.strategy = supportedStrategies.has(strategy)
      ? strategy
      : strategies.leastbusy;

    // Initialize round-robin index and job reference counter
    this.rr_index = -1;
    this.next_job_ref = 0;
    this.employees = [];

    // Create workers for the worker pool
    this.createWorkers();
    this._verbose = verbosity; // Use the setter method
  }

  // Method to create workers and attach message listeners
  private createWorkers(): void {
    for (
      let employee_number = 0;
      employee_number < this.size;
      employee_number++
    ) {
      // Generate a worker using the worker generator function
      const worker = tsnodeWorkerGenerator(
        __dirname,
        employee_number,
        Worker
      ).on('message', (msg: RpcResponse<unknown, unknown> | MCPResponse<unknown>) => {
        // Attach message listener for each worker to handle responses
        this.onMessageHandler(msg, employee_number);
      });

      // Define the employee object that represents the worker
      const employee = {
        worker,
        in_flight_commands: new Map(),
        employee_number,
      };

      // Add employee to the list of workers
      this.employees.push(employee);
      if (this.strategy === 'leastbusy') {
        // If the strategy is 'leastbusy', add to sorted list
        this.insertEmployeeSortedByLoad(employee);
      }
    }
  }

  // Insert employee in sorted order based on in-flight commands
  private insertEmployeeSortedByLoad(employee: {
    worker: Worker;
    in_flight_commands: Map<number, any>;
    employee_number: number;
  }): void {
    // Find the correct position to maintain sorted order
    let index = this.employeesSortedByLoad.findIndex(
      e => e.in_flight_commands.size > employee.in_flight_commands.size
    );
    if (index === -1) {
      index = this.employeesSortedByLoad.length;
    }
    // Insert the employee at the calculated index
    this.employeesSortedByLoad.splice(index, 0, employee);
  }

  // Method to execute an RPC request, delegating to `exec` method
  async execRpc<ResultsType = unknown>(
    rpcRequest: RpcRequest<string[]> | MCPRequest<string[]>
  ): Promise<ResultsType> {
    // Call the general exec method with the parameters from rpcRequest
    return this.exec<ResultsType>(
      rpcRequest.method,
      Number(rpcRequest.id),
      ...(rpcRequest.params || [])
    );
  }

  // General method to execute a command using a worker from the pool
  async exec<O = unknown>(
    command_name: string,
    external_message_identifier: number,
    ...args: string[]
  ): Promise<O> {
    // Generate a new internal job reference for the command
    const internal_job_ref = this.next_job_ref++;

    // Get the employee (worker) to execute the command
    const employee = this.getWorker();

    // Create a promise to manage command execution lifecycle
    const promise = this.createCommandPromise<O>(
      employee,
      internal_job_ref,
      external_message_identifier
    );

    // Construct the RPC request with details including job references and arguments
    const rpcRequest: RpcRequest<{}> | MCPRequest<{}> = {
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

    // Post the message to the worker with retry logic and error handling
    let retries = 3;
    while (retries > 0) {
      try {
        employee.worker.postMessage(rpcRequest);
        break; // Exit loop if message is posted successfully
      } catch (error: any) {
        retries -= 1;
        console.error('Failed to post message to worker:', error);
        if (retries === 0) {
          throw new Error(
            `Failed to post message to worker after multiple attempts: ${error.message}`
          );
        }
      }
    }

    return promise;
  }

  // Helper method to create a promise for command execution
  private createCommandPromise<O>(
    employee: {
      worker: Worker;
      in_flight_commands: Map<number, any>;
      employee_number: number;
    },
    internal_job_ref: number,
    external_message_identifier: number
  ): Promise<O> {
    // Create a promise and store its resolve and reject functions for later use
    return new Promise<O>((resolve, reject) => {
      employee.in_flight_commands.set(internal_job_ref, {
        resolve,
        reject,
        external_message_identifier,
      });
    });
  }

  // Private method to select a worker based on the specified strategy
  private getWorker(log_message_id = -1): {
    worker: Worker;
    in_flight_commands: Map<number, any>;
    employee_number: number;
  } {
    let employee_number = 0;
    switch (this.strategy) {
      case 'random':
        // Select a random worker
        employee_number = Math.floor(Math.random() * this.size);
        break;
      case 'roundrobin':
        // Use round-robin strategy to select the next worker
        this.rr_index = (this.rr_index + 1) % this.size;
        employee_number = this.rr_index;
        break;
      case 'leastbusy':
      default:
        // Select the worker with the least number of in-flight commands
        employee_number = this.employeesSortedByLoad[0].employee_number;
        break;
    }
    // Log the selected worker if verbosity is enabled
    if (this._verbose) {
      console.log(
        `Worker: ${employee_number + 1} Message id: ${log_message_id || 0}`
      );
    }

    return this.employees[employee_number];
  }

  // Private handler to process messages from workers
  private onMessageHandler(
    msg: RpcResponse<any> | MCPResponse<any>,
    employee_number: number
  ): void {
    // Get the worker object and retrieve the command from in-flight commands
    const worker = this.employees[employee_number];
    const internal_job_ref = Number(msg.id);
    const internal_job = worker.in_flight_commands.get(internal_job_ref);

    // Handle missing in-flight commands
    if (!internal_job) {
      const error = new Error(
        `No in-flight command found for job ref: ${internal_job_ref}`
      );
      if (this._verbose) {
        console.error(error);
      }
      throw error;
    }

    const { resolve, reject, external_message_identifier } = internal_job;

    // Process the result or error from the message
    const result: unknown = msg?.result ?? null;
    const error: RpcResponseError | null = msg?.error || null;
    if (!error && result != null) {
      // Handle successful result
      this.handleResult(resolve, result, external_message_identifier);
    } else {
      // Handle error
      this.handleError(reject, error);
    }

    // Delete the in-flight command since it's being processed
    worker.in_flight_commands.delete(internal_job_ref);
  }

  // Private method to handle successful RPC responses
  private handleResult(
    resolve: (value: unknown) => void,
    result: unknown,
    external_message_identifier: number | string
  ): void {
    // Wrap the result and resolve the promise
    resolve(baseRpcResponseRight(result)(external_message_identifier));
  }

  // Private method to handle errors in RPC responses
  private handleError(
    reject: (reason?: unknown) => void,
    error: RpcResponseError<unknown> | null
  ): void {
    // Reject the promise with the error
    reject(error || 'An unknown error occurred');
  }

  // Getter for verbosity flag
  get verbosity(): boolean {
    return this._verbose;
  }

  // Setter for verbosity flag
  set verbosity(value: boolean) {
    this._verbose = value;
  }

  static get coreCount(): number {
    return cpus().length;
  }
}

// Default export of the RpcWorkerPool class
export default RpcWorkerPool;
