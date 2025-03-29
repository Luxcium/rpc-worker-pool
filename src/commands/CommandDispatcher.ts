// src/command/CommandDispatcher.ts
//!! PEOBLEMTIC TRENSIENT atempt to save the code or delete the file
import { RpcRequest, RpcResponse } from 'src/types';

// The interface that all command handlers must implement
export interface CommandHandler<RequestType, ResponseType> {
  handle(request: RequestType): Promise<ResponseType>;
}

// CommandDispatcher: Dispatcher to manage command routing and execution
export class CommandDispatcher {
  private handlers: Map<string, CommandHandler<any, any>> = new Map();

  constructor() {
    // Register available command handlers
    this.registerHandler('heavyTask', new HeavyTaskHandler());
    this.registerHandler('helloWorld', new HelloWorldHandler());
  }

  // Register command handler for a specific command
  private registerHandler(command: string, handler: CommandHandler<any, any>) {
    this.handlers.set(command, handler);
  }

  // Dispatch a command to the appropriate handler
  public async dispatch<RequestType, ResponseType>(
    method: string,
    request: RequestType
  ): Promise<ResponseType> {
    const handler = this.handlers.get(method);

    if (!handler) {
      throw new Error(`Handler for method ${method} not found.`);
    }

    return await handler.handle(request);
  }
}

// Utility function that creates a typed request-response tuple
export function createCommandTuple<RequestType, ResponseType>(
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

  // Create the response part of the tuple (initially null)
  const response: RpcResponse<ResponseType> = {
    jsonrpc: '2.0',
    result: null,
    error: null,
    id: request.id,
  };

  return [request, response];
}

// // Example Command Handlers
// class HeavyTaskHandler implements CommandHandler<any, string> {
//   async handle(request: any): Promise<string> {
//     // Simulate a heavy task (e.g., computation or database call)
//     return new Promise(resolve => {
//       setTimeout(() => resolve('Heavy task completed successfully'), 2000);
//     });
//   }
// }

// class HelloWorldHandler implements CommandHandler<any, string> {
//   async handle(request: any): Promise<string> {
//     return 'Hello, world!';
//   }
// }
