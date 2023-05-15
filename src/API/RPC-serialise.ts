/**
 * PARSE_ERROR: 	-32700 	message:'Invalid JSON was received by the
 * server. An error occurred on the server while parsing the JSON
 * text.'
 * @param id
 * @param data
 */

import { InspectOptions } from 'util';
import {
  RpcLeft,
  RpcNotification,
  RpcRequest,
  RpcResponse,
  RpcResponseError,
  RpcRight,
} from '../types/specs';

const PARSE_ERROR = (id: string | number | null, data: any) => ({
  jsonrpc: '2.0' as const,
  error: {
    code: -32700 as const,
    message:
      'PARSE_ERROR: Invalid JSON was received by the server. An error occurred on the server while parsing the JSON text.' as const,
    data,
  },
  id,
});

/**
 * INVALID_REQUEST: 	-32600 	message:'The JSON sent is not a valid Request
 * object.'
 * @param id
 * @param data
 */
const INVALID_REQUEST = (id: string | number | null, data: any) => ({
  jsonrpc: '2.0' as const,
  error: {
    code: -32600 as const,
    message:
      'INVALID_REQUEST: The JSON sent is not a valid Request object.' as const,
    data,
  },
  id,
});

/**
 * METHOD_NOT_FOUND: 	-32601 	The method does not exist / is not
 * available.
 * @param id
 * @param data
 */
const METHOD_NOT_FOUND = (id: string | number | null, data: any) => ({
  jsonrpc: '2.0' as const,
  error: {
    code: -32601 as const,
    message:
      'METHOD_NOT_FOUND: The method does not exist / is not available.' as const,
    data,
  },
  id,
});
/**
 * INVALID_PARAMS: 	-32602 	Invalid method parameter(s).
 * available.
 * @param id
 * @param data
 */
const INVALID_PARAMS = (id: string | number | null, data: any) => ({
  jsonrpc: '2.0' as const,
  error: {
    code: -32602 as const,
    message: 'INVALID_PARAMS: Invalid method parameter(s).' as const,
    data,
  },
  id,
});

/*
          } catch (error: any) {
            const errorRPC = {
              code: -32_603,
              message:
                'Internal error!!! (Internal JSON-RPC error). ' +
                (error.message || ''),
              error,
            };
            console.error(String({ ...messageRPC, error: errorRPC }));
            return { ...messageRPC, error: errorRPC };
          }
 */

/**
 * INTERNAL_ERROR: 	-32603 	Internal JSON-RPC error.
 * @param id
 * @param data
 */
const INTERNAL_ERROR = <E>(id: string | number | null, data: E) => ({
  jsonrpc: '2.0' as const,
  error: {
    code: -32603 as const,
    message: 'INTERNAL_ERROR: Internal JSON-RPC error.' as const,
    data,
  },
  id,
});
/**
 * SERVER_ERROR: 	-32000 to -32099 	Reserved for implementation-defined
 * server-errors.
 * @param id
 * @param data
 * @param message
 */
const SERVER_ERROR = (
  id: string | number | null,
  data: any,
  code: number = 0,
  message: string = ''
) => ({
  jsonrpc: '2.0' as const,
  error: {
    code: -32000 - Math.abs(code % 100),
    message: `SERVER_ERROR: ${message} (server-error).` as const,
    data,
  },
  id,
});
// -32768 to -32000
/**
 * APPLICATION_ERROR: 	-32000 to -32099 	Reserved for implementation-defined
 * server-errors.
 * @param id
 * @param data
 * @param message
 */
const APPLICATION_ERROR = (
  id: string | number | null,
  data: any,
  code: number = 0,
  message: string = ''
) => ({
  jsonrpc: '2.0' as const,
  error: {
    code: -31999 + Math.abs(code % 31999),
    message: `APPLICATION_ERROR:  ${message} (application error)` as const,
    data,
  },
  id,
});
export const RPC_ERRORS_FNS = {
  PARSE_ERROR,
  INVALID_REQUEST,
  METHOD_NOT_FOUND,
  INVALID_PARAMS,
  INTERNAL_ERROR,
  SERVER_ERROR,
  APPLICATION_ERROR,
};

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
export function baseRpcNotification<N extends Array<any> | Record<string, any>>(
  method: string
): (params: N) => (_id: null) => RpcNotification<N>;
export function baseRpcNotification<N extends Array<any> | Record<string, any>>(
  method: string,
  verbose: false
): (params: N) => (_id: null) => RpcNotification<N>;
export function baseRpcNotification<N extends Array<any> | Record<string, any>>(
  method: string,
  verbose: true
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

export function baseRpcResponseRight<R>(result: R) {
  return (id: number | string): RpcRight<R> => ({
    jsonrpc: '2.0' as const,
    result,
    id,
  });
}
export function baseRpcResponseLeft(error: RpcResponseError) {
  return (id: number | null): RpcLeft => ({
    jsonrpc: '2.0' as const,
    error,
    id,
  });
}
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

type UnwrapedRpcError<E> = [
  data: E | undefined,
  code: number,
  message: string,
  rpcResponseError: RpcResponseError<E>
];

export function unwrapRpcError<E = unknown>(
  rpcResponseError: RpcResponseError<E>
) {
  const { code, message, data } = rpcResponseError;
  return [data, code, message, rpcResponseError] as UnwrapedRpcError<E>;
}
type UnwrapedRpcLeft<E> = [
  error: RpcResponseError<E>,
  unwrapedRpcError: UnwrapedRpcError<E>,
  id: string | number | null,
  jsonrpc: boolean,
  rpcResponseLeft: RpcLeft<E>
];
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

type UnwrapedRpcRight<R> = [
  result: R,
  id: string | number | null,
  jsonrpc: boolean,
  rpcResponseRight: RpcRight<R>
];

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

type UnwrapedRpcRequest<Q extends any[] | Record<string, any> = any> = [
  params: any,
  method: string,
  id: string | number | null,
  jsonrpc: boolean,
  rpcRequest: RpcRequest<Q>
];

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

type UnwrapedRpcNotification<N extends any[] | Record<string, any> = any> = [
  params: any,
  method: string,
  id: null,
  jsonrpc: boolean,
  rpcNotification: RpcNotification<N>
];

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

type UnwrapedRpcResponse<R, E = any> = [
  result: R,
  error: RpcResponseError<E> | null | undefined,
  unwrapedRpcError: UnwrapedRpcError<E>,
  id: string | number | null,
  jsonrpc: boolean,
  rpcResponseRight: RpcRight<R>
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
/*
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
 */
