import { fn_a1f9a } from 'mapping-tools/lib/typings/functions/core';
import { MapperOptions } from 'mapping-tools/lib/typings/types';

export interface ITransformInput<T, R> {
  transformInput(input: T): R;
}
export interface ICompose<T, R> {
  compose<U>(composeWith: (input: R) => U): ProcessStepComposable<T, U>;
}
export abstract class BaseProcessStep<T, R> {
  constructor(protected _transform: (input: T) => R) {}
  get transform() {
    return this._transform;
  }
}

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
export class ProcessStepComposable<T, R>
  extends ProcessStep<T, R>
  implements ITransformInput<T, R>, ICompose<T, R>
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

  public compose<U>(composeWith: (input: R) => U): ProcessStepComposable<T, U> {
    const transform: (input: T) => R = this._transform;
    const composedTransform = (input: T) => composeWith(transform(input));
    return new ProcessStepComposable<T, U>(composedTransform);
  }
}

export class Pipeline<T, R> {
  private constructor(private readonly steps: ProcessStep<any, any>[]) {}

  static initialize<T, R>(step: ProcessStep<T, R>): Pipeline<T, R> {
    return new Pipeline([step]);
  }

  appendStep<U>(step: ProcessStep<R, U>): Pipeline<T, U> {
    const newSteps = [...this.steps, step];
    return new Pipeline(newSteps);
  }

  process(input: T): R {
    return this.steps.reduce(
      (value, step) => step.transformInput(value),
      input as any
    ) as R;
  }
}

export type Fn_a1f9a<T, R> = ({
  item,
  index,
  array,
  transform = async value => value as any as R,
  lookup = (value, index, array) => void [value, index, array],
  validate = async (value, index, array) => void [value, index, array],
  errLookup = (value, index, currentRejection) =>
    void [value, index, currentRejection],
}: MapperOptions<T, R>) => any;

fn_a1f9a;
