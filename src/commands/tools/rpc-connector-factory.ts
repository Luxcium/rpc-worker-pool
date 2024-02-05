import {
  baseRpcResponseLeft,
  baseRpcResponseRight,
  unwrapRpcRequest,
  unwrapRpcResponseLeft,
  unwrapRpcResponseRight,
} from '../../server/API/RPC-serialise';
import { rpcRequestMethodHandler } from 'src/server/API/baseRpcRequest';
import { RpcRequest, RpcResponse } from '../../types/specs';
export type WorkerNumber = `{ workerNumber: ${number} }`;

// will be considered later no op for the moment to keep the typescript code always valid
const generateRequestId = () => {
  return NaN;
};
// will be considered later no op for the moment to keep the typescript code always valid
const generateResponseId = generateRequestId;
export function createRpcConnector<P extends Array<any>, R>(method: string) {
  // Function 1: Create a request
  const createRequest = (params: P): RpcRequest<P> => {
    // TODO: Implement this function
    const requestId = generateRequestId();
    return rpcRequestMethodHandler<P>(method)(params)(requestId);
  };

  // Function 2: Validate a request
  const validateRequest = (request: RpcRequest<P>): boolean => {
    const [method, params, id, jsonrpc] = unwrapRpcRequest(request);
    void [method, params, id, jsonrpc]; // to avoid is declared but its value is never read.
    // TODO: Implement validation logic
    return true;
  };

  // Function 3: Create a response
  const createResponse = (result: R): RpcResponse<R> => {
    // TODO: Implement this function
    const responseId = generateResponseId();
    // TODO: Handle errors and create RpcLeft objects
    return baseRpcResponseRight<R>(result)(responseId);
  };

  // Function 4: Validate a response
  const validateResponse = (response: RpcResponse<R>): boolean => {
    /*
    make the pseudo code valid typescript please fix theses error messages :
    this is for the code below this comment:

Argument of type 'RpcResponse<R>' is not assignable to parameter of type 'RpcRight<R | null | undefined>'.
  Type 'RpcLeft<any>' is not assignable to type 'RpcRight<R | null | undefined>'.
    Types of property 'id' are incompatible.
      Type 'string | number | null' is not assignable to type 'string | number'.
        Type 'null' is not assignable to type 'string | number'.


        will put as any for now please fix later
     */
    const [result, id, jsonrpc] = unwrapRpcResponseRight(response as any);
    void [result, id, jsonrpc]; // to avoid is declared but its value is never read.
    // TODO: Implement validation logic
    return true;
  };

  return [
    createRequest,
    validateRequest,
    createResponse,
    validateResponse,
  ] as const;
}

void baseRpcResponseLeft; // to avoid is declared but its value is never read.
void unwrapRpcResponseLeft; // to avoid is declared but its value is never read.
