'use strict';
/**
 * An object containing information about an error that occurred during a remote procedure call (RPC).
 */

export type ErrorRPC = {
  /** The HTTP status code that should be returned for this error. */
  status?: number;
  /** A unique identifier of the error. */
  id?: number | string | null;
  /** A short description of the error. */
  title: string;
  /** A detailed description of the error. */
  detail: string;
  /** Additional metadata about the error. */
  meta?: Record<string, any>;
  /** A numeric error code. */
  code: number;
  /** A human-readable error message. */
  message: string;
  /** Any additional data associated with the error. */
  data: any;
};
