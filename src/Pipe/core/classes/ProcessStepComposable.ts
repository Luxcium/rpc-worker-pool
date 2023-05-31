import { ICompose, ITransformInput, IUnbox, MapFunction } from '../types';
import { ProcessStep, ProcessableStep } from './';

export class ProcessStepComposable<T, R>
  extends ProcessStep<T, R>
  implements ITransformInput<T, R>, ICompose<T, R>, IUnbox<(input: T) => R>
{
  static override of<TVal, RVal>(transform: (input: TVal) => RVal) {
    return new ProcessStepComposable<TVal, RVal>(transform);
  }
  static override from<TVal, RVal>(processStep: ProcessableStep<TVal, RVal>) {
    return new ProcessStepComposable<TVal, RVal>(processStep.transform);
  }
  protected constructor(transform: (input: T) => R) {
    super(transform);
  }
  public precompose<I>(
    preComposeWith: (input: I) => T
  ): ProcessStepComposable<I, R> {
    const transform: (input: T) => R = this._transform;
    const composedTransform = (input: I) => transform(preComposeWith(input));
    return new ProcessStepComposable<I, R>(composedTransform);
  }
  public compose<O>(composeWith: (input: R) => O): ProcessStepComposable<T, O> {
    const transform: (input: T) => R = this._transform;
    const composedTransform = (input: T) => composeWith(transform(input));
    return new ProcessStepComposable<T, O>(composedTransform);
  }

  override map<I, O>(
    funct: (input: MapFunction<T, R>) => MapFunction<I, O>
  ): ProcessStepComposable<I, O> {
    const { transform } = this;
    return ProcessStepComposable.of(funct(transform));
  }

  override ap<I, O>(
    fn: ProcessStep<I, (input: MapFunction<T, R>) => O>
  ): ProcessStepComposable<I, O> {
    const { transform } = this;
    return ProcessStepComposable.of<I, O>(input =>
      fn.transform(input)(transform)
    );
  }

  override chain<I, O>(
    fn: (input: MapFunction<T, R>) => ProcessStepComposable<I, O>
  ): ProcessStepComposable<I, O> {
    const { transform } = this;
    return fn(transform);
  }
}
