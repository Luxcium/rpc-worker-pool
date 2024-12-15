import { MCPRequest, MCPResponse, MCPNotification } from './index';
import * as MCP from '../mcp/schema';

export const createMCPRequest = <P extends Record<string, unknown> | unknown[]>(
  method: keyof typeof MCP.ClientRequest | keyof typeof MCP.ServerRequest,
  params: P,
  id: number | string
): MCPRequest<P> => ({
  jsonrpc: '2.0',
  method,
  params,
  id,
});

export const createMCPNotification = <P extends Record<string, unknown> | unknown[]>(
  method: keyof typeof MCP.ClientNotification | keyof typeof MCP.ServerNotification,
  params?: P
): MCPNotification => ({
  jsonrpc: '2.0',
  method,
  params,
});

export const createMCPResponse = <R>(
  id: number | string,
  result: MCP.ClientResult | MCP.ServerResult
): MCPResponse<R> => ({
  jsonrpc: '2.0',
  id,
  result,
});

export const createMCPErrorResponse = <E>(
  id: number | string | null,
  code: number,
  message: string,
  data?: E
): MCPResponse<never> => ({
  jsonrpc: '2.0',
  id,
  error: {
    code,
    message,
    data,
  },
});
