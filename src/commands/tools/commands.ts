import { delay, heavyTask, timeStamp } from '@luxcium/tools';
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
      console.dir(
        { ['AS RECIEVED']: true, ...rpcRequest },
        { colors: true, depth: 10, compact: true }
      );

      const arg0 = Number(args[0]);
      const delay_0 = isFinite(arg0) ? arg0 : 100;
      const arg1 = Number(args[1]);
      const delay_1 = isFinite(arg1) ? arg1 : 100;
      const arg2 = Number(args[2]);
      const heavy_0 = isFinite(arg2) ? arg2 : 10;
      const arg3 = Number(args[3]);
      const heavy_1 = isFinite(arg3) ? arg3 : 10;

      const initialTime_0 = performance.now();
      const taskValues = await heavyTask(heavy_0, heavy_1);
      const delayValues = await delay(delay_0, delay_1);

      const result = {
        heavyTask: [heavy_0, heavy_1],
        taskValue: taskValues,
        delay: [delay_0, delay_1],
        delayValue: delayValues,
        arg: args,
        performance: timeStamp(performance.now() - initialTime_0),
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
      console.dir(
        { ['AS PREPROCESSED']: true, ...rpcResponse, id },
        { colors: true, depth: 10, compact: true }
      );

      console.log(chalk.yellowBright('Hello world returning the value now:'));

      // this delay() call below is very important to be noticed it is
      // what makes the diference beteween full output when it is not
      // commented out and partial output when it is commented out but
      // more information on that later LOOK:
      // await delay();
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
