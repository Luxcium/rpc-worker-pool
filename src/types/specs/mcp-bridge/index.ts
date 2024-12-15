import { RpcRequest, RpcNotification } from '../json-rpc-2.0/request-object';
import { RpcResponse } from '../json-rpc-2.0/response-object';
import * as MCP from '../mcp/schema';

export type MCPRequest<P extends Record<string, unknown> | unknown[]> = RpcRequest<P> & {
  method: keyof typeof MCP.ClientRequest | keyof typeof MCP.ServerRequest;
};

export type MCPNotification = RpcNotification<any> & {
  method: keyof typeof MCP.ClientNotification | keyof typeof MCP.ServerNotification;
};

export type MCPResponse<R> = RpcResponse<R> & {
  result?: MCP.ClientResult | MCP.ServerResult;
};

// Type guard to check if a message is an MCP message
export const isMCPMessage = (message: any): message is MCP.JSONRPCMessage => {
  return (
    message.jsonrpc === '2.0' &&
    (isMCPRequest(message) || isMCPNotification(message) || isMCPResponse(message))
  );
};

// Type guards for specific message types
export const isMCPRequest = (message: any): message is MCPRequest<any> => {
  return (
    'method' in message &&
    'id' in message &&
    (Object.keys(MCP.ClientRequest).includes(message.method) ||
      Object.keys(MCP.ServerRequest).includes(message.method))
  );
};

export const isMCPNotification = (message: any): message is MCPNotification => {
  return (
    'method' in message &&
    !('id' in message) &&
    (Object.keys(MCP.ClientNotification).includes(message.method) ||
      Object.keys(MCP.ServerNotification).includes(message.method))
  );
};

export const isMCPResponse = (message: any): message is MCPResponse<any> => {
  return (
    ('result' in message || 'error' in message) &&
    'id' in message &&
    (!message.result ||
      Object.keys(MCP.ClientResult).includes(typeof message.result) ||
      Object.keys(MCP.ServerResult).includes(typeof message.result))
  );
};
