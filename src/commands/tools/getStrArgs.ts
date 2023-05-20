import { deserializeURI } from './codecs';
import { isString } from './isString';

export function getStrArgs(rpcRequest: any) {
  const list: string[] = Array.isArray(rpcRequest.params)
    ? rpcRequest.params
    : [];
  const args = list.filter(isString).map(deserializeURI);
  return [...args];
}
