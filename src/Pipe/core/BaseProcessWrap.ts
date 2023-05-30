import { ProcessableWrapedStep } from './classes/bases/ProcessableWrapedStep';
import { ProcessStep } from './ProcessStep';
import { ITransformInput, IUnbox } from './types';
import { type IGetTransform } from './types/IGetTransform';
import { IUnWrap } from './types/IUnWrap';
import { IWrap } from './types/IWrap';
import { IWrapUnWrap } from './types/IWrapUnWrap';

export class ProcessWrap<T, R>
  extends ProcessableWrapedStep<T, R>
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
export class ProcessWithUnWrap<T, R>
  extends ProcessableWrapedStep<T, R>
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
  extends ProcessableWrapedStep<T, R>
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
