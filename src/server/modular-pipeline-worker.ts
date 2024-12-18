'use strict';
// src/server/worker.ts
// #!! Primary worker definition.
// #!! Consumed by the RpcWorkerPool class via path the to this file.

/**
 * @module WorkerThread
 * @description Primary worker thread implementation for RPC communication
 */

import { parentPort, threadId, workerData } from 'node:worker_threads';

import { getParams, methods } from '../commands';
import type { IdsObject, RpcRequest, RpcResponse } from '../types';
import { INTERNAL_ERROR, swapRpcId } from './API';
import { errorHandler } from './job/';

const VERBOSE = true;
const { workerAsset } = workerData;

VERBOSE &&
  console.log(
    `WORKER(${threadId - 1}):${
      1 === threadId - workerAsset ? '' : ` EmployeeID: '${workerAsset}'`
    } from ${__filename}`
  );
// const fn = async (
//   rpcRequest: RpcRequest<[IdsObject, ...string[]]>
// ): Promise<RpcResponse<unknown>> => {
//   try {
//     const { method } = rpcRequest;

//     // ++ Is awaited here to catch any errors.
//     return await methods[method](rpcRequest);
//   } catch (error) {
//     const errorRPC = INTERNAL_ERROR(rpcRequest.id, error);
//     console.error(errorRPC);
//     return errorRPC;
//   }
// };
/**
 * Main function that initializes the worker and sets up message handling.
 * This function is immediately invoked to start the worker.
 * @returns {number} Exit code (0 for success, 1 for error)
 * @throws {Error} If parentPort is missing or undefined
 */
void (function MAIN(): number {
  try {
    if (!parentPort) {
      throw new Error('parentPort is missing or is undefined');
    }
    parentPort.on(
      'message',
      async (rpcRequest: RpcRequest<[IdsObject, ...string[]]>) => {
        try {
          if (!parentPort) {
            throw new Error('parentPort is undefined');
          }
          const [{ external_message_identifier }] = getParams(rpcRequest);
          const currentId = swapRpcId(external_message_identifier, rpcRequest);
          const { method } = rpcRequest;
          try {
            const result: RpcResponse<unknown> =
              await methods[method](rpcRequest);
            swapRpcId(currentId, result);
            parentPort.postMessage(result);
          } catch (error) {
            const errorRPC = INTERNAL_ERROR(rpcRequest.id, error);
            console.error(errorRPC);
            parentPort.postMessage(errorRPC);
          }
        } catch (error) {
          errorHandler(
            'Worker failed to reply (postMessage) to parentPort:',
            error
          );
        }
      }
    );

    return 0;
  } catch (error) {
    errorHandler('Error communicating with parentPort:', error);
    return 1;
  }
})();

console.log('Initialized worker. Listening for messages...');

export function asyncOnMessageWrap() {
  const fn = async (
    rpcRequest: RpcRequest<[IdsObject, ...string[]]>
  ): Promise<RpcResponse<unknown>> => {
    try {
      const { method } = rpcRequest;

      // ++ Is awaited here to catch any errors.
      return await methods[method](rpcRequest);
    } catch (error) {
      const errorRPC = INTERNAL_ERROR(rpcRequest.id, error);
      console.error(errorRPC);
      return errorRPC;
    }
  };

  return async (msg: RpcRequest<[IdsObject, ...string[]]>) => {
    try {
      if (!parentPort) {
        throw new Error('parentPort is undefined');
      }
      const [{ external_message_identifier }] = getParams(msg);
      const currentId = swapRpcId(external_message_identifier, msg);
      const result: RpcResponse<unknown> = await fn(msg);
      swapRpcId(currentId, result);
      parentPort.postMessage(result);
    } catch (error) {
      errorHandler(
        'Worker failed to reply (postMessage) to parentPort:',
        error
      );
    }
  };
}

export type Fn = (
  msg: RpcRequest<[IdsObject, ...string[]]>
) => Promise<RpcResponse<unknown>>;

export async function messageWrap(
  fn: Fn,
  msg: RpcRequest<[IdsObject, ...string[]]>
) {
  try {
    if (!parentPort) {
      throw new Error('parentPort is undefined');
    }
    const [{ external_message_identifier }] = getParams(msg);
    const currentId = swapRpcId(external_message_identifier, msg);
    const result: RpcResponse<unknown> = await fn(msg);
    swapRpcId(currentId, result);
    parentPort.postMessage(result);
  } catch (error) {
    errorHandler('Worker failed to reply (postMessage) to parentPort:', error);
  }
}
