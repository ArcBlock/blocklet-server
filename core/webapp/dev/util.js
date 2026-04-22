// eslint-disable-next-line import/no-extraneous-dependencies
const crypto = require('crypto');
const fs = require('fs-extra');

const ABTNode = require('@abtnode/core');
// eslint-disable-next-line import/no-extraneous-dependencies
const { joinKFile } = require('@blocklet/cli/lib/manager/config');
const isValidPort = require('@abtnode/util/lib/is-valid-port');
const {
  NODE_MODES,
  DEFAULT_HTTP_PORT,
  DEFAULT_HTTPS_PORT,
  DEFAULT_IP_DOMAIN,
  DEFAULT_WILDCARD_CERT_HOST,
  DEFAULT_DID_DOMAIN,
  DEFAULT_DID_REGISTRY,
  BLOCKLET_LAUNCHER_URL,
} = require('@abtnode/constant');
const { findExistsProvider } = require('@abtnode/router-provider');
const { runSchemaMigrations, closeDatabaseConnections } = require('@abtnode/core/lib/migrations');

const { wallet } = require('../api/libs/auth');
const { version } = require('../package.json');

const dataDir = process.env.ABT_NODE_DATA_DIR;
fs.ensureDirSync(dataDir);

// ensure dk
if (!fs.existsSync(joinKFile(dataDir))) {
  fs.writeFileSync(joinKFile(dataDir), crypto.randomBytes(32), { encoding: 'binary', mode: '0600' });
}

const ensureSchemaMigrations = async (dir = dataDir) => {
  await runSchemaMigrations({ dataDir: dir, blocklets: [] });
  await closeDatabaseConnections({ dataDir: dir, blocklets: [] });
};

const getNodeConfig = ({ daemon, service }) => {
  const port = parseInt(process.env.ABT_NODE_PORT, 10) || 3000;
  const defaultProvider = findExistsProvider();

  const config = {
    name: process.env.ABT_NODE_NAME,
    description: process.env.ABT_NODE_DESCRIPTION,
    port,
    version,
    dataDir,
    nodeSk: wallet.secretKey,
    nodePk: wallet.publicKey,
    nodeDid: wallet.address,
    didRegistry: process.env.ABT_NODE_DID_REGISTRY || DEFAULT_DID_REGISTRY,
    didDomain: process.env.ABT_NODE_DID_DOMAIN || DEFAULT_DID_DOMAIN,
    ownerNft: {
      holder: process.env.ABT_NODE_OWNER_NFT_HOLDER || '',
      issuer: process.env.ABT_NODE_OWNER_NFT_ISSUER || '',
    },
    routing: {
      https: true,
      provider: process.env.ABT_NODE_ROUTER_PROVIDER || defaultProvider,
      adminPath: process.env.ABT_NODE_ADMIN_PATH || '/admin',
      ipWildcardDomain: process.env.ABT_NODE_DASHBOARD_DOMAIN || DEFAULT_IP_DOMAIN,
      wildcardCertHost: process.env.ABT_NODE_WILDCARD_CERT_HOST || DEFAULT_WILDCARD_CERT_HOST,
      httpPort: isValidPort(Number(process.env.ABT_NODE_HTTP_PORT))
        ? Number(process.env.ABT_NODE_HTTP_PORT)
        : DEFAULT_HTTP_PORT,
      httpsPort: isValidPort(Number(process.env.ABT_NODE_HTTPS_PORT))
        ? Number(process.env.ABT_NODE_HTTPS_PORT)
        : DEFAULT_HTTPS_PORT,
    },
    mode: process.env.ABT_NODE_MODE || NODE_MODES.PRODUCTION,
    runtimeConfig: {
      blockletMaxMemoryLimit: 300,
      daemonMaxMemoryLimit: 300,
    },
    autoUpgrade: true,
    registerUrl: process.env.ABT_NODE_BLOCKLET_LAUNCHER_URL || BLOCKLET_LAUNCHER_URL,
    webWalletUrl: process.env.ABT_NODE_WEB_WALLET_URL || 'https://web.abtwallet.io/',
    daemon,
    service,
  };

  if (process.env.ABT_NODE_LAUNCHER_DID) {
    config.launcher = {
      did: process.env.ABT_NODE_LAUNCHER_DID,
    };
  }

  return config;
};

const getNode = ({ daemon, service } = {}) => {
  const config = getNodeConfig({ daemon, service });

  const node = ABTNode(config);

  return { node, config };
};

module.exports = { getNode, ensureSchemaMigrations };
