import { RpcWorkerPool } from 'src/server/RpcWorkerPool';

interface PipelineItem<IO> {
  id: number;
  data: IO;
}

export class PipelineStage<I, O> {
  inputQueue: Array<PipelineItem<I>>;
  outputQueue: Array<PipelineItem<O>>;
  workerPool: RpcWorkerPool;
  commandName: string;

  constructor(workerPool: RpcWorkerPool, commandName: string) {
    this.inputQueue = [];
    this.outputQueue = [];
    this.workerPool = workerPool;
    this.commandName = commandName;
  }

  async run() {
    while (this.inputQueue.length > 0) {
      const item = this.inputQueue.shift();
      if (item) {
        const result = await this.workerPool.exec<O>(
          this.commandName,
          Number(item.id),
          JSON.stringify(item.data)
        );
        this.outputQueue.push({ id: item.id, data: result });
      }
    }
  }
}
