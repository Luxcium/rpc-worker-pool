#!/usr/bin/env node
// src/server/server.ts
import chalk from 'chalk';

import type { ServerResponse } from 'node:http';
import { createServer as createHTTP_Server } from 'node:http';
import { normalize } from 'node:path/posix';

import type {
  IArgsConfigs,
  IDefaultsConfigs,
  IEnvConfigs,
  IPriorities,
} from 'src/server/configs/types';
import {
  errorHttp,
  getTcpServer,
  isStrategy,
  response,
  serverResponse,
  strategies,
} from 'src/server/utils';
import RpcWorkerPool from './RpcWorkerPool';

const { error400, error500, error503 } = errorHttp;

// ## WILL PREFRE ARGV WHEN COMMAND LINE INVOQUATION ―――――――――――――――――
export function getArgvConfigs(): IArgsConfigs {
  const [
    argv0,
    argv1,
    httpConnParam,
    connecParam,
    threadsParam,
    strategyParam,
    scriptFilePath,
  ] = process.argv;
  const [httpEndpointParam, httpPortParam] = (httpConnParam || '').split(':');
  const [endpointParam, portParam] = (connecParam || '').split(':');
  return {
    argv0,
    argv1,
    httpConnParam,
    connecParam,
    threadsParam,
    strategyParam,
    scriptFilePath,
    splits: {
      httpEndpointParam,
      httpPortParam,
      endpointParam,
      portParam,
    },
  };
}

export function getConfigs({
  HTTP_ENDPOINT,
  HTTP_PORT,
  ENDPOINT,
  PORT,
  THREADS,
  STRATEGY,
}: IDefaultsConfigs): IPriorities {
  const env = getEnvConfigs();
  const args = getArgvConfigs();
  const { httpEndpointParam, httpPortParam, endpointParam, portParam } =
    args.splits;
  const inDocker =
    (isInDocker: boolean) =>
    <T>(e?: T, a?: T) =>
      isInDocker ? (e ?? a) : (a ?? e);
  const priority = inDocker(env.runInDockerFlag);

  // ## WILL DEFINE PRIORRITY ――――――――――――――――――――――――――――――――――――――――――
  const define =
    <T>(defaultValue: T | string) =>
    (env?: T | string, arg?: T | string) =>
      priority(env, arg) ?? defaultValue;

  const defHttpEndPoint = define(HTTP_ENDPOINT);
  const defHttpPort = define(HTTP_PORT);
  const defEndPoint = define(ENDPOINT);
  const defPort = define(PORT);
  const defThreads = define(THREADS);
  const defStrategy = define(STRATEGY);

  const httpEndpoint = defHttpEndPoint(env.httpEndpointEnv, httpEndpointParam);
  const httpPort = defHttpPort(env.httpPortEnv, httpPortParam);
  const actorEndpoint = defEndPoint(env.endpointEnv, endpointParam);
  const actorPort = defPort(env.portEnv, portParam);
  const threads = Number(defThreads(`${env.threadsEnv}`, args.threadsParam));
  const strategy_ = String(defStrategy(env.strategyEnv, args.strategyParam));
  const strategy = isStrategy(strategy_) ? strategy_ : strategies.roundrobin;

  return {
    httpEndpoint,
    httpPort,
    actorEndpoint,
    actorPort,
    threads,
    strategy_,
    strategy,
    runInDocker: env.runInDockerFlag,
  };
}
export const priorities = getConfigs({
  HTTP_ENDPOINT: '0.0.0.0',
  HTTP_PORT: '8010',
  ENDPOINT: '0.0.0.0',
  PORT: '7010',
  THREADS: 4,
  STRATEGY: 'roundrobin',
});

export function getEnvConfigs(): IEnvConfigs {
  return {
    httpEndpointEnv: process.env['HTTP_ENDPOINT'] ?? '',
    httpPortEnv: process.env['HTTP_PORT'] ?? '',
    endpointEnv: process.env['ACTOR_ENDPOINT'] ?? '',
    portEnv: process.env['ACTOR_PORT'] ?? '',
    threadsEnv: Number.parseInt(`${process.env['ACTOR_THREADS']}`) || 0,
    strategyEnv: process.env['ACTOR_STRATEGY'] ?? '',
    scriptFileEnv: process.env['SCRIPT_FILE_URI'] ?? '',
    runInDockerFlag: 'true' === process.env['RUNNING_IN_DOCKER'],
  };
}
export function getDefaultConfigs(): IDefaultsConfigs {
  return {
    HTTP_ENDPOINT: '0.0.0.0',
    HTTP_PORT: '8010',
    ENDPOINT: '0.0.0.0',
    PORT: '7010',
    THREADS: 4,
    STRATEGY: 'roundrobin',
  };
}
const VERBOSE = false;
const defaultConf = getDefaultConfigs();
const env = getEnvConfigs();
const {
  httpEndpoint,
  httpPort,
  actorEndpoint,
  actorPort,
  threads,
  strategy_,
  strategy,
  runInDocker,
} = priorities;

