import { range } from '@luxcium/tools';
import { existsSync } from 'fs';
import { join } from 'path';
import RpcWorkerPool from './RpcWorkerPool';
import { isStrategy, strategies } from './utils';

// const THREADS = 20;
const STRATEGY = 'roundrobin';

const SCRIPT_FILE_URI = join(
  `${__dirname}/worker.${existsSync(`${__dirname}/worker.ts`) ? 'ts' : 'js'}`
);

// const threads = Number(THREADS);
const strategy_ = String(STRATEGY);
const strategy = isStrategy(strategy_) ? strategy_ : strategies.roundrobin;
const scriptFileUri = SCRIPT_FILE_URI;

void (async function MAIN({ threads }: { threads: number }) {
  console.log(`at: MAIN from ${__filename}`);

  // Range of tests:
  // for example 20 requests when set to range down from 30 to 10.
  const testRequests = range(30, 10);

  const delaysAndLoads = ['1000', '1000', '5000', '5000'];

  const workerPool = new RpcWorkerPool(scriptFileUri, threads, strategy);

  // hello world worker command method is a command taht can take
  // lower and upper bounds to do random delays in miliseconds and random
  // loads in dimentionless factor (the higher the factor the higher the
  // load)
  const helloWorldWorker = async (i: number) => {
    // payload $ is a Promise that will resolve or reject into a Json RPC
    const $ = workerPool.exec('hello-world', i, ...delaysAndLoads);
    console.dir(
      {
        ['@helloWorldWorkerResult→']: await $,
      },
      { colors: true, depth: 10 }
    );
    return $;
  };

  const allresults = Promise.all(testRequests.map(helloWorldWorker));
  await allresults;
  return process.exit(0);
})({ threads: 20 });
