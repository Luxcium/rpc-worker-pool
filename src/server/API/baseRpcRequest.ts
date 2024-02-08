/**
 * This module provides a base function for creating JSON-RPC 2.0 request objects.
 * It exports a `baseRpcRequest` function that takes a method name and returns a curried function.
 * The curried function takes parameters and an id and returns a JSON-RPC 2.0 request object.
 *
 * @packageDocumentation
 */
import type { RpcRequest } from '../../types/specs';

export type RpcArgs = Record<string, unknown> | [unknown, ...unknown[]];
/**
 * Returns a function that creates a JSON-RPC 2.0 request object with
 * a method and optional parameters.
 *
 * @remarks This function is a curried function that takes a method
 * name and returns a function that takes parameters and an id and
 * returns a JSON-RPC 2.0 request object.
 *
 * @param methodName - The method name of the RPC call
 * @returns A function that takes parameters and an id and returns a
 * JSON-RPC 2.0 request object
 * @typeParam P - The type of the parameters for the RPC call. This is
 * a generic type that can represent either a tupple with labels or an
 * object with string keys and any type values.
 */
export function rpcRequestMethodHandler<Q extends RpcArgs>(methodName: string) {
  /**
   * Creates an RPC request accepting parameters.
   * @typeParam P - The type of the parameters for the RPC request. Can be an array or a record.
   * @param args - The arguments array or record (an object) for the RPC request.
   * @returns A function that takes a request ID and returns an RPC request object.
   */
  return function rpcRequestParametersHandler<P extends RpcArgs = Q>(
    args: NoInfer<P>
  ) {
    /**
     * Creates an RPC request object setting it's ID.
     * @param requestId - The ID for the RPC request.
     * @returns An RPC request object.
     * @typeParam P - The type of the parameters for the RPC call. This is
     * a generic type that can represent either a tupple with labels or an
     * object with string keys and any type values.
     */
    return function rpcRequestIdHandler(
      requestId: number | `${number}`
    ): RpcRequest<P> {
      return {
        jsonrpc: '2.0' as const,
        method: methodName,
        params: args,
        id: `${requestId}`,
      };
    };
  };
}

export const createRpcRequest =
  <Q extends RpcArgs>(methodName: string) =>
  <P extends RpcArgs = Q>(args: P, Id: numberStr): RpcRequest<P> =>
    rpcRequestMethodHandler<Q>(methodName)<P>(args)(Id);

export type numberStr = number | `${number}`;
export type NoInfer<T> = [T][T extends unknown ? 0 : never];
