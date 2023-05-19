import type { IdsObject, RpcRequest, RpcResponse } from '../../types';

// prettier-ignore

export type Methods<O> = { [k: string]: (rpcRequest: RpcRequest<[IdsObject, ...string[]]>) => Promise<RpcResponse<O>>; };
