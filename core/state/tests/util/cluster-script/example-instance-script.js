/* eslint-disable no-console */

const instance = process.env.NODE_APP_INSTANCE;

console.log(`[Worker] instance=${instance} started (pid=${process.pid})`);

if (process.env.NODE_APP_INSTANCE !== '0') {
  setTimeout(() => {
    console.error(`[Worker] instance=${instance} crashing (pid=${process.pid})`);
    process.exit(1);
  }, 500);
}
