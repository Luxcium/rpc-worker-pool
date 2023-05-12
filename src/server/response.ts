import { IncomingMessage, ServerResponse } from 'http';
import { serverResponse } from './serverResponse';

export function response(
  data: any,
  reply: string,
  messageMap: Map<number, ServerResponse<IncomingMessage>>
) {
  // HACK: Skiped null check may be not assignable to parameter ------
  const writeHead = serverResponse(messageMap.get(data.id)!);

  try {
    const res = writeHead(200, 'Success', 'application/json');
    res.end(reply.replaceAll('\0', '').replaceAll('\n', ''));
  } catch (error) {
    console.error(error);
    const res = writeHead(500, 'Internal Server Error', 'text/plain');
    res.end('Internal Server Error');
  }
  return messageMap.delete(data.id);
}
