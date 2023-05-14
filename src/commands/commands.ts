import { wget } from './wget';

import chalk from 'chalk';
import { APPLICATION_ERROR } from '../API';
import { Command } from '../types';
import { IdsObject } from '../types/IdsObject';
import { RpcLeft, RpcRequest, RpcResponse, RpcRight } from '../types/specs';
import { deserializeURI } from './codecs';
import { timeoutZalgo } from './timeout-zalgo';

export const methods: Methods<unknown> = {
  async ['hello-world'](rpcRequest: RpcRequest<[IdsObject, ...string[]]>) {
    try {
      const [idsObject, args] = getParams(rpcRequest);

      console.log(
        chalk.redBright('Hello world will echo back request as recieved:')
      );
      console.dir(rpcRequest, { colors: true });
      const result = {
        ['hello-world']: 'Hello wold just echo back!',
        args,
      };
      const rpcResponse: RpcRight<typeof result> = {
        jsonrpc: '2.0',
        id: Number(rpcRequest.id),
        result,
      };
      console.log(
        chalk.greenBright('Hello world did echo back request as pre processed:')
      );

      const { external_message_identifier: id } = idsObject;

      console.dir({ ...rpcResponse, id }, { colors: true });
      return rpcResponse;
    } catch (error) {
      const rpcError: RpcLeft<typeof error> = APPLICATION_ERROR(
        rpcRequest.id,
        error
      );
      console.error(rpcError);
      return rpcError;
    }
  },
};

export type Method = <O>(rpcRequest: RpcRequest<string[]>) => Promise<O>;
// prettier-ignore
export type Methods<O> ={[k: string]:(rpcRequest: RpcRequest<[IdsObject,...string[]]>) => Promise<RpcResponse<O>>};

export function createCommand<P extends any[], R>(
  description: string,
  callerSideFn: (...params: P) => Promise<R>,
  receiverSideFn: (...params: P) => Promise<R>,
  encodeFn: (result: R | Error) => string,
  decodeFn: (result: string) => R | Error
): Command<P, R> {
  return {
    description,
    callerSideFn,
    receiverSideFn,
    encodeFn,
    decodeFn,
  };
}

function isString(value: string | IdsObject): value is string {
  return typeof value === 'string';
}

function getStrArgs(rpcRequest: any) {
  const list: string[] = Array.isArray(rpcRequest.params)
    ? rpcRequest.params
    : [];
  const args = list.filter(isString).map(deserializeURI);
  return [...args];
}

function getIDsObject(rpcRequest: any) {
  let idsObject: IdsObject;

  const firstElement = rpcRequest?.params ? rpcRequest.params[0] : undefined;

  if (
    firstElement &&
    typeof firstElement === 'object' &&
    firstElement !== null
  ) {
    idsObject = {
      external_message_identifier:
        Number(firstElement.external_message_identifier) ?? NaN,
      employee_number: Number(firstElement.employee_number) ?? NaN,
      internal_job_ref: Number(firstElement.internal_job_ref) ?? NaN,
    };
  } else {
    idsObject = {
      external_message_identifier: NaN,
      employee_number: NaN,
      internal_job_ref: NaN,
    };
  }

  return idsObject;
}

function getParams(rpcRequest: any): [IdsObject, string[]] {
  return [getIDsObject(rpcRequest), [...getStrArgs(rpcRequest)]];
}

/** @deprecated */
export const old_commands = {
  async delay(job_ref: any, ...args: any[]) {
    const result = timeoutZalgo(args, Number(args[0]) || 2000);
    console.log('\ncomputing:', { job_ref: job_ref + 1, result });
    await result;
    console.log('done:', { job_ref: job_ref + 1, result }, '\n');
    return result;
  },
  async delay_loop(job_ref: any, ...args: any[]) {
    let adder = 0;
    console.log('computing: loop', { job_ref: job_ref + 1 });
    do {
      adder += 100;
      adder += Math.round(performance.now() * 1000) % 2;
    } while (adder < 1000000000);
    console.log('done:', { job_ref: job_ref + 1, args }, '\n');
    return args;
    // console.log('\ncomputing: timeout 1', { job_ref: job_ref + 1 });
    // const result = timeoutZalgo(args, 5000);
    // await result;
    // return result;
  },
  async wget(job_ref: any, ...args: any[]) {
    void job_ref++;
    const source = deserializeURI(args[0]);
    const localDestination = deserializeURI(args[1]);
    return wget(source, localDestination);
  },
  greet: createCommand(
    'Greet a person',
    async (name: string) => {
      // Caller side function for greet.
      return `Hello, ${name}!`;
    },
    async (name: string) => {
      // Receiver side function for greet.
      return `Hello, ${name}! From the other side.`;
    },
    (result: string | Error) => {
      // If the result is an error, we'll stringify the error message.
      if (result instanceof Error) {
        return JSON.stringify({ error: result.message });
      }
      // Otherwise, we'll stringify the result as it is.
      return JSON.stringify(result);
    },
    (result: string) => {
      // We'll parse the JSON string.
      const parsedResult = JSON.parse(result);
      // If it's an error, we'll return a new Error object with the error message.
      if (
        typeof parsedResult === 'object' &&
        parsedResult !== null &&
        'error' in parsedResult
      ) {
        return new Error(parsedResult.error);
      }
      // Otherwise, we'll return the result as it is.
      return parsedResult;
    }
  ),
  // Add more commands here...
};
