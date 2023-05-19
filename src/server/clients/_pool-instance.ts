import { delay, range } from '@luxcium/tools';
import chalk from 'chalk';
import { baseRpcRequest } from '../../API/RPC-serialise';
import RpcWorkerPool from '../RpcWorkerPool';
import { ArgsTuple, HelloWorldWorkerResultRpc } from '../types';
import { isStrategy, strategies } from '../utils';

const STRATEGY = 'roundrobin'; // leastbusy

// const threads = Number(THREADS);
const strategy_ = String(STRATEGY);
const strategy = isStrategy(strategy_) ? strategy_ : strategies.roundrobin;

void (async function MAIN({ threads }: { threads: number }) {
  console.log(`at: MAIN from ${__filename}`);
  const workerPool = new RpcWorkerPool(null, threads, strategy);
  await delay();
  // Range of tests:
  // for example 20 requests when set to range down from 30 to 10.
  const from = 10;
  const to = 89;
  const testRequests: number[] = range(from, to);

  // args value will echo back those values, first 2 are for delay
  // second 2 are for heavyTask and other ar only as information and
  // will be echoed back from the hellow world test function.
  // double 0 means no-op.

  const delaysAndLoads: ArgsTuple = [
    '0',
    '0',
    '5440',
    '5440',
    '0',
    '0',
    'true',
    `range(${from}, ${to})`,
    `{ threads(workers): ${threads} }`,
    'command_name: hello-world',
  ];
  // const jsonrpc = '2.0';
  // const method = 'hello-world';
  // const params = delaysAndLoads;

  const helloWorldRpcRequest = baseRpcRequest('hello-world');

  const helloWorldRequest = helloWorldRpcRequest(delaysAndLoads);
  // const
  // hello world worker command method is a command taht can take
  // lower and upper bounds to do random delays in miliseconds and random
  // loads in dimentionless factor (the higher the factor the higher the : Promise<HelloWorldWorkerResult>
  // load)
  const helloWorldWorkerRpc = async (i: number) => {
    // payload $ is a Promise that will resolve or reject into a Json RPC
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

  const helloWorldWorker = async (i: number) => {
    const $: Promise<HelloWorldWorkerResultRpc> = workerPool.exec(
      'hello-world',
      i,
      ...delaysAndLoads
    );
    await $;
    console.log(
      chalk.yellow('Received back from worker @helloWorldWorkerResult→')
    );
    console.dir(
      {
        ['@helloWorldWorkerResult→']: $,
      },
      { colors: true, depth: 10, compact: true }
    );
    return $;
  };
  void helloWorldWorker;
  const allresults = Promise.all(testRequests.map(helloWorldWorkerRpc));
  await allresults;
  return process.exit(0);
})({ threads: 20 });
