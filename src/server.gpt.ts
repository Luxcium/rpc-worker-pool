import chalk from 'chalk';
import { existsSync } from 'node:fs';
import { createServer as createHTTP_Server } from 'node:http';
import { createServer as createTCP_Server } from 'node:net';
import { isStrategy, strategies } from './commands';
import { RpcWorkerPool } from './RpcWorkerPool';
const [, , web_host, actor_host, threads_, strategy_] = process.argv;
const [web_hostname, web_port] = (web_host || '').split(':');
const [actor_hostname, actor_port] = (actor_host || '').split(':');
const workerScriptFileUri = `${__dirname}/worker.${
  existsSync(`${__dirname}/worker.ts`) ? 'ts' : 'js'
}`;
const threads = Number(threads_ || 0);
const strategy = isStrategy(strategy_) ? strategy_ : strategies.roundrobin;
const idCount = { messageId: 0, actorId: 0 };
const actors = new Set();
const messages = new Map();
function randomActor() {
  const pool = Array.from(actors);
  return pool[Math.floor(Math.random() * pool.length)];
}
const HTTP_Server = createHTTP_Server((req, res) => {
  idCount.messageId++;
  if (actors.size === 0) return res.end('ERROR: EMPTY ACTOR POOL');
  const actor: any = randomActor();
  messages.set(idCount.messageId, res);
  const splitedUrl = (req?.url || '').split('/');
  const command_name = splitedUrl.slice(1, 2).pop();
  actor({
    id: idCount.messageId,
    command_name,
    args: [...splitedUrl.slice(2)],
  });
  return res;
});

HTTP_Server.listen(Number(web_port), web_hostname, () => {
  console.info(
    '> ' +
      chalk.green('web:  ') +
      chalk.yellow(`http:\/\/${web_hostname}`) +
      ':' +
      chalk.magenta(`${web_port}`)
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
TCP_Server.listen(Number(actor_port), actor_hostname, () => {
  console.info(
    '> ' +
      chalk.green('actor: ') +
      chalk.yellow(`tcp:\/\/${actor_hostname}`) +
      ':' +
      chalk.magenta(`${actor_port}`) +
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
    idCount.actorId++;
    const replyObject = {
      id: data.id,
      pid: `actor(${idCount.actorId}) at process: ${process.pid}`,
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
