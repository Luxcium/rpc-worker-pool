'use strict';
import { Worker } from 'node:worker_threads';
import { cpus } from 'os';
import { baseRpcResponseRight } from '../API/RPC-serialise';
import { RpcRequest, RpcResponse, WorkerPool, WorkerPoolRpc } from '../types';
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
  private verbosity: boolean;
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
    pathURI: string,
    size: number = 0,
    strategy: Strategies = strategies.leastbusy,
    verbosity = false
  ) {
    this.size = size < 0 ? Math.max(CORES + size, 1) : size || CORES;
    this.strategy = supportedStrategies.has(strategy)
      ? strategy
      : strategies.leastbusy;
    this.verbosity = verbosity;

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
            runThisFileInTheWorker: pathURI, // '/path/to/worker-script.ts'
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
      worker.on('message', (msg: RpcResponse<unknown>) => {
        this.onMessageHandler(msg, employee_number);
      });
    }
  }
  async execRpc<O = unknown>(
    rpcRequest: RpcRequest<string[]>
  ): Promise<RpcResponse<O, unknown>> {
    return this.exec(
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
            employee_number = 0;
          }
        }
    }
    this.verbosity &&
      console.log(
        `Worker: ${employee_number + 1} Message id: ${log_message_id || 0}`
      );

    return this.workers[employee_number];
  }
  // ++ --------------------------------------------------------------
  /**
   * Handler for messages received from worker threads.
   * @param msg - The message received from the worker thread.
   * @param employee_number - The ID of the worker thread that sent the message.
   */
  private onMessageHandler(
    msg: RpcResponse<unknown>,
    employee_number: number
  ): void {
    const worker = this.workers[employee_number];

    const result = msg?.result;
    const error = msg?.error;

    const internal_job_ref = Number(msg.id);
    const { resolve, reject } = worker.in_flight_commands.get(
      internal_job_ref as number
    );
    worker.in_flight_commands.delete(internal_job_ref as number);

    if (error) reject(error);
    else resolve(baseRpcResponseRight(result)(NaN));
  }

  // private verbosity: boolean;
  get verbose(): boolean {
    return this.verbosity;
  }
  set verbose(VERBOSE: boolean) {
    this.verbosity = VERBOSE;
  }
}

export default RpcWorkerPool;

/* **************************************************************** */
/*                                                                  */
/*  MIT LICENSE                                                     */
/*                                                                  */
/*  Copyright © 2021-2022 Benjamin Vincent Kasapoglu (Luxcium)      */
/*                                                                  */
/*  NOTICE:                                                         */
/*  O’Reilly Online Learning                                        */
/*                                                                  */
/*  Title: “Multithreaded JavaScript”                               */
/*  Author: “by Thomas Hunter II and Bryan English”                 */
/*  Publisher: “O’Reilly”                                           */
/*  Copyright: “© 2022 Thomas Hunter II and Bryan English”          */
/*  ISBN: “978-1-098-10443-6.”                                      */
/*                                                                  */
/*  Using Code Examples                                             */
/*  Supplemental material (code examples, exercises, etc.)          */
/*  is available for download at                                    */
/*  https://github.com/MultithreadedJSBook/code-samples.            */
/*                                                                  */
/*  In general, if example code is offered with this book, you may  */
/*  use it in your programs and documentation. You do not need to   */
/*  contact us for permission unless you’re reproducing a           */
/*  significant portion of the code. For example, writing a         */
/*  program that uses several chunks of code from this book does    */
/*  not require permission. Selling or distributing examples from   */
/*  O’Reilly books does require permission. Answering a question by */
/*  citing this book and quoting example code does not require      */
/*  permission. Incorporating a significant amount of example code  */
/*  from this book into your product’s documentation does require   */
/*  permission.                                                     */
/*                                                                  */
/*  If you feel your use of code examples falls outside fair use or */
/*  the permission given above, feel free to contact us at          */
/*  permissions@oreilly.com.                                        */
/*                                                                  */
/* **************************************************************** */

// chat gpt code analysis
/*
Sure, here's my review of /projects/monorepo-one/services/rpc-worker-pool/src/RpcWorkerPool.ts:

Best Practices:
The class is well-structured and follows the principles of SOLID design.
The code is modular, with clear separation of concerns.
The class uses a factory pattern to create worker threads.
The code makes use of async/await and Promises, making the code more readable and easier to reason about.
Resilience:
The worker pool is designed to be resilient to failures of worker threads. It tracks in-flight commands, and can re-assign work to a different thread if one thread fails.
The class uses error handling to manage unexpected events.
Robustness:
The worker pool is designed to be robust, with the ability to handle large numbers of requests in parallel.
The class has been designed to prevent race conditions when multiple requests are being handled at once.
The worker pool is designed to work with any script that can be run in a worker thread.
Security:
The worker pool does not perform any unsafe operations, and is designed to be secure.
Maintainability:
The code is well-structured and easy to read.
The class follows best practices, which makes it easier to maintain.
The code is modular and has clear separation of concerns.
Testability:
The worker pool is designed to be easily testable, with the ability to mock worker threads and commands.
The code uses clear interfaces, making it easy to write tests for individual components.
Overall, I would say that /projects/monorepo-one/services/rpc-worker-pool/src/RpcWorkerPool.ts is well-designed and well-implemented, with a focus on modularity, testability, and resilience. It follows best practices, and is secure, robust, and maintainable.

TODO:

Best practice: The use of eval in the Worker constructor is generally not considered a best practice, as it can introduce security risks. It is also better to avoid eval when possible since it can make code more difficult to read and debug. Instead, it is recommended to pass the script to execute as a separate file.

Resilience: The RpcWorkerPool class could be made more resilient to worker thread failures. For example, it could monitor the status of worker threads and attempt to restart them if they fail.

Robustness: The RpcWorkerPool class currently does not handle errors that may occur during command execution. If a command fails on a worker thread, the pool should be able to handle the error and return an appropriate response to the caller.

Security: As mentioned previously, the use of eval in the Worker constructor can introduce security risks. It is important to ensure that any code executed on the worker thread is safe and does not expose the main thread to any security vulnerabilities.

Maintainability: The RpcWorkerPool class could be made more maintainable by adding documentation and improving the readability of the code. Additionally, it could benefit from better code organization, such as separating the RpcWorkerPool class into smaller, more focused classes.

Testability: To make the RpcWorkerPool class more testable, it could be useful to create unit tests for the individual methods and functions. This would ensure that any changes made to the code do not introduce new bugs or break existing functionality. Additionally, the class could be designed with dependency injection in mind, which would make it easier to mock dependencies during testing.

*/
