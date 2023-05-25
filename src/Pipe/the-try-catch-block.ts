// /=//==//===//====//=====//======//=======//========//=============/
export async function theTryCathBlock<A, R, E = R>(
  { fnct, errMsg, errVal }: TheTryCatchArgs<A, R, E>,
  ...args: A[]
): Promise<R | E> {
  try {
    const result = fnct(...args);
    return await Promise.resolve(result);
  } catch (error) {
    logError(error, `at: ${errMsg}`);
    return errVal;
  }
}
const logError = console.error;
export type TheTryCatchArgs<A, R, E> = {
  fnct: (...a: A[]) => R | Promise<R>;
  errMsg: string;
  errVal: E;
};
// /=//==//===//====//=====//======//=======//========//=============/

// Outline Draft for the function to be use in the pipeline

export function name(deferredObj: any, str: Awaited<string>) {
  const result_name = async () => await deferredObj;
  return { ...deferredObj, result_name, str };
}
