import { internals } from 'mapping-tools';
import { MapperOptions } from 'mapping-tools/lib/typings/types';
const { fn_a1f9a } = internals;
export type Fn_a1f9a<T, R> = ({
  item,
  index,
  array,
  transform = async value => value as any as R,
  lookup = (value, index, array) => void [value, index, array],
  validate = async (value, index, array) => void [value, index, array],
  errLookup = (value, index, currentRejection) =>
    void [value, index, currentRejection],
}: MapperOptions<T, R>) => any;

fn_a1f9a;
