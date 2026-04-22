const net = require('net');
const killProcess = require('fkill');
const detect = require('detect-port');
const getPm2ProcessInfo = require('./get-pm2-process-info');

const noop = () => {};

const killProcessOccupiedPorts = async ({ pm2ProcessId, ports = {}, printError = noop } = {}) => {
  if (!pm2ProcessId) {
    throw new Error('pm2ProcessId is required');
  }

  const info = await getPm2ProcessInfo(pm2ProcessId, { throwOnNotExist: false });
  await Promise.all(
    Object.entries(ports).map(async ([envName, configPort]) => {
      if (!configPort) {
        return;
      }

      const pm2ProcessPort = (info?.pm2_env?.env || {})[envName];
      const pm2ProcessExist = pm2ProcessPort === configPort;

      if (pm2ProcessExist) {
        return;
      }

      try {
        await killProcess(`:${configPort}`, { silent: true, force: true });
      } catch (error) {
        printError('Failed to kill process', { error });
      }
    })
  );
};

const isPortTaken = async (port) => {
  const nextPort = await detect(port);
  if (nextPort !== port) {
    return true;
  }
  return new Promise((resolve, reject) => {
    const tester = net
      .createServer()
      .once('error', (err) => {
        if (err.code !== 'EADDRINUSE') {
          reject(err);
          return;
        }
        resolve(true);
      })
      .once('listening', () => {
        tester.once('close', () => resolve(false)).close();
      })
      .listen(port, '::'); // Note: without host, this may still return false even when the port is occupied
  });
};

/**
 * @param {{
 *  [key: string]: number;
 * }} ports
 * @param {{
 *  blackList?: number[];
 *  range?: [number, number];
 * }} options
 * @returns {
 *  Promise<{
 *   [key: string]: number;
 *  }>
 * }
 */
const refreshPorts = async (ports, { blackList = [], range = [10000, 31000] } = {}) => {
  const res = {};
  const blackListPorts = [...Object.values(ports), ...blackList];

  for (const key of Object.keys(ports)) {
    let found = false;
    while (!found) {
      const port = Math.floor(Math.random() * [range[1] - range[0]]) + range[0];

      if (!blackListPorts.includes(port)) {
        // eslint-disable-next-line no-await-in-loop
        const isTaken = await isPortTaken(port);
        if (!isTaken) {
          res[key] = port;
          blackListPorts.push(port);
          found = true;
        }
      }
    }
  }

  return res;
};

const isPortsOccupiedByOtherProcess = async ({ pm2ProcessId, ports = {} } = {}) => {
  if (!pm2ProcessId) {
    throw new Error('pm2ProcessId is required');
  }

  const info = await getPm2ProcessInfo(pm2ProcessId, { throwOnNotExist: false });

  let occupied = false;
  await Promise.all(
    Object.entries(ports).map(async ([envName, configPort]) => {
      if (!configPort) {
        return;
      }

      const pm2ProcessPort = (info?.pm2_env?.env || {})[envName];
      const pm2ProcessExist = pm2ProcessPort === configPort;

      if (pm2ProcessExist) {
        return;
      }

      const isYes = await isPortTaken(configPort);
      if (isYes) {
        occupied = isYes;
      }
    })
  );

  return occupied;
};

module.exports = {
  isPortsOccupiedByOtherProcess,
  killProcessOccupiedPorts,
  isPortTaken,
  refreshPorts,
};
