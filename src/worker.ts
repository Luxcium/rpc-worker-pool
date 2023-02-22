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
  console.log(`at: MAIN from ${__filename}`);
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
type MsgObjectToWrap = { command_name: string; params: string; job_id: string };
type WraperFunction = (msgObject: MsgObjectToWrap) => Promise<any>;

type ErrorRPC = {
  code: number;
  message: string;
  data: any;
};

type MessageRPC = {
  jsonrpc: string;
  job_id: string;
  pid: string;
  result?: any;
  errorRPC?: ErrorRPC;
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
