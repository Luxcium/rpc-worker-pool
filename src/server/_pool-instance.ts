import { range } from '@luxcium/tools';
import { existsSync } from 'fs';
import { join } from 'path';
import RpcWorkerPool from './RpcWorkerPool';
import { isStrategy, strategies } from './utils';

const THREADS = 10;
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
  const list = range(0, 1);

  const workerPool = new RpcWorkerPool(scriptFileUri, threads, strategy);

  const helloWorldWorker = async (i: number) =>
    workerPool.exec('hello-world', i, ...['1', '1', '50', '50']);

  const allresults = await Promise.all(list.map(helloWorldWorker));

  allresults.map($ => console.log('$', $));

  return process.exit(0);
})();
