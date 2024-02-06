'use strict';
import type { ErrorRPC } from './ErrorRPC';

/**
 * An object containing the properties returned from a remote procedure call (RPC).
 */

export type MessageRPC<T = unknown> = {
  /** The JSON-RPC version. */
  jsonrpc: '2.0';

  /** The unique identifier of the original request. */
  id?: number | string | null;

  /** The result of the JSON-RPC method call. */
  result?: T;

  /** An error object if the JSON-RPC method call failed. */
  error?: ErrorRPC;

  /** The job ID associated with the message. */
  job_ref: string;

  /** The process ID of the worker thread. */
  pid: string;
};
