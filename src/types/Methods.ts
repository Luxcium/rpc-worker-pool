import type { IdsObject, RpcRequest, RpcResponse } from '.';

// prettier-ignore

export type Methods<O> = Record<string, (rpcRequest: RpcRequest<[IdsObject, ...string[]]>) => Promise<RpcResponse<O>>>;
