const { CustomError } = require('@blocklet/error');

const pm2 = require('./pm2/async-pm2');

const noop = () => {};

// add 10,000 ms timeout to avoid pm2 hanging indefinitely on errors
const getPm2ProcessInfo = (processId, { printError = noop, throwOnNotExist = true, timeout = 10_000 } = {}) => {
  return new Promise((resolve, reject) => {
    let settled = false;

    let timer;
    const onSettle = (fn, arg) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(arg);
    };

    timer = setTimeout(() => {
      printError('pm2.describe timeout', { processId, timeout });
      onSettle(reject, new CustomError('PM2_RPC_TIMEOUT', `pm2.describe(${processId}) timed out after ${timeout}ms`));
    }, timeout);

    pm2.describe(processId, (err, list) => {
      if (err) {
        printError('Failed to get blocklet status from pm2', { error: err });
        return onSettle(reject, err);
      }

      const info = Array.isArray(list) ? list[0] : undefined;

      if (!info && throwOnNotExist) {
        return onSettle(
          reject,
          new CustomError('BLOCKLET_PROCESS_404', `Blocklet process info is not available: ${processId}`)
        );
      }

      return onSettle(resolve, info || null);
    });
  });
};

module.exports = getPm2ProcessInfo;
