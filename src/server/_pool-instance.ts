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
  const list = range(0, 100);

  const workerPool = new RpcWorkerPool(scriptFileUri, threads, strategy);

  const helloWorldWorker = async (i: number) => {
    const $ = workerPool.exec(
      'hello-world',
      i,
      ...['1000', '1000', '500', '500']
    );
    console.dir(
      { ['@helloWorldWorkerResult→']: await $ },
      { colors: true, depth: 10 }
    );
    return $;
  };

  const allresults = await Promise.all(
    list.map(helloWorldWorker)
    // .map(async $ => {
    //   console.dir(
    //     { ['@helloWorldWorkerResult→']: await $ },
    //     { colors: true, depth: 10 }
    //   );
    //   return $;
    // })
  );

  // allresults.map($ => {
  //   console.dir(
  //     { ['@helloWorldWorkerResult→']: $ },
  //     { colors: true, depth: 10 }
  //   );
  //   return $;
  // });
  allresults;
  return process.exit(0);
})();
