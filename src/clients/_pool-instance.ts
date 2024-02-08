import { delay, range } from '@luxcium/tools';

import { rpcRequestMethodHandler } from '../server/API/baseRpcRequest';
import RpcWorkerPool from '../server/RpcWorkerPool';
import { isStrategy, strategies } from '../server/utils';
import type {
  ArgsTuple,
  HelloWorldWorkerResultRpc,
} from '../types/hello-world-method';

const strategy = isStrategy('leastbusy') ? 'leastbusy' : strategies.leastbusy;

void (async function MAIN({ threads }: { threads: number }) {
  console.log(`at: MAIN from ${__filename}`);
  const workerPool = new RpcWorkerPool(null, threads, strategy);
  await delay();
  const from = 10;
  const to = 110;
  const testRequests: number[] = range(from, to);
  const delaysAndLoads: ArgsTuple = [
    '1300',
    '1300',
    '5',
    '5',
    '0',
    '0',
    'true',
    'true',
    `range(${from}, ${to})`,
    `{ threads(workers): ${threads} }`,
    'command_name: hello-world', // command_name
  ];
  // Create a rpc request by setting the method to be used by the worker
  const helloWorldTakesParameters =
    rpcRequestMethodHandler<ArgsTuple>('hello-world');

  // Create a rpc request by setting the parameters to be used by the worker
  const helloWorldTakesID =
    helloWorldTakesParameters<ArgsTuple>(delaysAndLoads);

  // Create a function wrapper for the worker which will recive a range
  // of IDs to the RPCRequest that will be run in range using the method
  // and parameters previously included to the RPCRequest.
  const helloWorldWorkerRpc = async (i: number) => {
    const $ = workerPool.execRpc<HelloWorldWorkerResultRpc>(
      helloWorldTakesID(i)
    );

    return payloadLogger($);
  };

  await Promise.all(testRequests.map(helloWorldWorkerRpc));
  return process.exit(0);
})({ threads: 1 });

async function payloadLogger($: Promise<HelloWorldWorkerResultRpc>) {
  await $;
  console.log(
    '\u001B[33mReceived back from worker @helloWorldWorkerResult→\u001B[0m'
  );
  console.dir(
    {
      ['@helloWorldWorkerResult→']: await $,
    },
    { colors: true, depth: 10, compact: true }
  );
  return $;
}
