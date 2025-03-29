#!/usr/bin/env node
// src/base/server.ts
import chalk from 'chalk';
import { initializeActors } from './actors';
import { priorities } from './configs';
import { createHttpServer } from './httpServer';
import { setupTcpServer } from './tcpServer';

/**
 * Main entry point for the RPC worker pool server
 */
function MAIN() {
  // Get the merged configuration
  const {
    httpEndpoint,
    httpPort,
    actorEndpoint,
    actorPort,
    threads,
    strategy,
    runInDocker,
  } = priorities;

  // Log the server configuration
  console.log('Starting RPC worker pool server with configuration:');
  console.log({
    httpEndpoint,
    httpPort,
    actorEndpoint,
    actorPort,
    threads,
    strategy,
    runInDocker,
  });

  // Initialize actors and worker pool
  console.log(
    `Initializing worker pool with ${threads} threads using '${strategy}' strategy`
  );
  initializeActors(threads, strategy);

  // Create and start the HTTP server
  console.log(`Starting HTTP server at http://${httpEndpoint}:${httpPort}`);
  createHttpServer(httpEndpoint, httpPort);

  // Create and start the TCP server
  console.log(`Starting TCP server at tcp://${actorEndpoint}:${actorPort}`);
  setupTcpServer(actorEndpoint, actorPort);

  console.log(chalk.green('\nRPC worker pool server is up and running!'));
}

// Execute the main function
MAIN();
