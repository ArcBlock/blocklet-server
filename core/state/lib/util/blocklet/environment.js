/**
 * Environment Module
 *
 * Functions for managing blocklet environment variables and configuration
 * Extracted from blocklet.js for better modularity
 */

const fs = require('fs-extra');
const path = require('node:path');
const get = require('lodash/get');
const isNil = require('lodash/isNil');
const toLower = require('lodash/toLower');
const { slugify } = require('transliteration');

const { toHex } = require('@ocap/util');
const { fromSecretKey } = require('@ocap/wallet');
const { urlPathFriendly } = require('@blocklet/meta/lib/url-path-friendly');
const logger = require('@abtnode/logger')('@abtnode/core:util:blocklet:environment');
const { formatEnv } = require('@abtnode/util/lib/security');
const { AIGNE_CONFIG_ENCRYPT_SALT } = require('@abtnode/constant');
const { decrypt } = require('@abtnode/util/lib/security');
const {
  BlockletSource,
  BLOCKLET_MODES,
  BLOCKLET_ENTRY_FILE,
  BLOCKLET_DEFAULT_PORT_NAME,
  BLOCKLET_CONFIGURABLE_KEY,
  BLOCKLET_TENANT_MODES,
  PROJECT,
} = require('@blocklet/constant');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { getApplicationWallet: getBlockletWallet } = require('@blocklet/meta/lib/wallet');
const {
  forEachBlockletSync,
  findWebInterface,
  getSharedConfigObj,
  getComponentName,
  getBlockletAppIdList,
  hasStartEngine,
} = require('@blocklet/meta/lib/util');
const { getComponentsInternalInfo } = require('@blocklet/meta/lib/blocklet');
const { getBlockletEngine } = require('@blocklet/meta/lib/engine');
const { getDidDomainForBlocklet } = require('@abtnode/util/lib/get-domain-for-blocklet');
const { getComponentApiKey } = require('@abtnode/util/lib/blocklet');
const { get: getEngine } = require('../../blocklet/manager/engine');

const { templateReplace, prettyURL } = require('../index');
const { getBundleDir } = require('./install-utils');

/**
 * Private node environment variables that should not be passed to blocklets
 */
const PRIVATE_NODE_ENVS = [
  'ABT_NODE_UPDATER_PORT',
  'ABT_NODE_SESSION_TTL',
  'ABT_NODE_ROUTER_PROVIDER',
  'ABT_NODE_DATA_DIR',
  'ABT_NODE_TOKEN_SECRET',
  'ABT_NODE_SK',
  'ABT_NODE_SESSION_SECRET',
  'ABT_NODE_BASE_URL',
  'ABT_NODE_LOG_LEVEL',
  'ABT_NODE_LOG_DIR',
  // in /core/cli/bin/blocklet.js
  'CLI_MODE',
  'ABT_NODE_HOME',
  'PM2_HOME',
  'ABT_NODE_CONFIG_FILE',
];

/**
 * @returns { dataDir, logsDir, cacheDir, appDir }
 * dataDir: dataDirs.data/name (root component) or dataDirs.data/name/childName (child component)
 * logsDir: dataDirs.log/name
 * cacheDir: dataDirs.cache/name (root component) or dataDirs.cache/name/childName (child component)
 * appDir: component bundle dir
 */
const getComponentDirs = (component, { dataDirs, ensure = false, ancestors = [] } = {}) => {
  const componentName = getComponentName(component, ancestors);

  const logsDir = path.join(dataDirs.logs, componentName);
  const dataDir = path.join(dataDirs.data, componentName);
  const cacheDir = path.join(dataDirs.cache, componentName);

  let appDir = null;
  if (component.source === BlockletSource.local) {
    appDir = component.deployedFrom;
  } else {
    appDir = getBundleDir(dataDirs.blocklets, component.meta);
  }

  if (!appDir) {
    throw new Error('Can not determine blocklet directory, maybe invalid deployment from local blocklets');
  }

  if (ensure) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      fs.mkdirSync(path.join(dataDir, PROJECT.DIR), { recursive: true });
      fs.mkdirSync(logsDir, { recursive: true });
      fs.mkdirSync(cacheDir, { recursive: true });
      fs.mkdirSync(appDir, { recursive: true }); // prevent getDiskInfo failed from custom blocklet
    } catch (err) {
      logger.error('make blocklet dir failed', { error: err });
    }
  }

  return { dataDir, logsDir, cacheDir, appDir };
};

