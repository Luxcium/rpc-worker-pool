#!/usr/bin/env node
import chalk from 'chalk';
import { existsSync } from 'node:fs';
import { createServer as createHTTP_Server } from 'node:http';
import { createServer as createTCP_Server } from 'node:net';
import { isStrategy, strategies } from './commands';
import { RpcWorkerPool } from './server/RpcWorkerPool';

// ++ Initial Setup --------------------------------------------------
/**
 * A boolean indicating whether logging is enabled.
 */
const VERBOSE1 = true;

// Parse command line arguments
const [, , webConnection, actorConnection, threads_, strategy_] = process.argv;
const [webEndpoint, webPort] = (webConnection || '').split(':');
const [actorEndpoint, actorPort] = (actorConnection || '').split(':');
// const workerScriptFileUri = `${__dirname}/worker.ts`;
const workerScriptFileUri = `${__dirname}/worker.${
  existsSync(`${__dirname}/worker.ts`) ? 'ts' : 'js'
}`;
const threads = Number(threads_ || 0);
const strategy = isStrategy(strategy_) ? strategy_ : strategies.roundrobin;

// ++ new worker from RpcWorkerPool ----------------------------------
// Create a new instance of RpcWorkerPool to handle communication with worker threads.
const workerPool = new RpcWorkerPool(
  workerScriptFileUri, // The URI of the worker script file.
  threads, // The number of worker threads to spawn.
  strategy, // The strategy for handling incoming requests.
  VERBOSE1 // Whether or not to enable verbose output.
);

/**
 * The ID of the next message.
 */
const idCount = { messageSeq: 0, actorTracking: 0 };
/**
 * A collection of actor handlers.
 */
const actors = new Set();
/**
 * A map of message IDs to HTTP responses.
 */
const messages = new Map();
// ++ randomActor() --------------------------------------------------
/**
 * Returns a randomly selected actor handler.
 * @returns An actor handler from the actors collection.
 */
