// at: /projects/monorepo-one/services/rpc-worker-pool/global/global.d.ts
// declare namespace NodeJS {
//   interface Global {
//     [key: string]: any; // Add an index signature
//     VERBOSE: boolean;
//   }
// }
declare global {
  var VERBOSE: boolean;
  var DEBUG: boolean;
}
export {}; // This file needs to be a module
