import type { RpcRequest } from '.';

export type Method = <O>(rpcRequest: RpcRequest<string[]>) => Promise<O>;
