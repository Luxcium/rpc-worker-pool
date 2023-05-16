import type { IdsObject } from '../../types';
import { getIDsObject } from './getIDsObject';
import { getStrArgs } from './getStrArgs';

export function getParams(rpcRequest: any): [IdsObject, string[]] {
  return [getIDsObject(rpcRequest), [...getStrArgs(rpcRequest)]];
}
