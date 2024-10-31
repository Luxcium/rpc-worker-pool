// src/core/workerGenerator.ts
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';

export function tsnodeWorkerGenerator(
  dirname: string,
  employee_number: number,
  worker: typeof Worker
): Worker {
  const SCRIPT_FILE_URI = join(
    `${dirname}/worker.${existsSync(`${dirname}/worker.ts`) ? 'ts' : 'js'}`
  );
  return new worker(
    `
  require('ts-node/register');
  require(require('worker_threads').workerData.runThisFileInTheWorker);
`,
    {
      eval: true,
      workerData: {
        runThisFileInTheWorker: SCRIPT_FILE_URI,
        workerAsset: employee_number,
      },
    }
  );
}
