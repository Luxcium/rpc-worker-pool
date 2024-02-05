/**
 * PARSE_ERROR: 	-32700 	message:'Invalid JSON was received by the
 * server. An error occurred on the server while parsing the JSON
 * text.'
 * @param id
 * @param data
 */

import { RpcRight } from '../../types';

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

/**
 * Returns a function that creates a JSON-RPC 2.0 response object with a result property
 * @param result - The result of the RPC call
 * @returns A function that takes an id and returns a JSON-RPC 2.0 response object
 */
export function baseRpcResponseRight<R>(result: R) {
  return (responseId: number | string): RpcRight<R> => ({
    jsonrpc: '2.0' as const,
    result,
    id: responseId,
  });
}

/**
 * Extracts the result, id, jsonrpc property, and the original RpcRight object from a JSON-RPC 2.0 response object with a result property
 * @param response - The JSON-RPC 2.0 response object with a result property
 * @returns A tuple containing the result, id, jsonrpc property, and the original RpcRight object
 */
export function unwrapRpcResponseRight<R = unknown>(
  response: RpcRight<R>
): [
  result: R,
  id: string | number | null,
  isJsonRpc: boolean,
  originalResponse: RpcRight<R>,
] {
  const { result, id, jsonrpc } = response;
  return [result, id, jsonrpc === '2.0', response];
}
