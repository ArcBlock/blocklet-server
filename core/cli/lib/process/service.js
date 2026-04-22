const fs = require('fs');
const path = require('path');

const { loadReloadEnv } = require('@abtnode/util/lib/pm2/pm2-start-or-reload');
const { isWorkerInstance } = require('@abtnode/util/lib/pm2/is-instance-worker');

loadReloadEnv();

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

if (!process.env.ABT_NODE_CACHE_SQLITE_PATH) {
  process.env.ABT_NODE_CACHE_SQLITE_PATH = path.join(process.env.ABT_NODE_DATA_DIR, 'core', 'db-cache.db');
}

const { joinURL } = require('ufo');
const { BlockletStatus, BlockletInternalEvents } = require('@blocklet/constant');
const { filterComponentsV2 } = require('@blocklet/meta/lib/util');
const { canReceiveMessages } = require('@blocklet/meta/lib/engine');

process.env.ABT_NODE_LOG_NAME = 'service';
process.env.ABT_NODE_LOG_DIR = path.join(process.env.ABT_NODE_DATA_DIR, 'logs', '_abtnode'); // enable log

const ABTNode = require('@abtnode/core');
const getNodeWallet = require('@abtnode/util/lib/get-app-wallet');

const createServer = require('@abtnode/blocklet-services');
const { setupGracefulShutdown } = require('@abtnode/util/lib/pm2/setup-graceful-shutdown');

const { version } = require('../../package.json');

const wallet = getNodeWallet(process.env.ABT_NODE_SK);
const port = Number(process.env.ABT_NODE_SERVICE_PORT);
const dataDir = process.env.ABT_NODE_DATA_DIR;

const node = ABTNode({
  nodeSk: wallet.secretKey,
  nodePk: wallet.publicKey,
  nodeDid: wallet.address,
  port: process.env.ABT_NODE_PORT,
  dataDir,
  blockletPort: process.env.ABT_NODE_BLOCKLET_PORT,
  service: true,
});

const notifyServerVersionToApps = async (server) => {
  try {
    const result = await node.getBlocklets({ includeRuntimeInfo: false });
    const apps = result.blocklets || [];
    const runningApps = apps.filter(
      (app) => filterComponentsV2(app, (x) => x.status === BlockletStatus.running && canReceiveMessages(x.meta)).length
    );
    await Promise.all(
      runningApps.map(async (app) => {
        await server.sendToAppComponents({
          appDid: app.appDid,
          event: BlockletInternalEvents.appConfigChanged,
          data: { configs: [{ key: 'ABT_NODE_VERSION', value: version }] },
        });
        await node.syncAppConfig(app, { serverVersion: version });
      })
    );
  } catch (error) {
    console.error(error);
  }
};

node.onReady(() => {
  const server = createServer(node);
  setupGracefulShutdown(server);

  server.listen(port, '0.0.0.0', async (err) => {
    if (err) throw err;
    // eslint-disable-next-line
    console.log(`> Blocklet Service ready on ${port}`);
    process.send?.('ready');

    if (isWorkerInstance()) {
      return;
    }

    try {
      if (dataDir && fs.existsSync(path.join(dataDir, 'start.lock')) === false) {
        const nodeInfo = await node.getNodeInfo();
        let action = '/logs/abtnode';
        if (process.env.NODE_ENV === 'production') {
          action = joinURL(nodeInfo.routing.adminPath, action);
        }
        await node.createNotification({
          teamDid: nodeInfo.did,
          title: 'Blocklet Service Crashed',
          description: `Seems like blocklet service (pid: ${process.pid}) just recovered from a crash, please check logs for more detail.`,
          entityType: 'node',
          severity: 'error',
          sticky: true,
          action,
        });
      }
    } catch {
      // Do nothing
    }

    setTimeout(() => {
      notifyServerVersionToApps(server);
    }, 1000 * 30);
  });
});
