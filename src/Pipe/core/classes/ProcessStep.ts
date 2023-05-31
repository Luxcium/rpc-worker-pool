import type {
  IGetTransform,
  ITransformInput,
  IUnbox,
  MapFunction,
} from '../types';
import { ProcessableStep } from './';

export class ProcessStep<T, R>
  extends ProcessableStep<T, R>
  implements
    ITransformInput<T, R>,
    IGetTransform<T, R>,
    IUnbox<(input: T) => R>
{
  static of<TVal, RVal>(
    transform: (input: TVal) => RVal
  ): ProcessStep<TVal, RVal> {
    return new ProcessStep<TVal, RVal>(transform);
  }
  static from<TVal, RVal>(
    processStep: IGetTransform<TVal, RVal>
  ): ProcessStep<TVal, RVal> {
    return new ProcessStep<TVal, RVal>(processStep.transform);
  }
  protected constructor(transform: (input: T) => R) {
    super(transform);
  }
  public transformInput(input: T): R {
    return this._transform(input);
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
