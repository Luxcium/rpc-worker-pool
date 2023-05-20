import { RpcRight } from '.';

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

export interface Result {
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
