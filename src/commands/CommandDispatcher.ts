// src/command/CommandDispatcher.ts
import { RpcRequest, RpcResponse } from 'src/types';
import type { RpcRight } from 'src/types/specs/json-rpc-2.0/response-object';

/**
 * Interface that all command handlers must implement.
 * @param RequestType - The type of request this handler accepts, must be an object or array
 * @param ResponseType - The type of response this handler returns
 */
export interface CommandHandler<
  RequestType extends Record<string, unknown> | unknown[],
  ResponseType,
> {
  handle(request: RequestType): Promise<ResponseType>;
}

/**
 * Dispatcher to manage command routing and execution
 */
export class CommandDispatcher {
  private handlers: Map<string, CommandHandler<any, any>> = new Map();

  constructor() {
    // Register available command handlers
    this.registerHandler('heavyTask', new HeavyTaskHandler());
    this.registerHandler('helloWorld', new HelloWorldHandler());
  }

  /**
   * Register command handler for a specific command
   */
  private registerHandler<
    RequestType extends Record<string, unknown> | unknown[],
    ResponseType,
  >(command: string, handler: CommandHandler<RequestType, ResponseType>) {
    this.handlers.set(command, handler);
  }

  /**
   * Dispatch a command to the appropriate handler
   */
  public async dispatch<
    RequestType extends Record<string, unknown> | unknown[],
    ResponseType,
  >(method: string, request: RequestType): Promise<ResponseType> {
    const handler = this.handlers.get(method);

    if (!handler) {
      throw new Error(`Handler for method ${method} not found.`);
    }

    return await handler.handle(request);
  }
}

/**
 * Creates a typed request-response tuple for RPC communication
 */
export function createCommandTuple<
  RequestType extends Record<string, unknown> | unknown[],
  ResponseType,
>(
  method: string,
  params: RequestType
): [RpcRequest<RequestType>, RpcResponse<ResponseType>] {
  // Create the request part of the tuple
  const request: RpcRequest<RequestType> = {
    jsonrpc: '2.0',
    id: Math.floor(Math.random() * 1000), // Unique ID for the request
    method,
    params,
  };

  // Create a successful RPC response
  const response: RpcResponse<ResponseType> = {
    jsonrpc: '2.0',
    result: {} as ResponseType,
    id: request.id,
  } satisfies RpcRight<ResponseType>;

  return [request, response];
}

/**
 * Example Command Handler that simulates a heavy task
 */
class HeavyTaskHandler
  implements CommandHandler<Record<string, unknown>, string>
{
  async handle(_request: Record<string, unknown>): Promise<string> {
    // Simulate a heavy task (e.g., computation or database call)
    return new Promise(resolve => {
      setTimeout(() => resolve('Heavy task completed successfully'), 2000);
    });
  }
}

/**
 * Example Command Handler that returns a simple greeting
 */
class HelloWorldHandler
  implements CommandHandler<Record<string, unknown>, string>
{
  async handle(_request: Record<string, unknown>): Promise<string> {
    return 'Hello, world!';
  }
}
