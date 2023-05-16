import type { Command } from '../../types';

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
