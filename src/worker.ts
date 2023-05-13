'use strict';
// #!! Consumed by the RpcWorkerPool class via path the to this file.

import { parentPort } from 'node:worker_threads';
import { INTERNAL_ERROR } from './API';
import { methods } from './commands';
import { RpcRequest } from './types';
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
 * and `job_ref`. The `command_name` is used to look up a function in the `commands`
 * object, which is then called with the `job_ref` and `params`. If the function
 * call succeeds, the result is sent back to the parent thread as a message
 * containing a `MessageRPC` object. If the function call fails, an error message
 * is sent back to the parent thread as a message containing an `ErrorRPC` object.
 *
 * @returns void
 *
 * @internal
 * This function is consumed by the `RpcWorkerPool` class via the path to this file.(85)
 */
(function MAIN(): void {
  const { workerData } = require('worker_threads');
  const workerAsset = workerData.workerAsset;
  console.log(`at: WORKER ${workerAsset} from ${__filename}`);
  // console.log(`at: MAIN from ${__filename}`);
  try {
    if (!parentPort) throw new Error('parentPort is missing or is undefined');
    parentPort.on(
      'message',
      asyncOnMessageWrap(async (rpcRequest: RpcRequest<string[]>) => {
        const { method } = rpcRequest;
        try {
          const resultRPC = await methods[method](rpcRequest);
          return resultRPC;
        } catch (error) {
          const errorRPC = INTERNAL_ERROR(rpcRequest.id, error);
          console.error(errorRPC);
          return errorRPC;
        }
      })
    );
  } catch (error) {
    console.error('Error communicating with parentPort:', error);
  }

  return;
})();

/**
 * Wraps a function with asynchronous message handling for worker
 * threads.
 *
 * This function is intended to be used as a utility for processing
 * messages in worker threads.
 * It abstracts away some of the complexity of sending and receiving
 * messages, and ensures that
 * messages are handled asynchronously and errors are handled
 * properly.
 *
 * @internal
 * @typeparam P - The type of parameters for the `RpcRequest`. Default to string array.
 * @param fn - The function to wrap, which takes a message object of
 * type `RpcRequest<P>` and returns a `Promise<any>`.
 * @returns A new `async` function that takes a message object of type
 * `RpcRequest<P>` and returns a `Promise<any>`.
 *
 * @remarks
 * The returned function handles message passing between worker
 * threads by checking that `parentPort`
 * is defined, calling `fn` with the message object, and logging
 * any errors that occur during message handling.
 *
 * @example
 * ```
 * const handleMessage = asyncOnMessageWrap(async (msg: RpcRequest<string[]>) => {
 *   // Do some work with the message object...
 * });
 *
 * worker.on('message', handleMessage);
 * ```
 */
function asyncOnMessageWrap<P extends Array<string> = string[]>(
  fn: (msg: RpcRequest<P>) => Promise<any>
) {
  return async function (msg: RpcRequest<P>) {
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

// export function asyncOnMessageWrap2(fn: WraperFunction) {
//   return async function <P extends Array<string> = string[]>(
//     msg: RpcRequest<P>
//   ) {
//     try {
//       if (!parentPort) throw new Error('parentPort is undefined');
//       void parentPort.postMessage(await fn<P>(msg));
//     } catch (error) {
//       void console.error(
//         'Worker failed to reply (postMessage) to parentPort:',
//         error
//       );
//     }
//   };
// }
