import { delay, range } from '@luxcium/tools';
import chalk from 'chalk';
import { baseRpcRequest } from '../API/RPC-serialise';
import RpcWorkerPool from '../server/RpcWorkerPool';
import { isStrategy, strategies } from '../server/utils';
import {
  ArgsTuple,
  HelloWorldWorkerResultRpc,
} from '../types/hello-world-method';

const strategy = isStrategy('roundrobin')
  ? 'roundrobin'
  : strategies.roundrobin;

void (async function MAIN({ threads }: { threads: number }) {
  console.log(`at: MAIN from ${__filename}`);
  const workerPool = new RpcWorkerPool(null, threads, strategy);
  await delay();
  const from = 10;
  const to = 89;
  const testRequests: number[] = range(from, to);

  const delaysAndLoads: ArgsTuple = [
    '1000',
    '1000',
    '5440',
    '5440',
    '1000',
    '1000',
    'true',
    `range(${from}, ${to})`,
    `{ threads(workers): ${threads} }`,
    'command_name: hello-world',
  ];

  const helloWorldRpcRequest = baseRpcRequest('hello-world');
  const helloWorldRequest = helloWorldRpcRequest(delaysAndLoads);
  const helloWorldWorkerRpc = async (i: number) => {
    const $ = workerPool.execRpc<HelloWorldWorkerResultRpc>(
      helloWorldRequest(i)
    );
    await $;
    console.log(
      chalk.yellow('Received back from worker @helloWorldWorkerResult→')
    );
    console.dir(
      {
        ['@helloWorldWorkerResult→']: await $,
      },
      { colors: true, depth: 10, compact: true }
    );
    return $;
  };

  await Promise.all(testRequests.map(helloWorldWorkerRpc));

  return process.exit(0);
})({ threads: 20 });
