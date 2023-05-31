import {
  ProcessWithUnWrap,
  ProcessWithWrap,
} from '../classes/bases/ProcessableWrapedStep';

export interface IWrapUnWrap<T, R> {
  unWrap<I>(preComposeWith: (input: I) => T): ProcessWithWrap<I, R>;
  wrap<O>(composeWith: (input: R) => O): ProcessWithUnWrap<T, O>;
}
