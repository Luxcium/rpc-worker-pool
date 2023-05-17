import { InspectOptions } from 'util';
import {
  RpcLeft,
  RpcNotification,
  RpcRequest,
  RpcResponse,
  RpcResponseError,
  RpcRight,
} from '../types/specs';

export function baseRpcResponseRight<R>(result: R) {
  return (responseId: number | string): RpcRight<R> => ({
    jsonrpc: '2.0' as const,
    id: responseId,
    result,
  });
}

export function unwrapRpcResponseRight<R = unknown>(
  response: RpcRight<R>
): [
  result: R,
  id: string | number | null,
  jsonrpc: boolean,
  rpcResponseRight: RpcRight<R>
] {
  const { result, id, jsonrpc } = response;
  return [result, id, jsonrpc === '2.0', response];
}
// type UnwrapedRpcRight<R> = [
//   result: R,
//   id: string | number | null,
//   jsonrpc: boolean,
//   rpcResponseRight: RpcRight<R>
// ];
export function baseRpcResponseLeft(error: RpcResponseError) {
  return (id: number | null): RpcLeft => ({
    jsonrpc: '2.0' as const,
    error,
    id,
  });
}

export function unwrapRpcResponseLeft<E = unknown>(
  response: RpcLeft<E>
): [
  error: RpcResponseError<E>,
  unwrapedRpcError: UnwrapedRpcError<E>,
  id: string | number | null,
  jsonrpc: boolean,
  rpcResponseLeft: RpcLeft<E>
] {
  const { error, id, jsonrpc } = response;
  return [error, unwrapRpcError(error), id, jsonrpc === '2.0', response];
}
//   type UnwrapedRpcLeft<E> = [
//   error: RpcResponseError<E>,
//   unwrapedRpcError: UnwrapedRpcError<E>,
//   id: string | number | null,
//   jsonrpc: boolean,
//   rpcResponseLeft: RpcLeft<E>
// ];
export function baseRpcResponseError(code: number, message: string) {
  return (data?: any): ((id: number | null) => RpcLeft) => {
    const responseError: RpcResponseError = {
      code,
      message,
      data,
    };
    return baseRpcResponseLeft(responseError);
  };
}

export function unwrapRpcError<E = unknown>(
  rpcResponseError: RpcResponseError<E>
): UnwrapedRpcError<E> {
  const { code, message, data } = rpcResponseError;
  return [data, code, message, rpcResponseError];
}
type UnwrapedRpcError<E> = [
  data: E | undefined,
  code: number,
  message: string,
  rpcResponseError: RpcResponseError<E>
];

export function unwrapRpcResponse<R = unknown>(rpcResponse: RpcResponse<R>) {
  const { result, error, id, jsonrpc } = rpcResponse;

  return [
    result,
    error,
    error ? unwrapRpcError(error) : null,
    id,
    jsonrpc === '2.0',
    rpcResponse,
  ] as UnwrapedRpcResponse<R>;
}
type UnwrapedRpcResponse<R, E = any> = [
  result: R,
  error: RpcResponseError<E> | null | undefined,
  unwrapedRpcError: UnwrapedRpcError<E>,
  id: string | number | null,
  jsonrpc: boolean,
  rpcResponseRight: RpcRight<R>
];
export function baseRpcNotification<N extends Array<any> | Record<string, any>>(
  method: string
): (params: N) => (_id: null) => RpcNotification<N>;
export function baseRpcNotification<N extends Array<any> | Record<string, any>>(
  method: string,
  verbose: boolean
): (params: N) => (_id: null) => RpcNotification<N>;
export function baseRpcNotification<N extends Array<any> | Record<string, any>>(
  method: string,
  verbose: true,
  options: InspectOptions
): (params: N) => (_id: null) => RpcNotification<N>;
export function baseRpcNotification<N extends Array<any> | Record<string, any>>(
  method: string,
  verbose = true,
  options?: InspectOptions
): (params: N) => (_id: null) => RpcNotification<N> {
  return (params: N) =>
    (_id: null): RpcNotification<N> => {
      const notification = {
        jsonrpc: '2.0' as const,
        method,
        params,
      };
      verbose && console.dir(notification, options);
      return notification;
    };
}

export function unwrapRpcNotification<
  N extends any[] | Record<string, any> = any
>(
  rpcNotification: RpcNotification<N>
): [
  method: string,
  params: any,
  id: null,
  jsonrpc: boolean,
  rpcNotification: RpcNotification<N>
] {
  const { method, params, jsonrpc } = rpcNotification;
  return [method, params, null, jsonrpc === '2.0', rpcNotification];
}
type UnwrapedRpcNotification<N extends any[] | Record<string, any> = any> = [
  params: any,
  method: string,
  id: null,
  jsonrpc: boolean,
  rpcNotification: RpcNotification<N>
];
export type { UnwrapedRpcNotification };
/**
 * Returns a function that creates a JSON-RPC 2.0 request object with
 * a method and optional parameters
 * @param method - The method name of the RPC call
 * @returns A function that takes parameters and an id and returns a
 * JSON-RPC 2.0 request object
 * @template Q - The type of the parameters for the RPC call, which
 * can be an array or an object
 */
export function baseRpcRequest<Q extends Array<any> | Record<string, any>>(
  method: string
) {
  return (params: Q) =>
    (requestId: number | string): RpcRequest<Q> => ({
      jsonrpc: '2.0' as const,
      method,
      params,
      id: requestId,
    });
}

/**
 * Extracts the parameters, method name, id, jsonrpc property, and
 * the original RpcRequest object from a JSON-RPC 2.0 request
 * object
 * @param request - The JSON-RPC 2.0 request object
 * @returns A tuple containing the parameters, method name, id,
 * jsonrpc property, and the original RpcRequest object
 * @template Q - The type of the parameters for the RPC call, which
 * can be an array or an object
 */
export function unwrapRpcRequest<Q extends any[] | Record<string, any> = any>(
  request: RpcRequest<Q>
): [
  method: string,
  params: Q | undefined,
  id: string | number | null,
  jsonrpc: boolean,
  rpcRequest: RpcRequest<Q>
] {
  const { method, params, id, jsonrpc } = request;
  return [method, params, id, jsonrpc === '2.0', request];
}

export const rpcParams = <Q extends any[] | Record<string, any> = any>(
  request: RpcRequest<Q>
) => unwrapRpcRequest(request)[1];
export const rpcMethod = (request: RpcRequest<{}>) => request.method;
export const rpcId = (request: RpcMessage) => request.id;

type RpcMessage = RpcRequest<{}> | RpcResponse<unknown>;

export const swapRpcId = (newId: number | string, request: RpcMessage) => {
  const currentId = request.id;
  request.id = newId;
  return currentId ?? '';
};
