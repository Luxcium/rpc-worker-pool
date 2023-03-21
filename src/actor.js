#!/usr/bin/env node
'use strict';

import chalk from 'chalk';
import { existsSync } from 'node:fs';
import { connect } from 'node:net';
import { join } from 'node:path';
import { RpcWorkerPool } from './RpcWorkerPool';

// ## DEFAULTS VALUE ―――――――――――――――――――――――――――――――――――――――――――――――――
const VERBOSE = true;

const ENDPOINT = '0.0.0.0';
const PORT = '7010';
const THREADS = 0;
const STRATEGY = 'roundrobin';
const SCRIPT_FILE_URI = join(
  `${__dirname}/worker.${existsSync(`${__dirname}/worker.ts`) ? 'ts' : 'js'}`
);
// ## WILL PREFRE ENV IN DOCKER CONTAINER ――――――――――――――――――――――――――――
const endpointEnv = process.env.ACTOR_ENDPOINT;
const portEnv = process.env.ACTOR_PORT;
const threadsEnv = process.env.ACTOR_THREADS;
const strategyEnv = process.env.ACTOR_STRATEGY;
const scriptFileEnv = process.env.SCRIPT_FILE_URI;

// ## WILL PREFRE ARGV WHEN COMMAND LINE INVOQUATION ―――――――――――――――――
const [, , connecParam, threadsParam, strategyParam, scriptFileParam] =
  process.argv;
const [endpointParam, portParam] = (connecParam || '').split(':');

// ## WILL SET PRIORRITY ―――――――――――――――――――――――――――――――――――――――――――――
const inDocker = isInDocker => (e, a) => isInDocker ? e || a : a || e;
const priority = inDocker(process.env.RUNNING_IN_DOCKER === 'true');

// ## WILL DEFINE PRIORRITY ――――――――――――――――――――――――――――――――――――――――――
const define = def => (env, arg) => priority(env, arg) || def;
const defEndPoint = define(ENDPOINT);
const defPort = define(PORT);
const defThreads = define(THREADS);
const defStrategy = define(STRATEGY);
const defScriptFileUri = define(SCRIPT_FILE_URI);

// ## WILL DEFINE VALUES ―――――――――――――――――――――――――――――――――――――――――――――
const actorEndpoint = defEndPoint(endpointEnv, endpointParam);
const actorPort = defPort(portEnv, portParam);
const threads = Number(defThreads(threadsEnv, threadsParam));
const strategy = String(defStrategy(strategyEnv, strategyParam));
const scriptFileUri = defScriptFileUri(scriptFileEnv, scriptFileParam);

// ## WILL SET DEFINED STRATEGY ――――――――――――――――――――――――――――――――――――――
let myStrategies = '';
try {
  myStrategies = {
    roundrobin: 'roundrobin',
    random: 'random',
    leastbusy: 'leastbusy',
  }[strategy];
} catch {
  myStrategies = STRATEGY;
}

// ## WILL CREATE WORKER POOL INSTANCE ―――――――――――――――――――――――――――――――
const workerPool = new RpcWorkerPool(
  scriptFileUri,
  threads,
  myStrategies,
  VERBOSE
);

// ## WILL TRY TO CONNECT ――――――――――――――――――――――――――――――――――――――――――――
console.log('Will try to connect', actorEndpoint + ':' + actorPort);
const upstreamSocket = connect(Number(actorPort), actorEndpoint, () => {
  console.log(
    '  > Actor pool connected to server at ' + actorEndpoint + ':' + actorPort
  );
});

// ## LISTEN FOR ERRORS ――――――――――――――――――――――――――――――――――――――――――――――
void upstreamSocket.on('error', error => {
  console.error(error);
});

// ## LISTEN FOR DATA ――――――――――――――――――――――――――――――――――――――――――――――――
let last_data_string = '';
let actor_id = 0;
void upstreamSocket.on('data', raw_data => {
  // console.log('raw_data:', String(raw_data));

  const data_string = String(raw_data).split('\0\n\0');
  // last_data_string = data_string.slice(-1)[0];

  // data_string.slice(0, -1).forEach(async chunk => {
  if (last_data_string.length > 0) {
    data_string[0] = last_data_string + data_string[0];
  }
  last_data_string = data_string.pop();

  data_string.forEach(async chunk => {
    try {
      const data = JSON.parse(chunk);
      const timeBefore = performance.now();
      const result = await workerPool.exec(
        data.command_name,
        `${data.id}`,
        ...data.args
      );
      const timeAfter = performance.now();
      const delay = timeAfter - timeBefore;
      const time = Math.round(delay * 100) / 100;

      console.log(
        'remote.actors.add',
        {
          jsonrpc: '2.0',
          id: data.id,
          pid: `actor(${++actor_id}) at process: ${process.pid}`,
        },
        'performance: ' + chalk.yellow(time) + ' ms'
      );
      const jsonRpcMessage = {
        jsonrpc: '2.0',
        id: data.id,
        result,
        pid: `actor(${actor_id}) at process: ${process.pid}`,
        performance: delay,
      };

      void upstreamSocket.write(JSON.stringify(jsonRpcMessage) + '\0\n\0');
    } catch (err) {
      // const jsonRpcMessage = {
      //   jsonrpc: '2.0',
      //   id: data.id,
      //   error: { err },
      //   pid: 'actor:' + process.pid,
      // };
      console.error(err);
      // void upstreamSocket.write(JSON.stringify(jsonRpcMessage) + '\0\n\0');
    }
  });
});

// ## LISTEN FOR CONNECTION END ――――――――――――――――――――――――――――――――――――――
void upstreamSocket.on('end', () => {
  console.log(
    '  > Disconnected from actor pool at ' + actorEndpoint + ':' + actorPort
  );
});
// ## ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

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
