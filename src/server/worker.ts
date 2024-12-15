'use strict';
// src/server/worker.ts
// #!! Primary worker definition.
// #!! Consumed by the RpcWorkerPool class via path the to this file.

import { parentPort, threadId, workerData } from 'node:worker_threads';

import { methods } from '../commands';
import type { IdsObject } from '../types';
import type { RpcRequest, RpcResponse } from '../types/specs';
import { INTERNAL_ERROR } from './API';
import { asyncOnMessageWrap, errorHandler } from './job/';

const VERBOSE = true;
const workerAsset = workerData.workerAsset;

VERBOSE && console.log(
  `WORKER(${threadId - 1}):${1 === threadId - workerAsset ? '' : ` EmployeeID: '${workerAsset}'`
  } from ${__filename}`
);

/**
 * Main function that initializes the worker and sets up message handling.
 * This function is immediately invoked to start the worker.
 * @returns {number} - Exit code (0 for success, 1 for error)
 */
void (function MAIN(): number {
  try {
    if (!parentPort) {
      throw new Error('parentPort is missing or is undefined');
    }
    parentPort.on(
      'message',

      asyncOnMessageWrap(
        /**
         * Handles incoming RPC requests and executes the corresponding method.
         * @param {RpcRequest<[IdsObject, ...string[]]>} rpcRequest - The RPC request containing method and parameters.
         * @returns {Promise<RpcResponse<unknown>>} - The RPC response with the result or error.
         */
        async (
          rpcRequest: RpcRequest<[IdsObject, ...string[]]>
        ): Promise<RpcResponse<unknown>> => {
          const { method } = rpcRequest;
          try {
            // ++ Is awaited here to catch any errors.
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

    return 0;
  } catch (error) {
    errorHandler('Error communicating with parentPort:', error);
    return 1;
  }
})();

console.log('Initialized worker. Listening for messages...');
