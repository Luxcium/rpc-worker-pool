// Update to use local types instead of potentially conflicting imports
/**
 * Command definitions and utilities for RPC worker pool
 */
import type { RpcRequest, RpcResponse } from './types';

/**
 * Extracts parameters from an RPC request
 * @param request - The RPC request
 * @returns The parameters from the request
 */
export function getParams<T>(request: RpcRequest<T>): T {
  return request.params as T;
}

/**
 * Available RPC methods that can be executed by workers
 */
export const methods: Record<
  string,
  (request: RpcRequest<any>) => Promise<RpcResponse<any>>
> = {
  /**
   * Hello world example method
   * @param request - The RPC request
   * @returns A greeting response
   */
  helloWorld: async (
    request: RpcRequest<any[]>
  ): Promise<RpcResponse<string>> => {
    const params = getParams(request);
    // Ensure params is an array and join with spaces
    const greeting = Array.isArray(params)
      ? params.filter(p => p != null).join(' ')
      : 'World';

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: `Hello, ${greeting || 'World'}!`,
    };
  },

  /**
   * Echo method that returns the parameters it received
   * @param request - The RPC request
   * @returns The request parameters as the result
   */
  echo: async (request: RpcRequest<any[]>): Promise<RpcResponse<any[]>> => {
    const params = getParams(request);
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: params,
    };
  },

  /**
   * Status method that returns the server status
   * @param request - The RPC request
   * @returns A status response
   */
  status: async (
    request: RpcRequest<any>
  ): Promise<RpcResponse<{ status: string; uptime: number }>> => {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        status: 'operational',
        uptime: process.uptime(),
      },
    };
  },

  /**
   * Info method that returns information about the server
   * @param request - The RPC request
   * @returns Information about the server
   */
  info: async (
    request: RpcRequest<any>
  ): Promise<RpcResponse<{ version: string; environment: string }>> => {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
    };
  },
};
