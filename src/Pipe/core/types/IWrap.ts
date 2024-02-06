import type { ProcessStep } from '../classes/ProcessStep';

export interface IWrap<T, R> {
  wrap: <O>(composeWith: (input: R) => O) => ProcessStep<T, O>;
}