export function getRelativePaths(path1: string, path2: string): string[] {
  const segments1 = normalize(path1).split('/');
  const segments2 = normalize(path2).split('/');
  const commonSegments = [];
  let i = 0;

  // find the common segments
  while (
    i < segments1.length &&
    i < segments2.length &&
    segments1[i] === segments2[i]
  ) {
    commonSegments.push(segments1[i]);
    i++;
  }

  // remove the common segments from both paths
  segments1.splice(0, commonSegments.length);
  segments2.splice(0, commonSegments.length);

  // if there are no remaining segments, return the file names
  if (0 === segments1.length && 0 === segments2.length) {
    return [
      `.${path1.slice(Math.max(0, path1.lastIndexOf('/')))}`,
      `.${path2.slice(Math.max(0, path2.lastIndexOf('/')))}`,
    ];
  }

  // create the relative paths
  let relative1 = `.${segments1.map(s => `/${s}`).join('')}`;
  let relative2 = `.${segments2.map(s => `/${s}`).join('')}`;

  // if there are no common segments, add the leading "/"
  if (0 === commonSegments.length) {
    relative1 = `.${path1.slice(0, Math.max(0, path1.indexOf(relative1)))}${relative1}`;
    relative2 = `.${path2.slice(0, Math.max(0, path2.indexOf(relative2)))}${relative2}`;
  }

  return [relative1, relative2];
}

// #region ++ CREATE POOL INSTANCES ---------------------------------↓
// ## WILL CREATE WORKER POOL INSTANCE ―――――――――――――――――――――――――――――――
function createWorkerPool(poolFactory: () => RpcWorkerPool) {
  return poolFactory();
}

const workerPool = createWorkerPool(() =>
  RpcWorkerPool.create(threads, strategy, VERBOSE)
);
const elementCounter = { messageSeq: 0, actorTracking: 0 };
const messageMap = new Map<number, ServerResponse>();
type Data = { messageSeq: number; command_name: string; args: string[] };
export const actorSet = new Set<(data: Data) => any>();
const primeActor = async (data: Data) => {
  try {
    // Executor of the worker from pool.
    const timeBefore = performance.now();
    const result = await workerPool.exec(
      data.command_name, // The name of the command to execute.
      data.messageSeq, // The ID of the incoming request.
      ...data.args // Any additional arguments for the command.
    );
    const timeAfter = performance.now();
    const delay = timeAfter - timeBefore;
    const time = Math.round(delay * 100) / 100;

    // Increment actor ID.
    elementCounter.actorTracking++;
    const dateNow = Date.now();

    const valueResult = {
      jsonrpc: '2.0',
      id: data.messageSeq,
      result,
    };
    const metaData = {
      jsonrpc: '2.0',
      id: data.messageSeq,
      pid: process.pid,
      actorTracking: elementCounter.actorTracking,
      performance: delay,
      referenceString: `${dateNow}:${data.messageSeq}@${process.pid}:${elementCounter.actorTracking}:${time}ms`,
      [`${Date.now()}`]: new Date(),
    };
    const httpReply = JSON.stringify({
      ...valueResult,
      ...metaData,
    });

    // Log performance information.
    console.log(
      'actors.add!',
      {
        actor: 'Local',
        localPid: process.pid,
        ...metaData,
      },
      `performance: ${chalk.yellow(time)} ms`
    );

    // End the http reponse with the message
    response(data, httpReply, messageMap);
    messageMap.delete(data.messageSeq);
  } catch (error) {
    console.error(`Error in primeActor: ${(error as Error).message}`);
  }
};
actorSet.add(primeActor);

/**
 * Returns a randomly selected actor handler.
 * @returns An actor handler from the actors collection.
 */
function randomActor() {
  const pool = [...actorSet];
  return pool[Math.floor(Math.random() * pool.length)];
}

// #endregion ++ CREATE POOL INSTANCES ------------------------------↑
// #region ++ HTTP_Server -------------------------------------------↓
/**
 * The HTTP Server Handler for incoming HTTP requests. This handler will
 * choose a random actor and send the request to it. The actor will
 * respond to the client via the TCP Server. The HTTP Server Handler
 * will wait for the response from the TCP Server and send it to the
 * client.
 */
