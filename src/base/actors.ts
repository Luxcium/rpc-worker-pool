// src/base/actors.ts
import chalk from 'chalk';
import { ServerResponse } from 'node:http';
import RpcWorkerPool from './RpcWorkerPool';
import { Data } from './types';
import { isStrategy, response, Strategies, strategies } from './utils';

// Global counters and collections
export const elementCounter = { messageSeq: 0, actorTracking: 0 };
export const messageMap = new Map<number, ServerResponse>();
export const actorSet = new Set<(data: Data) => any>();

/**
 * Creates a worker pool instance
 *
 * @param threads Number of threads to use
 * @param strategy Strategy for worker distribution
 * @param verbose Whether to enable verbose logging
 * @returns RpcWorkerPool instance
 */
export function createWorkerPool(
  threads: number,
  strategyName: string,
  verbose = false
): RpcWorkerPool {
  // Ensure strategy is valid
  const strategy: Strategies = isStrategy(strategyName)
    ? (strategyName as Strategies)
    : strategies.roundrobin;

  return RpcWorkerPool.create(threads, strategy, verbose);
}

/**
 * Primary actor function that processes a command through the worker pool
 * and sends the response back to the HTTP client
 *
 * @param data Command data to process
 * @param workerPool Worker pool instance to use
 */
export const primeActor = (workerPool: RpcWorkerPool) => async (data: Data) => {
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

    // End the http response with the message
    response(data, httpReply, messageMap);
    messageMap.delete(data.messageSeq);
  } catch (error) {
    console.error(`Error in primeActor: ${(error as Error).message}`);
  }
};

/**
 * Initialize the actor system with a worker pool
 *
 * @param threads Number of threads to use
 * @param strategy Strategy for worker distribution
 * @param verbose Whether to enable verbose logging
 * @returns The worker pool instance
 */
export function initializeActors(
  threads: number,
  strategyName: string,
  verbose = false
): RpcWorkerPool {
  // Create worker pool
  const workerPool = createWorkerPool(threads, strategyName, verbose);

  // Register the prime actor with the worker pool
  actorSet.add(primeActor(workerPool));

  return workerPool;
}

/**
 * Returns a randomly selected actor handler.
 * @returns An actor handler from the actors collection.
 */
export function randomActor() {
  const pool = [...actorSet];
  return pool[Math.floor(Math.random() * pool.length)];
}
