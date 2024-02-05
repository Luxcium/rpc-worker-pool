import { IEnvConfigs } from './types/IEnvConfigs';

export function getEnvConfigs(): IEnvConfigs {
  return {
    httpEndpointEnv: process.env['HTTP_ENDPOINT'] || '',
    httpPortEnv: process.env['HTTP_PORT'] || '',
    endpointEnv: process.env['ACTOR_ENDPOINT'] || '',
    portEnv: process.env['ACTOR_PORT'] || '',
    threadsEnv: parseInt(`${process.env['ACTOR_THREADS']}`) || 0,
    strategyEnv: process.env['ACTOR_STRATEGY'] || '',
    scriptFileEnv: process.env['SCRIPT_FILE_URI'] || '',
    runInDockerFlag: process.env['RUNNING_IN_DOCKER'] === 'true',
  };
}
