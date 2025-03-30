// src/base/utils.ts
import { ServerResponse } from 'node:http';
import { normalize } from 'node:path/posix';
import type { Data } from './types';

// -------------------- Strategy-related utilities --------------------
/**
 * Strategy constants for worker selection
 */
export const strategies = {
  roundrobin: 'roundrobin' as const,
  random: 'random' as const,
  leastbusy: 'leastbusy' as const,
};

export type Strategies = (typeof strategies)[keyof typeof strategies];

export const supportedStrategies = new Set<Strategies>([
  strategies.roundrobin,
  strategies.leastbusy,
  strategies.random,
]);

/**
 * Checks if a string is a valid strategy
 * @param value - The string to check
 * @returns Whether the string is a valid strategy
 */
export function isStrategy(value: string | undefined): value is Strategies {
  if (!value) return false;
  return supportedStrategies.has(value as Strategies);
}

/**
 * Calculates the maximum size of a worker pool
 * @param size - The requested size
 * @param cores - The number of available CPU cores
 * @returns The calculated pool size
 */
export function maxSize(size: number, cores: number): number {
  if (size < 1) {
    // If size is less than 1, use the number of cores minus the absolute value of size
    // e.g., if size is -1 and cores is 8, return 7
    const calculatedSize = Math.max(cores + size, 1);
    return calculatedSize;
  }

  // Otherwise use the specified size, with a minimum of 1
  return Math.max(size, 1);
}

// -------------------- Path utilities --------------------
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

// -------------------- HTTP error handling utilities --------------------
export const errorHttp = {
  error400(res: ServerResponse, title?: string, msg?: string) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 400, title, msg }));
  },
  error500(res: ServerResponse, msg?: string) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 500, msg }));
  },
  error503(res: ServerResponse, title?: string, description?: string) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 503, title, description }));
  },
};

// -------------------- HTTP response handling utilities --------------------
export function response(
  data: Data,
  reply: string,
  messageMap: Map<number, ServerResponse>
) {
  const res = messageMap.get(data.messageSeq);
  if (!res) return;
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(reply);
}

export function serverResponse(res: ServerResponse) {
  return (
    statusCode: number,
    statusText: string,
    contentType = 'application/json'
  ) => {
    // Explicitly acknowledge the variable will be used later
    void statusText;
    res.statusCode = statusCode;
    return {
      end: (body: string) => {
        res.setHeader('Content-Type', contentType);
        res.end(body);
      },
    };
  };
}

// -------------------- TCP server utility --------------------
import { createServer as createNetServer, Server as NetServer } from 'node:net';

export function getTcpServer(
  actorSet: Set<(data: Data) => any>,
  responseHandler: typeof response,
  messageMap: Map<number, ServerResponse>
): NetServer {
  // Explicitly acknowledge the variable will be used later
  void responseHandler;
  void messageMap;
  const server = createNetServer(socket => {
    // For binary data handling
    socket.on('data', buffer => {
      try {
        const data = JSON.parse(buffer.toString());
        console.log('TCP Server received:', data);

        // If it's a valid message with a handler in actorSet, process it
        if (data && data.messageSeq && data.command_name) {
          const actor = [...actorSet][
            Math.floor(Math.random() * actorSet.size)
          ];
          if (actor) {
            actor(data);
          }
        }
      } catch (error) {
        console.error('Error processing TCP data:', error);
      }
    });

    socket.on('error', err => {
      console.error('TCP socket error:', err);
    });
  });

  return server;
}
