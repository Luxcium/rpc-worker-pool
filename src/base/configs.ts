// src/base/configs.ts
import {
  IArgsConfigs,
  IDefaultsConfigs,
  IEnvConfigs,
  IPriorities,
} from './types';
import { isStrategy, strategies } from './utils';

/**
 * Gets configuration from command line arguments.
 */
export function getArgvConfigs(): IArgsConfigs {
  const [
    argv0,
    argv1,
    httpConnParam,
    connecParam,
    threadsParam,
    strategyParam,
    scriptFilePath,
  ] = process.argv;
  const [httpEndpointParam, httpPortParam] = (httpConnParam || '').split(':');
  const [endpointParam, portParam] = (connecParam || '').split(':');
  return {
    argv0,
    argv1,
    httpConnParam,
    connecParam,
    threadsParam,
    strategyParam,
    scriptFilePath,
    splits: {
      httpEndpointParam,
      httpPortParam,
      endpointParam,
      portParam,
    },
  };
}

/**
 * Gets configuration from environment variables.
 */
export function getEnvConfigs(): IEnvConfigs {
  return {
    httpEndpointEnv: process.env['HTTP_ENDPOINT'] ?? '',
    httpPortEnv: process.env['HTTP_PORT'] ?? '',
    endpointEnv: process.env['ACTOR_ENDPOINT'] ?? '',
    portEnv: process.env['ACTOR_PORT'] ?? '',
    threadsEnv: Number.parseInt(`${process.env['ACTOR_THREADS']}`) || 0,
    strategyEnv: process.env['ACTOR_STRATEGY'] ?? '',
    scriptFileEnv: process.env['SCRIPT_FILE_URI'] ?? '',
    runInDockerFlag: 'true' === process.env['RUNNING_IN_DOCKER'],
  };
}

/**
 * Gets default configuration values.
 */
export function getDefaultConfigs(): IDefaultsConfigs {
  return {
    HTTP_ENDPOINT: '0.0.0.0',
    HTTP_PORT: '8010',
    ENDPOINT: '0.0.0.0',
    PORT: '7010',
    THREADS: 4,
    STRATEGY: 'roundrobin',
  };
}

/**
 * Merges configurations from different sources with proper priority.
 */
export function getConfigs({
  HTTP_ENDPOINT,
  HTTP_PORT,
  ENDPOINT,
  PORT,
  THREADS,
  STRATEGY,
}: IDefaultsConfigs): IPriorities {
  const env = getEnvConfigs();
  const args = getArgvConfigs();
  const { httpEndpointParam, httpPortParam, endpointParam, portParam } =
    args.splits;
  const inDocker =
    (isInDocker: boolean) =>
    <T>(e?: T, a?: T) =>
      isInDocker ? (e ?? a) : (a ?? e);
  const priority = inDocker(env.runInDockerFlag);

  // Define priority logic
  const define =
    <T>(defaultValue: T | string) =>
    (env?: T | string, arg?: T | string) =>
      priority(env, arg) ?? defaultValue;

  const defHttpEndPoint = define(HTTP_ENDPOINT);
  const defHttpPort = define(HTTP_PORT);
  const defEndPoint = define(ENDPOINT);
  const defPort = define(PORT);
  const defThreads = define(THREADS);
  const defStrategy = define(STRATEGY);

  const httpEndpoint = defHttpEndPoint(env.httpEndpointEnv, httpEndpointParam);
  const httpPort = defHttpPort(env.httpPortEnv, httpPortParam);
  const actorEndpoint = defEndPoint(env.endpointEnv, endpointParam);
  const actorPort = defPort(env.portEnv, portParam);
  const threads = Number(defThreads(`${env.threadsEnv}`, args.threadsParam));
  const strategy_ = String(defStrategy(env.strategyEnv, args.strategyParam));
  const strategy = isStrategy(strategy_) ? strategy_ : strategies.roundrobin;

  return {
    httpEndpoint,
    httpPort,
    actorEndpoint,
    actorPort,
    threads,
    strategy_,
    strategy,
    runInDocker: env.runInDockerFlag,
  };
}

/**
 * Merged priorities with default values.
 */
export const priorities = getConfigs({
  HTTP_ENDPOINT: '0.0.0.0',
  HTTP_PORT: '8010',
  ENDPOINT: '0.0.0.0',
  PORT: '7010',
  THREADS: 4,
  STRATEGY: 'roundrobin',
});
