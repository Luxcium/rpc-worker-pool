import { ServerResponse } from 'node:http';

export function serverResponse(res: ServerResponse) {
  return (statusCode: number, statusMessage: string, ContentType: string) => {
    res.statusCode = statusCode;
    res.statusMessage = statusMessage;
    return res.writeHead(statusCode, statusMessage, {
      'Content-Type': ContentType,
    });
  };
}
