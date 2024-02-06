'use strict';
export function errorHandler(msg: string, error: unknown) {
  console.error(
    msg,
    'Worker failed to reply (postMessage) to parentPort:',
    error
  );
}
