'use strict';
import { RpcRequest } from './specs';

/**
 * A function that takes a `MsgObjectToWrap` and returns a Promise of any type.
 */
export type WraperFunction = <P extends Array<string> = string[]>(
  rpcRequest: RpcRequest<P>
) => Promise<any>;
