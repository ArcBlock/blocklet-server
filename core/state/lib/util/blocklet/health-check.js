/* eslint-disable no-await-in-loop */
/**
 * Health Check Module
 *
 * Functions for checking blocklet process health status
 * Extracted from blocklet.js for better modularity
 */

const logger = require('@abtnode/logger')('@abtnode/core:util:blocklet:health-check');
const sleep = require('@abtnode/util/lib/sleep');
const ensureEndpointHealthy = require('@abtnode/util/lib/ensure-endpoint-healthy');
const promiseSpawn = require('@abtnode/util/lib/promise-spawn');
const { forEachBlocklet, hasStartEngine } = require('@blocklet/meta/lib/util');
const { getBlockletEngine } = require('@blocklet/meta/lib/engine');

const {
  BlockletStatus,
  BlockletGroup,
  BLOCKLET_MODES,
  BLOCKLET_INTERFACE_TYPE_WEB,
  BLOCKLET_INTERFACE_TYPE_DOCKER,
} = require('@blocklet/constant');

const { getProcessInfo, shouldSkipComponent } = require('./process-manager');

/**
 * Get actual listening port from Docker container or process
 * @param {string} processId - PM2 process ID
 * @param {object} blocklet - Blocklet object with meta and env
 * @returns {Promise<number|null>} Actual port number or null if not found
 */
const getActualListeningPort = async (processId, blocklet) => {
  try {
    const info = await getProcessInfo(processId, { timeout: 3_000 });
    const dockerName = info.pm2_env?.env?.dockerName;

    if (dockerName) {
      // For Docker containers, get actual port from docker inspect
      try {
        // Get port mapping from docker inspect
        const inspectCmd = `docker inspect --format='{{range $p, $conf := .NetworkSettings.Ports}}{{$p}} {{end}}' ${dockerName}`;
        const portMappings = await promiseSpawn(inspectCmd, { mute: true });

        if (portMappings) {
          const ports = portMappings.trim().split(/\s+/).filter(Boolean);
          for (const portMapping of ports) {
            const port = parseInt(portMapping.split('/')[0], 10);
            if (port && !Number.isNaN(port)) {
              try {
                const portCmd = `docker port ${dockerName} ${portMapping}`;
                const hostPortOutput = await promiseSpawn(portCmd, { mute: true });
                const match = hostPortOutput.match(/:(\d+)$/);
                if (match) {
                  const actualPort = parseInt(match[1], 10);
                  if (actualPort && !Number.isNaN(actualPort)) {
                    logger.info('Got actual Docker port from container', {
                      processId,
                      dockerName,
                      containerPort: port,
                      hostPort: actualPort,
                    });
                    return actualPort;
                  }
                }
              } catch (err) {
                logger.debug('Failed to get port from docker port command', { error: err.message });
              }
            }
          }
        }

        // Fallback: try to get from NetworkSettings.Ports directly
        const inspectPortsCmd = `docker inspect --format='{{json .NetworkSettings.Ports}}' ${dockerName}`;
        const portsJson = await promiseSpawn(inspectPortsCmd, { mute: true });
        if (portsJson) {
          const portsObj = JSON.parse(portsJson);
          // Find the primary port (usually BLOCKLET_PORT)
          const webInterface = (blocklet?.meta?.interfaces || []).find(
            (x) => x.type === BLOCKLET_INTERFACE_TYPE_WEB || x.type === BLOCKLET_INTERFACE_TYPE_DOCKER
          );
          const expectedContainerPort = webInterface?.containerPort || webInterface?.port;

          if (expectedContainerPort) {
            const portKey = `${expectedContainerPort}/tcp`;
            if (portsObj[portKey] && portsObj[portKey][0]) {
              const hostPort = parseInt(portsObj[portKey][0].HostPort, 10);
              if (hostPort && !Number.isNaN(hostPort)) {
                logger.info('Got actual Docker port from NetworkSettings', {
                  processId,
                  dockerName,
                  containerPort: expectedContainerPort,
                  hostPort,
                });
                return hostPort;
              }
            }
          }
        }
      } catch (error) {
        logger.debug('Failed to get Docker port mapping', { error: error.message, processId, dockerName });
      }
    }

    return null;
  } catch (error) {
    logger.debug('Failed to get actual listening port', { error: error.message, processId });
    return null;
  }
};

