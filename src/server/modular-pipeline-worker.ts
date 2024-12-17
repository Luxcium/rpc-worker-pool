'use strict';
// src/server/worker.ts
// #!! Primary worker definition.
// #!! Consumed by the RpcWorkerPool class via path the to this file.

/**
 * @module WorkerThread
 * @description Primary worker thread implementation for RPC communication
 */

import { parentPort } from 'node:worker_threads';

import { getParams, methods } from '../commands';
import type { IdsObject, RpcRequest, RpcResponse } from '../types';
import { INTERNAL_ERROR, swapRpcId } from './API';
import { errorHandler } from './job/';

void (function MAIN() {
  if (!parentPort) {
    throw new Error('parentPort is missing or is undefined');
  }
  parentPort.on('message', async (rpcRequest: any) => {
    if (!parentPort) {
      throw new Error('parentPort is undefined');
    }
    const [{ external_message_identifier }] = getParams(rpcRequest);
    const currentId = swapRpcId(external_message_identifier, rpcRequest);
    const { method } = rpcRequest;
    const result: RpcResponse<unknown> = await methods[method](rpcRequest);
    swapRpcId(currentId, result);
    parentPort.postMessage(result);
  });
  return void 0;
})();

export function asyncOnMessageWrap() {
  const fn = async (rpcRequest: RpcRequest<[IdsObject, ...string[]]>) => {
    try {
      const { method } = rpcRequest;
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
