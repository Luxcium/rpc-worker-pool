import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getConfigs } from './getConfigs';

export const priorities = getConfigs({
  HTTP_ENDPOINT: '0.0.0.0',
  HTTP_PORT: '8010',
  ENDPOINT: '0.0.0.0',
  PORT: '7010',
  THREADS: 4,
  STRATEGY: 'roundrobin',
  SCRIPT_FILE_URI: join(
    `${__dirname}/worker.${existsSync(`${__dirname}/worker.ts`) ? 'ts' : 'js'}`
  ),
});
