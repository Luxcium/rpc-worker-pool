#!/usr/bin/env node
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
'use strict';

import { connect, Socket } from 'node:net';

import chalk from 'chalk';
import { RpcWorkerPool } from './server/RpcWorkerPool';
import { Strategies } from './server/utils';

// ## TYPES & INTERFACES
interface JsonRpcRequest {
  jsonrpc: string;
  id: string | number;
  command_name: string;
  args: any[];
}

interface JsonRpcResponse {
  jsonrpc: string;
  id: string | number;
  result?: any;
  error?: string;
  pid?: string;
  performance?: number;
}

// ## DEFAULTS VALUE
const VERBOSE = true;
const ENDPOINT = '0.0.0.0';
const PORT = '7010';
const THREADS = 0;
const STRATEGY: Strategies = 'roundrobin';

// ## WILL PREFER ENV IN DOCKER CONTAINER
const endpointEnv = process.env['ACTOR_ENDPOINT'];
const portEnv = process.env['ACTOR_PORT'];
const threadsEnv = process.env['ACTOR_THREADS'];
const strategyEnv = process.env['ACTOR_STRATEGY'] as Strategies;

// ## WILL PREFER ARGV WHEN COMMAND LINE INVOCATION
const [_, __, connecParam, threadsParam, strategyParam] = process.argv;
const [endpointParam, portParam] = (connecParam || '').split(':');

// ## WILL SET PRIORITY
const inDocker = (isInDocker: boolean) => (e: any, a: any) =>
  isInDocker ? e || a : a || e;
const priority = inDocker('true' === process.env['RUNNING_IN_DOCKER']);

// ## WILL DEFINE PRIORITY
const define = (def: any) => (env: any, arg: any) => priority(env, arg) || def;
const defEndPoint = define(ENDPOINT);
const defPort = define(PORT);
const defThreads = define(THREADS);
const defStrategy = define(STRATEGY);

// ## WILL DEFINE VALUES
const actorEndpoint = defEndPoint(endpointEnv, endpointParam);
const actorPort = defPort(portEnv, portParam);
const threads = Number(defThreads(threadsEnv, threadsParam));
const strategy = defStrategy(strategyEnv, strategyParam) as Strategies;

// ## WILL SET DEFINED STRATEGY
const strategies: Record<string, Strategies> = {
  roundrobin: 'roundrobin',
  random: 'random',
  leastbusy: 'leastbusy',
};
const myStrategies: Strategies = strategies[strategy] || STRATEGY;

// ## WILL CREATE WORKER POOL INSTANCE
const workerPool = new RpcWorkerPool(threads, myStrategies, VERBOSE);

// ## WILL TRY TO CONNECT
console.log('Will try to connect', `${actorEndpoint}:${actorPort}`);
let upstreamSocket: Socket | null = connect(
  Number(actorPort),
  actorEndpoint,
  () => {
    console.log(
      `  > Actor pool connected to server at ${actorEndpoint}:${actorPort}`
    );
  }
);

// ## LISTEN FOR ERRORS
const handleSocketError = (error: Error) => {
  console.error('Socket error:', error);
  if (upstreamSocket) {
    upstreamSocket.destroy();
    upstreamSocket = null;
  }
  setTimeout(() => {
    console.log('Attempting to reconnect...');
    upstreamSocket = connect(Number(actorPort), actorEndpoint, () => {
      console.log(
        `  > Actor pool reconnected to server at ${actorEndpoint}:${actorPort}`
      );
    });
    addSocketListeners(upstreamSocket);
  }, 5000);
};

// ## LISTEN FOR DATA
let lastDataString = '';
let actorUnit = 0;
const handleSocketData = (rawData: Buffer) => {
  const dataStrings = String(rawData).split('\0\n\0');

  if (lastDataString.length > 0) {
    dataStrings[0] = lastDataString + dataStrings[0];
  }
  lastDataString = dataStrings.pop() || '';

  dataStrings.forEach(async chunk => {
    try {
      const data: JsonRpcRequest = JSON.parse(chunk);
      const timeBefore = performance.now();
      const result = await workerPool.exec(
        data.command_name,
        Number(data.id),
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
          pid: `actor(${++actorUnit}) at process: ${process.pid}`,
        },
        `performance: ${chalk.yellow(time)} ms`
      );

      const jsonRpcMessage: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: data.id,
        result,
        pid: `actor(${actorUnit}) at process: ${process.pid}`,
        performance: delay,
      };

      if (upstreamSocket && !upstreamSocket.destroyed) {
        upstreamSocket.write(`${JSON.stringify(jsonRpcMessage)}\0\n\0`);
      }
    } catch (error) {
      console.error('Failed to process data:', error);
      let id = 'unknown';
      try {
        const parsedChunk = JSON.parse(chunk);
        id = parsedChunk.id;
      } catch {}
      const jsonRpcError: JsonRpcResponse = {
        jsonrpc: '2.0',
        id,
        error: 'Failed to process request',
        pid: `actor(${actorUnit}) at process: ${process.pid}`,
      };
      if (upstreamSocket && !upstreamSocket.destroyed) {
        upstreamSocket.write(`${JSON.stringify(jsonRpcError)}\0\n\0`);
      }
    }
  });
};

// ## LISTEN FOR CONNECTION END
const handleSocketEnd = () => {
  console.log(
    `  > Disconnected from actor pool at ${actorEndpoint}:${actorPort}`
  );
  if (upstreamSocket) {
    upstreamSocket.destroy();
    upstreamSocket = null;
  }
  setTimeout(() => {
    console.log('Attempting to reconnect...');
    upstreamSocket = connect(Number(actorPort), actorEndpoint, () => {
      console.log(
        `  > Actor pool reconnected to server at ${actorEndpoint}:${actorPort}`
      );
    });
    addSocketListeners(upstreamSocket);
  }, 5000);
};

const addSocketListeners = (socket: Socket) => {
  socket.on('error', handleSocketError);
  socket.on('data', handleSocketData);
  socket.on('end', handleSocketEnd);
};

addSocketListeners(upstreamSocket);
