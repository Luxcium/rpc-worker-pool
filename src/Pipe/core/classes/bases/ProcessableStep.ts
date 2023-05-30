import { IGetTransform, IUnbox } from '../../types';

export abstract class ProcessableStep<T, R>
  implements IGetTransform<T, R>, IUnbox<(input: T) => R>
{
  constructor(protected _transform: (input: T) => R) {}
  get transform() {
    return this._transform;
  }
  unbox() {
    return this._transform;
  }
}

export interface IFunctor<A> {
  map<B>(funct: (input: A) => B): IFunctor<B>;
}
// abstract map<BVal extends (input: any) => any = (input: any) => any>(fn: (input: TVal) => BVal): ProcessableStep<BVal>;
// abstract map<BVal extends (input: any) => any = (input: any) => any>(
//   fn: (input: (input: T) => R) => (input: any) => any
// ): IFunctor<BVal>; //
// (input: (meta_X: T) => R) => (Metany ): IFunctor<(meta_Z: any) => any>;
//  RVal<RVal> (input: any) => any
// fn: (transform: (input: T) => R) => (input: I) => O input:
// ): ProcessableStep<any, any>; (_in: T) => R) => (_in: I) => O <I, O>

export interface IFunctor<A> {
  map<B>(funct: (input: A) => B): IFunctor<B>;
}

export abstract class ProcessableStep_<
  T,
  R,
  TVal extends (input: T) => R = (input: T) => R
> implements IFunctor<TVal>
{
  constructor(protected _transform: TVal) {}

  get transform() {
    return this._transform;
  }

  unbox() {
    return this._transform;
  }

  abstract map<BVal extends (input: any) => any>(
    fn: (input: TVal) => BVal
  ): IFunctor<BVal>;
}
