import type { MapFunction } from '../../types/MapFunction';

export type ALike<T, R> = MapFunction<T, R>;
export type BLike = MapFunction<ILike, OLike>;
export type TLike = string;
export type RLike = number;
export type ILike = unknown;
export type OLike = unknown;
export type PLike = any;
export type QLike = any;

// interface IFunctor_<A> {
//   map<B>(funct: (input: A) => B): IFunctor_<B>;
// }

// export abstract class ProcessableStep_<T, R>
//   implements IFunctor_<MapFunction<T, R>>
// {
//   abstract map<I = any, O = any>(
//     fn: (input: MapFunction<T, R>) => MapFunction<I, O>
//   ): ProcessableStep_<I, O>;
// }

export interface IFunctor<A> {
  map: <B>(funct: (input: A) => B) => IFunctor<B>;
}

// interface IFunctor<number> {
//   map<string>(funct: (input: number) => string): IFunctor<string>;
// }

// abstract class ProcessableStep<number, boolean>
//   implements IFunctor<(number) => boolean>
// {
//   abstract map<I = any, O = any>(
//     fn: (input: (number) => boolean) => (I) => O
//   ): ProcessableStep<I, O>;
// }
// abstract map<BVal extends (input: any) => any = (input: any) => any>(fn: (input: TVal) => BVal): ProcessableStep<BVal>;
// abstract map<BVal extends (input: any) => any = (input: any) => any>(
//   fn: (input: (input: T) => R) => (input: any) => any
// ): IFunctor<BVal>; //
// (input: (meta_X: T) => R) => (Metany ): IFunctor<(meta_Z: any) => any>;
//  RVal<RVal> (input: any) => any
// fn: (transform: (input: T) => R) => (input: I) => O input:
// ): ProcessableStep<any, any>; (_in: T) => R) => (_in: I) => O <I, O>
// abstract map<I,O>(fn:MapFunction<MapFunction<T, R>,MapFunction<I,O>>): ProcessableStep<I,O> & IFunctor<MapFunction<I,O>>;IFunctor<MapFunction<T, R>>,
// export interface IFunctor_<A> {
//   map<B>(funct: (input: A) => B): IFunctor_<B>;
// }

// export abstract class ProcessableStep_<
//   T,
//   R,
//   TVal extends (input: T) => R = (input: T) => R
// > implements IFunctor<TVal>
// {
//   constructor(protected _transform: TVal) {}

//   get transform() {
//     return this._transform;
//   }

//   unbox() {
//     return this._transform;
//   }

//   abstract map<BVal extends (input: any) => any>(
//     fn: (input: TVal) => BVal
//   ): IFunctor<BVal>;
// }
