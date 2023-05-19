import type { RpcRequest } from '../../types';

export type Method = <O>(rpcRequest: RpcRequest<string[]>) => Promise<O>;
