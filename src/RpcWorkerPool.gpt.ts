import { cpus } from 'os';
import { Worker } from 'worker_threads';
import { strategies, supportedStrategies, type Strategies } from './commands';

const VERBOSE = false;
const CORES = cpus().length;

export class RpcWorkerPool {
  size: number;
  strategy: Strategies;
  verbosity: boolean;
  rr_index = -1;
  next_job_id = 0;
  workers: {
    worker: Worker;
    in_flight_commands: Map<number, any>;
    worker_id: number;
  }[] = [];

  constructor(
    path: string,
    size = 0,
    strategy: Strategies = strategies.leastbusy,
    verbosity = VERBOSE
  ) {
    this.size = size < 0 ? Math.max(CORES + size, 1) : size || CORES;
    this.strategy = supportedStrategies.has(strategy)
      ? strategy
      : strategies.leastbusy;
    this.verbosity = verbosity;
    for (let worker_id = 0; worker_id < this.size; worker_id++) {
      const worker = new Worker(
        `
        require('ts-node/register');
        require(require('worker_threads').workerData.runThisFileInTheWorker);
      `,
        {
          eval: true,
          workerData: { runThisFileInTheWorker: path, workerId: worker_id },
        }
      );
      this.workers.push({ worker, in_flight_commands: new Map(), worker_id });
      worker.on('message', msg => this.onMessageHandler(msg, worker_id));
    }
  }

  async exec(command_name: string, message_id: number, ...args: string[]) {
    const job_id = this.next_job_id++;
    const worker = this.getWorker(message_id);
    const promise = new Promise((resolve, reject) =>
      worker.in_flight_commands.set(job_id, { resolve, reject })
    );
    worker.worker.postMessage({ command_name, params: args, job_id });
    return promise;
  }

  getWorker(message_id = -1) {
    let worker_id = 0;
    switch (this.strategy) {
      case 'random':
        worker_id = Math.floor(Math.random() * this.size);
        break;
      case 'roundrobin':
        this.rr_index++;
        if (this.rr_index >= this.size) this.rr_index = 0;
        worker_id = this.rr_index;
        break;
      case 'leastbusy':
      default:
        let min = Infinity;
        for (let i = 0; i < this.size; i++) {
          const worker = this.workers[i];
          if (worker.in_flight_commands.size < min) {
            min = worker.in_flight_commands.size;
            worker_id = 0;
          }
        }
    }
    this.verbosity &&
      console.log(`Worker: ${worker_id + 1} Message id: ${message_id || 0}`);
    return this.workers[worker_id];
  }

  onMessageHandler(msg: any, worker_id: number) {
    const worker = this.workers[worker_id];
    const { result, error, job_id } = msg;
    const { resolve, reject } = worker.in_flight_commands.get(job_id);
    worker.in_flight_commands.delete(job_id);
    error ? reject(error) : resolve(result);
  }
}

export default RpcWorkerPool;
