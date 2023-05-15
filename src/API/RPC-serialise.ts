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
  return (id: number | string): RpcRight<R> => ({
    jsonrpc: '2.0' as const,
    result,
    id,
  });
}

export function unwrapRpcResponseRight<R = unknown>(
  rpcResponseRight: RpcRight<R>
) {
  const { result, id, jsonrpc } = rpcResponseRight;
  return [
    result,
    id,
    jsonrpc === '2.0',
    rpcResponseRight,
  ] as UnwrapedRpcRight<R>;
}
type UnwrapedRpcRight<R> = [
  result: R,
  id: string | number | null,
  jsonrpc: boolean,
  rpcResponseRight: RpcRight<R>
];
export function baseRpcResponseLeft(error: RpcResponseError) {
  return (id: number | null): RpcLeft => ({
    jsonrpc: '2.0' as const,
    error,
    id,
  });
}

export function unwrapRpcResponseLeft<E = unknown>(
  rpcResponseLeft: RpcLeft<E>
) {
  const { error, id, jsonrpc } = rpcResponseLeft;
  return [
    error,
    unwrapRpcError(error),
    id,
    jsonrpc === '2.0',
    rpcResponseLeft,
  ] as UnwrapedRpcLeft<E>;
}
type UnwrapedRpcLeft<E> = [
  error: RpcResponseError<E>,
  unwrapedRpcError: UnwrapedRpcError<E>,
  id: string | number | null,
  jsonrpc: boolean,
  rpcResponseLeft: RpcLeft<E>
];
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
) {
  const { code, message, data } = rpcResponseError;
  return [data, code, message, rpcResponseError] as UnwrapedRpcError<E>;
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
>(rpcNotification: RpcNotification<N>) {
  const { params, method, jsonrpc } = rpcNotification;
  return [
    params,
    method,
    null,
    jsonrpc === '2.0',
    rpcNotification,
  ] as UnwrapedRpcNotification<N>;
}
type UnwrapedRpcNotification<N extends any[] | Record<string, any> = any> = [
  params: any,
  method: string,
  id: null,
  jsonrpc: boolean,
  rpcNotification: RpcNotification<N>
];
export function baseRpcRequest<Q extends Array<any> | Record<string, any>>(
  method: string
) {
  return (params: Q) =>
    (id: number): RpcRequest<Q> => ({
      jsonrpc: '2.0' as const,
      method,
      params,
      id,
    });
}

export function unwrapRpcRequest<Q extends any[] | Record<string, any> = any>(
  rpcRequest: RpcRequest<Q>
) {
  const { params, method, id, jsonrpc } = rpcRequest;
  return [
    params,
    method,
    id,
    jsonrpc === '2.0',
    rpcRequest,
  ] as UnwrapedRpcRequest<Q>;
}
type UnwrapedRpcRequest<Q extends any[] | Record<string, any> = any> = [
  params: any,
  method: string,
  id: string | number | null,
  jsonrpc: boolean,
  rpcRequest: RpcRequest<Q>
];
