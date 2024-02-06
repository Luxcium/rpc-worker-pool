import type { ProcessStep } from '../classes/ProcessStep';

export interface IUnWrap<T, R> {
  unWrap: <I>(preComposeWith: (input: I) => T) => ProcessStep<I, R>;
}
