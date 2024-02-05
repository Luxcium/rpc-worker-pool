import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { IDefaultsConfigs } from './types/IDefaultsConfigs';

export function getDefaultConfigs(dirname: string): IDefaultsConfigs {
  return {
    HTTP_ENDPOINT: '0.0.0.0',
    HTTP_PORT: '8010',
    ENDPOINT: '0.0.0.0',
    PORT: '7010',
    THREADS: 4,
    STRATEGY: 'roundrobin',
    SCRIPT_FILE_URI: join(
      `${dirname}/worker.${existsSync(`${dirname}/worker.ts`) ? 'ts' : 'js'}`
    ),
  };
}
