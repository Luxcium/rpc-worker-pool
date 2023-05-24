export interface ITransformInput<T, R> {
  transformInput(input: T): R;
}
export interface ICompose<T, R> {
  compose<U>(composeWith: (input: R) => U): ProcessStepComposable<T, U>;
}
export abstract class BaseProcessStep<T, R> {
  constructor(protected _transform: (input: T) => R) {}
}

export class ProcessStep<T, R>
  extends BaseProcessStep<T, R>
  implements ITransformInput<T, R>
{
  constructor(transform: (input: T) => R) {
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
  constructor(transform: (input: T) => R) {
    super(transform);
  }

  public compose<U>(composeWith: (input: R) => U): ProcessStepComposable<T, U> {
    const transform: (input: T) => R = this._transform;
    const composedTransform = (input: T) => composeWith(transform(input));
    return new ProcessStepComposable<T, U>(composedTransform);
  }
}

export class Pipeline<T, R> {
  private constructor(private steps: ProcessStep<any, any>[]) {}

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

export class NumericProcessStep
  extends ProcessStep<number, number>
  implements ITransformInput<number, number>
{
  constructor(transform: (input: number) => number) {
    super(transform);
  }
}

export type MyObjectType = Record<string | number | symbol, any>;

// export type O<T> = {};
//
export type T_A76FBD2<T> = T extends
  | Function
  | Array<any>
  | Date
  | RegExp
  | Map<any, any>
  | Set<any>
  ? never
  : T extends undefined | null | boolean | number | string | bigint | symbol
  ? never
  : T extends (...args: any[]) => any
  ? never
  : T extends object
  ? {
      [K in keyof T]: T[K] extends (...args: any[]) => any
        ? never
        : T_A76FBD2<T[K]>;
    }
  : T extends any[]
  ? Array<T_A76FBD2<T[number]>>
  : T;
export type T_A76FBD<T> = T extends (...args: any[]) => any
  ? never
  : T extends { [key: PropertyKey]: any }
  ? { [K in keyof T]: T_A76FBD<T[K]> }
  : T extends any[]
  ? Array<T_A76FBD<T[number]>>
  : T;

export type T_SimpleObject<T> =
  // Exclude anything that's not a plain object
  T extends
    | Array<any>
    | Function
    | null
    | undefined
    | boolean
    | number
    | string
    | bigint
    | symbol
    ? never
    : // Exclude built-in non-plain objects
    T extends
        | Date
        | RegExp
        | Map<any, any>
        | Set<any>
        | WeakMap<any, any>
        | WeakSet<any>
    ? never
    : // Allow only plain objects and apply the process recursively to its properties
      { [K in keyof T]: T_ValidProperty<T[K]> };

export type T_ValidProperty<T> =
  // Exclude functions and built-in non-plain objects
  T extends
    | Function
    | Date
    | RegExp
    | Map<any, any>
    | Set<any>
    | WeakMap<any, any>
    | WeakSet<any>
    ? never // Allow only primitive types, plain objects, and arrays of these (recursively)
    : T extends undefined | null | boolean | number | string | bigint | symbol
    ? T
    : T extends Array<infer U>
    ? Array<T_ValidProperty<U>>
    : T extends object
    ? T_SimpleObject<T>
    : never;

type Json = typeof JSON;
export type _Never_d2 = T_A76FBD2<{ item: 10 }>; // both same
export type _Never_d = T_A76FBD<Json>; // both same

const multiplyByTwo = new ProcessStep<number, number>(n => n * 2);
const addOne = new ProcessStep<number, number>(n => n + 1);

const pipeline = Pipeline.initialize(multiplyByTwo).appendStep(addOne);

console.log(pipeline.process(3)); // Outputs: 7
