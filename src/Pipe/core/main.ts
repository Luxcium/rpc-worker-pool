import { ProcessStep } from './classes/ProcessStep';

export const somePseudoFunctor = ProcessStep.of((input: string) => input.length)
  .map(tr => (input: string) => '-'.repeat(tr(input)))
  .map(identity => identity);

export type HighLevelTransformer_A<
  X = unknown,
  Y = any,
  I = any,
  O = unknown
> = (intrant: MapFunction<X, Y>) => MapFunction<I, O>;

export type HighLevelTransformer_B<
  A,
  B,
  X,
  Y,
  I extends MapFunction<A, B> = MapFunction<A, B>,
  O extends MapFunction<X, Y> = MapFunction<X, Y>
> = (intrant: I) => O;
export type MapFunction<P = any, Q = any> = (value: P) => Q;

export const input_001: MapFunction<string, number> = (input: string) =>
  input.length;
export const Fx: HighLevelTransformer_B<string, number, string, string> =
  (intrantFN: (input: string) => number): ((input: string) => string) =>
  (input: string): string =>
    '-'.repeat(intrantFN(input));

export const Gx: HighLevelTransformer_B<string, string, string, number> =
  (intrantFN: (input: string) => string): ((input: string) => number) =>
  (input: string): number =>
    intrantFN(input).length;

export const FxGx = (X: MapFunction<string, string>) => Fx(Gx(X));

const identity_no_op = ProcessStep.of<string, string>(identity => identity);

export const compositionLaw_FxGx = identity_no_op.map<string, string>(FxGx);

export const compositionLaw_Gx_Fx = identity_no_op.map(Gx).map(Fx);

console.log(
  // 'compositionLaw_FxGx :>> ',
  compositionLaw_FxGx.transform('HELLO')
);
console.log('HELLO');
console.log(
  // 'compositionLaw_Gx_Fx :>> ',
  compositionLaw_Gx_Fx.transform('HELLO')
);

/*
EXPECTED:
-----
HELLO
-----
 */
