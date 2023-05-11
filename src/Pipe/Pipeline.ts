import { PipelineStage } from './PipelineStage';

export class Pipeline {
  stages: Array<PipelineStage<any, any>>;

  constructor(stages: Array<PipelineStage<any, any>>) {
    this.stages = stages;
  }

  async run() {
    for (let i = 0; i < this.stages.length; i++) {
      const stage = this.stages[i];
      if (i > 0) {
        // If this isn't the first stage, take the output from the previous stage as the input for this one.
        stage.inputQueue = this.stages[i - 1].outputQueue;
      }
      await stage.run();
    }
  }
}
