import type { IdsObject } from '../../types';

export function isString(value: IdsObject | string): value is string {
  return 'string' === typeof value;
}
