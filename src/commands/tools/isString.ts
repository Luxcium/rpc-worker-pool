import type { IdsObject } from '../../types';

export function isString(value: string | IdsObject): value is string {
  return typeof value === 'string';
}
