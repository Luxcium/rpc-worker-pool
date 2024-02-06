'use strict';
// #!! Primary worker definition.
// #!! Consumed by the RpcWorkerPool class via path the to this file.

import { parentPort, threadId, workerData } from 'node:worker_threads';
import { INTERNAL_ERROR } from './API';
import { methods } from '../commands';
import { IdsObject } from '../types';
import { RpcRequest, RpcResponse } from '../types/specs';
import { asyncOnMessageWrap } from './job/asyncOnMessageWrap';
import { errorHandler } from './job/errorHandler';

const workerAsset = workerData.workerAsset;

console.log(
  `WORKER(${threadId - 1}):${
    threadId - workerAsset === 1 ? '' : ` EmployeeID: '${workerAsset}'`
  } from ${__filename}`
);

(function MAIN(): number {
  try {
    if (!parentPort) throw new Error('parentPort is missing or is undefined');
    parentPort.on(
      'message',

      asyncOnMessageWrap(
        async (
          rpcRequest: RpcRequest<[IdsObject, ...string[]]>
        ): Promise<RpcResponse<unknown>> => {
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
    return 0;
  } catch (error) {
    errorHandler('Error communicating with parentPort:', error);
    return 1;
  }
})();
