import { ITransformInput, IUnbox, MapFunction } from '../types';
import { type IGetTransform } from '../types/IGetTransform';
import { IWrapUnWrap } from '../types/IWrapUnWrap';
import { ProcessStep } from './ProcessStep';
import { ProcessWithUnWrap } from './ProcessWithUnWrap';
import { ProcessWithWrap } from './ProcessWithWrap';
import { ProcessableWrapedStep } from './bases/ProcessableWrapedStep';

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

  map<I, O>(
    funct: (input: MapFunction<T, R>) => MapFunction<I, O>
  ): ProcessWrap<I, O> {
    const { transform } = this;
    return ProcessWrap.of(funct(transform));
  }

  ap<I, O>(
    fn: ProcessStep<I, (input: MapFunction<T, R>) => O>
  ): ProcessWrap<I, O> {
    const { transform } = this;
    return ProcessWrap.of<I, O>(input => fn.transform(input)(transform));
  }

  override chain<I, O>(
    fn: (input: MapFunction<T, R>) => ProcessWrap<I, O>
  ): ProcessWrap<I, O> {
    const { transform } = this;
    return fn(transform);
  }
}
