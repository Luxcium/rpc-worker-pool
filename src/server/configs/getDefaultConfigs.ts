import type { IDefaultsConfigs } from './types/IDefaultsConfigs';

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