/**
 * Get healthy check timeout configuration
 * @param {object} blocklet - Blocklet object
 * @param {object} options - Options
 * @param {boolean} options.checkHealthImmediately - Whether to check immediately
 * @param {Array} options.componentDids - Component DIDs to filter
 * @returns {{ startTimeout: number, minConsecutiveTime: number }}
 */
const getHealthyCheckTimeout = (blocklet, { checkHealthImmediately, componentDids } = {}) => {
  let minConsecutiveTime = 3000;
  if (process.env.NODE_ENV === 'test' && process.env.ABT_NODE_TEST_MIN_CONSECUTIVE_TIME !== undefined) {
    minConsecutiveTime = +process.env.ABT_NODE_TEST_MIN_CONSECUTIVE_TIME;
  } else if (checkHealthImmediately) {
    minConsecutiveTime = 3000;
  }

  if (process.env.BLOCKLET_START_TIMEOUT) {
    return {
      startTimeout: +process.env.BLOCKLET_START_TIMEOUT * 1000,
      minConsecutiveTime,
    };
  }
  if (blocklet.mode === BLOCKLET_MODES.DEVELOPMENT) {
    return {
      startTimeout: 3600 * 1000,
      minConsecutiveTime: 3000,
    };
  }

  const children = componentDids?.length
    ? blocklet.children.filter((child) => componentDids.includes(child.meta.did))
    : blocklet.children;

  // Let's wait for at least 1 minute for the blocklet to go live
  let startTimeout =
    Math.max(blocklet.meta?.timeout?.start || 60, ...(children || []).map((child) => child.meta?.timeout?.start || 0)) *
    1000;

  if (process.env.NODE_ENV === 'test') {
    startTimeout = 10 * 1000;
  }

  return {
    startTimeout,
    minConsecutiveTime,
  };
};

/**
 * Internal function to check process health
 * @param {object} blocklet - Blocklet component
 * @param {object} options - Check options
 * @param {number} options.minConsecutiveTime - Minimum consecutive healthy time
 * @param {number} options.timeout - Timeout in ms
 * @param {boolean} options.logToTerminal - Whether to log to terminal
 * @param {boolean} options.isGreen - Whether checking green deployment
 * @param {string} options.appDid - App DID for logging
 * @param {Function} findInterfacePortByName - Function to find port by interface name
 * @returns {Promise<void>}
 */
