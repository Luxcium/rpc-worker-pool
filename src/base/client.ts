#!/usr/bin/env node
'use strict';
// src/base/client.ts

import * as http from 'node:http';
import { IncomingMessage } from 'node:http';
import { URL } from 'node:url';

/**
 * Makes an HTTP request to the RPC server
 *
 * @param command - The RPC command to execute
 * @param params - Parameters to pass to the command
 * @param host - Server hostname
 * @param port - Server port
 * @returns Promise resolving to the response data
 */
async function rpcRequest(
  command: string,
  params: string[] = [],
  host = 'localhost',
  port = '8010'
): Promise<any> {
  return new Promise((resolve, reject) => {
    // Construct the URL with command and parameters
    const path = `/${command}/${params.join('/')}`;
    const url = new URL(`http://${host}:${port}${path}`);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    };

    console.log(`Sending request to: ${url.toString()}`);

    const req = http.request(options, (res: IncomingMessage) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          // The response may include null bytes and newlines as delimiters
          const cleanData = data.replace(/\0\n\0/g, '');

          // Check status code with nullish coalescing to handle undefined
          if ((res.statusCode ?? 200) >= 400) {
            // If we got an error status code, reject with the error
            reject(
              new Error(
                `Server returned ${res.statusCode || 'unknown'}: ${cleanData}`
              )
            );
            return;
          }

          // Try to parse the response as JSON
          let result;
          try {
            result = JSON.parse(cleanData);
          } catch (error) {
            // If it's not valid JSON, return the raw data
            result = { raw: cleanData };
          }

          resolve(result);
        } catch (error) {
          reject(
            new Error(
              `Failed to process response: ${(error as Error).message || error}`
            )
          );
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Main function to demonstrate RPC client usage
 */
async function main(): Promise<void> {
  try {
    // Parse command-line arguments
    const [
      ,
      ,
      host = 'localhost',
      port = '8010',
      command = 'helloWorld',
      ...params
    ] = process.argv;

    console.log(`Connecting to RPC server at ${host}:${port}`);
    console.log(
      `Executing command: ${command} with params: ${params.join(', ') || 'none'}`
    );

    const response = await rpcRequest(command, params, host, port);
    console.log('Response:');
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', (error as Error).message || error);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main();
}

export { rpcRequest };
