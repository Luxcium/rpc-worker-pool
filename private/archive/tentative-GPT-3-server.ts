#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getStrategy, Strategies } from './commands';
import RpcWorkerPool from './RpcWorkerPool.gpt';

const VERBOSE = false;

const SERVER_ENDPOINT = '0.0.0.0';
const SERVER_PORT = '8010';
const ACTOR_ENDPOINT = '0.0.0.0';
const ACTOR_PORT = '7010';
const SCRIPT_FILE_URI = join(
  `${__dirname}/worker.${existsSync(`${__dirname}/worker.ts`) ? 'ts' : 'js'}`
);

function prioritizeValue(
  envVar: string | undefined,
  arg: string | undefined,
  defaultValue: string | number
): string | number {
  if (process.env['RUNNING_IN_DOCKER'] === 'true') {
    return envVar || arg || defaultValue;
  }
  return arg || envVar || defaultValue;
}

export function getConfig(strategie = 'roundrobin', threads = 4): ServerConfig {
  // Extract environment variables and command-line arguments
  const httpEndpointEnv = process.env['SERVER_ENDPOINT'];
  const httpPortEnv = process.env['SERVER_PORT'];
  const tcpEndpointEnv = process.env['ACTOR_ENDPOINT'];
  const tcpPortEnv = process.env['ACTOR_PORT'];
  const threadsEnv = process.env['THREADS'];
  const strategyEnv = process.env['STRATEGY'];
  const scriptFileEnv = process.env['SCRIPT_FILE_URI'];

  const [
    ,
    ,
    httpConnParam,
    connecParam,
    threadsParam,
    strategyParam,
    scriptFileParam,
  ] = process.argv;
  const [httpEndpointParam, httpPortParam] = (httpConnParam || '').split(':');
  const [endpointParam, portParam] = (connecParam || '').split(':');

  return {
    httpEndpoint: prioritizeValue(
      httpEndpointEnv,
      httpEndpointParam,
      SERVER_ENDPOINT
    ) as string,
    httpPort: prioritizeValue(
      httpPortEnv,
      httpPortParam,
      SERVER_PORT
    ) as string,
    tcpEndpoint: prioritizeValue(
      tcpEndpointEnv,
      endpointParam,
      ACTOR_ENDPOINT
    ) as string,
    tcpPort: prioritizeValue(tcpPortEnv, portParam, ACTOR_PORT) as string,
    threads: prioritizeValue(threadsEnv, threadsParam, threads) as number,
    strategy: getStrategy(
      prioritizeValue(strategyEnv, strategyParam, strategie) as string
    ),
    scriptFileUri: prioritizeValue(
      scriptFileEnv,
      scriptFileParam,
      SCRIPT_FILE_URI
    ) as string,
  };
}

export function createWorkerPool(config: Config): RpcWorkerPool {
  return new RpcWorkerPool(
    config.scriptFileUri,
    config.threads,
    config.strategy,
    VERBOSE
  );
}

export type HttpConfig = {
  httpEndpoint: string;
  httpPort: string;
};
export type TcpConfig = {
  tcpEndpoint: string;
  tcpPort: string;
};
type Config = {
  threads: number;
  strategy: Strategies;
  scriptFileUri: string;
};

export type ServerConfig = HttpConfig & TcpConfig & Config;
export type ActorConfig = TcpConfig & Config;

// export function getConfig_(
//   strategie = 'roundrobin',
//   threads = 4
// ): ServerConfig {
//   const httpEndpointEnv = process.env['SERVER_ENDPOINT'];
//   const httpPortEnv = process.env['SERVER_PORT'];
//   const tcpEndpointEnv = process.env['ACTOR_ENDPOINT'];
//   const tcpPortEnv = process.env['ACTOR_PORT'];
//   const threadsEnv = process.env['THREADS'];
//   const strategyEnv = process.env['STRATEGY'];
//   const scriptFileEnv = process.env['SCRIPT_FILE_URI'];

//   const [
//     ,
//     ,
//     httpConnParam,
//     connecParam,
//     threadsParam,
//     strategyParam,
//     scriptFileParam,
//   ] = process.argv;
//   const [httpEndpointParam, httpPortParam] = (httpConnParam || '').split(':');
//   const [endpointParam, portParam] = (connecParam || '').split(':');

//   const priority =
//     process.env['RUNNING_IN_DOCKER'] === 'true'
//       ? (e: string, a: string) => e || a
//       : (e: string, a: string) => a || e;

//   const defHttpEndPoint = (env: string, arg: string) =>
//     priority(env, arg) || SERVER_ENDPOINT;
//   const defHttpPort = (env: string, arg: string) =>
//     priority(env, arg) || SERVER_PORT;
//   const defEndPoint = (env: string, arg: string) =>
//     priority(env, arg) || ACTOR_ENDPOINT;
//   const defPort = (env: string, arg: string) =>
//     priority(env, arg) || ACTOR_PORT;
//   const defThreads = (env: string, arg: string) =>
//     priority(env, arg) ? Number(priority(env, arg)) : threads;
//   const defStrategy = (env: string, arg: string) =>
//     priority(env, arg) || strategie;
//   const defScriptFileUri = (env: string, arg: string) =>
//     priority(env, arg) || SCRIPT_FILE_URI;

//   return {
//     httpEndpoint: defHttpEndPoint(httpEndpointEnv || '', httpEndpointParam),
//     httpPort: defHttpPort(httpPortEnv || '', httpPortParam),
//     tcpEndpoint: defEndPoint(tcpEndpointEnv || '', endpointParam),
//     tcpPort: defPort(tcpPortEnv || '', portParam),
//     threads: defThreads(threadsEnv || '', threadsParam),
//     strategy: getStrategy(defStrategy(strategyEnv || '', strategyParam)),
//     scriptFileUri: defScriptFileUri(scriptFileEnv || '', scriptFileParam),
//   };
// }
