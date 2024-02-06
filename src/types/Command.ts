export type Command<P extends any[], R> = {
  description: string;

  // Function to be used on the caller side, which takes some parameters and returns a Promise of a result.
  callerSideFn: (...params: P) => Promise<R>;

  // Function to be used on the receiver side, which takes some parameters and returns a Promise of a result.
  receiverSideFn: (...params: P) => Promise<R>;

  // Function to encode the result or error.
  encodeFn: (result: Error | R) => string;

  // Function to decode the result or error.
  decodeFn: (result: string) => Error | R;
};