const HTTP_Server = getHttpServer();

export function getHttpServer() {
  const HTTP_Server = createHTTP_Server((req, res): any => {
    elementCounter.messageSeq++;
    try {
      if (0 === actorSet.size) {
        const reason = 'EMPTY ACTOR POOL';
        const description = 'No actors available to handle requests.';
        return error503(res, reason, description);
      }

      // Select a random actor to handle the request
      // Store the response object with the message ID for later use
      const actor: (data: Data) => any = randomActor();
      messageMap.set(elementCounter.messageSeq, res);

      // Extract the command name, query string, and fragment identifier from the URL
      const fullUrl = new URL(req?.url ?? '', `http:\/\/${req.headers.host}`);

      // Split the path into segments and filter out empty strings
      const pathSegments = fullUrl.pathname.split('/').filter(Boolean);

      const destination = pathSegments.shift();
      const fullArgs = pathSegments;

      // Get the query string
      const queryString = fullUrl.search;

      // Get the fragment identifier
      const fragmentIdentifier = fullUrl.hash;
      if ('worker' === destination) {
        // Remove and store the first segment as the command name
        const command_name = pathSegments.shift();

        // The remaining segments are the arguments
        const args = pathSegments;

        // Send the command and arguments, along with the query string and fragment identifier, to the selected actor
        actor({
          messageSeq: elementCounter.messageSeq,
          command_name: command_name ?? '',
          args,

          // args: { args, queryString, fragmentIdentifier },
        });
      } else if ('server' === destination) {
        // Remove and store the first segment as the command name
        const command_name = pathSegments.shift();

        // The remaining segments are the arguments
        const args = pathSegments;

        // Get the query string
        // const queryString = fullUrl.search;
        // Get the fragment identifier
        // const fragmentIdentifier = fullUrl.hash;

        if ('infos' === command_name) {
          const paths = getRelativePaths(
            '/projects/monorepo-one/rpc-worker-pool/docker/dist/server/worker.js',
            '/projects/monorepo-one/rpc-worker-pool/docker/dist/server/server.js'
          );
          const definedValues = {
            httpEndpoint,
            httpPort,
            actorEndpoint,
            actorPort,
            threads,
            strategy_,
            strategy,
          };
          console.log('envs_', JSON.stringify({ ...env }), env);

          serverResponse(res)(200, 'OK', 'string').end(
            JSON.stringify({
              jsonrpc: '2.0',
              id: elementCounter.messageSeq,
              result: {
                paths,
                DEFAULTS: defaultConf,
                ENVs: env,
                ARGs: args,
                isInDocker: runInDocker,
                definedValues,
                pid: `server: ${process.pid}`,
              },
            })
          );
        } else {
          error400(
            res,
            `${command_name}`,
            `fullArgs: ${fullArgs}, args: ${args}, queryString: ${queryString}, fragmentIdentifier: ${fragmentIdentifier}`
          );
        }

        // sever would do something
      } else {
        error400(
          res,
          `UNIMPLEMENTD DESTINATION: ${destination}`,
          `fullArgs: ${fullArgs}, queryString: ${queryString}, fragmentIdentifier: ${fragmentIdentifier}`
        );
      }
    } catch (error) {
      console.error(`Error in HTTP Server: ${(error as Error).message}`);
      return error500(res, (error as Error).message);
    }
  });
  return HTTP_Server;
}

HTTP_Server.listen(Number(httpPort), httpEndpoint, () => {
  console.info(
    `\n\n> ${chalk.green('web:  ')}${chalk.yellow(
      // eslint-disable-next-line no-useless-escape
      `http:\/\/${httpEndpoint}`
    )}:${chalk.magenta(`${httpPort}`)}`
  );
});

// #endregion ++ HTTP_Server ----------------------------------------↑
// #region ++ TCP_Server --------------------------------------------↓
/**
 * The TCP Server Handler for incoming TCP requests. This handler will
 * wait for the actor response and send it to the HTTP Server Handler.
 * The HTTP Server Handler will wait for the response from the TCP
 * Server and send it to the client.
 */
const TCP_Server = getTcpServer(actorSet, response, messageMap);
TCP_Server.listen(Number(actorPort), actorEndpoint, () => {
  console.info(
    `> ${chalk.green('actor: ')}${chalk.yellow(
      // eslint-disable-next-line no-useless-escape
      `tcp:\/\/${actorEndpoint}`
    )}:${chalk.magenta(`${actorPort}`)}\n\n\n\n`
  );
});

// #endregion ++ TCP_Server -----------------------------------------↑
