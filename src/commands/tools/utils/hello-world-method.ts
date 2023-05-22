import {
  ArgsTuple,
  BooleanString,
  CommandName,
  NumberString,
  Range,
  Threads,
} from '../../../types/hello-world-method';

export function extractRange(args: ArgsTuple): [Range, Threads, CommandName] {
  const len = args.length;
  return [
    args[len - 3] as Range,
    args[len - 2] as Threads,
    args[len - 1] as CommandName,
  ];
}

export function extractArgs(args: ArgsTuple): [Range, Threads, CommandName] {
  const len = args.length;
  return [
    args[len - 3] as Range,
    args[len - 2] as Threads,
    args[len - 1] as CommandName,
  ];
}

export function isRange(value: string): value is Range {
  return /^range\(\d+, \d+\)$/.test(value);
}

export function isThreads(value: string): value is Threads {
  return /^\{ threads\(workers\): \d+ \}$/.test(value);
}

export function isCommandName(value: string): value is CommandName {
  return /^command_name: .*$/.test(value);
}

export function isNumberString(value: string): value is NumberString {
  return /^\d+$/.test(value);
}

export function isBooleanString(value: string): value is BooleanString {
  return value === 'true' || value === 'false';
}

export function areLastThreeElementsCommandParams(
  array: string[]
): array is [...string[], Range, Threads, CommandName] {
  const len = array.length;
  return (
    len >= 3 &&
    isRange(array[len - 3]) &&
    isThreads(array[len - 2]) &&
    isCommandName(array[len - 1])
  );
}
