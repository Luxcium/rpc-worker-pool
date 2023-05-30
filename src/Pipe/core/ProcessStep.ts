import { ProcessableStep } from './classes/bases/ProcessableStep';
import { ITransformInput, IUnbox } from './types';
import { type IGetTransform } from './types/IGetTransform';

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
}

// public map(
//     fn: (input: (input: any) => any) => any

//     // fn: (transform: ((input: T) => R) : (input: I)) => O
//   ): ProcessStep<I, O> {
//     return new ProcessStep(fn(this.transform));
//   }