/**
 * @param component {import('@blocklet/server-js').ComponentState & { environmentObj: {[key: string]: string } } }
 * @returns {{cwd, script, args, environmentObj, interpreter, interpreterArgs}: { args: []}}
 * @return {*}
 */
const getComponentStartEngine = (component, { e2eMode = false } = {}) => {
  if (!hasStartEngine(component.meta)) {
    return {};
  }

  const { appDir } = component.env;

  const cwd = appDir;

  // get app dirs
  const { group } = component.meta;

  let startFromDevEntry = '';
  if (component.mode === BLOCKLET_MODES.DEVELOPMENT && component.meta.scripts) {
    startFromDevEntry = component.meta.scripts.dev;
    if (e2eMode && component.meta.scripts.e2eDev) {
      startFromDevEntry = component.meta.scripts.e2eDev;
    }
  }

  const blockletEngineInfo = getBlockletEngine(component.meta);
  if (blockletEngineInfo.interpreter === 'blocklet') {
    return {};
  }

  let script = null;
  let interpreter;
  let interpreterArgs = [];
  const environmentObj = {};
  let args = [];

  if (startFromDevEntry) {
    script = startFromDevEntry;
  } else if (group === 'dapp') {
    script = blockletEngineInfo.source || BLOCKLET_ENTRY_FILE;
    args = blockletEngineInfo.args || [];
  }

  if (component.mode !== BLOCKLET_MODES.DEVELOPMENT) {
    const engine = getEngine(blockletEngineInfo.interpreter);
    interpreter = engine.interpreter === 'node' ? undefined : engine.interpreter;
    interpreterArgs = interpreterArgs.concat(engine.args ? [engine.args] : []);
  }

  return {
    cwd,
    script,
    args,
    environmentObj,
    interpreter,
    interpreterArgs: interpreterArgs.join(' ').trim(),
  };
};

/**
 * Get blocklet config object from configs array
 * @param {object} blocklet - Blocklet object with configs
 * @param {object} options - Options
 * @param {boolean} options.excludeSecure - Exclude secure configs
 * @returns {object} Config object
 */
const getBlockletConfigObj = (blocklet, { excludeSecure } = {}) => {
  const obj = (blocklet?.configs || [])
    .filter((x) => {
      if (excludeSecure) {
        return !x.secure;
      }
      return true;
    })
    .reduce((acc, x) => {
      acc[x.key] = templateReplace(x.value, blocklet);
      return acc;
    }, {});

  return obj;
};

/**
 * Get app-level system environment variables
 * @param {object} blocklet - Blocklet object
 * @param {object} nodeInfo - Node info with sk
 * @param {object} dataDirs - Data directories
 * @returns {object} Environment variables
 */
