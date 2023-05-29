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
}

//
/*
// folder (path to an image folder) const giveNameTo_
// list files
// filter per image extension case insensitive (using a set)
//
 */
