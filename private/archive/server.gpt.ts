import chalk from 'chalk';
import { existsSync } from 'node:fs';
import { createServer as createHTTP_Server } from 'node:http';
import { createServer as createTCP_Server } from 'node:net';
import { isStrategy, strategies } from './commands';
import { RpcWorkerPool } from './server/RpcWorkerPool';
const [, , webConnection, actorConnection, threads_, strategy_] = process.argv;
const [webEndpoint, webPort] = (webConnection || '').split(':');
const [actorEndpoint, actorPort] = (actorConnection || '').split(':');
const workerScriptFileUri = `${__dirname}/worker.${
  existsSync(`${__dirname}/worker.ts`) ? 'ts' : 'js'
}`;
const threads = Number(threads_ || 0);
const strategy = isStrategy(strategy_) ? strategy_ : strategies.roundrobin;
const idCount = { messageSeq: 0, actorTracking: 0 };
const actors = new Set();
const messages = new Map();
function randomActor() {
  const pool = Array.from(actors);
  return pool[Math.floor(Math.random() * pool.length)];
}
const HTTP_Server = createHTTP_Server((req, res) => {
  idCount.messageSeq++;
  if (actors.size === 0) return res.end('ERROR: EMPTY ACTOR POOL');
  const actor: any = randomActor();
  messages.set(idCount.messageSeq, res);
  const splitedUrl = (req?.url || '').split('/');
  const command_name = splitedUrl.slice(1, 2).pop();
  actor({
    id: idCount.messageSeq,
    command_name,
    args: [...splitedUrl.slice(2)],
  });
  return res;
});

HTTP_Server.listen(Number(webPort), webEndpoint, () => {
  console.info(
    '> ' +
      chalk.green('web:  ') +
      chalk.yellow(`http:\/\/${webEndpoint}`) +
      ':' +
      chalk.magenta(`${webPort}`)
  );
});
const TCP_Server = createTCP_Server(tcp_client => {
  const handler = (data: any) =>
    tcp_client.write(JSON.stringify(data) + '\0\n\0');
  actors.add(handler);
  console.info('actor pool connected', actors.size);
  tcp_client.on('end', () => {
    actors.delete(handler);
    console.info('actor pool disconnected', actors.size);
  });
  tcp_client.on('data', raw_data => {
    String(raw_data)
      .split('\0\n\0')
      .slice(0, -1)
      .forEach(chunk => {
        const data = JSON.parse(chunk);
        const res = messages.get(data.id);
        res.end(JSON.stringify(data) + '\0\n\0');
        messages.delete(data.id);
      });
  });
});
TCP_Server.listen(Number(actorPort), actorEndpoint, () => {
  console.info(
    '> ' +
      chalk.green('actor: ') +
      chalk.yellow(`tcp:\/\/${actorEndpoint}`) +
      ':' +
      chalk.magenta(`${actorPort}`) +
      '\n\n\n\n'
  );
});
const workerPool = new RpcWorkerPool(workerScriptFileUri, threads, strategy);
actors.add(async (data: any) => {
  try {
    const timeBefore = performance.now();
    const value = await workerPool.exec(
      data.command_name,
      data.id,
      ...data.args
    );
    const timeAfter = performance.now();
    const delay = timeAfter - timeBefore;
    const time = Math.round(delay * 100) / 100;
    idCount.actorTracking++;
    const replyObject = {
      id: data.id,
      pid: `actor(${idCount.actorTracking}) at process: ${process.pid}`,
    };
    const reply =
      JSON.stringify({
        jsonrpc: '2.0',
        value,
        ...replyObject,
        performance: delay,
      }) + '\0\n\0';
    console.log(
      'actors.add!',
      {
        jsonrpc: '2.0',
        ...replyObject,
      },
      'performance: ' + chalk.yellow(time) + ' ms'
    );
    messages.get(data.id).end(reply);
    messages.delete(data.id);
  } catch (error) {
    console.error(error);
  }
});
