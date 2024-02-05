import { Strategies } from '../../utils';

export interface IPriorities {
  httpEndpoint: string;
  httpPort: string;
  actorEndpoint: string;
  actorPort: string;
  threads: number;
  strategy_: string;
  strategy: Strategies;
  runInDocker: boolean;
}
