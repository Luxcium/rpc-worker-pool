import { IUnbox } from '../tools/types';
import { ProcessStep, ProcessWithUnWrap, ProcessWithWrap } from './ProcessStep';

export abstract class BaseProcessStep<T, R>
  implements IGetTransform<T, R>, IUnbox<(input: T) => R>
{
  constructor(protected _transform: (input: T) => R) {}
  get transform() {
    return this._transform;
  }
  unbox() {
    return this._transform;
  }
}

export interface IGetTransform<P, Q> {
  get transform(): (input: P) => Q;
}

export interface IUnWrap<T, R> {
  unWrap<I>(preComposeWith: (input: I) => T): ProcessStep<I, R>;
}

export interface IWrap<T, R> {
  wrap<O>(composeWith: (input: R) => O): ProcessStep<T, O>;
}

export interface IWrapUnWrap<T, R> {
  unWrap<I>(preComposeWith: (input: I) => T): ProcessWithWrap<I, R>;
  wrap<O>(composeWith: (input: R) => O): ProcessWithUnWrap<T, O>;
}
