'use strict';
/**
 * An object containing the properties needed to wrap a message for the worker thread.
 */
export type MsgObjectToWrap = {
  /** The name of the command to execute. */
  command_name: string;
  /** The parameters to pass to the command. */
  params: string;
  /** The job ID associated with the message. */
  job_id: string;
};
