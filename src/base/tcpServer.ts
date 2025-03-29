// src/base/tcpServer.ts
import { Server as NetServer } from 'node:net';
import { actorSet, messageMap } from './actors';
import { getTcpServer, response } from './utils';

/**
 * Creates and configures a TCP server for actor communication
 *
 * @param actorEndpoint The IP address to bind to
 * @param actorPort The port number to listen on
 * @returns The configured TCP server instance
 */
export function setupTcpServer(
  actorEndpoint: string,
  actorPort: string | number
): NetServer {
  // Create the TCP server with the actor set and response handler
  const TCP_Server = getTcpServer(actorSet, response, messageMap);

  // Start listening on the specified endpoint and port
  TCP_Server.listen(Number(actorPort), actorEndpoint, () => {
    console.info(
      `> TCP server listening on tcp://${actorEndpoint}:${actorPort}`
    );
  });

  return TCP_Server;
}
