import type { ProcessStep } from './classes/ProcessStep';

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
    return this.steps.reduce<any>(
      (value, step) => step.transformInput(value),
      input
    ) as R;
  }
}
