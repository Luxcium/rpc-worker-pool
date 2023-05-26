import { BaseProcessStep } from '.';
import { ITransformInput } from '../tools/types';

export class ProcessStep<T, R>
  extends BaseProcessStep<T, R>
  implements ITransformInput<T, R>
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
  transformInput(input: T): R {
    return this._transform(input);
  }
}
