#!/usr/bin/env node
import chalk from 'chalk';
import { existsSync } from 'node:fs';
import { createServer as createHTTP_Server, ServerResponse } from 'node:http';
import { createServer as createTCP_Server } from 'node:net';
import { join } from 'node:path';
import { isStrategy, strategies } from './commands';
import { RpcWorkerPool } from './server/RpcWorkerPool';

const VERBOSE = false;

// ## DEFAULTS VALUE ―――――――――――――――――――――――――――――――――――――――――――――――――
const PORT = '7010';
const HTTP_PORT = '8010';
const ENDPOINT = '0.0.0.0';
const HTTP_ENDPOINT = '0.0.0.0';
const THREADS = 4;
const STRATEGY = 'roundrobin';
const SCRIPT_FILE_URI = join(
  `${__dirname}/worker.${existsSync(`${__dirname}/worker.ts`) ? 'ts' : 'js'}`
);

// ## WILL PREFRE ENV IN DOCKER CONTAINER ――――――――――――――――――――――――――――
const httpEndpointEnv = process.env['HTTP_ENDPOINT'];
const httpPortEnv = process.env['HTTP_PORT'];
const endpointEnv = process.env['ACTOR_ENDPOINT'];
const portEnv = process.env['ACTOR_PORT'];
const threadsEnv = process.env['ACTOR_THREADS'];
const strategyEnv = process.env['ACTOR_STRATEGY'];
const scriptFileEnv = process.env['SCRIPT_FILE_URI'];

// ## WILL PREFRE ARGV WHEN COMMAND LINE INVOQUATION ―――――――――――――――――
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

// ## WILL SET PRIORRITY ―――――――――――――――――――――――――――――――――――――――――――――
const inDocker = (isInDocker: boolean) => (e: string, a: string) =>
  isInDocker ? e || a : a || e;
const priority = inDocker(process.env['RUNNING_IN_DOCKER'] === 'true');

// ## WILL DEFINE PRIORRITY ――――――――――――――――――――――――――――――――――――――――――
const define = (def: any) => (env: any, arg: any) => priority(env, arg) || def;
const defHttpEndPoint = define(HTTP_ENDPOINT);
const defHttpPort = define(HTTP_PORT);
const defEndPoint = define(ENDPOINT);
const defPort = define(PORT);
const defThreads = define(THREADS);
const defStrategy = define(STRATEGY);
const defScriptFileUri = define(SCRIPT_FILE_URI);

// ## WILL DEFINE VALUES ―――――――――――――――――――――――――――――――――――――――――――――
const httpEndpoint = defHttpEndPoint(httpEndpointEnv, httpEndpointParam);
const httpPort = defHttpPort(httpPortEnv, httpPortParam);
const actorEndpoint = defEndPoint(endpointEnv, endpointParam);
const actorPort = defPort(portEnv, portParam);
const threads = Number(defThreads(threadsEnv, threadsParam));
const strategy_ = String(defStrategy(strategyEnv, strategyParam));
const strategy = isStrategy(strategy_) ? strategy_ : strategies.roundrobin;
const scriptFileUri = defScriptFileUri(scriptFileEnv, scriptFileParam);

// ## WILL CREATE WORKER POOL INSTANCE ―――――――――――――――――――――――――――――――
const workerPool = new RpcWorkerPool(scriptFileUri, threads, strategy, VERBOSE);

/**
 * The ID of the next message.
 */
const elementCounter = { messageSeq: 0, actorTracking: 0 };
/**
 * A collection of actor handlers.
 */
const actorSet = new Set();
/**
 * A map of message IDs to HTTP responses.
 */
const messageMapping = new Map<number, ServerResponse>();

// ++ HTTP_Server ----------------------------------------------------

/**
 * The HTTP Server Handler for incoming HTTP requests. This handler will
 * choose a random actor and send the request to it. The actor will
 * respond to the client via the TCP Server. The HTTP Server Handler
 * will wait for the response from the TCP Server and send it to the
 * client.
 */
