import type { ServerResponse } from 'node:http';
import { createServer as createTCP_Server } from 'node:net';

export function getTcpServer(
  actorSet: Set<(data: any) => any>,
  response: (
    data: any,
    reply: string,
    messageMap: Map<number, ServerResponse>
  ) => boolean,
  messageMap: Map<number, ServerResponse>
) {
  const TCP_Server = createTCP_Server(tcp_client => {
    // The handler function is used to send responses back to this TCP client
    const handler = async (dataRequest: any) =>
      tcp_client.write(`${JSON.stringify(dataRequest)}\0\n\0`); // <1>

    // Add the handler function to the actor pool
    actorSet.add(handler);

    // Log the current size of the actor pool
    console.info('actor pool connected', actorSet.size);

    // Remove the handler function from the actor pool when the client disconnects
    tcp_client.on('end', () => {
      actorSet.delete(handler); // <2>

      // Log the current size of the actor pool
      console.info('actor pool disconnected', actorSet.size);
    });

    // Handle incoming data from the TCP client
    tcp_client.on('data', raw_data => {
      // Split the incoming data by the defined delimiter and remove the last (empty) null, new line, null.
      String(raw_data)
        .split('\0\n\0')
        .slice(0, -1) // Remove the last (empty) null, new line, null.
        .forEach(chunk => {
          // Parse the incoming data as a JSON object
          const data = JSON.parse(chunk);

          // Retrieve the HTTP response object associated with the message ID
          const reply = JSON.stringify(data).replaceAll('\0', '');

          response(data, reply, messageMap);
        });
    });
  });

  return TCP_Server;
}
