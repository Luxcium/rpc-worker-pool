export interface ICompose<T, R> {
  compose<U>(composeWith: (input: R) => U): ICompose<T, U>;
}