const HTTP_Server = createHTTP_Server((req, res): any => {
  try {
    elementCounter.messageSeq++;

    // End if there are no actors, respond with an error message
    if (actorSet.size === 0) {
      const reason = 'EMPTY ACTOR POOL';
      const description = 'No actors available to handle requests.';
      return error503(res, reason, description);
    }

    // Select a random actor to handle the request
    const actor: any = randomActor();

    // Store the response object with the message ID for later use
    void messageMapping.set(elementCounter.messageSeq, res);

    // Extract the command name, query string, and fragment identifier from the URL
    const fullUrl = new URL(req?.url || '', `http:${'//' + req.headers.host}`);
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
        id: elementCounter.messageSeq,
        command_name,
        args,
        queryString,
        fragmentIdentifier,
      });
    } else if (destination === 'server') {
      // Remove and store the first segment as the command name
      const command_name = pathSegments.shift();
      // The remaining segments are the arguments
      const args = pathSegments;
      // Get the query string
      const queryString = fullUrl.search;
      // Get the fragment identifier
      const fragmentIdentifier = fullUrl.hash;
      error400(
        res,
        `${command_name}`,
        `fullArgs: ${fullArgs}, args: ${args}, queryString: ${queryString}, fragmentIdentifier: ${fragmentIdentifier}`
      );
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
    return error500(res);
  }
});

HTTP_Server.listen(Number(httpPort), httpEndpoint, () => {
  console.info(
    '\n\n> ' +
      chalk.green('web:  ') +
      chalk.yellow(`http:\/\/${httpEndpoint}`) +
      ':' +
      chalk.magenta(`${httpPort}`)
  );
});

// ++ TCP_Server -----------------------------------------------------
/**
 * The TCP Server Handler for incoming TCP requests. This handler will
 * wait for the actor response and send it to the HTTP Server Handler.
 * The HTTP Server Handler will wait for the response from the TCP
 * Server and send it to the client.
 */
void createTCP_Server;
void actorEndpoint;
void actorPort;
// const TCP_Server = createTCP_Server(tcp_client => {
//   // The handler function is used to send responses back to this TCP client
//   const handler = (data: any) =>
//     tcp_client.write(JSON.stringify(data) + '\0\n\0'); // <1>

//   // Add the handler function to the actor pool
//   void actorSet.add(handler);
//   // Log the current size of the actor pool
//   void console.info('actor pool connected', actorSet.size);

//   // Remove the handler function from the actor pool when the client disconnects
//   void tcp_client.on('end', () => {
//     void actorSet.delete(handler); // <2>
//     // Log the current size of the actor pool
//     void console.info('actor pool disconnected', actorSet.size);
//   });

//   // Handle incoming data from the TCP client
//   void tcp_client.on('data', raw_data => {
//     // Split the incoming data by the defined delimiter and remove the last (empty) null, new line, null.
//     void String(raw_data)
//       .split('\0\n\0')
//       .slice(0, -1) // Remove the last (empty) null, new line, null.
//       .forEach(chunk => {
//         // Parse the incoming data as a JSON object
//         const data = JSON.parse(chunk);
//         // Retrieve the HTTP response object associated with the message ID
//         const reply = JSON.stringify(data).replaceAll('\0', '');

//         response(data, reply);
//       });
//   });
// });

// TCP_Server.listen(Number(actorPort), actorEndpoint, () => {
//   console.info(
//     '> ' +
//       chalk.green('actor: ') +
//       chalk.yellow(`tcp:\/\/${actorEndpoint}`) +
//       ':' +
//       chalk.magenta(`${actorPort}`) +
//       '\n\n\n\n'
//   );
// });

// ++ actors.add -----------------------------------------------------
// Add an actor handler to the actors set.

