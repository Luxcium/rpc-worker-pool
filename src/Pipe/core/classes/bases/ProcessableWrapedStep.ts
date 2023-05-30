import { ProcessWrap } from '../../BaseProcessWrap';
import { ProcessStep } from '../../ProcessStep';
import { ITransformInput, IUnbox } from '../../types';
import { type IGetTransform } from '../../types/IGetTransform';
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
}
