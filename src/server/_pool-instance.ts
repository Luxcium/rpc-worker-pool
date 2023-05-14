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
  const rpcDummyData: any = 'not implemented';
  rpcDummyData;
  workerPool;
  const result = await workerPool.exec(
    'hello-world',
    9,
    ...['...args', 'string[]']
  );
  await workerPool.exec('hello-world', 10, ...['...args', 'string[]']);
  await workerPool.exec('hello-world', 11, ...['...args', 'string[]']);
  await workerPool.exec('hello-world', 12, ...['...args', 'string[]']);
  await workerPool.exec('hello-world', 13, ...['...args', 'string[]']);
  await workerPool.exec('hello-world', 14, ...['...args', 'string[]']);
  return void result;
})();
