'use strict';
import { cpus } from 'os';
import { Worker } from 'worker_threads';
import { strategies, supportedStrategies, type Strategies } from './commands';

// const { Worker } = require('worker_threads');

new Worker(
  `
  require('ts-node/register');
  require(require('worker_threads').workerData.runThisFileInTheWorker);
`,
  {
    eval: true,
    workerData: {
      runThisFileInTheWorker: '/path/to/worker-script.ts',
    },
  }
);

const VERBOSE = false;
const CORES = cpus().length;

/**
 * Manages a pool of worker threads that can execute remote procedure calls (RPCs) on behalf of the main thread.
 * Will be used as an import to the server.ts file. Ultimately, this should be used to create a pool of worker threads.
 * @remarks
 * This class is intended to be used by the main thread of an application.
 * It creates a pool of worker threads that can execute remote procedure calls (RPCs) on behalf of the main thread.
 */
export class RpcWorkerPool {
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
   * The in-flight commands map is keyed by the `job_id` of the command.
   * The value of the in-flight command map is the `resolve` function used to resolve the
   * promise returned by the `scheduleTask()` method.
   */
  private next_job_id: number;
  /**
   * An array containing objects representing the worker threads in the pool.
   * Each object contains the worker thread itself, a map of its in-flight commands, and the worker ID.
   * The in-flight commands map is keyed by the `job_id` of the command.
   * The value of the in-flight command map is the `resolve` function used to resolve the
   * promise returned by the `scheduleTask()` method. The worker ID is an integer in the range [0, size - 1].
   */
  private workers: {
    worker: Worker;
    in_flight_commands: Map<number, any>;
    worker_id: number;
  }[];
  /**
   * Creates a new RpcWorkerPool object.
   * @param path - The file path of the worker thread code.
   * @param size - The number of worker threads to create. Defaults to the number of CPU cores.
   * @param strategy - The strategy used to allocate tasks to worker threads. Defaults to 'leastbusy'.
   * @param verbosity - A boolean indicating whether logging is enabled. Defaults to false.
   * When logging is enabled, the pool will log messages to the console.
   */
  constructor(
    path: string,
    size: number = 0,
    strategy: Strategies = strategies.leastbusy,
    verbosity = VERBOSE
  ) {
    this.size = size < 0 ? Math.max(CORES + size, 1) : size || CORES;
    this.strategy = supportedStrategies.has(strategy)
      ? strategy
      : strategies.leastbusy;
    this.verbosity = verbosity;

    this.rr_index = -1;
    this.next_job_id = 0;
    this.workers = [];
    for (let worker_id = 0; worker_id < this.size; worker_id++) {
      // HACK: This is a hack to work around the fact that the Worker constructor does not support
      const worker = new Worker(
        `
  require('ts-node/register');
  require(require('worker_threads').workerData.runThisFileInTheWorker);
`,
        {
          eval: true,
          workerData: {
            runThisFileInTheWorker: path, // '/path/to/worker-script.ts'
          },
        }
      );

      // const worker = new Worker(path);
      this.workers.push({ worker, in_flight_commands: new Map(), worker_id });
      worker.on('message', msg => {
        this.onMessageHandler(msg, worker_id);
      });
    }
  }
  // ++ --------------------------------------------------------------
  /**
   * Sends a command to a worker thread for execution.
   * @param command_name - The name of the command to execute.
   * @param message_id - A message ID to associate with the command.
   * @param args - Optional arguments for the command.
   * @returns A promise that resolves to the result of the command execution.
   */
  async exec(command_name: string, message_id: number, ...args: string[]) {
    const job_id = this.next_job_id++;

    // The message_id is provided for feedback purpose only.
    const worker = this.getWorker(message_id);

    const promise = new Promise((resolve, reject) => {
      worker.in_flight_commands.set(job_id, { resolve, reject });
    });
    worker.worker.postMessage({ command_name, params: args, job_id });

    return promise;
  }
  // ++ --------------------------------------------------------------
  /**
   * Returns the worker thread to which the next command should be sent.
   * @param message_id - A message ID to associate with the command.
   * @returns An object representing the worker thread to use.
   */
  getWorker(message_id = -1) {
    let worker_id: number = 0;
    switch (this.strategy) {
      case 'random':
        worker_id = Math.floor(Math.random() * this.size);
        break;
      case 'roundrobin':
        this.rr_index++;
        if (this.rr_index >= this.size) this.rr_index = 0;
        worker_id = this.rr_index;
        break;
      case 'leastbusy':
      default:
        let min = Infinity;
        for (let i = 0; i < this.size; i++) {
          let worker = this.workers[i];
          if (worker.in_flight_commands.size < min) {
            min = worker.in_flight_commands.size;
            worker_id = 0;
          }
        }
    }
    this.verbosity &&
      console.log(`Worker: ${worker_id + 1} Message id: ${message_id || 0}`);

    return this.workers[worker_id];
  }
  // ++ --------------------------------------------------------------
  /**
   * Handler for messages received from worker threads.
   * @param msg - The message received from the worker thread.
   * @param worker_id - The ID of the worker thread that sent the message.
   */
  onMessageHandler(msg: any, worker_id: number) {
    const worker = this.workers[worker_id];

    const { result, error, job_id } = msg;

    // resolve: (value: any) => void, reject: (reason?: any) =>
    const { resolve, reject } = worker.in_flight_commands.get(job_id);
    worker.in_flight_commands.delete(job_id);

    if (error) reject(error);
    else resolve(result);
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
