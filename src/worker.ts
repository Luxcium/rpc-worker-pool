'use strict';
// #!! Consumed by the RpcWorkerPool class via path the to this file.

import { parentPort } from 'node:worker_threads';
import { commands } from './commands';
/**
 * The main function that runs the worker process.
 *
 * @remarks
 * This function is intended to be run as an IIFE in a worker thread, and is not
 * meant to be called directly. It is consumed by the `RpcWorkerPool` class via
 * the path to this file.
 *
 * The `MAIN()` function listens for messages on the `parentPort` and processes
 * them using the `asyncOnMessageWrap()` function. It expects messages to be in
 * the format of a `MsgObjectToWrap`, which contains a `command_name`, `params`,
 * and `job_id`. The `command_name` is used to look up a function in the `commands`
 * object, which is then called with the `job_id` and `params`. If the function
 * call succeeds, the result is sent back to the parent thread as a message
 * containing a `MessageRPC` object. If the function call fails, an error message
 * is sent back to the parent thread as a message containing an `ErrorRPC` object.
 *
 * @returns void
 *
 * @internal
 * This function is consumed by the `RpcWorkerPool` class via the path to this file.(85)
 */
void (function MAIN(): void {
  const { workerData } = require('worker_threads');
  const workerId = workerData.workerId;
  console.log(`at: WORKER ${workerId} from ${__filename}`);
  // console.log(`at: MAIN from ${__filename}`);
  try {
    if (!parentPort) throw new Error('parentPort is missing or is undefined');
    void parentPort.on(
      'message',
      asyncOnMessageWrap(
        async ({ command_name, params, job_id }: MsgObjectToWrap) => {
          const messageRPC: MessageRPC = {
            jsonrpc: '2.0',
            job_id,
            pid: 'worker: ' + process.pid,
          };

          try {
            const resultRPC = await commands[command_name](job_id, ...params);
            return { ...messageRPC, result: resultRPC };
          } catch (error: any) {
            const errorRPC = {
              code: -32_603,
              message:
                'Internal error!!! (Internal JSON-RPC error). ' +
                (error.message || ''),
              error,
            };
            console.error(String({ ...messageRPC, error: errorRPC }));
            return { ...messageRPC, error: errorRPC };
          }
        }
      )
    );
  } catch (error) {
    void console.error('Error communicating with parentPort:', error);
  }

  return;
})();
/**
 * @internal
 * Wraps a function with async message handling for worker threads.
 *
 * @param fn - The function to wrap, which takes a message object of type `MsgObjectToWrap` and returns a `Promise<any>`.
 *
 * @returns A new `async` function that takes a message object of type `MsgObjectToWrap` and returns a `Promise<any>`.
 * The returned function handles message passing between worker threads by checking that `parentPort`
 * is defined, calling `fn` with the message object, and logging any errors that occur during message handling.
 *
 * @remarks
 * This function is intended to be used as a utility for processing messages in worker threads.
 * It abstracts away some of the complexity of sending and receiving messages, and ensures that
 * messages are handled asynchronously and errors are handled properly.
 *
 * @example
 * ```
 * const handleMessage = asyncOnMessageWrap(async (msg: MsgObjectToWrap) => {
 *   // Do some work with the message object...
 * });
 *
 * worker.on('message', handleMessage);
 * ```
 */
function asyncOnMessageWrap(fn: WraperFunction) {
  return async function (msg: MsgObjectToWrap) {
    try {
      if (!parentPort) throw new Error('parentPort is undefined');
      void parentPort.postMessage(await fn(msg));
    } catch (error) {
      void console.error(
        'Worker failed to reply (postMessage) to parentPort:',
        error
      );
    }
  };
}
/**
 * An object containing the properties needed to wrap a message for the worker thread.
 */
type MsgObjectToWrap = {
  /** The name of the command to execute. */
  command_name: string;
  /** The parameters to pass to the command. */
  params: string;
  /** The job ID associated with the message. */
  job_id: string;
};

