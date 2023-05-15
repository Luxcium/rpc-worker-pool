'use strict';
// #!! Consumed by the RpcWorkerPool class via path the to this file.

import { parentPort } from 'node:worker_threads';
import { INTERNAL_ERROR } from '../API';
import { methods } from '../commands';
import { getParams } from '../commands/commands';
import { IdsObject } from '../types';
import { RpcRequest, RpcResponse } from '../types/specs';
/**
 * The main function that runs the worker process.
 * This function is intended to be run as an IIFE in a worker thread, and is not
 * meant to be called directly. It is consumed by the `RpcWorkerPool` class via
 * the path to this file.
 *
 * @remarks
 * The `MAIN()` function listens for messages on the `parentPort` and processes
 * them using the `asyncOnMessageWrap()` function. It expects messages to be in
 * the format of a `RpcRequest<string[]>`, which contains a `method`. The `method`
 * is used to look up a function in the `methods` object, which is then called.
 * If the function call succeeds, the result is sent back to the parent thread.
 * If the function call fails, an error message is sent back to the parent thread as an `ErrorRPC` object.
 *
 * @internal
 * @returns void
 */
// function MAIN() {
//   const { workerData } = require('worker_threads');
//   const workerAsset = workerData.workerAsset;
//   console.log(`at: WORKER ${workerAsset} from ${__filename}`);
//   try {
//     if (!parentPort) throw new Error('parentPort is missing or is undefined');
//     parentPort.on(
//       'message',
//       asyncOnMessageWrap(async rpcRequest => {
//         const { method } = rpcRequest;
//         try {
//           const resultRPC = await methods[method](rpcRequest);
//           return resultRPC;
//         } catch (error) {
//           const errorRPC = INTERNAL_ERROR(rpcRequest.id, error);
//           console.error(errorRPC);
//           return errorRPC;
//         }
//       })
//     );
//   } catch (error) {
//     console.error('Error communicating with parentPort:', error);
//   }
// }
// MAIN;
(function MAIN(): void {
  const { workerData } = require('worker_threads');
  const workerAsset = workerData.workerAsset;
  console.log(`at: WORKER ${workerAsset} from ${__filename}`);
  // console.log(`at: MAIN from ${__filename}`);
  try {
    if (!parentPort) throw new Error('parentPort is missing or is undefined');
    parentPort.on(
      'message',
      asyncOnMessageWrap(
        async (rpcRequest: RpcRequest<[IdsObject, ...string[]]>) => {
          const { method } = rpcRequest;
          try {
            const resultRPC = await methods[method](rpcRequest);
            return resultRPC;
          } catch (error) {
            const errorRPC = INTERNAL_ERROR(rpcRequest.id, error);
            console.error(errorRPC);
            return errorRPC;
          }
        }
      )
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
function asyncOnMessageWrap(
  fn: (
    msg: RpcRequest<[IdsObject, ...string[]]>
  ) => Promise<RpcResponse<unknown>>
) {
  return async function (msg: RpcRequest<[IdsObject, ...string[]]>) {
    try {
      if (!parentPort) throw new Error('parentPort is undefined');
      const [at_asyncOnMessageWrap] = getParams(msg);
      console.dir({ at_asyncOnMessageWrap });
      const result: RpcResponse<unknown> = await fn(msg);
      void parentPort.postMessage(result);
    } catch (error) {
      void console.error(
        'Worker failed to reply (postMessage) to parentPort:',
        error
      );
    }
  };
}
