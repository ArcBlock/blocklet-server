/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */

const { loadReloadEnv } = require('@abtnode/util/lib/pm2/pm2-start-or-reload');
const { isWorkerInstance } = require('@abtnode/util/lib/pm2/is-instance-worker');

loadReloadEnv();

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

const fs = require('fs');
const path = require('path');

if (!process.env.ABT_NODE_CACHE_SQLITE_PATH) {
  process.env.ABT_NODE_CACHE_SQLITE_PATH = path.join(process.env.ABT_NODE_DATA_DIR, 'core', 'db-cache.db');
}

const { joinURL } = require('ufo');

process.env.ABT_NODE_LOG_NAME = 'daemon';
process.env.ABT_NODE_LOG_DIR = path.join(process.env.ABT_NODE_DATA_DIR, 'logs', '_abtnode'); // enable log

const runningBefore = !!process.env.BLOCKLET_SERVER_RUNNING_BEFORE;

const logger = require('@abtnode/logger')('daemon');

const ABTNode = require('@abtnode/core');

const getNodeWallet = require('@abtnode/util/lib/get-app-wallet');

const { SERVER_STATUS } = require('@abtnode/constant');

const createServer = require('@abtnode/webapp/blocklet'); // eslint-disable-line

const { setupGracefulShutdown } = require('@abtnode/util/lib/pm2/setup-graceful-shutdown');
const { ensureBlockletRunning } = require('@abtnode/core/lib/blocklet/manager/ensure-blocklet-running');

const wallet = getNodeWallet(process.env.ABT_NODE_SK);
const dataDir = process.env.ABT_NODE_DATA_DIR;

const node = ABTNode({
  nodeSk: wallet.secretKey,
  nodePk: wallet.publicKey,
  nodeDid: wallet.address,
  port: process.env.ABT_NODE_PORT,
  dataDir,
  blockletPort: process.env.ABT_NODE_BLOCKLET_PORT,
  daemon: true,
});

node.collectorPath = path.dirname(require.resolve('@blocklet/form-collector'));
node.themeBuilderPath = path.dirname(require.resolve('@blocklet/theme-builder'));

logger.info('Waiting for Blocklet Server Daemon instance created');
node.onReady(async () => {
  logger.info('Blocklet Server Daemon instance was created');
  const info = await node.getNodeInfo();

  if (info.registerUrl && !info.registerInfo) {
    node.updateNodeInfo({ registerUrl: info.registerUrl }).catch((err) => {
      logger.error(`Failed to update launcher info from ${info.registerUrl}`, err);
    });
  }

  if (isWorkerInstance() === false) {
    const startRouting = process.env.ABT_NODE_START_ROUTING || 'system';
    if (startRouting === 'full') {
      await node.handleAllRouting({ message: 'server started (full rebuild)' });
    } else {
      // 'system' - default, fastest (O(1))
      await node.handleSystemRouting({ message: 'server started' });
    }
  }

  const server = createServer(node);
  setupGracefulShutdown(server);

  server.listen(process.env.ABT_NODE_PORT, '0.0.0.0', async (err) => {
    if (err) throw err;
    process.send?.('ready');
    console.info(`> Blocklet Server Daemon ready on ${process.env.ABT_NODE_PORT}`);

    if (isWorkerInstance()) {
      return;
    }

    // Should resume upgrading if we are in process
    const session = await node.isBeingMaintained();
    if (session) {
      console.info('> Resume maintain', session);
      await node.resumeMaintain(session);
    }

    try {
      await node.cleanupDirtyMaintainState();
    } catch (e) {
      console.error('Blocklet Server failed to cleanup dirty maintain state', e);
    }

    try {
      const initialized = await node.isInitialized();
      if (initialized) {
        // Regardless of whether the server previously crashed, always restart previously running components on server start (non-hot-reload)
        await node.updateNodeStatus(SERVER_STATUS.RUNNING);
        if (runningBefore) {
          logger.info('> Blocklet Server is restarted from running before');
          // If the server was running before, skip the rapid-restart check
          ensureBlockletRunning.whenCycleCheck = true;
        } else {
          logger.info('> Blocklet Server is stopped from running before');
        }
      }
    } catch (e) {
      console.error('> Blocklet Server failed to restart running blocklets', e);
    } finally {
      ensureBlockletRunning.canRunEnsureBlockletRunning = true;
    }

    try {
      if (dataDir && fs.existsSync(path.join(dataDir, 'start.lock')) === false) {
        let action = '/logs/abtnode';
        if (process.env.NODE_ENV === 'production') {
          action = joinURL(info.routing.adminPath, action);
        }
        await node.createNotification({
          teamDid: info.did,
          title: 'Blocklet Server Crashed',
          description: `Seems like blocklet server (did: ${info.did}, pid: ${process.pid}) just recovered from a crash, please check logs for more detail.`,
          entityType: 'node',
          severity: 'error',
          sticky: true,
          action,
        });
      }
    } catch {
      // Do nothing
    }
    if (process.env.NODE_ENV !== 'test') {
      node.migrateAuditLog(dataDir);
    }
  });
});