const getAppSystemEnvironments = (blocklet, nodeInfo, dataDirs) => {
  const { did, name, title, description } = blocklet.meta;
  const keys = Object.keys(BLOCKLET_CONFIGURABLE_KEY);
  const result = getBlockletInfo(
    {
      meta: blocklet.meta,
      environments: keys.map((key) => ({ key, value: blocklet.configObj[key] })).filter((x) => x.value),
    },
    nodeInfo.sk
  );

  const { wallet } = result;
  const appSk = toHex(wallet.secretKey);
  const appPk = toHex(wallet.publicKey);

  const appId = wallet.address;
  const appName = title || name || result.name;
  const appDescription = description || result.description;

  const isMigrated = Array.isArray(blocklet.migratedFrom) && blocklet.migratedFrom.length > 0;
  const appPid = blocklet.appPid || appId;
  const appPsk = toHex(isMigrated ? blocklet.migratedFrom[0].appSk : appSk);

  /* 获取 did domain 方式:
   * 1. 先从 site 里读
   * 2. 如果没有，再拼接
   */

  const pidDomain = getDidDomainForBlocklet({ did: appPid, didDomain: nodeInfo.didDomain });
  const domainAliases = get(blocklet, 'site.domainAliases') || [];

  let didDomain = domainAliases.find((item) => toLower(item.value) === toLower(pidDomain));

  if (!didDomain) {
    didDomain = domainAliases.find(
      (item) => item.value.endsWith(nodeInfo.didDomain) || item.value.endsWith('did.staging.arcblock.io') // did.staging.arcblock.io 是旧 did domain, 但主要存在于比较旧的节点中, 需要做兼容
    );
  }

  const appUrl = didDomain ? prettyURL(didDomain.value, true) : `https://${pidDomain}`;

  return {
    BLOCKLET_DID: did, // BLOCKLET_DID is always same as BLOCKLET_APP_PID in structV2 application
    BLOCKLET_APP_PK: appPk,
    BLOCKLET_APP_SK: appSk,
    BLOCKLET_APP_ID: appId,
    BLOCKLET_APP_PSK: appPsk, // permanent sk even the blocklet has been migrated
    BLOCKLET_APP_PID: appPid, // permanent did even the blocklet has been migrated
    BLOCKLET_APP_NAME: appName,
    BLOCKLET_APP_NAME_SLUG: urlPathFriendly(slugify(appName)),
    BLOCKLET_APP_DESCRIPTION: appDescription,
    BLOCKLET_APP_URL: appUrl,
    BLOCKLET_APP_DATA_DIR: path.join(dataDirs.data, blocklet.meta.name),
    BLOCKLET_APP_TENANT_MODE: result.tenantMode || BLOCKLET_TENANT_MODES.SINGLE,
    BLOCKLET_APP_SALT: blocklet.settings?.session?.salt || '',
  };
};

/**
 * Get app-level overwritten environment variables from config
 * @param {object} blocklet - Blocklet object with configObj
 * @param {object} nodeInfo - Node info with sk
 * @returns {object} Environment variables
 */
const getAppOverwrittenEnvironments = (blocklet, nodeInfo) => {
  const result = {};
  if (!blocklet || !blocklet.configObj) {
    return result;
  }

  Object.keys(BLOCKLET_CONFIGURABLE_KEY).forEach((x) => {
    if (!blocklet.configObj[x]) {
      return;
    }

    result[x] = blocklet.configObj[x];
  });

  const keys = ['BLOCKLET_APP_SK', 'BLOCKLET_APP_CHAIN_TYPE', 'BLOCKLET_WALLET_TYPE'];
  const isAppDidRewritten = keys.some((key) => blocklet.configObj[key]);
  if (!isAppDidRewritten) {
    return result;
  }

  // We use user configuration here without any validation since the validation is done during update phase
  const { wallet } = getBlockletInfo(
    {
      meta: blocklet.meta,
      environments: keys.map((key) => ({ key, value: blocklet.configObj[key] })).filter((x) => x.value),
    },
    nodeInfo.sk
  );
  result.BLOCKLET_APP_ID = wallet.address;

  return result;
};

/**
 * Get component-level system environment variables
 * @param {object} blocklet - Blocklet object with env and ports
 * @returns {object} Environment variables
 */
