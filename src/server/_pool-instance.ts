import { range } from '@luxcium/tools';
import { existsSync } from 'fs';
import { join } from 'path';
import RpcWorkerPool from './RpcWorkerPool';
import { isStrategy, strategies } from './utils';

const THREADS = 1;
const STRATEGY = 'roundrobin';

const SCRIPT_FILE_URI = join(
  `${__dirname}/worker.${existsSync(`${__dirname}/worker.ts`) ? 'ts' : 'js'}`
);

const threads = Number(THREADS);
const strategy_ = String(STRATEGY);
const strategy = isStrategy(strategy_) ? strategy_ : strategies.roundrobin;
const scriptFileUri = SCRIPT_FILE_URI;

void (async function MAIN() {
  console.log(`at: MAIN from ${__filename}`);
  const workerPool = new RpcWorkerPool(scriptFileUri, threads, strategy);
  const helloWorldWorker = async (i: number) =>
    workerPool.exec(
      'hello-world',
      i,
      ...['1', '1', '50', '...args', 'string[]']
    );
  const list = range(1, 1000);
  // for (const item of list) {
  //   const each = helloWorldWorker(item);
  //   await each;
  //   console.log('', each);
  // }
  const allresults = await Promise.all(list.map(helloWorldWorker));
  // heavyTask(33);
  allresults.map($ => console.log('$', $));
  return process.exit(0);
})();

// function heavyTask(n: number) {
//   let result = 0;
//   for (let i = 0; i < n * 1e6; i++) {
//     result += i;
//   }
//   return result;
// }
