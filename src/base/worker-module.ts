/**
 * Worker module types and utilities
 */
import type { RpcRequest, RpcResponse } from './types';

/**
 * Type definition for an asynchronous function that processes RPC requests
 */
export type Fn = (msg: RpcRequest<any>) => Promise<RpcResponse<unknown>>;
