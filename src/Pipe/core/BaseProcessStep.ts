export abstract class BaseProcessStep<T, R> implements GetTransform<T, R> {
  constructor(protected _transform: (input: T) => R) {}
  get transform() {
    return this._transform;
  }
}

interface GetTransform<P, Q> {
  get transform(): (input: P) => Q;
}
