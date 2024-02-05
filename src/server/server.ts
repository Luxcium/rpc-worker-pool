#!/usr/bin/env node
import chalk from 'chalk';
import { createServer as createHTTP_Server, ServerResponse } from 'node:http';
import RpcWorkerPool from './RpcWorkerPool';
import { error400, error500, error503 } from './utils/errorHttp';
import { getRelativePaths } from './utils/getRelativePaths';
import { getTcpServer } from './utils/getTcpServer';
import { response } from './utils/response';
import { serverResponse } from './utils/serverResponse';
import { getEnvConfigs } from './configs/getEnvConfigs';
import { getDefaultConfigs } from './configs/getDefaultConfigs';
import { priorities } from './configs/priorities';

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
// #region ++ CREATE POOL INSTANCES ---------------------------------↓
// ## WILL CREATE WORKER POOL INSTANCE ―――――――――――――――――――――――――――――――
const workerPool = new RpcWorkerPool(null, threads, strategy, VERBOSE);
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
      [`${Date.now()}`]: Date(),
    };
    const httpReply = JSON.stringify({
      ...valueResult,
      ...metaData,
    });

    // Log performance information.
    void console.log(
      'actors.add!',
      {
        actor: 'Local',
        localPid: process.pid,
        ...metaData,
      },
      'performance: ' + chalk.yellow(time) + ' ms'
    );

    // End the http reponse with the message
    response(data, httpReply, messageMap);
  } catch (error) {
    console.error(error);
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
      if (actorSet.size === 0) {
        const reason = 'EMPTY ACTOR POOL';
        const description = 'No actors available to handle requests.';
        return error503(res, reason, description);
      }

      // Select a random actor to handle the request
      // Store the response object with the message ID for later use
      const actor: (data: Data) => any = randomActor();
      messageMap.set(elementCounter.messageSeq, res);

      // Extract the command name, query string, and fragment identifier from the URL
      const fullUrl = new URL(
        req?.url || '',
        `http:${'//' + req.headers.host}`
      );
      // Split the path into segments and filter out empty strings
      const pathSegments = fullUrl.pathname.split('/').filter(Boolean);

      const destination = pathSegments.shift();
      const fullArgs = pathSegments;
      // Get the query string
      const queryString = fullUrl.search;
      // Get the fragment identifier
      const fragmentIdentifier = fullUrl.hash;
      if (destination === 'worker') {
        // Remove and store the first segment as the command name
        const command_name = pathSegments.shift();
        // The remaining segments are the arguments
        const args = pathSegments;

        // Send the command and arguments, along with the query string and fragment identifier, to the selected actor
        actor({
          messageSeq: elementCounter.messageSeq,
          command_name: command_name || '',
          args,
          // args: { args, queryString, fragmentIdentifier },
        });
      } else if (destination === 'server') {
        // Remove and store the first segment as the command name
        const command_name = pathSegments.shift();
        // The remaining segments are the arguments
        const args = pathSegments;
        // Get the query string
        // const queryString = fullUrl.search;
        // Get the fragment identifier
        // const fragmentIdentifier = fullUrl.hash;

        if (command_name === 'infos') {
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
                pid: 'server: ' + process.pid,
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
      console.error(error);
      return error500(res, (error as any).message);
    }
  });
  return HTTP_Server;
}

HTTP_Server.listen(Number(httpPort), httpEndpoint, () => {
  console.info(
    '\n\n> ' +
      chalk.green('web:  ') +
      chalk.yellow(`http:\/\/${httpEndpoint}`) +
      ':' +
      chalk.magenta(`${httpPort}`)
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
    '> ' +
      chalk.green('actor: ') +
      chalk.yellow(`tcp:\/\/${actorEndpoint}`) +
      ':' +
      chalk.magenta(`${actorPort}`) +
      '\n\n\n\n'
  );
});
// #endregion ++ TCP_Server -----------------------------------------↑
