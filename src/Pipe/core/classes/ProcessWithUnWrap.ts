import { ITransformInput, IUnbox, MapFunction } from '../types';
import { type IGetTransform } from '../types/IGetTransform';
import { IUnWrap } from '../types/IUnWrap';
import { ProcessStep } from './ProcessStep';
import { ProcessableWrapedStep } from './bases/ProcessableWrapedStep';

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
  map<I, O>(
    funct: (input: MapFunction<T, R>) => MapFunction<I, O>
  ): ProcessStep<I, O> {
    const { transform } = this;
    return ProcessStep.of(funct(transform));
  }

  ap<I, O>(
    fn: ProcessStep<I, (input: MapFunction<T, R>) => O>
  ): ProcessStep<I, O> {
    const { transform } = this;
    return ProcessStep.of<I, O>(input => fn.transform(input)(transform));
  }
  chain<I, O>(
    fn: (input: MapFunction<T, R>) => ProcessStep<I, O>
  ): ProcessStep<I, O> {
    const { transform } = this;
    return fn(transform);
  }
}