const _checkProcessHealthy = async (
  blocklet,
  { minConsecutiveTime, timeout, logToTerminal, isGreen = false, appDid, findInterfacePortByName }
) => {
  const { meta, ports, greenPorts, env } = blocklet;
  const { name } = meta;
  const processId = isGreen ? `${env.processId}-green` : env.processId;

  const webInterface = (meta.interfaces || []).find((x) => x.type === BLOCKLET_INTERFACE_TYPE_WEB);
  const dockerInterface = (meta.interfaces || []).find((x) => x.type === BLOCKLET_INTERFACE_TYPE_DOCKER);

  if (!webInterface && !dockerInterface) {
    // TODO: how do we check healthy for service interfaces
    throw new Error(`Blocklet ${name} does not have any web interface`);
  }

  try {
    // ensure pm2 status is 'online'
    const getStatus = async () => {
      try {
        const info = await getProcessInfo(processId, { timeout: 3_000 });
        return { status: info.pm2_env.status, envPort: info.pm2_env.BLOCKLET_PORT };
      } catch (err) {
        logger.error('blocklet checkStart error', { appDid, error: err, processId, name });
        return { status: '', envPort: null };
      }
    };

    // eslint-disable-next-line prefer-const
    let { status, envPort } = await getStatus();

    for (let i = 0; i < 20 && status !== 'online'; i++) {
      const t = process.env.NODE_ENV !== 'test' ? 500 : 30;
      await sleep(t);
      ({ status, envPort } = await getStatus());
    }

    if (status !== 'online') {
      throw new Error('process not start within 10s');
    }

    // Get actual listening port from Docker container or process
    // This avoids using stale port after port refresh
    const actualPort = await getActualListeningPort(processId, blocklet);

    // Port priority: actual port > pm2 env port > database port
    const port =
      actualPort ||
      envPort ||
      findInterfacePortByName({ meta, ports: isGreen ? greenPorts : ports }, (webInterface || dockerInterface).name);

    if (logToTerminal) {
      logger.info(
        // eslint-disable-next-line no-nested-ternary
        `Checking endpoint healthy for ${meta.title}, port: ${port}${actualPort ? ' (actual)' : envPort ? ' (from pm2 env)' : ' (from db)'}, minConsecutiveTime: ${
          minConsecutiveTime / 1000
        }s, timeout: ${timeout / 1000}s`
      );
    }

    if (
      actualPort &&
      actualPort !== envPort &&
      actualPort !==
        (isGreen
          ? greenPorts?.[webInterface?.port || dockerInterface?.port]
          : ports?.[webInterface?.port || dockerInterface?.port])
    ) {
      logger.info('Port mismatch detected, using actual port for health check', {
        processId,
        appDid,
        actualPort,
        envPort,
        dbPort: isGreen
          ? greenPorts?.[webInterface?.port || dockerInterface?.port]
          : ports?.[webInterface?.port || dockerInterface?.port],
      });
    }

    try {
      await ensureEndpointHealthy({
        port,
        protocol: webInterface ? 'http' : 'tcp',
        minConsecutiveTime,
        timeout,
        doConsecutiveCheck: blocklet.mode !== BLOCKLET_MODES.DEVELOPMENT,
        waitTCP: !webInterface,
        shouldAbort: async () => {
          // Check if pm2 process exists and is online
          try {
            const info = await getProcessInfo(processId, { timeout: 3_000 });
            const currentStatus = info.pm2_env.status;
            if (currentStatus !== 'online') {
              throw new Error(`pm2 process ${processId} status is ${currentStatus}, not online`);
            }
          } catch (err) {
            // If process doesn't exist or has error, abort immediately
            logger.error('pm2 process check failed in shouldAbort', { appDid, error: err, processId, name });
            const isProcessNotExist =
              err.message &&
              (err.message.includes('not found') ||
                err.message.includes('does not exist') ||
                err.message.includes('not running'));
            if (isProcessNotExist) {
              throw new Error(`pm2 process ${processId} (${name}) died or does not exist: ${err.message}`);
            }
            throw new Error(`pm2 process ${processId} (${name}) check failed: ${err.message}`);
          }
        },
      });
    } catch (error) {
      const isProcessDead =
        error.message &&
        (error.message.includes('pm2 process') ||
          error.message.includes('died') ||
          error.message.includes('does not exist'));
      if (isProcessDead) {
        logger.error('blocklet process died during health check', {
          appDid,
          processId,
          name,
          port,
          error: error.message,
        });
        throw error;
      }
      logger.error('ensure endpoint healthy failed', {
        appDid,
        port,
        minConsecutiveTime,
        timeout,
        error: error.message,
      });
      throw error;
    }
  } catch (error) {
    logger.error('start blocklet failed', { processId, name });
    throw error;
  }
};

/**
 * Check if all blocklet components are healthy
 * @param {object} blocklet - Root blocklet
 * @param {object} options - Options
 * @param {number} options.minConsecutiveTime - Minimum consecutive healthy time
 * @param {number} options.timeout - Timeout in ms
 * @param {Array} options.componentDids - Component DIDs to check
 * @param {Function} options.setBlockletRunning - Callback when blocklet becomes running
 * @param {boolean} options.isGreen - Whether checking green deployment
 * @param {string} options.appDid - App DID for logging
 * @param {Function} options.findInterfacePortByName - Function to find port by interface name
 * @returns {Promise<void>}
 */