/**
 * A function that takes a `MsgObjectToWrap` and returns a Promise of any type.
 */
type WraperFunction = (msgObject: MsgObjectToWrap) => Promise<any>;

/**
 * An object containing information about an error that occurred during a remote procedure call (RPC).
 */
type ErrorRPC = {
  /** The HTTP status code that should be returned for this error. */
  status?: number;
  /** A unique identifier of the error. */
  id?: number | string | null;
  /** A short description of the error. */
  title: string;
  /** A detailed description of the error. */
  detail: string;
  /** Additional metadata about the error. */
  meta?: Record<string, any>;
  /** A numeric error code. */
  code: number;
  /** A human-readable error message. */
  message: string;
  /** Any additional data associated with the error. */
  data: any;
};

/**
 * An object containing the properties returned from a remote procedure call (RPC).
 */
type MessageRPC<T = unknown> = {
  /** The JSON-RPC version. */
  jsonrpc: '2.0';
  /** The unique identifier of the original request. */
  id?: number | string | null;
  /** The result of the JSON-RPC method call. */
  result?: T;
  /** An error object if the JSON-RPC method call failed. */
  error?: ErrorRPC;
  /** The job ID associated with the message. */
  job_id: string;
  /** The process ID of the worker thread. */
  pid: string;
};

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

/*
ChatGPT Analysis

Best Practice:
The code is using import and export statements for module management, which is a best practice in modern JavaScript.
The code is also using strict mode and typescript, which can help catch errors at compile time and is also considered a best practice.
Resilience:
The code seems to have some error handling in place, including handling messages that fail, but it could benefit from more robust error handling to ensure the worker threads do not stop functioning in unexpected situations.
The code could also be enhanced to better handle communication issues with the parent process to ensure that errors can be detected and managed appropriately.
Robustness:
The code is relatively simple and appears to have been designed with robustness in mind, with good separation of concerns and a clear, concise structure.
The use of TypeScript can help prevent type errors and ensure better code correctness.
The code could benefit from more comprehensive unit tests and integration tests to ensure that all edge cases are handled correctly.
Security:
From a security perspective, the code seems to be relatively safe. It doesn't appear to have any glaring security issues, but it would benefit from a comprehensive security review to ensure that it meets all relevant security standards.
Maintainability:
The code is fairly easy to read and appears to have been designed with maintainability in mind. It has a clear, concise structure that should be relatively easy to modify or extend.
The use of TypeScript should help make the code more maintainable by ensuring that changes are less likely to introduce type errors or other bugs.
Testability:
The code appears to be designed with testability in mind, with clearly defined interfaces and a well-separated code structure.
However, the code could benefit from more comprehensive testing to ensure that it works correctly in all edge cases.

TODO:

there are some potential areas for improvement:

Error handling: While the code does handle errors, the current implementation only logs the error message and sends a generic error message back to the parent process. In order to improve resilience, it might be useful to include more information in the error message that is sent back to the parent process. This could include the stack trace or any additional contextual information that would be helpful for debugging.

Security: The code currently does not include any security measures, such as input validation or output sanitization. If the params variable is not properly validated, there is a risk of potential injection attacks. To improve security, it is recommended to validate any input parameters to ensure they are of the expected type and within the acceptable range, and sanitize any output to ensure it does not contain any unexpected or harmful content.

Maintainability: The current implementation uses a simple object to map command names to functions. As the number of available commands increases, it may become difficult to manage and maintain the commands object. To improve maintainability, it might be useful to organize the code into modules or packages, and use a more robust and scalable approach to mapping command names to functions, such as a registry or a service locator pattern.

Testability: The current implementation could be improved in terms of testability by separating the worker logic from the message passing and error handling. This would allow for more comprehensive testing of the worker logic in isolation from the message passing and error handling. Additionally, it would be useful to include unit tests for the asyncOnMessageWrap function to ensure that it handles errors correctly and returns the expected output.
*/
