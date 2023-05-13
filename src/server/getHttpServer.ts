export {};
// import { createServer as createHTTP_Server } from 'node:http';
// import { error400, error500, error503 } from './errorHttp';
// import { getRelativePaths } from './getRelativePaths';
// // import {
// //   SCRIPT_FILE_URI,
// //   actorSet,
// //   endpointEnv,
// //   httpEndpointEnv,
// //   httpPortEnv,
// //   elementCounter,
// //   messageMap,
// //   portEnv,
// //   randomActor,
// //   runInDocker,
// //   scriptFileEnv,
// //   strategyEnv,
// //   threadsEnv,
// // } from './server';
// import { serverResponse } from './serverResponse';

// export function getHttpServer({
//   SCRIPT_FILE_URI,
//   actorSet,
//   endpointEnv,
//   httpEndpointEnv,
//   httpPortEnv,
//   elementCounter,
//   messageMap,
//   portEnv,
//   randomActor,
//   runInDocker,
//   scriptFileEnv,
//   strategyEnv,
//   threadsEnv,
// }: any) {
//   const HTTP_Server = createHTTP_Server((req, res): any => {
//     try {
//       elementCounter.messageSeq++;

//       // End if there are no actors, respond with an error message
//       if (actorSet.size === 0) {
//         const reason = 'EMPTY ACTOR POOL';
//         const description = 'No actors available to handle requests.';
//         return error503(res, reason, description);
//       }

//       // Select a random actor to handle the request
//       const actor: any = randomActor();

//       // Store the response object with the message ID for later use
//       void messageMap.set(elementCounter.messageSeq, res);

//       // Extract the command name, query string, and fragment identifier from the URL
//       const fullUrl = new URL(
//         req?.url || '',
//         `http:${'//' + req.headers.host}`
//       );
//       // Split the path into segments and filter out empty strings
//       const pathSegments = fullUrl.pathname.split('/').filter(Boolean);

//       const destination = pathSegments.shift();
//       const fullArgs = pathSegments;
//       // Get the query string
//       const queryString = fullUrl.search;
//       // Get the fragment identifier
//       const fragmentIdentifier = fullUrl.hash;
//       if (destination === 'worker') {
//         // Remove and store the first segment as the command name
//         const command_name = pathSegments.shift();
//         // The remaining segments are the arguments
//         const args = pathSegments;

//         // Send the command and arguments, along with the query string and fragment identifier, to the selected actor
//         actor({
//           id: elementCounter.messageSeq,
//           command_name,
//           args,
//           // args: { args, queryString, fragmentIdentifier },
//         });
//       } else if (destination === 'server') {
//         // Remove and store the first segment as the command name
//         const command_name = pathSegments.shift();
//         // The remaining segments are the arguments
//         const args = pathSegments;
//         // Get the query string
//         // const queryString = fullUrl.search;
//         // Get the fragment identifier
//         // const fragmentIdentifier = fullUrl.hash;
//         if (command_name === 'infos') {
//           const paths = getRelativePaths(
//             '/projects/monorepo-one/rpc-worker-pool/docker/dist/server/worker.js',
//             '/projects/monorepo-one//rpc-worker-pool/docker/dist/server/server.js'
//           );
//           const defaults_ = {
//             PORT,
//             HTTP_PORT,
//             ENDPOINT,
//             HTTP_ENDPOINT,
//             THREADS,
//             STRATEGY,
//             SCRIPT_FILE_URI,
//           };
//           const envs_ = {
//             httpEndpointEnv: httpEndpointEnv,
//             httpPortEnv: httpPortEnv,
//             endpointEnv: endpointEnv,
//             portEnv: portEnv,
//             threadsEnv: threadsEnv,
//             strategyEnv: strategyEnv,
//             scriptFileEnv: scriptFileEnv,
//           };
//           const args_ = {
//             argv0,
//             argv1,
//             httpConnParam,
//             connecParam,
//             threadsParam,
//             strategyParam,
//             scriptFileParam,
//             splits: {
//               httpEndpointParam,
//               httpPortParam,
//               endpointParam,
//               portParam,
//             },
//           };
//           const definedValues = {
//             httpEndpoint,
//             httpPort,
//             actorEndpoint,
//             actorPort,
//             threads,
//             strategy_,
//             strategy,
//             scriptFileUri,
//           };
//           console.log('envs_', JSON.stringify({ ...envs_ }), envs_);

//           serverResponse(res)(200, 'OK', 'string').end(
//             JSON.stringify({
//               jsonrpc: '2.0',
//               pid: 'server: ' + process.pid,
//               result: {
//                 paths,
//                 worker_path: SCRIPT_FILE_URI,
//                 DEFAULTS: defaults_,
//                 ENVs: envs_,
//                 ARGs: args_,
//                 isInDocker: runInDocker,
//                 definedValues,
//               },
//               id: elementCounter.messageSeq,
//             })
//           );
//         } else {
//           error400(
//             res,
//             `${command_name}`,
//             `fullArgs: ${fullArgs}, args: ${args}, queryString: ${queryString}, fragmentIdentifier: ${fragmentIdentifier}`
//           );
//         }
//         // sever would do something
//       } else {
//         error400(
//           res,
//           `UNIMPLEMENTD DESTINATION: ${destination}`,
//           `fullArgs: ${fullArgs}, queryString: ${queryString}, fragmentIdentifier: ${fragmentIdentifier}`
//         );
//       }
//     } catch (error) {
//       console.error(error);
//       return error500(res, (error as any).message);
//     }
//   });
//   return HTTP_Server;
// }
