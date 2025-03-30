/**
 * API utilities for RPC worker pool
 */
import type { RpcRequest, RpcResponse } from './types';

/**
 * Creates a right-biased RPC response
 * @param result - The result to include in the response
 * @returns A function that takes an ID and returns an RPC response
 */
export const baseRpcResponseRight =
  (result: unknown) =>
  (id: number | string): unknown => ({
    jsonrpc: '2.0',
    id,
    result,
  });

/**
 * Creates an internal error RPC response
 * @param id - The ID of the request that caused the error
 * @param error - The error that occurred
 * @returns An RPC response with an error
 */
export function INTERNAL_ERROR(
  id: number | string,
  error: unknown
): RpcResponse<null, unknown> {
  const errorMessage = error instanceof Error ? error.message : String(error);

  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32603,
      message: 'Internal error',
      data: errorMessage,
    },
  };
}

/**
 * Swaps the ID in an RPC request or response
 * @param newId - The new ID to set
 * @param obj - The RPC request or response object
 * @returns The original ID that was replaced
 */
export function swapRpcId(
  newId: number | string,
  obj: RpcRequest | RpcResponse
): number | string {
  const originalId = obj.id;
  obj.id = newId;
  return originalId;
}