actorSet.add(async (data: any) => {
  try {
    // Executor of the worker from pool.
    const timeBefore = performance.now();
    const result = await workerPool.exec(
      data.command_name, // The name of the command to execute.
      data.id, // The ID of the incoming request.
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
      id: data.id,
      result,
    };
    const metaData = {
      jsonrpc: '2.0',
      id: data.id,
      pid: process.pid,
      actorTracking: elementCounter.actorTracking,
      performance: delay,
      referenceString: `${dateNow}:${data.id}@${process.pid}:${elementCounter.actorTracking}:${time}ms`,
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
    response(data, httpReply);
  } catch (error) {
    console.error(error);
  }
});
// ++ randomActor() --------------------------------------------------
/**
 * Returns a randomly selected actor handler.
 * @returns An actor handler from the actors collection.
 */
function randomActor() {
  const pool = [...actorSet];
  return pool[Math.floor(Math.random() * pool.length)];
}

function serverResponse(res: ServerResponse) {
  return (
    statusCode: number,
    statusMessage: string,
    ContentType: string
  ) /* => (reply: string= statusMessage) */ => {
    res.statusCode = statusCode;
    res.statusMessage = statusMessage;
    return res.writeHead(statusCode, statusMessage, {
      'Content-Type': ContentType,
    });
  };
}

function errorHttp(statusCode: number, statusMessage: string) {
  return (res: ServerResponse, reason: string = '', description: string) => {
    const writeHead = serverResponse(res);
    const message = `${statusMessage}${reason ? ': ' + reason : ''}`;
    const warning = `ERROR[${statusCode}]: ${message}`;
    console.warn(warning);
    const reply = writeHead(statusCode, message, 'application/json');
    reply.end({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32000,
        message,
        data: { warning, description },
      },
    });
    console.warn(description);
    return reply;
  };
}
function error400(
  res: ServerResponse,
  reason: string = '',
  description: string
) {
  const reply = errorHttp(400, 'Bad Request');
  return reply(res, reason, description);
}
function error503(
  res: ServerResponse,
  reason: string = '',
  description: string
) {
  const reply = errorHttp(503, 'Service Unavailable');
  return reply(res, reason, description);
}
function error500(
  res: ServerResponse,
  reason: string = '',
  description: string = ''
) {
  const reply = errorHttp(500, 'Internal Server Error');
  return reply(res, reason, description);
}
function response(data: any, reply: string) {
  // HACK: Skiped null check may be not assignable to parameter ------
  const writeHead = serverResponse(messageMapping.get(data.id)!);

  try {
    const res = writeHead(200, 'Success', 'application/json');
    res.end(reply.replaceAll('\0', '').replaceAll('\n', ''));
  } catch (error) {
    console.error(error);
    const res = writeHead(500, 'Internal Server Error', 'text/plain');
    res.end('Internal Server Error');
  }
  return messageMapping.delete(data.id);
}
/* **************************************************************** */
/*                                                                  */
/*  MIT LICENSE                                                     */
/*                                                                  */
/*  Copyright © 2021-2022 Benjamin Vincent Kasapoglu (Luxcium)      */
/*                                                                  */
/*  NOTICE:                                                         */
/*  O’Reilly Online Learning                                        */
/*                                                                  */
/*  Title: “Multithreaded JavaScript”                               */
/*  Author: “by Thomas Hunter II and Bryan English”                 */
/*  Publisher: “O’Reilly”                                           */
/*  Copyright: “© 2022 Thomas Hunter II and Bryan English”          */
/*  ISBN: “978-1-098-10443-6.”                                      */
/*                                                                  */
/*  Using Code Examples                                             */
/*  Supplemental material (code examples, exercises, etc.)          */
/*  is available for download at                                    */
/*  https://github.com/MultithreadedJSBook/code-samples.            */
/*                                                                  */
/*  In general, if example code is offered with this book, you may  */
/*  use it in your programs and documentation. You do not need to   */
/*  contact us for permission unless you’re reproducing a           */
/*  significant portion of the code. For example, writing a         */
/*  program that uses several chunks of code from this book does    */
/*  not require permission. Selling or distributing examples from   */
/*  O’Reilly books does require permission. Answering a question by */
/*  citing this book and quoting example code does not require      */
/*  permission. Incorporating a significant amount of example code  */
/*  from this book into your product’s documentation does require   */
/*  permission.                                                     */
/*                                                                  */
/*  If you feel your use of code examples falls outside fair use or */
/*  the permission given above, feel free to contact us at          */
/*  permissions@oreilly.com.                                        */
/*                                                                  */
/* **************************************************************** */

// // Extract the command name and arguments from the URL
// const splitedUrl = (req?.url || '').split('/');
// const command_name = splitedUrl.slice(1, 2).pop();

// // Send the command and arguments to the selected actor
// actor({
//   id: elementCounter.messageSeq,
//   command_name,
//   args: [...splitedUrl.slice(2)],
// });
