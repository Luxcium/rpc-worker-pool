export interface IGetTransform<P, Q> {
  get transform(): (input: P) => Q;
}
