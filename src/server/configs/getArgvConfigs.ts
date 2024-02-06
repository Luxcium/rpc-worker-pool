import type { IArgsConfigs } from './types/IArgsConfigs';

// ## WILL PREFRE ARGV WHEN COMMAND LINE INVOQUATION ―――――――――――――――――
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
