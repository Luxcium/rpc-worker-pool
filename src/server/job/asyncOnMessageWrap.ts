'use strict';
import { IdsObject } from '../../types';
import { RpcRequest } from '../../types/specs';
import { getParams } from '../../commands/tools/getParams';
import { RpcResponse } from '../../types/specs';
import { parentPort } from 'node:worker_threads';
import { swapRpcId } from '../API';
import { errorHandler } from './errorHandler';

export function asyncOnMessageWrap(fn: Fn) {
  return (msg: RpcRequest<[IdsObject, ...string[]]>) => messageWrap(fn, msg);
}
export type Fn = (
  msg: RpcRequest<[IdsObject, ...string[]]>
) => Promise<RpcResponse<unknown>>;

export async function messageWrap(
  fn: Fn,
  msg: RpcRequest<[IdsObject, ...string[]]>
) {
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
