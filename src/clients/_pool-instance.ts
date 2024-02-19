import { delay, range } from '@luxcium/tools';

import { rpcRequestMethodHandler } from '../server/API/baseRpcRequest';
import RpcWorkerPool from '../server/RpcWorkerPool';
import { isStrategy, strategies } from '../server/utils';
import type {
  ArgsObject,
  ArgsTuple,
  HelloWorldResult,
} from '../types/hello-world-method';

const { VERBOSE } = global;

const strategy = isStrategy('leastbusy') ? 'leastbusy' : strategies.leastbusy;

void (async function MAIN({ threads }: { threads: number }): Promise<never> {
  console.log(`at: MAIN from ${__filename}`);
  const workerPool = new RpcWorkerPool(threads, strategy, VERBOSE);
  await delay();
  const from = 10;
  const to = 20;
  const testRequests: number[] = range(from, to);

  // const d = delaysAndLoadsObject;
  const delaysAndLoads: ArgsTuple = createArgsTuple(from, to, threads);

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
    const $ = workerPool.execRpc<HelloWorldResult>(helloWorldTakesID(i));

    return payloadLogger($, VERBOSE);
  };

  await Promise.all(testRequests.map(helloWorldWorkerRpc));
  return process.exit(0);
})({ threads: 2 });

async function payloadLogger($: Promise<HelloWorldResult>, verbose = VERBOSE) {
  await $;
  verbose &&
    console.log(
      '\u001B[33mReceived back from worker @helloWorldWorkerResult→\u001B[0m'
    );
  verbose &&
    console.dir(
      {
        ['@helloWorldWorkerResult→']: await $,
      },
      { colors: true, depth: 10, compact: true }
    );
  return $;
}

function createArgsObject(
  from: number,
  to: number,
  threads: number
): ArgsObject {
  return {
    lowerBoundDelay_a: '1300',
    upperBoundDelay_a: '1300',
    lowerBoundHeavyTask: '100',
    upperBoundHeavyTask: '100',
    lowerBoundDelay_b: '0',
    upperBoundDelay_b: '0',
    awaited: 'true',
    delay: 'true',
    range: `range(${from}, ${to})`,
    threads: `{ threads(workers): ${threads} }`,
    commandName: 'command_name: hello-world',
  };
}

function createArgsTuple(from: number, to: number, threads: number): ArgsTuple {
  const d = createArgsObject(from, to, threads);
  return [
    d.lowerBoundDelay_a,
    d.upperBoundDelay_a,
    d.lowerBoundHeavyTask,
    d.upperBoundHeavyTask,
    d.lowerBoundDelay_b,
    d.upperBoundDelay_b,
    d.awaited,
    d.delay,
    d.range,
    d.threads,
    d.commandName,
  ];
}
export const filename = __filename;
