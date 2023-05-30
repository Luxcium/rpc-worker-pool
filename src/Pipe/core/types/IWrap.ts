import { ProcessStep } from '../ProcessStep';

export interface IWrap<T, R> {
  wrap<O>(composeWith: (input: R) => O): ProcessStep<T, O>;
}