const checkBlockletProcessHealthy = async (
  blocklet,
  {
    minConsecutiveTime,
    timeout,
    componentDids,
    setBlockletRunning,
    isGreen = false,
    appDid,
    findInterfacePortByName,
  } = {}
) => {
  await forEachBlocklet(
    blocklet,
    async (b) => {
      if (b.meta.group === BlockletGroup.gateway) {
        return;
      }

      // components that relies on another engine component should not be checked
      const engine = getBlockletEngine(b.meta);
      if (engine.interpreter === 'blocklet') {
        return;
      }

      if (!hasStartEngine(b.meta)) {
        return;
      }

      if (shouldSkipComponent(b.meta.did, componentDids)) {
        logger.info('skip check component healthy', { processId: b.env.processId });
        return;
      }

      const logToTerminal = [blocklet.mode, b.mode].includes(BLOCKLET_MODES.DEVELOPMENT);

      const startedAt = Date.now();

      await _checkProcessHealthy(b, {
        minConsecutiveTime,
        timeout,
        logToTerminal,
        isGreen,
        appDid,
        findInterfacePortByName,
      });

      logger.info('done check component healthy', { processId: b.env.processId, time: Date.now() - startedAt });

      if (setBlockletRunning) {
        try {
          await setBlockletRunning(b.meta.did);
        } catch (error) {
          logger.error(`Failed to set blocklet as running for DID: ${b.meta.name || b.meta.did}`, { error });
        }
      }
    },
    { parallel: true }
  );
};

/**
 * Check if a blocklet should have health check
 * @param {object} blocklet - Blocklet component
 * @returns {boolean}
 */
const shouldCheckHealthy = (blocklet) => {
  if (blocklet.meta.group === BlockletGroup.gateway) {
    return false;
  }

  // components that relies on another engine component should not be checked
  const engine = getBlockletEngine(blocklet.meta);
  if (engine.interpreter === 'blocklet') {
    return false;
  }

  return hasStartEngine(blocklet.meta);
};

/**
 * Check if blocklet port is healthy
 * @param {object} blocklet - Blocklet object
 * @param {object} options - Options
 * @param {number} options.minConsecutiveTime - Minimum consecutive healthy time (default 3000ms)
 * @param {number} options.timeout - Timeout in ms (default 10s)
 * @returns {Promise<void>}
 */
const isBlockletPortHealthy = async (blocklet, { minConsecutiveTime = 3000, timeout = 10 * 1000 } = {}) => {
  if (!blocklet) {
    return;
  }
  const { environments } = blocklet;
  const webInterface = (blocklet.meta?.interfaces || []).find((x) => x.type === BLOCKLET_INTERFACE_TYPE_WEB);
  const dockerInterface = (blocklet.meta?.interfaces || []).find((x) => x.type === BLOCKLET_INTERFACE_TYPE_DOCKER);
  const key = webInterface?.port || dockerInterface?.port || 'BLOCKLET_PORT';

  let port = blocklet.greenStatus === BlockletStatus.running ? blocklet.greenPorts?.[key] : blocklet.ports?.[key];

  if (!port) {
    const keyPort = webInterface?.port || dockerInterface?.port;
    port = environments?.find((e) => e.key === keyPort)?.value;
  }

  if (!port) {
    return;
  }

  await ensureEndpointHealthy({
    port,
    protocol: webInterface ? 'http' : 'tcp',
    minConsecutiveTime,
    timeout,
    doConsecutiveCheck: false,
  });
};

module.exports = {
  getActualListeningPort,
  getHealthyCheckTimeout,
  _checkProcessHealthy,
  checkBlockletProcessHealthy,
  shouldCheckHealthy,
  isBlockletPortHealthy,
};
