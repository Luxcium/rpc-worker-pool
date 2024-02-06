/**
 * Type representing a function that encapsulates an asynchronous operation.
 */
export type Deferred<R = unknown> = () => Promise<R>;

/**
 * Interface for an object that encapsulates asynchronous operations.
 */
type OperationObject<R = unknown> = Record<string, Deferred<R>>;

type Deferred_<R = unknown> = () => Promise<R>;

export type OperationObject_<K extends PropertyKey, R = unknown> = {
  [P in K]: Deferred_<R>;
};

export type WithFileName = {
  fileName: string;
};

export type WithFileName_ = OperationObject_<'fileName', string>;

/**
 * Type representing a function that adds an operation to an OperationObject.
 */
export type OperationEncapsulationFunction<R = unknown> = (
  input: OperationObject,
  operation: Deferred<R>
) => OperationObject;

/**
 * Class to encapsulate Deferred Asynchronous Operations Encapsulation (DAOE) concept.
 */
export class DAOEObject {
  private operations: OperationObject = {};

  /**
   * Add an operation to this object.
   * @param key The key to store the operation under.
   * @param operation The operation to store.
   */
  addOperation<R>(key: string, operation: Deferred<R>): void {
    this.operations[key] = operation;
  }

  /**
   * Get an operation from this object.
   * @param key The key of the operation to retrieve.
   * @returns The operation, or undefined if no operation is stored under the given key.
   */
  getOperation(key: string): Deferred | undefined {
    return this.operations[key];
  }

  /**
   * Execute all operations stored in this object, in the order they were added.
   * @returns An object mapping operation keys to their results.
   * @throws Will throw an error if any operation fails.
   */
  async executeOperations(): Promise<Record<string, unknown>> {
    const results: Record<string, unknown> = {};
    for (const key in this.operations) {
      try {
        results[key] = await this.operations[key]();
      } catch (error) {
        // Here we could defer the error handling by storing the error in the results object,
        // but for simplicity we'll just throw the error.
        console.error(error);
        throw error;
      }
    }
    return results;
  }
}

// Define the OperationEncapsulationFunction implementation

/**
 * Add an operation to an OperationObject.
 * @param obj The OperationObject to add the operation to.
 * @param key The key to store the operation under.
 * @param operation The operation to store.
 * @returns A new OperationObject with the added operation.
 */
export function addOperationToObj<R>(
  obj: OperationObject,
  key: string,
  operation: Deferred<R>
): OperationObject {
  const updatedObj = { ...obj };
  updatedObj[key] = operation;
  return updatedObj;
}

// /=//==//===//====//=====//======//=======//========//=============/
type TheTryCatchArgs<A, R, E> = {
  fnct: (...a: A[]) => Promise<R> | R;
  errMsg: string;
  errVal: E;
};
const logError = console.error;
export async function theTryCathBlock<A, R, E = R>(
  { fnct, errMsg, errVal }: TheTryCatchArgs<A, R, E>,
  ...args: A[]
): Promise<E | R> {
  try {
    const result = fnct(...args);
    return await Promise.resolve(result);
  } catch (error) {
    logError(error, `at: ${errMsg}`);
    return errVal;
  }
}

// /=//==//===//====//=====//======//=======//========//=============/
