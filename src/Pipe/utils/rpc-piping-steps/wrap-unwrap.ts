import {
  RPC_ERRORS_FNS,
  baseRpcNotification,
  baseRpcRequest,
  baseRpcResponseError,
  baseRpcResponseLeft,
  baseRpcResponseRight,
  rpcId,
  rpcMethod,
  rpcParams,
  swapRpcId,
  unwrapRpcError,
  unwrapRpcNotification,
  unwrapRpcRequest,
  unwrapRpcResponse,
  unwrapRpcResponseLeft,
  unwrapRpcResponseRight,
} from '../../../server/API';
import { ProcessStep } from '../../core/classes/ProcessStep';
import { ProcessWrap } from '../../core/classes/bases/ProcessableWrapedStep';

baseRpcNotification;
baseRpcRequest;
baseRpcResponseError;
baseRpcResponseLeft;
baseRpcResponseRight;
rpcId;
rpcMethod;
rpcParams;
swapRpcId;
unwrapRpcError;
unwrapRpcNotification;
unwrapRpcRequest;
unwrapRpcResponse;
unwrapRpcResponseLeft;
unwrapRpcResponseRight;
// export const identityWrap = ProcessWrap.of(
//   <R>([result, id, jsonrpc, rpcResponseRight]: [
//     result: R,
//     id: string | number | null,
//     jsonrpc: boolean,
//     rpcResponseRight: RpcRight<R>
//   ]) => [result, id, jsonrpc, rpcResponseRight]
// );
// identityWrap.unWrap(preComposeWith);
// identityWrap.unWrap(preComposeWith);

// export const rpcErrorUnwrap = identityWrap.unWrap(unwrapRpcError);
// export const rpcNotificationUnwrap = identityWrap.unWrap(unwrapRpcNotification);
// export const rpcRequestUnwrap = identityWrap.unWrap(unwrapRpcRequest);
// export const rpcResponseUnwrap = identityWrap.unWrap(unwrapRpcResponse);
// export const rpcResponseLeftUnwrap = identityWrap.unWrap(unwrapRpcResponseLeft);
// export const rpcResponseRightUnwrap = identityWrap.unWrap(
//   unwrapRpcResponseRight
// );

// baseRpcResponseRight;
// unwrapRpcResponseRight;

const {
  PARSE_ERROR,
  INVALID_REQUEST,
  METHOD_NOT_FOUND,
  INVALID_PARAMS,
  INTERNAL_ERROR,
  SERVER_ERROR,
  APPLICATION_ERROR,
} = RPC_ERRORS_FNS;

PARSE_ERROR;
INVALID_REQUEST;
METHOD_NOT_FOUND;
INVALID_PARAMS;
INTERNAL_ERROR;
SERVER_ERROR;
APPLICATION_ERROR;

ProcessStep;
ProcessWrap;