function randomActor() {
  const pool = [...actors];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ++ HTTP_Server ----------------------------------------------------
/**
 * The HTTP Server Handler for incoming HTTP requests. This handler will
 * choose a random actor and send the request to it. The actor will
 * respond to the client via the TCP Server. The HTTP Server Handler
 * will wait for the response from the TCP Server and send it to the
 * client.
 */
const HTTP_Server = createHTTP_Server((req, res): any => {
  idCount.messageSeq++;
  // If there are no actors, respond with an error message
  if (actors.size === 0) return res.end('ERROR: EMPTY ACTOR POOL');

  // Select a random actor to handle the request
  const actor: any = randomActor();

  // Store the response object with the message ID for later use
  void messages.set(idCount.messageSeq, res);

  // Extract the command name and arguments from the URL
  const splitedUrl = (req?.url || '').split('/');
  const command_name = splitedUrl.slice(1, 2).pop();

  // Send the command and arguments to the selected actor
  void actor({
    id: idCount.messageSeq,
    command_name,
    args: [...splitedUrl.slice(2)],
  });
});

// Start the HTTP server
void HTTP_Server.listen(Number(webPort), webEndpoint, () => {
  console.info(
    '\n\n> ' +
      chalk.green('web:  ') +
      chalk.yellow(`http:\/\/${webEndpoint}`) +
      ':' +
      chalk.magenta(`${webPort}`)
  );
});

// ++ TCP_Server -----------------------------------------------------
/**
 * The TCP Server Handler for incoming TCP requests. This handler will
 * wait for the actor response and send it to the HTTP Server Handler.
 * The HTTP Server Handler will wait for the response from the TCP
 * Server and send it to the client.
 */
const TCP_Server = createTCP_Server(tcp_client => {
  // The handler function is used to send responses back to this TCP client
  const handler = (data: any) =>
    tcp_client.write(JSON.stringify(data) + '\0\n\0'); // <1>

  // Add the handler function to the actor pool
  void actors.add(handler);
  // Log the current size of the actor pool
  void console.info('actor pool connected', actors.size);

  // Remove the handler function from the actor pool when the client disconnects
  void tcp_client.on('end', () => {
    void actors.delete(handler); // <2>
    // Log the current size of the actor pool
    void console.info('actor pool disconnected', actors.size);
  });

  // Handle incoming data from the TCP client
  void tcp_client.on('data', raw_data => {
    // Split the incoming data by the defined delimiter and remove the last (empty) null, new line, null.
    void String(raw_data)
      .split('\0\n\0')
      .slice(0, -1) // Remove the last (empty) null, new line, null.
      .forEach(chunk => {
        // Parse the incoming data as a JSON object
        const data = JSON.parse(chunk);
        // Retrieve the HTTP response object associated with the message ID
        const res = messages.get(data.id);

        // Send the response to the HTTP client
        void res.end(JSON.stringify(data) + '\0\n\0');
        // Remove the HTTP response object from the message map
        void messages.delete(data.id);
      });
  });
});

// ++ Start listening for incoming TCP connections -------------------
void TCP_Server.listen(Number(actorPort), actorEndpoint, () => {
  void console.info(
    '> ' +
      chalk.green('actor: ') +
      chalk.yellow(`tcp:\/\/${actorEndpoint}`) +
      ':' +
      chalk.magenta(`${actorPort}`) +
      '\n\n\n\n'
  );
});

// ++ actors.add -----------------------------------------------------
// Add an actor handler to the actors set.
void actors.add(async (data: any) => {
  try {
    // Executor of the worker from pool.
    const timeBefore = performance.now();
    const value = await workerPool.exec(
      data.command_name, // The name of the command to execute.
      data.id, // The ID of the incoming request.
      ...data.args // Any additional arguments for the command.
    );
    const timeAfter = performance.now();
    const delay = timeAfter - timeBefore;
    const time = Math.round(delay * 100) / 100;

    // Increment actor ID.
    idCount.actorTracking++;

    // Build reply object.
    const replyObject = {
      id: data.id,
      pid: `actor(${idCount.actorTracking}) at process: ${process.pid}`,
    };

    // Build reply string.
    const reply =
      JSON.stringify({
        jsonrpc: '2.0',
        value,
        ...replyObject,
        performance: delay,
      }) + '\0\n\0';

    // Log performance information.
    void console.log(
      'actors.add!',
      {
        jsonrpc: '2.0',
        ...replyObject,
      },
      'performance: ' + chalk.yellow(time) + ' ms'
    );

    // Send response back to HTTP server.
    void messages.get(data.id).end(reply);
    void messages.delete(data.id);
  } catch (error) {
    void console.error(error);
  }
});

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

/* **************************************************************** */
//
/*
%% ChatGPT Code Analysis

## Topic:
Refactoring and optimizing a Node.js server application.

## Context:
We have been discussing a Node.js server application and how to
optimize and refactor it for better performance, resilience,
robustness, and security. We have already made some changes to the
code, including using type annotations, removing let statements, and
adding object counters for message and actor IDs.

## Action items:
Use type annotations for function parameters, return values, and
variables to make the code more self-documenting.
Refactor the code to remove let statements and use object counters
instead.
Implement a load balancer in the RpcWorkerPool to distribute incoming
requests among worker threads.
Use performance.now() to measure the execution time of worker
functions.
Add error handling and logging to improve resilience and robustness.
Update comments and annotations to improve readability and
maintanability of the code.

## Key points:
Use type annotations to make the code more self-documenting and
easier to understand.
Refactor the code to use object counters instead of let statements.
Implement a load balancer in the RpcWorkerPool to distribute incoming
requests among worker threads for better performance.
Use performance.now() to measure the execution time of worker
functions and improve performance.
Add error handling and logging to improve resilience and robustness.
Update comments and annotations to improve readability and
maintainability of the code.

## Contextual information:
The application is a Node.js server that receives HTTP requests,
sends them to worker threads for processing, and returns the response
to the client.
The code has already been refactored to remove let statements and use
object counters instead.
The RpcWorkerPool is already using a load balancer to distribute
incoming requests among worker threads.
The application is being optimized for better performance,
resilience, robustness, and security.

## Next steps:
Continue to optimize the code for better performance, resilience,
robustness, and security.
Refactor the code to handle errors and log information for easier
debugging and maintenance.
Implement testing to ensure the code is working as expected.
Explore additional security measures, such as input validation and
authentication.
Keep comments and annotations up-to-date to improve maintainability.

Once you have the summary, please feel free to copy and paste this
summary into a new instance of ChatGPT so we can continue our
conversation where we left off.
******************************************************************* */
