'use strict';
// src/server/worker.ts
// #!! Primary worker definition.
// #!! Consumed by the RpcWorkerPool class via path the to this file.

import { getParams, methods } from 'src/commands';
import { INTERNAL_ERROR, swapRpcId } from 'src/server/API';
import { Fn } from 'src/server/modular-pipeline-worker';
import { IdsObject, RpcRequest, RpcResponse } from 'src/types';
import { MessagePort, parentPort } from 'worker_threads';

// const methods: any = null; // placeholder for now

void (function MAIN(): void {
  try {
    if (!parentPort) {
      throw new Error('parentPort is missing or is undefined');
    }
    parentPort.on(
      'message',
      asyncOnMessageWrap(
        async (msg: RpcRequests): Promise<RpcResponse<unknown>> => {
          try {
            const { method } = msg;

            // ++ Is awaited here to catch any errors.
            return await methods[method](msg);
            //
          } catch (error) {
            const errorRPC = INTERNAL_ERROR(msg.id, error);
            // console.error(errorRPC);
            return errorRPC;
          }
        },
        parentPort
      )
    );
  } catch (_) {
    console.dir({ error: _ }, { colors: true, depth: 10, compact: true });
  }
})();

export function asyncOnMessageWrap(
  fn: Fn,
  parentPort: MessagePort
): (msg: RpcRequest<[IdsObject, ...string[]]>) => Promise<void> {
  return async function (msg: RpcRequest<[IdsObject, ...string[]]>) {
    const [{ external_message_identifier }] = getParams(msg);
    const currentId = swapRpcId(external_message_identifier, msg);
    const result: RpcResponse<unknown> = await fn(msg);
    swapRpcId(currentId, result);
    parentPort.postMessage(result);
  };
}

type RpcRequests = RpcRequest<[IdsObject, ...string[]]>;
