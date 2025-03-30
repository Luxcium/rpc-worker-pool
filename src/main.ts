'strict mode';
// at: /projects/monorepo-one/services/rpc-worker-pool/src/main.ts

global.VERBOSE =
  process.argv.map(v => v.toLowerCase()).includes('--verbose=true') ||
  process.argv.includes('--verbose') ||
  process.argv.includes('-v') ||
  process.argv.includes('-vd') ||
  process.argv.includes('-dv') ||
  'true' === (process.env?.['VERBOSE'] || 'false').toLowerCase() ||
  '1' === (process.env?.['VERBOSE'] || '0');

global.DEBUG =
  process.argv.map(v => v.toLowerCase()).includes('--debug=true') ||
  process.argv.includes('--debug') ||
  process.argv.includes('-d') ||
  process.argv.includes('-vd') ||
  process.argv.includes('-dv') ||
  'true' === (process.env?.['DEBUG'] || 'false').toLowerCase() ||
  '1' === (process.env?.['DEBUG'] || '0');

// Or, if extension is not suitable, use a dynamic import
// const { poolInstance } = await import('./clients/_pool-instance');

export {}; // This file needs to be a module
