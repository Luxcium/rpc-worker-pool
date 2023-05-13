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
  next_job_ref = 0;
  workers: {
    worker: Worker;
    in_flight_commands: Map<number, any>;
    worker_tag: number;
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
    for (let worker_tag = 0; worker_tag < this.size; worker_tag++) {
      const worker = new Worker(
        `
        require('ts-node/register');
        require(require('worker_threads').workerData.runThisFileInTheWorker);
      `,
        {
          eval: true,
          workerData: { runThisFileInTheWorker: path, workerAsset: worker_tag },
        }
      );
      this.workers.push({ worker, in_flight_commands: new Map(), worker_tag });
      worker.on('message', msg => this.onMessageHandler(msg, worker_tag));
    }
  }

  async exec(
    command_name: string,
    message_identifier: number,
    ...args: string[]
  ) {
    const job_ref = this.next_job_ref++;
    const worker = this.getWorker(message_identifier);
    const promise = new Promise((resolve, reject) =>
      worker.in_flight_commands.set(job_ref, { resolve, reject })
    );
    worker.worker.postMessage({ command_name, params: args, job_ref });
    return promise;
  }

  getWorker(message_identifier = -1) {
    let worker_tag = 0;
    switch (this.strategy) {
      case 'random':
        worker_tag = Math.floor(Math.random() * this.size);
        break;
      case 'roundrobin':
        this.rr_index++;
        if (this.rr_index >= this.size) this.rr_index = 0;
        worker_tag = this.rr_index;
        break;
      case 'leastbusy':
      default:
        let min = Infinity;
        for (let i = 0; i < this.size; i++) {
          const worker = this.workers[i];
          if (worker.in_flight_commands.size < min) {
            min = worker.in_flight_commands.size;
            worker_tag = 0;
          }
        }
    }
    this.verbosity &&
      console.log(
        `Worker: ${worker_tag + 1} Message id: ${message_identifier || 0}`
      );
    return this.workers[worker_tag];
  }

  onMessageHandler(msg: any, worker_tag: number) {
    const worker = this.workers[worker_tag];
    const { result, error, job_ref } = msg;
    const { resolve, reject } = worker.in_flight_commands.get(job_ref);
    worker.in_flight_commands.delete(job_ref);
    error ? reject(error) : resolve(result);
  }
}

export default RpcWorkerPool;
