import type { ServerResponse } from 'node:http';

import { serverResponse } from './serverResponse';

export function errorHttp(statusCode: number, statusMessage: string) {
  return (res: ServerResponse, reason = '', description: string) => {
    const writeHead = serverResponse(res);
    const message = `${statusMessage}${reason ? `: ${reason}` : ''}`;
    const warning = `ERROR[${statusCode}]: ${message}`;
    console.warn(warning);
    const reply = writeHead(statusCode, message, 'application/json');
    reply.end(
      JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32_000,
          message,
          data: { warning, description },
        },
      })
    );
    console.warn(description);
    return reply;
  };
}
export function error400(
  res: ServerResponse,
  reason = '',
  description: string
) {
  const reply = errorHttp(400, 'Bad Request');
  return reply(res, reason, description);
}
export function error503(
  res: ServerResponse,
  reason = '',
  description: string
) {
  const reply = errorHttp(503, 'Service Unavailable');
  return reply(res, reason, description);
}
export function error500(res: ServerResponse, reason = '', description = '') {
  const reply = errorHttp(500, 'Internal Server Error');
  return reply(res, reason, description);
}
