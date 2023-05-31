// import { ITransformInput, IUnbox, MapFunction } from '../types';
// import { type IGetTransform } from '../types/IGetTransform';
// import { IWrap } from '../types/IWrap';
// import { ProcessStep, ProcessableWrapedStep } from './';

// export class ProcessWithWrap<T, R>
//   extends ProcessableWrapedStep<T, R>
//   implements
//     IWrap<T, R>,
//     ITransformInput<T, R>,
//     IGetTransform<T, R>,
//     IUnbox<(input: T) => R>
// {
//   public wrap<O>(composeWith: (input: R) => O) {
//     const transform: (input: T) => R = this._transform;
//     const composedTransform = (input: T) => composeWith(transform(input));
//     return new ProcessStep<T, O>(composedTransform);
//   }

//   map<I, O>(
//     funct: (input: MapFunction<T, R>) => MapFunction<I, O>
//   ): ProcessStep<I, O> {
//     const { transform } = this;
//     return ProcessStep.of(funct(transform));
//   }
//   ap<I, O>(
//     fn: ProcessStep<I, (input: MapFunction<T, R>) => O>
//   ): ProcessStep<I, O> {
//     const { transform } = this;
//     return ProcessStep.of<I, O>(input => fn.transform(input)(transform));
//   }
//   chain<I, O>(
//     fn: (input: MapFunction<T, R>) => ProcessStep<I, O>
//   ): ProcessStep<I, O> {
//     const { transform } = this;
//     return fn(transform);
//   }
// }

export {};
