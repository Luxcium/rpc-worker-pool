export interface IArgsConfigs {
  argv0: string;
  argv1: string;
  httpConnParam: string;
  connecParam: string;
  threadsParam: string;
  strategyParam: string;
  scriptFilePath: string;
  splits: {
    httpEndpointParam: string;
    httpPortParam: string;
    endpointParam: string;
    portParam: string;
  };
}
