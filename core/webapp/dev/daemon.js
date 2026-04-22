/* eslint-disable no-console */
require('dotenv-flow').config();
const expandTilde = require('expand-tilde');
const { promisify } = require('util');
const path = require('path');
const dns = require('dns');

if (!process.env.ABT_NODE_UPDATER_PORT) {
  process.env.ABT_NODE_UPDATER_PORT = 40405;
}
if (!process.env.ABT_NODE_SERVICE_PORT) {
  process.env.ABT_NODE_SERVICE_PORT = 40406;
}

if (!process.env.ABT_NODE_DATA_DIR) {
  process.env.ABT_NODE_DATA_DIR = path.join(__dirname, '../../../.abtnode');
} else {
  process.env.ABT_NODE_DATA_DIR = expandTilde(process.env.ABT_NODE_DATA_DIR);
}

if (!process.env.ABT_NODE_CACHE_SQLITE_PATH) {
  process.env.ABT_NODE_CACHE_SQLITE_PATH = path.join(process.env.ABT_NODE_DATA_DIR, 'core', 'db-cache.db');
}

const { updateServerDocument } = require('@abtnode/util/lib/did-document');
const getIP = require('@abtnode/util/lib/get-ip');
const getAppWallet = require('@abtnode/util/lib/get-app-wallet');
const { encode } = require('@abtnode/util/lib/base32');

process.env.ABT_NODE_LOG_DIR = path.join(process.env.ABT_NODE_DATA_DIR, 'logs', '_abtnode'); // enable log
process.env.ABT_NODE_DID = getAppWallet(process.env.ABT_NODE_SK).address;
process.env.ABT_NODE_MAX_CLUSTER_SIZE = 1;
process.env.ABT_NODE_DAEMON_CLUSTER_SIZE = 1;

const { name, version } = require('../package.json');
const { getNode } = require('./util');

const port = parseInt(process.env.ABT_NODE_PORT, 10) || 3000;
const { node } = getNode({ daemon: true, service: false });

let createServer = require('../api');
const { wrapSpinner } = require('../../cli/lib/ui');
const { wallet } = require('../api/libs/auth');

const sleep = ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line
  createServer = require('../blocklet');
}

const lookup = promisify(dns.lookup);

node.onReady(async () => {
  node.collectorPath = path.dirname(require.resolve('@blocklet/form-collector'));
  node.themeBuilderPath = path.dirname(require.resolve('@blocklet/theme-builder'));
  const server = createServer(node);
  /* istanbul ignore next */
  // eslint-disable-next-line no-underscore-dangle
  if (global.__coverage__) {
    // eslint-disable-next-line
    require('@cypress/code-coverage/middleware/express')(server.app);
  }
  await sleep(1000);
  const info = await node.getNodeInfo();
  const initialized = await node.isInitialized();
  if (initialized) {
    await wrapSpinner('Updating blocklet environments...', async () => {
      await node.updateAllBlockletEnvironment();
    });
  }

  if (!process.env.SKIP_ENSURE_ROUTING) {
    await node.ensureDashboardRouting();
  }

  if (!process.env.SKIP_UPDATE_CERTS) {
    try {
      await node.ensureWildcardCerts();
      console.log('Fetch wildcard certificates successfully');
    } catch (error) {
      console.error(error);
      console.error(`Fetch wildcard certificates failed: ${error.message}`);
    }
  }

  if (!process.env.SKIP_UPDATE_DNS) {
    const { internal } = await getIP({ includeV6: false, includeExternal: false });

    console.log('Current IP:', internal);

    const didDomain = `${encode(wallet.address)}.${info.didDomain}`;
    console.log('DID domain:', didDomain);

    let resolvedIP = '';
    try {
      const result = await lookup(didDomain, { rrtype: 'A' });
      console.log(`Resolved ${didDomain}:`, result);
      if (result) {
        resolvedIP = result.address;
      }
    } catch (error) {
      console.error('Resolve did domain DNS failed:', error);
    }

    if (internal !== resolvedIP) {
      await wrapSpinner(
        'Updating DID Domain...',
        async () => {
          await updateServerDocument({
            ips: [internal],
            didRegistryUrl: info.didRegistry,
            wallet,
            domain: info.didDomain,
            blockletServerVersion: version,
          });
        },
        { throwOnError: false, printErrorFn: console.error }
      );
    }
  }

  server.listen(port, async err => {
    if (err) throw err;

    await node.handleAllRouting({ message: 'server start' });
    console.log(`> Routing engine ready: ${info.routing.provider}`);
    console.log(`> ${name} v${version} ready on ${port}`);
  });

  // 可以执行相关迁移脚本, 不需要等待迁移完成
  if (process.env.NODE_ENV !== 'test') {
    node.migrateAuditLog();
  }
});
