import { wget } from './wget';

import chalk from 'chalk';
import { Command } from '../types';
import { deserializeURI } from './codecs';
import { timeoutZalgo } from './timeout-zalgo';

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

export const commands: { [k: string]: any } = {
  ['hello-world'](job_id: any, ...args: any[]) {
    // console.log
    job_id++,
      chalk.ansi256(209)('Hello wold will echo back:'),
      chalk.ansi256(92)(deserializeURI(...(args as [any]))) + '\n\n';

    return {
      ['hello-world']: 'Hello wold just echo back!',
      args: deserializeURI(...(args as [any])),
    };
  },
  async delay(job_id: any, ...args: any[]) {
    const result = timeoutZalgo(args, Number(args[0]) || 2000);
    console.log('\ncomputing:', { job_id: job_id + 1, result });
    await result;
    console.log('done:', { job_id: job_id + 1, result }, '\n');
    return result;
  },
  async delay_loop(job_id: any, ...args: any[]) {
    let adder = 0;
    console.log('computing: loop', { job_id: job_id + 1 });
    do {
      adder += 100;
      adder += Math.round(performance.now() * 1000) % 2;
    } while (adder < 1000000000);
    console.log('done:', { job_id: job_id + 1, args }, '\n');
    return args;
    // console.log('\ncomputing: timeout 1', { job_id: job_id + 1 });
    // const result = timeoutZalgo(args, 5000);
    // await result;
    // return result;
  },
  async wget(job_id: any, ...args: any[]) {
    void job_id++;
    const source = deserializeURI(args[0]);
    const localDestination = deserializeURI(args[1]);
    return wget(source, localDestination);
  },
};

export const commands2 = {
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
