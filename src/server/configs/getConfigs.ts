import { isStrategy, strategies } from '../utils';
import { getEnvConfigs } from './getEnvConfigs';
import { getArgvConfigs } from './getArgvConfigs';
import { IDefaultsConfigs } from './types/IDefaultsConfigs';
import { IPriorities } from './types/IPriorities';

// ## WILL SET PRIORRITY ―――――――――――――――――――――――――――――――――――――――――――――
export function getConfigs({
  HTTP_ENDPOINT,
  HTTP_PORT,
  ENDPOINT,
  PORT,
  THREADS,
  STRATEGY,
  SCRIPT_FILE_URI,
}: IDefaultsConfigs): IPriorities {
  const env = getEnvConfigs();
  const args = getArgvConfigs();
  const { httpEndpointParam, httpPortParam, endpointParam, portParam } =
    args.splits;
  const inDocker =
    (isInDocker: boolean) =>
    <T>(e?: T, a?: T) =>
      isInDocker ? e || a : a || e;
  const priority = inDocker(env.runInDockerFlag);

  // ## WILL DEFINE PRIORRITY ――――――――――――――――――――――――――――――――――――――――――
  const define =
    <T>(defaultValue: T | string) =>
    (env?: T | string, arg?: T | string) =>
      priority(env, arg) || defaultValue;

  const defHttpEndPoint = define(HTTP_ENDPOINT);
  const defHttpPort = define(HTTP_PORT);
  const defEndPoint = define(ENDPOINT);
  const defPort = define(PORT);
  const defThreads = define(THREADS);
  const defStrategy = define(STRATEGY);
  const defScriptFileUri = define(SCRIPT_FILE_URI);

  const httpEndpoint = defHttpEndPoint(env.httpEndpointEnv, httpEndpointParam);
  const httpPort = defHttpPort(env.httpPortEnv, httpPortParam);
  const actorEndpoint = defEndPoint(env.endpointEnv, endpointParam);
  const actorPort = defPort(env.portEnv, portParam);
  const threads = Number(defThreads(`${env.threadsEnv}`, args.threadsParam));
  const strategy_ = String(defStrategy(env.strategyEnv, args.strategyParam));
  const strategy = isStrategy(strategy_) ? strategy_ : strategies.roundrobin;
  const scriptFileUri = defScriptFileUri(
    env.scriptFileEnv,
    args.scriptFilePath
  );
  return {
    httpEndpoint,
    httpPort,
    actorEndpoint,
    actorPort,
    threads,
    strategy_,
    strategy,
    scriptFileUri,
    runInDocker: env.runInDockerFlag,
  };
}
