import { delay, heavyTask } from '@luxcium/tools';
import chalk from 'chalk';
import { APPLICATION_ERROR } from '../../API';
import type {
  IdsObject,
  RpcLeft,
  RpcRequest,
  RpcResponse,
  RpcRight,
} from '../../types';
import { getParams } from './getParams';
export const methods: Methods<unknown> = {
  async ['hello-world'](rpcRequest: RpcRequest<[IdsObject, ...string[]]>) {
    try {
      const [idsObject, args] = getParams(rpcRequest);

      console.log(
        chalk.redBright('Hello world will echo back request as recieved:')
      );
      console.dir(rpcRequest, { colors: true });

      const arg0 = Number(args[0]);
      const delay_0 = arg0 ? arg0 : 100;

      const arg1 = Number(args[1]);
      const delay_1 = arg1 ? arg1 : 100;

      const arg2 = Number(args[2]);
      const heavy_0 = arg2 ? arg2 : 10;

      const arg3 = Number(args[3]);
      const heavy_1 = arg3 ? arg3 : 10;

      const task = await heavyTask(heavy_0, heavy_1);
      const initialTime_0 = performance.now();
      // const [chosenDelay, actualDelay, actualDelay_0]
      const { value, timeElapsed, totalTimeElapsed } = await delay(
        delay_0,
        delay_1
      );

      const result = {
        ['hello-world']: 'Hello world just echo back!',
        args,
        argsList: {
          arg0: [args[0], arg0],
          delay_0,
          arg1: [args[1], arg1],
          delay_1,
          heavy: [heavy_0, heavy_1],
          task,
          heavyTask: performance.now() - initialTime_0,
        },
        randomedelay: [value, timeElapsed, totalTimeElapsed],
      };

      const rpcResponse: RpcRight<typeof result> = {
        jsonrpc: '2.0',
        id: Number(rpcRequest.id),
        result,
      };

      console.log(
        chalk.greenBright('Hello world did echo back request as pre processed:')
      );

      const { external_message_identifier: id } = idsObject;
      console.dir({ ...rpcResponse, id }, { colors: true });

      console.log(chalk.greenBright('Hello world returning the value now:'));
      await delay();
      return rpcResponse;
    } catch (error) {
      const rpcError: RpcLeft<typeof error> = APPLICATION_ERROR(
        rpcRequest.id,
        error
      );
      console.error(rpcError);
      return rpcError;
    }
  },
};

export type Method = <O>(rpcRequest: RpcRequest<string[]>) => Promise<O>;
// prettier-ignore
export type Methods<O> ={[k: string]:(rpcRequest: RpcRequest<[IdsObject,...string[]]>) => Promise<RpcResponse<O>>};
