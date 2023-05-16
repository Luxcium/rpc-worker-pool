import { RPC_ERRORS_FNS } from './RPC-errors';

export { swapRpcId } from './RPC-serialise';
export { RPC_ERRORS_FNS };
export const {
  PARSE_ERROR,
  INVALID_REQUEST,
  METHOD_NOT_FOUND,
  INVALID_PARAMS,
  INTERNAL_ERROR,
  SERVER_ERROR,
  APPLICATION_ERROR,
} = RPC_ERRORS_FNS;
