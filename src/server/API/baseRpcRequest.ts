/**
 * This module provides a base function for creating JSON-RPC 2.0 request objects.
 * It exports a `baseRpcRequest` function that takes a method name and returns a curried function.
 * The curried function takes parameters and an id and returns a JSON-RPC 2.0 request object.
 *
 * @packageDocumentation
 */
import { RpcRequest } from '../../types/specs';

/**
 * Returns a function that creates a JSON-RPC 2.0 request object with
 * a method and optional parameters.
 *
 * @remarks This function is a curried function that takes a method
 * name and returns a function that takes parameters and an id and
 * returns a JSON-RPC 2.0 request object.
 *
 * @param method - The method name of the RPC call
 * @returns A function that takes parameters and an id and returns a
 * JSON-RPC 2.0 request object
 * @typeParam P - The type of the parameters for the RPC call. This is
 * a generic type that can represent either a tupple with labels or an
 * object with string keys and any type values.
 */
export function rpcRequestMethodHandler<
  Q extends Array<any> | Record<string, any>,
>(method: string) {
  /**
   * Creates an RPC request accepting parameters.
   * @typeParam P - The type of the parameters for the RPC request. Can be an array or a record.
   * @param params - The parameters for the RPC request.
   * @returns A function that takes a request ID and returns an RPC request object.
   */
  return function rpcRequestParametersHandler<
    P extends Array<any> | Record<string, any> = Q,
  >(params: P) {
    /**
     * Creates an RPC request object setting it's ID.
     * @param requestId - The ID for the RPC request.
     * @returns An RPC request object.
     * @typeParam P - The type of the parameters for the RPC call. This is
     * a generic type that can represent either a tupple with labels or an
     * object with string keys and any type values.
     */
    return function rpcRequestIdHandler(
      requestId: number | string
    ): RpcRequest<P> {
      return {
        jsonrpc: '2.0' as const,
        method,
        params,
        id: requestId,
      };
    };
  };
}
