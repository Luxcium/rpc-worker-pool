import type { IGetTransform, IUnbox, MapFunction } from '../../types';

export abstract class ProcessableStep<T, R>
  implements IGetTransform<T, R>, IUnbox<MapFunction<T, R>>
{
  constructor(protected _transform: MapFunction<T, R>) {}

  get transform(): MapFunction<T, R> {
    return this._transform;
  }

  unbox(): MapFunction<T, R> {
    return this._transform;
  }
  abstract map<I = any, O = any>(
    fn: (input: MapFunction<T, R>) => MapFunction<I, O>
  ): ProcessableStep<I, O>;

  abstract ap<I, O>(
    fn: ProcessableStep<I, (input: MapFunction<T, R>) => O>
  ): ProcessableStep<I, O>;

  abstract chain<I, O>(
    fn: (input: MapFunction<T, R>) => ProcessableStep<I, O>
  ): ProcessableStep<I, O>;
}
