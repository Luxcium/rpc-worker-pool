'use strict';
// #!! Consumed by the RpcWorkerPool class via path the to this file.

import { parentPort } from 'node:worker_threads';
import { INTERNAL_ERROR } from '../API';
import { methods } from '../commands';
import { WraperFunction } from '../types';
import { RpcRequest } from '../types/specs';
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

// RpcRequest
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
  return async function <P extends Array<string> = string[]>(
    msg: RpcRequest<P>
  ) {
    try {
      if (!parentPort) throw new Error('parentPort is undefined');
      void parentPort.postMessage(await fn<P>(msg));
    } catch (error) {
      void console.error(
        'Worker failed to reply (postMessage) to parentPort:',
        error
      );
    }
  };
}

// // Define interfaces for each command's parameters and return type
// interface Command1Params {
//   param1: string;
//   param2: number;
// }

// interface Command1Result {
//   result: string;
// }

// // Define a mapping from command names to their respective interfaces
// type CommandMap = {
//   command1: { params: Command1Params; result: Command1Result };
//   // Add additional commands here...
// };

// // Use the CommandMap type to make the commands object strongly typed
// export const commands_2: {
//   [K in keyof CommandMap]: (
//     job_ref: number,
//     params: CommandMap[K]['params']
//   ) => Promise<CommandMap[K]['result']>;
// } = {
//   command1: async (job_ref, params) => {
//     // Implement command1 here...
//   },
//   // Add additional commands here...
// };

// export type Command<P extends any[], R> = {
//   description: string;
//   // Function to be used on the caller side, which takes some parameters and returns a Promise of a result.
//   callerSideFn: (...params: P) => Promise<R>;
//   // Function to be used on the receiver side, which takes some parameters and returns a Promise of a result.
//   receiverSideFn: (...params: P) => Promise<R>;
//   // Function to encode the result or error.
//   encodeFn: (result: R | Error) => string;
//   // Function to decode the result or error.
//   decodeFn: (result: string) => R | Error;
// };

// export function createCommand<P extends any[], R>(
//   description: string,
//   callerSideFn: (...params: P) => Promise<R>,
//   receiverSideFn: (...params: P) => Promise<R>,
//   encodeFn: (result: R | Error) => string,
//   decodeFn: (result: string) => R | Error
// ): Command<P, R> {
//   return {
//     description,
//     callerSideFn,
//     receiverSideFn,
//     encodeFn,
//     decodeFn,
//   };
// }

// export const commands_3 = {
//   command1: createCommand(
//     'Description for command1',
//     async (param1, param2) => {
//       // Implement caller side function for command1.
//     },
//     async (param1, param2) => {
//       // Implement receiver side function for command1.
//     },
//     result => JSON.stringify(result),
//     result => JSON.parse(result)
//   ),
//   // Add more commands here...
// };