const getComponentSystemEnvironments = (blocklet) => {
  const { port, ports } = blocklet;
  const portEnvironments = {};
  if (port) {
    portEnvironments[BLOCKLET_DEFAULT_PORT_NAME] = port;
  }

  if (ports) {
    Object.assign(portEnvironments, ports);
  }

  return {
    BLOCKLET_REAL_DID: blocklet.env.id, // <appDid>/componentDid> e.g. xxxxx/xxxxx
    BLOCKLET_REAL_NAME: blocklet.env.name,
    BLOCKLET_COMPONENT_DID: blocklet.meta.did, // component meta did e.g. xxxxxx
    BLOCKLET_COMPONENT_VERSION: blocklet.meta.version,
    BLOCKLET_DATA_DIR: blocklet.env.dataDir,
    BLOCKLET_LOG_DIR: blocklet.env.logsDir,
    BLOCKLET_CACHE_DIR: blocklet.env.cacheDir,
    BLOCKLET_APP_DIR: blocklet.env.appDir,
    ...portEnvironments,
  };
};

/**
 * Set 'configs', 'configObj', 'environmentObj' to blocklet
 * @param {object} blocklet - Blocklet to fill configs for
 * @param {Array} configs - Configs array
 * @param {object} options - Optional: { rootBlocklet, nodeInfo, dataDirs }
 */
const fillBlockletConfigs = (blocklet, configs, options = {}) => {
  blocklet.configs = configs || [];
  blocklet.configObj = getBlockletConfigObj(blocklet);
  blocklet.environments = blocklet.environments || [];
  blocklet.environmentObj = blocklet.environments.reduce((acc, x) => {
    acc[x.key] = templateReplace(x.value, blocklet);
    return acc;
  }, {});

  // After migration: ensure all component system environments are set from blocklet.env if available
  // This ensures children loaded from blocklet_children table have all required env vars in environmentObj
  if (blocklet.env) {
    try {
      const componentSystemEnvs = getComponentSystemEnvironments(blocklet);
      // Only set env vars that are not already set
      Object.entries(componentSystemEnvs).forEach(([key, value]) => {
        if (value !== undefined && value !== null && !blocklet.environmentObj[key]) {
          blocklet.environmentObj[key] = value;
        }
      });
    } catch (error) {
      // If getting component system environments fails, log warning but continue
      logger.warn('fillBlockletConfigs: failed to get component system environments', {
        blockletDid: blocklet.meta?.did,
        error: error.message,
      });
    }
  }

  // For children: also set app-level environment variables from root blocklet
  // This ensures children have app-level env vars like BLOCKLET_APP_ID
  const { rootBlocklet, nodeInfo, dataDirs } = options;
  if (rootBlocklet && nodeInfo && dataDirs && blocklet !== rootBlocklet) {
    try {
      const appSystemEnvs = getAppSystemEnvironments(rootBlocklet, nodeInfo, dataDirs);
      const appOverwrittenEnvs = getAppOverwrittenEnvironments(rootBlocklet, nodeInfo);
      // Only set env vars that are not already set
      Object.entries({ ...appSystemEnvs, ...appOverwrittenEnvs }).forEach(([key, value]) => {
        if (value !== undefined && value !== null && !blocklet.environmentObj[key]) {
          blocklet.environmentObj[key] = value;
        }
      });
    } catch (error) {
      // If getting app system environments fails, log warning but continue
      logger.warn('fillBlockletConfigs: failed to get app system environments', {
        blockletDid: blocklet.meta?.did,
        rootDid: rootBlocklet.meta?.did,
        error: error.message,
      });
    }
  }
};

/**
 * Get runtime environment variables for a blocklet process
 * @param {object} blocklet - Blocklet object
 * @param {object} nodeEnvironments - Node environment variables
 * @param {Array} ancestors - Ancestor blocklets
 * @param {boolean} isGreen - Whether this is a green deployment
 * @returns {object} Environment variables
 */
