export interface ITransformInput<T, R> {
  transformInput: (input: T) => R;
}
