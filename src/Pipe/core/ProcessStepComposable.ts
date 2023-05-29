import { BaseProcessStep, ProcessStep } from '.';
import { ICompose, ITransformInput, IUnbox } from '../tools/types';

export class ProcessStepComposable<T, R>
  extends ProcessStep<T, R>
  implements ITransformInput<T, R>, ICompose<T, R>, IUnbox<(input: T) => R>
{
  static override of<TVal, RVal>(transform: (input: TVal) => RVal) {
    return new ProcessStepComposable<TVal, RVal>(transform);
  }
  static override from<TVal, RVal>(processStep: BaseProcessStep<TVal, RVal>) {
    return new ProcessStepComposable<TVal, RVal>(processStep.transform);
  }
  protected constructor(transform: (input: T) => R) {
    super(transform);
  }
  public precompose<U>(
    preComposeWith: (input: T) => U
  ): ProcessStepComposable<T, U> {
    const transform: (input: T) => R = this._transform;
    // input transform preComposeWith
    const composedTransform = (input: T) => transform(preComposeWith(input)); //
    // preComposeWith(transform());
    return new ProcessStepComposable(composedTransform);
  }

  public compose<U>(composeWith: (input: R) => U): ProcessStepComposable<T, U> {
    const transform: (input: T) => R = this._transform;
    const composedTransform = (input: T) => composeWith(transform(input));
    return new ProcessStepComposable<T, U>(composedTransform);
  }
}

//
/*
// folder (path to an image folder) const giveNameTo_
// list files
// filter per image extension case insensitive (using a set)
//
 */
