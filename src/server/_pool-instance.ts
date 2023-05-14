import { range } from '@luxcium/tools';
import { existsSync } from 'fs';
import { join } from 'path';
import RpcWorkerPool from './RpcWorkerPool';
import { isStrategy, strategies } from './utils';

const THREADS = 4;
const STRATEGY = 'roundrobin';

const SCRIPT_FILE_URI = join(
  `${__dirname}/worker.${existsSync(`${__dirname}/worker.ts`) ? 'ts' : 'js'}`
);

const threads = Number(THREADS);
const strategy_ = String(STRATEGY);
const strategy = isStrategy(strategy_) ? strategy_ : strategies.roundrobin;
const scriptFileUri = SCRIPT_FILE_URI;

const workerPool = new RpcWorkerPool(scriptFileUri, threads, strategy);

void (async function MAIN() {
  console.log(`at: MAIN from ${__filename}`);
  const helloWorldWorker = async (i: number) =>
    workerPool.exec('hello-world', i, ...['...args', 'string[]']);
  const list = range(200, 400, 2);
  await Promise.all(list.map(helloWorldWorker));

  const initialTime = performance.now();
  const initialTime_0 = performance.now();
  const delayTime = await delay(1000);
  const fianlTime = performance.now() - initialTime_0;
  console.log([delayTime, fianlTime]);
  const withConsolLog = performance.now() - initialTime;
  console.log(withConsolLog);

  return process.exit(0);
})();

export async function delay(
  lowerBound: number = 500,
  upperBound: number = lowerBound
): Promise<[number, number, number]> {
  const initialTime_0 = performance.now();

  // Make sure both values are positive
  lowerBound = Math.abs(lowerBound);
  upperBound = Math.abs(upperBound);

  // Ensure lowerBound is the smallest number and upperBound is the largest
  if (lowerBound > upperBound) {
    [lowerBound, upperBound] = [upperBound, lowerBound];
  }

  // Get the initial time
  const initialTime = performance.now();

  // Calculate random delay within bounds and wait for it in an IIFE
  const chosenDelay = await (async () => {
    const delay =
      Math.floor(Math.random() * (upperBound - lowerBound + 1)) + lowerBound;
    return new Promise<number>(resolve =>
      setTimeout(() => resolve(delay), delay)
    );
  })();

  // Return the chosen delay and the actual delay
  return [
    chosenDelay,
    performance.now() - initialTime,
    performance.now() - initialTime_0,
  ];
}
