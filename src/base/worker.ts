'use strict';
// src/base/worker.ts

import { parentPort } from 'node:worker_threads';
import { INTERNAL_ERROR, swapRpcId } from './API';
import { getParams, methods } from './commands';
import { IdsObject, RpcRequest, RpcResponse } from './types';

void (function MAIN(): void {
  try {
    if (!parentPort) {
      throw new Error('parentPort is missing or is undefined');
    }

    parentPort.on('message', createMessageHandler(parentPort));
  } catch (error) {
    console.error(`Worker error: ${error}`);
    process.exit(1);
  }
})();

function createMessageHandler(port: typeof parentPort) {
  return async function handleMessage(
    msg: RpcRequest<[IdsObject, ...string[]]>
  ) {
    try {
      const { method } = msg;
      const [{ external_message_identifier }] = getParams(msg) as [
        IdsObject,
        ...string[],
      ];

      const currentId = swapRpcId(external_message_identifier, msg);

      let result: RpcResponse<unknown>;
      try {
        result = await methods[method](msg);
      } catch (error) {
        result = INTERNAL_ERROR(msg.id, error);
      }

      swapRpcId(currentId, result);
      port?.postMessage(result);
    } catch (error) {
      console.error('Error processing message:', error);
      if (port) {
        port.postMessage(INTERNAL_ERROR(msg.id || 'unknown', error));
      }
    }
  };
}
