'use strict';
// src/server/job/asyncOnMessageWrap.ts

/**
 * @module MessageWrapping
 * @description Provides message wrapping functionality for RPC worker communication
 */
import { parentPort } from 'node:worker_threads';

import { getParams } from '../../commands/tools';
import type { IdsObject, RpcRequest, RpcResponse } from '../../types';
import { swapRpcId } from '../API';
import { errorHandler } from './errorHandler';

/**
 * Wraps an asynchronous function to handle messages from the parent port.
 * @param {Fn} fn - The function to wrap.
 * @returns {(msg: RpcRequest<[IdsObject, ...string[]]>) => Promise<void>} The wrapped function.
 */
export function asyncOnMessageWrap(fn: Fn) {
  return async (msg: RpcRequest<[IdsObject, ...string[]]>) =>
    messageWrap(fn, msg);
}

/**
 * Type definition for the function to be wrapped.
 */
export type Fn = (
  msg: RpcRequest<[IdsObject, ...string[]]>
) => Promise<RpcResponse<unknown>>;

/**
 * Handles the message wrapping logic, including error handling and ID swapping.
 * @param {Fn} fn - The function to wrap.
 * @param {RpcRequest<[IdsObject, ...string[]]>} msg - The RPC request message.
 * @returns {Promise<void>} A promise that resolves when the message is handled.
 * @throws {Error} If parentPort is undefined
 */
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
