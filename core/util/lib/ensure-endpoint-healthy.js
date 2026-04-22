const net = require('node:net');
const debug = require('debug')('@abtnode/util:ensure-endpoint-healthy');

const sleep = require('./sleep');
const tryWithTimeout = require('./try-with-timeout');

const ONE_SECOND = 1000;
const WAIT_TCP_TIME = 3000;

const dial = (host, port, timeout = 3 * 1000) =>
  new Promise((resolve, reject) => {
    const socket = net.connect({
      host: host || '127.0.0.1',
      port,
    });

    const overallTimeout = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Connection timeout after ${timeout}ms`));
    }, timeout);

    socket.on('connect', () => {
      clearTimeout(overallTimeout);
      socket.destroy();
      resolve();
    });

    socket.on('error', (error) => {
      clearTimeout(overallTimeout);
      reject(error);
    });
  });

const dialHttp = (host, port, timeout = 3 * 1000) => {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port });
    let dataBuffer = '';

    // Set an overall timeout to keep the socket lifetime under 3 seconds
    const overallTimeout = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Socket existed for more than ${timeout}ms`));
    }, timeout);

    socket.on('connect', () => {
      socket.write(`HEAD / HTTP/1.1\r\nHost: ${host}\r\nX-Unique-Record: dial_http\r\nConnection: close\r\n\r\n`);
    });

    socket.on('data', (chunk) => {
      dataBuffer += chunk.toString();
      const firstLineEnd = dataBuffer.indexOf('\r\n');
      if (firstLineEnd !== -1) {
        clearTimeout(overallTimeout);
        const firstLine = dataBuffer.substring(0, firstLineEnd);
        socket.destroy();
        if (firstLine.startsWith('HTTP')) {
          resolve(firstLine);
        } else {
          reject(new Error(`Response does not appear to be HTTP: "${firstLine}"`));
        }
      }
    });

    // Handle data on connection end: if the first line is incomplete, treat it as an invalid response
    socket.on('end', () => {
      clearTimeout(overallTimeout);
      socket.destroy();
      if (!dataBuffer) {
        reject(new Error('No data received'));
      } else if (dataBuffer.indexOf('\r\n') === -1) {
        // No complete first line
        reject(new Error(`Response did not complete the first line: "${dataBuffer}"`));
      } else {
        // If data has a first line but did not reach the data callback completion logic (for example interrupted data), do a final check
        const firstLine = dataBuffer.substring(0, dataBuffer.indexOf('\r\n'));
        if (firstLine.startsWith('HTTP')) {
          resolve(firstLine);
        } else {
          reject(new Error(`Response does not appear to be HTTP: "${firstLine}"`));
        }
      }
    });

    socket.on('error', (err) => {
      clearTimeout(overallTimeout);
      socket.destroy();
      reject(err);
    });
  });
};

const ensureStarted = async ({
  host,
  port,
  protocol = 'http',
  timeout = 10 * ONE_SECOND,
  elapse = 0,
  minConsecutiveTime = 3 * ONE_SECOND,
  waitTCP = false,
}) => {
  const startTime = Date.now();
  try {
    if (protocol === 'http') {
      await dialHttp(host, port, minConsecutiveTime);
    } else {
      await dial(host, port);
      // For TCP protocols marked as requiring TCP wait, wait 3 seconds to ensure the service has started, such as MySQL
      if (waitTCP) {
        await sleep(WAIT_TCP_TIME);
      }
    }
    debug('ping if started', { port });
    return true;
  } catch (err) {
    debug('ping error:', err.message, port);
    await sleep(ONE_SECOND);

    const spend = elapse + (Date.now() - startTime);

    if (spend >= timeout) {
      throw new Error(`service not ready within ${Math.ceil(timeout / ONE_SECOND)} seconds, error: ${err?.message}`);
    }

    return ensureStarted({ host, port, protocol, timeout, elapse: spend, waitTCP });
  }
};

module.exports = async ({
  host = '127.0.0.1',
  port,
  protocol = 'tcp',
  timeout = 10 * ONE_SECOND,
  minConsecutiveTime = (+process.env.ENDPOINT_CONSECUTIVE_TIME || 5) * ONE_SECOND,
  doConsecutiveCheck = true,
  waitTCP = false,
  shouldAbort,
  // eslint-disable-next-line require-await
}) => {
  debug('ensure endpoint healthy', { host, port, protocol, timeout, minConsecutiveTime, doConsecutiveCheck });

  if (timeout < minConsecutiveTime) {
    throw new Error('"timeout" should not less than "minConsecutiveTime"');
  }

  const fn = async () => {
    // Check shouldAbort before starting, to ensure process exists
    if (shouldAbort) {
      // eslint-disable-next-line no-useless-catch
      try {
        await shouldAbort();
      } catch (abortError) {
        throw abortError;
      }
    }
    await ensureStarted({
      host,
      port,
      protocol,
      timeout: timeout - minConsecutiveTime,
      minConsecutiveTime,
      waitTCP,
      shouldAbort,
    });
    if (doConsecutiveCheck) {
      try {
        await ensureStarted({
          host,
          port,
          protocol,
          timeout: timeout - minConsecutiveTime,
          minConsecutiveTime,
          waitTCP,
        });
        await ensureStarted({
          host,
          port,
          protocol,
          timeout: timeout - minConsecutiveTime,
          minConsecutiveTime,
          waitTCP,
        });
      } catch (error) {
        throw new Error(
          `ensure healthy consecutive check failed in ${timeout - minConsecutiveTime}ms: ${error.message}`
        );
      }
    }
  };
  try {
    return await tryWithTimeout(fn, timeout);
  } catch (error) {
    throw new Error(`service not ready within ${Math.ceil(timeout / ONE_SECOND)} seconds, error: ${error?.message}`);
  }
};

module.exports.dial = dial;
module.exports.dialHttp = dialHttp;
