#!/usr/bin/env node
'use strict';
// src/base/test-client.ts

import { rpcRequest } from './client';

/**
 * Tests all available RPC commands
 */
async function testCommands(): Promise<void> {
  const host = 'localhost';
  const port = '8010';

  try {
    console.log('=== Testing RPC Worker Pool Commands ===\n');

    console.log('1. Testing helloWorld command...');
    const helloResult = await rpcRequest(
      'helloWorld',
      ['RPC', 'Worker', 'Pool'],
      host,
      port
    );
    console.log('Response:', JSON.stringify(helloResult, null, 2));
    console.log();

    console.log('2. Testing echo command...');
    const echoResult = await rpcRequest(
      'echo',
      ['param1', 'param2', 'param3'],
      host,
      port
    );
    console.log('Response:', JSON.stringify(echoResult, null, 2));
    console.log();

    console.log('3. Testing status command...');
    const statusResult = await rpcRequest('status', [], host, port);
    console.log('Response:', JSON.stringify(statusResult, null, 2));
    console.log();

    console.log('4. Testing info command...');
    const infoResult = await rpcRequest('info', [], host, port);
    console.log('Response:', JSON.stringify(infoResult, null, 2));
    console.log();

    console.log('=== All tests completed successfully ===');
  } catch (error: unknown) {
    console.error(
      'Test failed:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  testCommands();
}

export { testCommands };
