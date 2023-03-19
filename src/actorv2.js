#!/usr/bin/env node
'use strict';
import chalk from 'chalk';
import { connect } from 'net';
// import { Strategies } from './consts';
import { RpcWorkerPool } from './RpcWorkerPool';

const workerScriptFileUri = `${__dirname}/worker.js`;

const [, , host] = process.argv;
const [hostname, port] = host.split(':');

const Strategies = {
  roundrobin: 'roundrobin',
  random: 'random',
  leastbusy: 'leastbusy',
};

// ++ ----------------------------------------------------------------
console.log('Will try to connect', host);
const upstreamSocket = connect(Number(port), hostname, () => {
  console.log('  > Actor pool connected to server!');
});

void upstreamSocket.on('error', error => {
  console.error(error);
});

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
      const result = await getWorker().exec(
        data.command_name,
        `${data.id}`,
        ...data.args
      );
      const timeAfter = performance.now();
      const delay = timeAfter - timeBefore;
      const time = Math.round(delay * 100) / 100;

      // console.log('remote.actors.add', {
      //   id: data.id,
      //   performance: timeAfter - timeBefore,
      //   pid: 'actor:' + process.pid,
      // });
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
        performance: delay,
        pid: 'actor:' + process.pid,
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

void upstreamSocket.on('end', () => {
  console.log('  >', 'disconnect from server');
});
// let last_data_string = '';
// let actor_id = 0;
// void upstreamSocket.on('data', raw_data => {
//   // console.log('raw_data:', String(raw_data));

//   const data_string = String(raw_data).split('\0\n\0');
//   last_data_string = data_string.slice(-1)[0];

//   data_string.slice(0, -1).forEach(async chunk => {
//     try {
//       if (last_data_string.length > 0) {
//         console.error(
//           '\n\n\nlast_data_string.length > 0',
//           last_data_string,
//           '\n\n\n'
//         );
//         throw new Error(
//           "String(raw_data).split('\0\n\0') ERROR: last_data_string.length > 0"
//         );
//       }

//       // BUG:~ Must add last non empty chunk first prior to the next chunk
//       const data = JSON.parse(chunk);
//       const timeBefore = performance.now();
//       const result = await getWorker().exec(
//         data.command_name,
//         `${data.id}`,
//         ...data.args
//       );
//       const timeAfter = performance.now();
//       const delay = timeAfter - timeBefore;
//       const time = Math.round(delay * 100) / 100;

//       // console.log('remote.actors.add', {
//       //   id: data.id,
//       //   performance: timeAfter - timeBefore,
//       //   pid: 'actor:' + process.pid,
//       // });
//       console.log(
//         'remote.actors.add',
//         {
//           jsonrpc: '2.0',
//           id: data.id,
//           pid: `actor(${++actor_id}) at process: ${process.pid}`,
//         },
//         'performance: ' + chalk.yellow(time) + ' ms'
//       );
//       const jsonRpcMessage = {
//         jsonrpc: '2.0',
//         id: data.id,
//         result,
//         performance: delay,
//         pid: 'actor:' + process.pid,
//       };

//       void upstreamSocket.write(JSON.stringify(jsonRpcMessage) + '\0\n\0');
//     } catch (err) {
//       // const jsonRpcMessage = {
//       //   jsonrpc: '2.0',
//       //   id: data.id,
//       //   error: { err },
//       //   pid: 'actor:' + process.pid,
//       // };
//       console.error(err);
//       // void upstreamSocket.write(JSON.stringify(jsonRpcMessage) + '\0\n\0');
//     }
//   });
// });

function getWorker() {
  return new RpcWorkerPool(workerScriptFileUri, 1, Strategies.random);
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
