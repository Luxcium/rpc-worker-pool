/**
 * Create JSON-RPC request object.
 *
 * @param method - The name of the method to be invoked.
 * @param params - The parameters of the method.
 * @returns The JSON-RPC request object as a string.
 */
export function createRPCRequest<T>(method: string, params: T): string {
  return JSON.stringify({
    jsonrpc: '2.0',
    method,
    params,
  });
}

/**
 * Create JSON-RPC response object.
 *
 * @param result - The result from the invoked method or an error.
 * @returns The JSON-RPC response object as a string.
 */
export function createRPCResponse<T>(result: T | Error): string {
  const rpcResponse =
    result instanceof Error
      ? { jsonrpc: '2.0', error: result.message }
      : { jsonrpc: '2.0', result };
  return JSON.stringify(rpcResponse);
}

/**
 * The Command type represents a command that can be run in the system.
 * Each command consists of:
 * - commandName: the name of the command.
 * - description: a description of what the command does.
 * - serializeAndSend: a function that takes a payload of type I, serializes it into a string in the JSON-RPC format, and returns a Promise that resolves to that string.
 * - workerFunctionWrapper: a function that takes a payload of type I, runs the command with that payload, and returns a Promise that resolves to a result of type O.
 * - deserializeAndHandleResponse: a function that takes a serialized response string, deserializes it into a result of type O or throws an error, and returns a Promise that resolves to that result or error.
 * - workerResponseWrapper: a function that takes a response of type O or an error, wraps it in the JSON-RPC format, and returns a Promise that resolves to a serialized response string.
 */
export type Command<I, O> = {
  commandName: string;
  description: string;
  serializeAndSend: (payload: I) => Promise<string>;
  workerFunctionWrapper: (payload: I) => Promise<O>;
  deserializeAndHandleResponse: (response: string) => Promise<O>;
  workerResponseWrapper: (response: O | Error) => Promise<string>;
};

/**
 * The createCommand function creates a new command.
 * @param commandName The name of the command.
 * @param description A description of what the command does.
 * @param heavyLiftingFn The function that performs the main logic of the command. It takes a payload of type I and returns a Promise that resolves to a result of type O.
 * @returns A Command object.
 */

export function createCommand<I, O>(
  commandName: string,
  description: string,
  heavyLiftingFn: (params: I) => Promise<O>
): Command<I, O> {
  return {
    commandName,
    description,
    // This function takes a payload, wraps it in a JSON-RPC request object, and serializes it to a string.
    serializeAndSend: async (payload: I) => {
      const rpcRequest = {
        jsonrpc: '2.0',
        method: commandName,
        params: payload,
      };
      return JSON.stringify(rpcRequest);
    },
    // This function wraps the main logic of the command. It takes a payload, runs the command with that payload, and returns the result. If the command throws an error, it wraps that error in a new Error object.
    workerFunctionWrapper: async (payload: I) => {
      try {
        const result = await heavyLiftingFn(payload);
        return result;
      } catch (error) {
        throw new Error(`Error in ${commandName}: ${error}`);
      }
    },
    // This function takes a serialized response, deserializes it to a JSON-RPC response object, checks for an error in the response, and returns the result or throws an error.
    deserializeAndHandleResponse: async (response: string) => {
      const rpcResponse = JSON.parse(response);
      if (rpcResponse.error) {
        throw new Error(`Error from ${commandName}: ${rpcResponse.error}`);
      }
      return rpcResponse.result as O;
    },
    // This function takes a response or an error, wraps it in a JSON-RPC response object, and serializes it to a string.
    workerResponseWrapper: async (response: O | Error) => {
      const rpcResponse =
        response instanceof Error
          ? { jsonrpc: '2.0', error: response.message }
          : { jsonrpc: '2.0', result: response };
      return JSON.stringify(rpcResponse);
    },
  };
}

export function createCommand_<I, O>(
  commandName: string,
  description: string,
  heavyLiftingFn: (params: I) => Promise<O>
): Command<I, O> {
  return {
    commandName,
    description,
    serializeAndSend: async (payload: I) => {
      const rpcRequest = {
        jsonrpc: '2.0',
        method: commandName,
        params: payload,
      };
      return JSON.stringify(rpcRequest);
    },
    workerFunctionWrapper: async (payload: I) => {
      try {
        const result = await heavyLiftingFn(payload);
        return result;
      } catch (error) {
        throw new Error(`Error in ${commandName}: ${error}`);
      }
    },
    deserializeAndHandleResponse: async (response: string) => {
      const rpcResponse = JSON.parse(response);
      if (rpcResponse.error) {
        throw new Error(`Error from ${commandName}: ${rpcResponse.error}`);
      }
      return rpcResponse.result as O;
    },
    workerResponseWrapper: async (response: O | Error) => {
      const rpcResponse =
        response instanceof Error
          ? { jsonrpc: '2.0', error: response.message }
          : { jsonrpc: '2.0', result: response };
      return JSON.stringify(rpcResponse);
    },
  };
}

// commandName
