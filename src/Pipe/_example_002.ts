/**
 * Type representing a function that encapsulates an asynchronous operation.
 */
export type DeferredAsyncFunction<R = unknown> = () => Promise<R>;

/**
 * Interface for an object that encapsulates asynchronous operations.
 */
interface OperationObject<R = unknown> {
  [key: string]: DeferredAsyncFunction<R>;
}

/**
 * Type representing a function that adds an operation to an OperationObject.
 */
export type OperationEncapsulationFunction<R = unknown> = (
  input: OperationObject,
  operation: DeferredAsyncFunction<R>
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
  addOperation<R>(key: string, operation: DeferredAsyncFunction<R>): void {
    this.operations[key] = operation;
  }

  /**
   * Get an operation from this object.
   * @param key The key of the operation to retrieve.
   * @returns The operation, or undefined if no operation is stored under the given key.
   */
  getOperation(key: string): DeferredAsyncFunction | undefined {
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
      } catch (err) {
        // Here we could defer the error handling by storing the error in the results object,
        // but for simplicity we'll just throw the error.
        throw err;
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
  operation: DeferredAsyncFunction<R>
): OperationObject {
  const newObj = { ...obj };
  newObj[key] = operation;
  return newObj;
}
