import { RpcRight } from '../types';

export type Range = `range(${number}, ${number})`;
export type Threads = `{ threads(workers): ${number} }`;
export type CommandName = `command_name: ${string}`;
export type NumberString = `${number}`;
export type BooleanString = `${boolean}`;

export type ArgsTuple = [
  lowerBoundDelay_a: NumberString,
  upperBoundDelay_a: NumberString,
  lowerBoundHeavyTask: NumberString,
  upperBoundHeavyTask: NumberString,
  lowerBoundDelay_b: NumberString,
  upperBoundDelay_b: NumberString,
  awaited: BooleanString,
  range: Range,
  threads: Threads,
  commandName: CommandName
];
/**
 * This interface is used to represent the performance result of an
 * operation.
 * It is generic and can have a value of any type N, time elapsed for
 * the operation,
 * total time elapsed, and initial time of the operation.
 */
export interface PerformanceResult<N = number> {
  value: N;
  timeElapsed: number;
  totalTimeElapsed: number;
  initialTime: number;
}
/**
 * This type is used to represent the result of a task.
 */
export type TaskStepsResult = {
  steps: number;
  result: number;
};
export type DelayValue = PerformanceResult;

export type TaskValue = PerformanceResult<TaskStepsResult>;

// export interface HelloWorldWorkerResult extends RpcRight<HelloWorldWorkerResult['result']> {
//   jsonrpc: '2.0';
//   id: number | string;
//   result: {
//     delay_a: [lowerBoundDelay_a: number, upperBoundDelay_a: number];
//     heavyTask: [lowerBoundHeavyTask: number, upperBoundHeavyTask: number];
//     delay_b: [lowerBoundDelay_b: number, upperBoundDelay_b: number];
//     awaited: boolean;
//     delayValues_a: DelayValue;
//     taskValue: TaskValue;
//     delayValues_b: DelayValue;
//     performance: [duration: number, initialTime_0: number];
//     args: ArgsTuple;
//   };
// }
interface Result {
  delay_a: [lowerBoundDelay_a: number, upperBoundDelay_a: number];
  heavyTask: [lowerBoundHeavyTask: number, upperBoundHeavyTask: number];
  delay_b: [lowerBoundDelay_b: number, upperBoundDelay_b: number];
  awaited: boolean;
  delayValues_a: DelayValue;
  taskValue: TaskValue;
  delayValues_b: DelayValue;
  performance: [duration: number, initialTime_0: number];
  args: ArgsTuple;
}

export interface HelloWorldWorkerResultRpc extends RpcRight<Result> {
  jsonrpc: '2.0';
  id: number | string;
  result: Result;
}

export interface HelloWorldWorker {
  '@helloWorldWorkerResult→':
    | Promise<HelloWorldWorkerResultRpc>
    | Awaited<HelloWorldWorkerResultRpc>;
}
// :-@-----------------------------------------------------------------------@―:
// export const myArrayTest: ArgsTuple = [
//   '1',
//   '1',
//   '1',
//   '1',
//   '1',
//   '1',
//   'true',
//   `range(${1}, ${2})`,
//   `{ threads(workers): ${3} }`,
//   `command_name: ${'string'}`,
// ];
// export const argsSlice = myArrayTest.slice(7);
// if (areLastThreeElementsCommandParams(argsSlice)) {
//   const [range, threads, commandname]: [Range, Threads, CommandName] =
//     argsSlice;
//   console.log([range, threads, commandname]);
// }

// const [range, threads, commandname] = [
//   myArrayTest[7],
//   myArrayTest[8],
//   myArrayTest[9],
// ];
// myArrayTest;
// console.log([range, threads, commandname]);

export function extractRange(array: ArgsTuple): [Range, Threads, CommandName] {
  return [array[7], array[8], array[9]];
}

export function extractArgs(args: ArgsTuple): [Range, Threads, CommandName] {
  return [args[7], args[8], args[9]];
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

// export function extractargs(arg: ArgsTuple) {
//   const len = arg.length;

//   return [arg[len - 3], arg[len - 2], arg[len - 1]];
// }

// type MyTup = [num: 1, str: 'hello', bool: true];

// let tuple: MyTup = [1, 'hello', true];
// let[A,B,C] = tuple;
// let a = tuple[0]; // TypeScript infers `a` as `number`
// let b = tuple[1]; // TypeScript infers `b` as `string`
// let c = tuple[2]; // TypeScript infers `c` as `boolean`
// [a, b, c];

// [
//   '1',
//   '1',
//   '1',
//   '1',
//   '1',
//   '1',
//   'true',
//   `range(${1}, ${2})`,
//   `{ threads(workers): ${3} }`,
//   `command_name: ${'string'}`,
// ];
// type _Range = `range(${number}, ${number})`;
// type _Threads = `{ threads(workers): ${number} }`;
// type _CommandName = `command_name: ${string}`;
// type _NumberString = `${number}`;
// type _BooleanString = `${boolean}`;

// export type _ArgsTuple = [
//   lowerBoundDelay_a: _NumberString,
//   upperBoundDelay_a: _NumberString,
//   lowerBoundHeavyTask: _NumberString,
//   upperBoundHeavyTask: _NumberString,
//   lowerBoundDelay_b: _NumberString,
//   upperBoundDelay_b: _NumberString,
//   awaited: _BooleanString,
//   range: _Range,
//   threads: _Threads,
//   commandName: _CommandName
// ];
