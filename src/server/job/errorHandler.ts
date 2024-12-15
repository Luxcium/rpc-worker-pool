/**
 * A utility function to handle errors in the worker thread.
 * Logs the error message and the associated error object.
 * @param {string} msg - A descriptive message for the error context.
 * @param {unknown} error - The error object or value.
 */
export function errorHandler(msg: string, error: unknown) {
  console.error(
    `Error: ${msg} - Worker failed to reply (postMessage) to parentPort:`,
    error
  );
}
