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
} from '../../../API';
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
