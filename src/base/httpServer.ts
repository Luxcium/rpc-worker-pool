// src/base/httpServer.ts
import { createServer } from 'node:http';
import { URL } from 'node:url';
import { actorSet, elementCounter, messageMap, randomActor } from './actors';
import { errorHttp, getRelativePaths, serverResponse } from './utils';

const { error400, error500, error503 } = errorHttp;

/**
 * Creates and configures an HTTP server
 *
 * @param httpEndpoint The IP address to bind to
 * @param httpPort The port number to listen on
 * @returns The configured HTTP server
 */
export function createHttpServer(
  httpEndpoint: string,
  httpPort: string | number
) {
  const HTTP_Server = createServer((req, res): any => {
    elementCounter.messageSeq++;
    try {
      if (0 === actorSet.size) {
        const reason = 'EMPTY ACTOR POOL';
        const description = 'No actors available to handle requests.';
        return error503(res, reason, description);
      }

      // Store the response object with the message ID for later use
      messageMap.set(elementCounter.messageSeq, res);

      // Extract the command name, query string, and fragment identifier from the URL
      const fullUrl = new URL(req?.url ?? '', `http://${req.headers.host}`);

      // Split the path into segments and filter out empty strings
      const pathSegments = fullUrl.pathname.split('/').filter(Boolean);

      const destination = pathSegments.shift();
      const fullArgs = pathSegments;

      // Get the query string and fragment identifier
      const queryString = fullUrl.search;
      const fragmentIdentifier = fullUrl.hash;

      // Route the request based on the destination
      if ('worker' === destination) {
        // Worker route - invoke an actor to process the command
        const command_name = pathSegments.shift() || '';
        const args = pathSegments;

        // Get a random actor and invoke it with the request data
        const actor = randomActor();
        actor({
          messageSeq: elementCounter.messageSeq,
          command_name,
          args,
        });
      } else if ('server' === destination) {
        // Server route - handle server-specific commands
        const command_name = pathSegments.shift() || '';
        const args = pathSegments;

        if ('infos' === command_name) {
          // Provide server information
          const paths = getRelativePaths(
            '/projects/monorepo-one/rpc-worker-pool/docker/dist/server/worker.js',
            '/projects/monorepo-one/rpc-worker-pool/docker/dist/server/server.js'
          );

          serverResponse(res)(200, 'OK', 'application/json').end(
            JSON.stringify({
              jsonrpc: '2.0',
              id: elementCounter.messageSeq,
              result: {
                paths,
                pid: `server: ${process.pid}`,
              },
            })
          );
        } else {
          // Unknown server command
          error400(
            res,
            `Unknown server command: ${command_name}`,
            `args: ${args}, queryString: ${queryString}, fragmentIdentifier: ${fragmentIdentifier}`
          );
        }
      } else {
        // Unknown destination
        error400(
          res,
          `UNIMPLEMENTED DESTINATION: ${destination}`,
          `fullArgs: ${fullArgs}, queryString: ${queryString}, fragmentIdentifier: ${fragmentIdentifier}`
        );
      }
    } catch (error) {
      console.error(`Error in HTTP Server: ${(error as Error).message}`);
      return error500(res, (error as Error).message);
    }
  });

  // Start listening on the specified endpoint and port
  HTTP_Server.listen(Number(httpPort), httpEndpoint, () => {
    console.info(`HTTP server running at http://${httpEndpoint}:${httpPort}`);
  });

  return HTTP_Server;
}
