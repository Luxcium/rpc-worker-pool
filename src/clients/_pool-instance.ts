import { delay, range } from '@luxcium/tools';
import { rpcRequestMethodHandler } from 'src/server/API/baseRpcRequest';
import RpcWorkerPool from '../server/RpcWorkerPool';
import { isStrategy, strategies } from '../server/utils';
import {
  ArgsTuple,
  HelloWorldWorkerResultRpc,
} from '../types/hello-world-method';

const strategy = isStrategy('leastbusy') ? 'leastbusy' : strategies.leastbusy;

void (async function MAIN({ threads }: { threads: number }) {
  console.log(`at: MAIN from ${__filename}`);
  const workerPool = new RpcWorkerPool(null, threads, strategy);
  await delay();
  const from = 10;
  const to = 10;
  const testRequests: number[] = range(from, to);
  const delaysAndLoads: ArgsTuple = [
    '10000',
    '10000',
    '5',
    '5',
    '0',
    '0',
    'true',
    'true',
    `range(${from}, ${to})`,
    `{ threads(workers): ${threads} }`,
    'command_name: hello-world',
  ];

  const helloWorldRpcRequestTakesParameters =
    rpcRequestMethodHandler<ArgsTuple>('hello-world');

  const helloWorldRequestTakesID =
    helloWorldRpcRequestTakesParameters<ArgsTuple>(delaysAndLoads);
  const helloWorldWorkerRpc = async (i: number) => {
    const $ = workerPool.execRpc<HelloWorldWorkerResultRpc>(
      helloWorldRequestTakesID(i)
    );
    await $;
    console.log(
      '\x1b[33mReceived back from worker @helloWorldWorkerResult→\x1b[0m'
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
})({ threads: 1 });
