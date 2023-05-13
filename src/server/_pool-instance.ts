import { existsSync } from 'fs';
import { join } from 'path';
import { isStrategy, strategies } from '../commands';
import { WorkerPool } from '../types';
import RpcWorkerPool from './RpcWorkerPool';

const THREADS = 4;
const STRATEGY = 'roundrobin';

const SCRIPT_FILE_URI = join(
  `${__dirname}/worker.${existsSync(`${__dirname}/worker.ts`) ? 'ts' : 'js'}`
);

const threads = Number(THREADS);
const strategy_ = String(STRATEGY);
const strategy = isStrategy(strategy_) ? strategy_ : strategies.roundrobin;
const scriptFileUri = SCRIPT_FILE_URI;

const workerPool: WorkerPool = new RpcWorkerPool(
  scriptFileUri,
  threads,
  strategy
);

void (async function MAIN() {
  console.log(`at: MAIN from ${__filename}`);
  const rpcDummyData: any = 'not implemented';
  rpcDummyData;
  workerPool;
  const result = await workerPool.exec(
    'command_name',
    0 as number,
    ...['...args', 'string[]']
  );
  return void result;
})();
