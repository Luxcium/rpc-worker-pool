'use strict';
// #!! Primary worker definition.
// #!! Consumed by the RpcWorkerPool class via path the to this file.

import { parentPort, threadId, workerData } from 'node:worker_threads';
import { INTERNAL_ERROR, swapRpcId } from './API';
import { methods } from '../commands';
import { getParams } from '../commands/tools/getParams';
import { IdsObject } from '../types';
import { RpcRequest, RpcResponse } from '../types/specs';

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
  `WORKER(${threadId - 1}):${
    threadId - workerAsset === 1 ? '' : ` EmployeeID: '${workerAsset}'`
  } from ${__filename}`
);

MAIN();