const getRuntimeEnvironments = (blocklet, nodeEnvironments, ancestors, isGreen = false) => {
  const root = (ancestors || [])[0] || blocklet;

  const initialized = root?.settings?.initialized;

  const environmentObj = { ...(blocklet.environmentObj || {}) };
  if (isGreen && blocklet.greenPorts) {
    Object.entries(blocklet.greenPorts).forEach(([key, value]) => {
      if (!value) {
        return;
      }
      environmentObj[key] = value;
      if (key === BLOCKLET_DEFAULT_PORT_NAME || key === 'BLOCKLET_PORT') {
        environmentObj[BLOCKLET_DEFAULT_PORT_NAME] = value;
      }
    });
  }

  // pm2 will force inject env variables of daemon process to blocklet process
  // we can only rewrite these private env variables to empty
  const safeNodeEnvironments = PRIVATE_NODE_ENVS.reduce((o, x) => {
    o[x] = '';
    return o;
  }, {});

  // get devEnvironments, when blocklet is in dev mode
  const devEnvironments =
    blocklet.mode === BLOCKLET_MODES.DEVELOPMENT
      ? {
          BLOCKLET_DEV_MOUNT_POINT: blocklet?.mountPoint || '',
        }
      : {};

  // BLOCKLET_DEV_PORT should NOT in components of production mode
  if (process.env.BLOCKLET_DEV_PORT) {
    devEnvironments.BLOCKLET_DEV_PORT =
      blocklet.mode === BLOCKLET_MODES.DEVELOPMENT ? process.env.BLOCKLET_DEV_PORT : '';
  }

  const ports = {};
  forEachBlockletSync(root, (x) => {
    const webInterface = findWebInterface(x);
    const envObj = x.meta?.did === blocklet.meta?.did ? environmentObj : x.environmentObj;
    if (webInterface && envObj?.[webInterface.port]) {
      ports[envObj.BLOCKLET_REAL_NAME] = envObj[webInterface.port];
    }
  });

  const componentsInternalInfo = getComponentsInternalInfo(root);

  // use index 1 as the path to derive deterministic encryption key for blocklet
  const derivedEkWallet = get(nodeEnvironments, 'ABT_NODE_SK')
    ? getBlockletWallet(blocklet.meta.did, nodeEnvironments.ABT_NODE_SK, undefined, 1)
    : null;
  const persistedEk = blocklet.appEk;

  // For Access Key authentication, components should use root app's wallet
  // This ensures consistent accessKeyId across parent and child components
  const accessWallet = get(nodeEnvironments, 'ABT_NODE_SK')
    ? getBlockletWallet(root.appDid || root.meta.did, nodeEnvironments.ABT_NODE_SK, undefined, 2)
    : null;

  const BLOCKLET_APP_IDS = getBlockletAppIdList(root).join(',');

  const componentApiKey = getComponentApiKey({
    serverSk: nodeEnvironments.ABT_NODE_SK,
    app: root,
    component: blocklet,
  });

  const blockletInfo = getBlockletInfo(blocklet, nodeEnvironments.ABT_NODE_SK, { returnWallet: true });

  const rootBlockletInfo =
    blocklet === root ? blockletInfo : getBlockletInfo(root, nodeEnvironments.ABT_NODE_SK, { returnWallet: true });

  const { wallet } = rootBlockletInfo;
  const appSk = toHex(wallet.secretKey);
  const appPk = toHex(wallet.publicKey);

  const ethWallet = fromSecretKey(appSk.slice(0, 66), 'ethereum');
  const ethPk = toHex(ethWallet.publicKey);

  const isMigrated = Array.isArray(root.migratedFrom) && root.migratedFrom.length > 0;
  const appPsk = toHex(isMigrated ? root.migratedFrom[0].appSk : appSk);

  // Calculate permanent public key (PPK)
  const appPpk = isMigrated ? toHex(fromSecretKey(appPsk, wallet.type).publicKey) : appPk;
  const ethPermanentWallet = fromSecretKey(appPsk.slice(0, 66), 'ethereum');
  const appPpkEth = toHex(ethPermanentWallet.publicKey);

  const env = {
    ...blocklet.configObj,
    ...getSharedConfigObj((ancestors || [])[0], blocklet, true),
    ...environmentObj,
    ...devEnvironments,
    BLOCKLET_MOUNT_POINTS: JSON.stringify(componentsInternalInfo),
    BLOCKLET_MODE: blocklet.mode || BLOCKLET_MODES.PRODUCTION,
    BLOCKLET_APP_EK: persistedEk || derivedEkWallet?.secretKey,
    // for login token authentication
    BLOCKLET_SESSION_SECRET: rootBlockletInfo.secret,
    BLOCKLET_APP_VERSION: root.meta.version,
    BLOCKLET_APP_IDS,
    BLOCKLET_COMPONENT_API_KEY: componentApiKey,
    BLOCKLET_APP_ASK: accessWallet?.secretKey,
    ...nodeEnvironments,
    ...safeNodeEnvironments,
    BLOCKLET_APP_PPK: appPpk, // permanent pk corresponding to PSK
    BLOCKLET_APP_PPK_ETH: appPpkEth, // permanent pk corresponding to PSK for ethereum
    BLOCKLET_APP_PK: appPk,
    BLOCKLET_APP_PK_ETH: ethPk,
  };

  const aigne = get(root, 'settings.aigne', {});
  const salt = root.meta.did || AIGNE_CONFIG_ENCRYPT_SALT;
  if (!isNil(aigne) && aigne.provider) {
    const { key, accessKeyId, secretAccessKey, provider } = aigne;
    const selectedModel = !aigne.model || aigne.model === 'auto' ? undefined : aigne.model;
    env.BLOCKLET_AIGNE_API_MODEL = selectedModel;
    env.BLOCKLET_AIGNE_API_PROVIDER = aigne.provider;
    const credential = {
      apiKey: key ? decrypt(key, salt, '') : key || '',
      accessKeyId: accessKeyId && provider === 'bedrock' ? decrypt(accessKeyId, salt, '') : accessKeyId || '',
      secretAccessKey:
        secretAccessKey && provider === 'bedrock' ? decrypt(secretAccessKey, salt, '') : secretAccessKey || '',
    };
    env.BLOCKLET_AIGNE_API_CREDENTIAL = JSON.stringify(credential);
    env.BLOCKLET_AIGNE_API_URL = aigne.url || '';
  }

  if (root?.environmentObj?.BLOCKLET_APP_DATA_DIR) {
    env.BLOCKLET_APP_SHARE_DIR = path.join(root.environmentObj.BLOCKLET_APP_DATA_DIR, '.share');
    env.BLOCKLET_SHARE_DIR = path.join(root.environmentObj.BLOCKLET_APP_DATA_DIR, '.share', blocklet.meta.did);
    if (!fs.existsSync(env.BLOCKLET_APP_SHARE_DIR) && process.env.ABT_NODE_DATA_DIR) {
      fs.mkdirSync(env.BLOCKLET_APP_SHARE_DIR, { recursive: true });
    }
  }

  if (initialized) {
    env.initialized = initialized;
  }

  if (isGreen && blocklet.greenPorts?.[BLOCKLET_DEFAULT_PORT_NAME]) {
    env[BLOCKLET_DEFAULT_PORT_NAME] = blocklet.greenPorts[BLOCKLET_DEFAULT_PORT_NAME];
  }

  // ensure all envs are literals and do not contain line breaks
  Object.keys(env).forEach((key) => {
    env[key] = formatEnv(env[key]);
  });

  return env;
};

module.exports = {
  PRIVATE_NODE_ENVS,
  getComponentDirs,
  getComponentStartEngine,
  getBlockletConfigObj,
  getAppSystemEnvironments,
  getAppOverwrittenEnvironments,
  getComponentSystemEnvironments,
  fillBlockletConfigs,
  getRuntimeEnvironments,
};
