import { ITransformInput, IUnbox } from '../tools/types';
import {
  BaseProcessStep,
  IUnWrap,
  IWrap,
  IWrapUnWrap,
  type IGetTransform,
} from './BaseProcessStep';

export class ProcessStep<T, R>
  extends BaseProcessStep<T, R>
  implements
    ITransformInput<T, R>,
    IGetTransform<T, R>,
    IUnbox<(input: T) => R>
{
  static of<TVal, RVal>(transform: (input: TVal) => RVal) {
    return new ProcessStep<TVal, RVal>(transform);
  }
  static from<TVal, RVal>(processStep: BaseProcessStep<TVal, RVal>) {
    return new ProcessStep<TVal, RVal>(processStep.transform);
  }
  protected constructor(transform: (input: T) => R) {
    super(transform);
  }
  public transformInput(input: T): R {
    return this._transform(input);
  }
}

export abstract class BaseProcessWrap<T, R>
  extends ProcessStep<T, R>
  implements
    ITransformInput<T, R>,
    IGetTransform<T, R>,
    IUnbox<(input: T) => R>
{
  static override of<TVal, RVal>(transform: (input: TVal) => RVal) {
    return new ProcessWrap<TVal, RVal>(transform);
  }
  static override from<TVal, RVal>(processStep: BaseProcessStep<TVal, RVal>) {
    return new ProcessWrap<TVal, RVal>(processStep.transform);
  }
  protected constructor(transform: (input: T) => R) {
    super(transform);
  }
}

export class ProcessWithUnWrap<T, R>
  extends BaseProcessWrap<T, R>
  implements
    IUnWrap<T, R>,
    ITransformInput<T, R>,
    IGetTransform<T, R>,
    IUnbox<(input: T) => R>
{
  public unWrap<I>(preComposeWith: (input: I) => T) {
    const transform: (input: T) => R = this._transform;
    const composedTransform = (input: I) => transform(preComposeWith(input));
    return new ProcessStep<I, R>(composedTransform);
  }
}

export class ProcessWithWrap<T, R>
  extends BaseProcessWrap<T, R>
  implements
    IWrap<T, R>,
    ITransformInput<T, R>,
    IGetTransform<T, R>,
    IUnbox<(input: T) => R>
{
  public wrap<O>(composeWith: (input: R) => O) {
    const transform: (input: T) => R = this._transform;
    const composedTransform = (input: T) => composeWith(transform(input));
    return new ProcessStep<T, O>(composedTransform);
  }
}
export class ProcessWrap<T, R>
  extends BaseProcessWrap<T, R>
  implements
    IWrapUnWrap<T, R>,
    ITransformInput<T, R>,
    IGetTransform<T, R>,
    IUnbox<(input: T) => R>
{
  public unWrap<I>(preComposeWith: (input: I) => T): ProcessWithWrap<I, R> {
    const transform: (input: T) => R = this._transform;
    const composedTransform = (input: I) => transform(preComposeWith(input));
    return new ProcessWithWrap<I, R>(composedTransform);
  }
  public wrap<O>(composeWith: (input: R) => O): ProcessWithUnWrap<T, O> {
    const transform: (input: T) => R = this._transform;
    const composedTransform = (input: T) => composeWith(transform(input));
    return new ProcessWithUnWrap<T, O>(composedTransform);
  }
}
