const fs = require('fs');
const chalk = require('chalk');
const yaml = require('js-yaml');
const path = require('path');
const ABTNode = require('@abtnode/core');
const security = require('@abtnode/util/lib/security');
const { WsClient } = require('@arcblock/ws');
const { isFromPublicKey } = require('@arcblock/did');
const { getBaseUrls } = require('@abtnode/core/lib/util');
const { ensureDockerPostgres } = require('@abtnode/core/lib/util/docker/ensure-docker-postgres');

const debug = require('./debug')('node');
const { version } = require('../package.json');

const util = require('./util');
const {
  getDataDirectoryByConfigFile,
  getConfigFile,
  joinKFile,
  getConfigDir,
  verifyDataDirectory,
} = require('./manager');

const { print, printError, printInfo } = util;

const isHex = (str) => /^0x[0-9a-f]+$/i.test(str);

const getOwner = (info) => {
  if (info && info.pk && info.did && isFromPublicKey(info.did, info.pk)) {
    return info;
  }

  return undefined;
};

const printConfigError = () => {
  printError('Cannot find config file for Blocklet Server');
  printInfo(`Please initialize a configuration directory first: run ${chalk.cyan('blocklet server init')}`);
  print();
};

let instance = null;
let client = null;

const readNodeConfig = async (dir) => {
  const configDir = await getConfigDir(dir);
  if (fs.existsSync(configDir)) {
    try {
      verifyDataDirectory(configDir);
    } catch (error) {
      debug('validate data directory failed:', error);
      printError('Validate data directory failed:', error.message);
      process.exit(1);
    }
  } else {
    printConfigError();
    process.exit(1); // TODO: Hate early-exit functions like this — extremely hard to debug
  }

  const configFile = await getConfigFile(dir);

  let config = {};
  try {
    config = yaml.load(fs.readFileSync(configFile).toString(), { json: true });
    const ukFile = joinKFile(configDir);
    if (fs.existsSync(ukFile) && isHex(config.node.sk) === false) {
      config.node.sk = security.decrypt(config.node.sk, config.node.did, fs.readFileSync(ukFile));
    }
  } catch (err) {
    debug(err);
    printError('Blocklet Server config parse failed', err.message);
    process.exit(1);
  }

  return { config, configFile, dataDir: getDataDirectoryByConfigFile(configFile) };
};

const readNodeConfigWithValidate = async (dir) => {
  const { config, configFile, dataDir } = await readNodeConfig(dir);

  // validate node config
  const wallet = util.getWallet(config.node.sk);
  if (wallet.address !== config.node.did) {
    printError('config.node.sk and config.node.did does not match');
    process.exit(1);
  }

  if (!config.node.port) {
    printError('config.node.port must be specified');
    process.exit(1);
  }

  printInfo('Server DID', chalk.cyan(config.node.did));

  return { config, configFile, dataDir };
};

async function getNode({ dir = process.cwd() } = {}) {
  const { config, configFile, dataDir } = await readNodeConfigWithValidate(dir);
  if (!process.env.ABT_NODE_CACHE_SQLITE_PATH) {
    process.env.ABT_NODE_CACHE_SQLITE_PATH = path.join(dataDir, 'core', 'db-cache.db');
  }

  if (typeof config.env?.ABT_NODE_DID_DOCUMENT_UPDATE !== 'undefined') {
    process.env.ABT_NODE_DID_DOCUMENT_UPDATE = config.env.ABT_NODE_DID_DOCUMENT_UPDATE;
  }

  if (!process.env.ABT_NODE_POSTGRES_URL) {
    const postgresUrl = await ensureDockerPostgres(dataDir);
    process.env.ABT_NODE_POSTGRES_URL = postgresUrl;
  }

  util.ensurePermission(dataDir);

  printInfo('Server config from', chalk.cyan(configFile));

  const wallet = util.getWallet(config.node.sk);
  const node = ABTNode({
    version,
    nodeSk: wallet.secretKey,
    nodePk: wallet.publicKey,
    nodeDid: wallet.address,
    port: config.node.port,
    dataDir,
    nodeOwner: getOwner(config.node.owner),
    name: config.node.name,
    description: config.node.description,
    blockletPort: config.blocklet.port,
    routing: config.node.routing,
    docker: config.node.docker,
    mode: config.node.mode,
    runtimeConfig: config.node.runtimeConfig,
    ownerNft: config.node.ownerNft || { holder: '', issuer: '' },
    launcher: config.node.launcher,
    registerUrl: config.node.registerUrl,
    didRegistry: config.node.didRegistry,
    didDomain: config.node.didDomain,
    slpDomain: config.node.slpDomain,
    enablePassportIssuance: config.node.enablePassportIssuance,
    trustedPassports: config.node.trustedPassports,
    webWalletUrl: config.node.webWalletUrl,
  });

  return {
    node,
    config,
    dataDir,
    configFile,
    wallet,
    getBaseUrls: (ips) => getBaseUrls(node, ips),
    publishEvent: (event, data) => publishEvent(node, event, data),
    getWsClient: () => getWsClient(node),
  };
}

async function getWsClient(node) {
  if (!client) {
    const info = await node.getNodeInfo();
    const endpoint = `ws://127.0.0.1:${info.port}`;
    const wallet = util.getWallet(info.sk);
    const timestamp = Date.now().toString();

    const token = await wallet.sign(timestamp);

    client = new WsClient(endpoint, {
      silent: true,
      params: () => ({
        token,
        timestamp,
      }),
    });

    process.on('exit', () => {
      client.disconnect();
    });
  }

  if (client.isConnected()) {
    return client;
  }

  return new Promise((resolve, reject) => {
    client.onOpen(() => {
      resolve(client);
    });

    client.onError((err) => {
      reject(new Error(`Failed to connect to daemon socket server: ${err.message}`));
    });

    client.connect();
  });
}

function publishEvent(node, event, data) {
  return new Promise((resolve, reject) => {
    getWsClient(node)
      .then((c) => {
        const channel = c.channel('cli');
        channel
          .join()
          .receive('ok', () => {
            channel.push(event, data);
            channel.leave();
            resolve(true);
          })
          .receive('error', (err) => {
            reject(new Error(`join channel error: ${err.message}`));
          })
          .receive('timeout', () => {
            reject(new Error('join channel timeout: cli'));
          });
      })
      .catch((err) => reject(err));
  });
}

module.exports = {
  getNode: async (...args) => {
    if (instance) {
      return instance;
    }

    instance = await getNode(...args);
    return instance;
  },
  readNodeConfig,
  readNodeConfigWithValidate,
  publishEvent,
  getWsClient,
};
