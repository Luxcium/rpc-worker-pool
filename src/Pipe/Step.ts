import { internals } from 'mapping-tools';
// import type { MapperOptions } from 'mapping-tools/lib/typings/types';
type MapperOptions<T, R> = {
  item: T;
  index: number;
  array: T[];
  transform: (item: T) => R;
  lookup?: (key: string) => R;
  validate?: (item: T) => boolean;
  errLookup?: (error: any) => string;
};
const { fn_a1f9a } = internals;
export type Fn_a1f9a<T, R> = ({
  item,
  index,
  array,
  transform,
  lookup,
  validate,
  errLookup,
}: MapperOptions<T, R>) => any;

fn_a1f9a;
