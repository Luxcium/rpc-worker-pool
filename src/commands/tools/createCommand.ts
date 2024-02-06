import type { Command } from '../../types';

export function createCommand<P extends any[], R>(
  description: string,
  callerSideFn: (...params: P) => Promise<R>,
  receiverSideFn: (...params: P) => Promise<R>,
  encodeFn: (result: Error | R) => string,
  decodeFn: (result: string) => Error | R
): Command<P, R> {
  return {
    description,
    callerSideFn,
    receiverSideFn,
    encodeFn,
    decodeFn,
  };
}
