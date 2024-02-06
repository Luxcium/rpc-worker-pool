import type {
  IGetTransform,
  ITransformInput,
  IUnbox,
  IUnWrap,
  IWrap,
  IWrapUnWrap,
  MapFunction,
} from '../../types';
import { ProcessStep } from '../ProcessStep';
import type { ProcessableStep } from './ProcessableStep';

export abstract class ProcessableWrapedStep<T, R>
  extends ProcessStep<T, R>
  implements
    ITransformInput<T, R>,
    IGetTransform<T, R>,
    IUnbox<(input: T) => R>
{
  static override of<TVal, RVal>(transform: (input: TVal) => RVal) {
    return new ProcessWrap<TVal, RVal>(transform);
  }

  static override from<TVal, RVal>(processStep: IGetTransform<TVal, RVal>) {
    return new ProcessWrap<TVal, RVal>(processStep.transform);
  }

  protected constructor(transform: (input: T) => R) {
    super(transform);
  }

  abstract override map<I = any, O = any>(
    fn: (input: MapFunction<T, R>) => MapFunction<I, O>
  ): ProcessableWrapedStep<I, O>;

  abstract override ap<I, O>(
    fn: ProcessableStep<I, (input: MapFunction<T, R>) => O>
  ): ProcessableWrapedStep<I, O>;

  abstract override chain<I, O>(
    fn: (input: MapFunction<T, R>) => ProcessableWrapedStep<I, O>
  ): ProcessableWrapedStep<I, O>;
}

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

  chain<I, O>(
    fn: (input: MapFunction<T, R>) => ProcessWrap<I, O>
  ): ProcessWrap<I, O> {
    const { transform } = this;
    return fn(transform);
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
