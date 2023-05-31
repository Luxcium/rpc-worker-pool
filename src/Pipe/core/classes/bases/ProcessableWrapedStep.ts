import type {
  IGetTransform,
  ITransformInput,
  IUnbox,
  MapFunction,
} from '../../types';
import { ProcessStep } from '../ProcessStep';
import { ProcessWrap } from '../ProcessWrap';
import { ProcessableStep } from './ProcessableStep';

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
  static override from<TVal, RVal>(processStep: ProcessableStep<TVal, RVal>) {
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
