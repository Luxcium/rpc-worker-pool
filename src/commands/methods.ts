import { delay, heavyTask, timeStamp } from '@luxcium/tools';
import { DelayValue, TaskValue } from '@luxcium/tools/lib/typings/delay/delay';
import chalk from 'chalk';
import { APPLICATION_ERROR } from '../API';
import type { IdsObject, RpcLeft, RpcRequest, RpcRight } from '../types';
import { Methods } from '../types/Methods';
import { getParams } from './tools/getParams';

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
      const initialTime_0 = performance.now();

      const arg0 = Number(args[0]);
      const delay_0a = isFinite(arg0) ? arg0 : 100;
      const arg1 = Number(args[1]);
      const delay_1a = isFinite(arg1) ? arg1 : 100;
      const arg2 = Number(args[2]);
      const heavy_0 = isFinite(arg2) ? arg2 : 10;
      const arg3 = Number(args[3]);
      const heavy_1 = isFinite(arg3) ? arg3 : 10;

      const arg4 = Number(args[4]);
      const delay_0b = isFinite(arg4) ? arg4 : 10;
      const arg5 = Number(args[5]);
      const delay_1b = isFinite(arg5) ? arg5 : 10;

      const awaited = Boolean(args[6] === 'true');

      let delayValues_a: DelayValue;
      let delayValues_b: DelayValue;
      let taskValues: TaskValue;

      if (awaited) {
        const _delayValues_a = delay(delay_0a, delay_1a);
        delayValues_a = await _delayValues_a;

        const _taskValues = heavyTask(heavy_0, heavy_1);
        taskValues = await _taskValues;

        const _delayValues_b = delay(delay_0b, delay_1b);
        delayValues_b = await _delayValues_b;
      } else {
        const _delayValues_a = delay(delay_0a, delay_1a);
        const _taskValues = heavyTask(heavy_0, heavy_1);
        const _delayValues_b = delay(delay_0b, delay_1b);

        delayValues_a = await _delayValues_a;
        taskValues = await _taskValues;
        delayValues_b = await _delayValues_b;
      }

      const result = {
        delay_a: [delay_0a, delay_1a],
        heavyTask: [heavy_0, heavy_1],
        delay_b: [delay_0b, delay_1b],
        awaited: awaited,
        delayValues_a,
        taskValue: taskValues,
        delayValues_b,
        performance: [
          timeStamp(performance.now() - initialTime_0),
          initialTime_0,
        ],
        args: args,
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

      console.log(
        chalk.yellowBright(
          'Hello world returning back the value now (to the worker and out):'
        )
      );

      // this delay() call below is very important to be noticed it is
      // what makes the diference beteween full output when it is not
      // commented out and partial output when it is commented out but
      // more information on that later LOOK:
      // await delay(1);
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
