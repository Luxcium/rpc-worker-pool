'use strict';
// #!! Primary worker definition.
// #!! Consumed by the RpcWorkerPool class via path the to this file.

import { parentPort, threadId, workerData } from 'node:worker_threads';
import { INTERNAL_ERROR, swapRpcId } from '../API';
import { methods } from '../commands';
import { getParams } from '../commands/tools/getParams';
import { IdsObject } from '../types';
import { RpcRequest, RpcResponse } from '../types/specs';
/**
 * The primary worker definition module that runs the worker process.
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
 * TypeDoc or in TSDoc
 */

function MAIN(): void {
  try {
    if (!parentPort) throw new Error('parentPort is missing or is undefined');
    parentPort.on(
      'message',

      asyncOnMessageWrap(onWrapedMessage)
      // msg: RpcRequest<[IdsObject, ...string[]]>) =>
      // messageWrap(onWrapedMessage, msg)
    );
  } catch (error) {
    errorHandler('Error communicating with parentPort:', error);
  }
}

async function onWrapedMessage(
  rpcRequest: RpcRequest<[IdsObject, ...string[]]>
): Promise<RpcResponse<unknown>> {
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

type Fn = (
  msg: RpcRequest<[IdsObject, ...string[]]>
) => Promise<RpcResponse<unknown>>;

async function messageWrap(fn: Fn, msg: RpcRequest<[IdsObject, ...string[]]>) {
  try {
    if (!parentPort) throw new Error('parentPort is undefined');
    const [{ external_message_identifier }] = getParams(msg);
    const currentId = swapRpcId(external_message_identifier, msg);
    const result: RpcResponse<unknown> = await fn(msg);
    swapRpcId(currentId, result);
    parentPort.postMessage(result);
  } catch (error) {
    errorHandler('Worker failed to reply (postMessage) to parentPort:', error);
  }
}

function asyncOnMessageWrap(fn: Fn) {
  return (msg: RpcRequest<[IdsObject, ...string[]]>) => messageWrap(fn, msg);
}

function errorHandler(msg: string, error: unknown) {
  console.error(
    msg,
    'Worker failed to reply (postMessage) to parentPort:',
    error
  );
}
const workerAsset = workerData.workerAsset;
console.log(
  `WORKER(${threadId}):${
    threadId - workerAsset === 1 ? '' : ` EmployeeID: '${workerAsset}'`
  } from ${__filename}`
);

MAIN();

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

// export async function messageWrap(msg: RpcRequest<[IdsObject, ...string[]]>) {
//   try {
//     if (!parentPort) throw new Error('parentPort is undefined');
//     const [{ external_message_identifier }] = getParams(msg);
//     const currentId = swapRpcId(external_message_identifier, msg);
//     const result: RpcResponse<unknown> = await onWrapedMessage(msg);
//     swapRpcId(currentId, result);
//     parentPort.postMessage(result);
//   } catch (error) {
//     errorHandler('Error communicating with parentPort:', error);
//   }
// }
