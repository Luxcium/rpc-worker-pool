'use strict';
export function maxSize(size_: number, coreLength: number) {
  return Math.max(size_ < 0 ? coreLength + size_ : size_ || coreLength - 1, 1);
}
