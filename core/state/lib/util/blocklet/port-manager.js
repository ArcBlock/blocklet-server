/* eslint-disable no-await-in-loop */
/**
 * Port Manager Module
 *
 * Functions for managing blocklet port allocation and conflict resolution
 * Extracted from blocklet.js for better modularity
 */

const logger = require('@abtnode/logger')('@abtnode/core:util:blocklet:port-manager');
const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');
const { isPortTaken } = require('@abtnode/util/lib/port');
const { forEachComponentV2 } = require('@blocklet/meta/lib/util');

const { shouldSkipComponent } = require('./process-manager');

// Lock for port assignment to prevent race conditions in multi-process environment
const portAssignLock = new DBCache(() => ({
  ...getAbtNodeRedisAndSQLiteUrl(),
  prefix: 'blocklet-port-assign-lock',
  ttl: 1000 * 30, // 30 seconds timeout
}));

/**
 * Ensure ports shape matches between ports and greenPorts
 * @param {object} _states - States (unused)
 * @param {object} portsA - Source ports
 * @param {object} portsB - Target ports to fill
 */
const ensurePortsShape = (_states, portsA, portsB) => {
  if (!portsA || Object.keys(portsA).length === 0) {
    return;
  }
  if (Object.keys(portsB).length === 0) {
    for (const key of Object.keys(portsA)) {
      portsB[key] = portsA[key];
    }
  }
};

/**
 * Ensure app ports are not occupied, refresh if needed
 * @param {object} options - Options
 * @param {object} options.blocklet - Blocklet object
 * @param {Array} options.componentDids - Component DIDs to check
 * @param {object} options.states - State managers
 * @param {object} options.manager - Blocklet manager
 * @param {boolean} options.isGreen - Whether checking green ports
 * @returns {Promise<object>} Updated blocklet
 */
const ensureAppPortsNotOccupied = async ({ blocklet, componentDids: inputDids, states, manager, isGreen = false }) => {
  const { did } = blocklet.meta;
  const lockName = `port-check-${did}`;

  // ⚠️ 关键修复：使用 DBCache 锁确保端口分配的原子性
  // 在多进程环境下，防止多个进程同时检查同一个端口
  await portAssignLock.acquire(lockName);

  try {
    const occupiedDids = new Set();

    await forEachComponentV2(blocklet, async (b) => {
      try {
        if (shouldSkipComponent(b.meta.did, inputDids)) return;

        if (!b.greenPorts) {
          occupiedDids.add(b.meta.did);
          b.greenPorts = {};
        }
        const { ports = {}, greenPorts } = b;
        ensurePortsShape(states, ports, greenPorts);

        const targetPorts = isGreen ? greenPorts : ports;

        let currentOccupied = false;
        for (const port of Object.values(targetPorts)) {
          currentOccupied = await isPortTaken(port);
          if (currentOccupied) {
            break;
          }
        }

        if (currentOccupied) {
          occupiedDids.add(b.meta.did);
        }
      } catch (error) {
        logger.error('Failed to check ports occupied', { error, blockletDid: b.meta.did, isGreen });
      }
    });

    if (occupiedDids.size === 0) {
      logger.info('No occupied ports detected, no refresh needed', { did, isGreen });
      return blocklet;
    }

    const componentDids = Array.from(occupiedDids);
    const {
      refreshed,
      componentDids: actuallyRefreshedDids,
      isInitialAssignment,
    } = await states.blocklet.refreshBlockletPorts(did, componentDids, isGreen);

    // 只有真正刷新了端口才打印日志和更新环境
    if (refreshed && actuallyRefreshedDids.length > 0) {
      // 区分首次分配和冲突刷新，使用不同的日志信息
      if (isInitialAssignment) {
        logger.info('Assigned green ports for blue-green deployment', {
          did,
          componentDids: actuallyRefreshedDids,
          isGreen,
        });
      } else {
        logger.info('Refreshed component ports due to conflict', {
          did,
          componentDids: actuallyRefreshedDids,
          isGreen,
        });
      }

      await manager._updateBlockletEnvironment(did);
      const newBlocklet = await manager.ensureBlocklet(did);

      return newBlocklet;
    }

    logger.info('Ports were detected as occupied but not actually occupied during refresh, no refresh needed', {
      did,
      componentDids,
      isGreen,
    });

    return blocklet;
  } finally {
    await portAssignLock.releaseLock(lockName);
  }
};

module.exports = {
  portAssignLock,
  ensurePortsShape,
  ensureAppPortsNotOccupied,
};
