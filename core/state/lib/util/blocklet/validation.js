/**
 * Validation Module
 *
 * Functions for validating blocklet configurations, structures, and compatibility
 * Extracted from blocklet.js for better modularity
 */

const semver = require('semver');
const isEmpty = require('lodash/isEmpty');
const isUrl = require('is-url');

const { types } = require('@ocap/mcrypto');
const { fromSecretKey } = require('@ocap/wallet');
const { isHex } = require('@ocap/util');
const logger = require('@abtnode/logger')('@abtnode/core:util:blocklet:validation');
const normalizePathPrefix = require('@abtnode/util/lib/normalize-path-prefix');
const { APP_STRUCT_VERSION } = require('@abtnode/constant');
const { chainInfo: chainInfoSchema } = require('@arcblock/did-connect-js/lib/schema');

const { BLOCKLET_CONFIGURABLE_KEY } = require('@blocklet/constant');
const { titleSchema, descriptionSchema, logoSchema } = require('@blocklet/meta/lib/schema');
const {
  forEachBlockletSync,
  forEachComponentV2,
  getDisplayName,
  getChainInfo,
  hasStartEngine,
} = require('@blocklet/meta/lib/util');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { hasMountPoint } = require('@blocklet/meta/lib/engine');

const formatName = require('@abtnode/util/lib/format-name');
const isRequirementsSatisfied = require('../requirement');
const { validate: validateEngine } = require('../../blocklet/manager/engine');

/**
 * Validate blocklet requirements and engine
 * @param {object} blocklet - Blocklet object
 * @param {Function} getBlockletEngineNameByPlatform - Function to get engine name
 */
const validateBlocklet = (blocklet, getBlockletEngineNameByPlatform) =>
  forEachComponentV2(blocklet, (b) => {
    isRequirementsSatisfied(b.meta.requirements);
    validateEngine(getBlockletEngineNameByPlatform(b.meta));
  });

/**
 * Validate blocklet chain info configuration
 * @param {object} blocklet - Blocklet object with configObj
 * @returns {object} Validated chain info
 */
const validateBlockletChainInfo = (blocklet) => {
  const chainInfo = getChainInfo({
    CHAIN_TYPE: blocklet.configObj[BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_CHAIN_TYPE],
    CHAIN_ID: blocklet.configObj[BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_CHAIN_ID],
    CHAIN_HOST: blocklet.configObj[BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_CHAIN_HOST],
  });

  const { error } = chainInfoSchema.validate(chainInfo);
  if (error) {
    throw error;
  }

  return chainInfo;
};

/**
 * Check for duplicate components
 * @param {Array} components - Array of components
 */
const checkDuplicateComponents = (components = []) => {
  const duplicates = components.filter(
    (item, index) => components.findIndex((x) => x.meta.did === item.meta.did) !== index
  );
  if (duplicates.length) {
    throw new Error(
      `Cannot add duplicate component${duplicates.length > 1 ? 's' : ''}: ${duplicates
        .map((x) => getDisplayName(x, true))
        .join(', ')}`
    );
  }
};

/**
 * Validate app config
 * @param {object} config - Config object
 * @param {object} states - State manager
 */
const validateAppConfig = async (config, states) => {
  const x = config;

  // sk should be force secured while other app prop should not be secured
  config.secure = x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SK;

  if (x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SK) {
    if (x.value) {
      let wallet;
      try {
        wallet = fromSecretKey(x.value, { role: types.RoleType.ROLE_APPLICATION });
      } catch {
        try {
          wallet = fromSecretKey(x.value, 'eth');
        } catch {
          throw new Error('Invalid custom blocklet secret key');
        }
      }

      // Ensure sk is not used by existing blocklets, otherwise we may encounter appDid collision
      const exist = await states.blocklet.hasBlocklet(wallet.address);
      if (exist) {
        throw new Error('Invalid custom blocklet secret key: already used by existing blocklet');
      }
    } else {
      delete x.value;
    }
  }

  if (x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_URL) {
    if (isEmpty(x.value)) {
      throw new Error(`${x.key} can not be empty`);
    }

    if (!isUrl(x.value)) {
      throw new Error(`${x.key}(${x.value}) is not a valid URL`);
    }
  }

  if (x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_NAME) {
    x.value = await titleSchema.validateAsync(x.value);
  }

  if (x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_DESCRIPTION) {
    x.value = await descriptionSchema.validateAsync(x.value);
  }

  if (
    [
      BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO,
      BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_RECT,
      BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_RECT_DARK,
      BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_SQUARE,
      BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_SQUARE_DARK,
      BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_FAVICON,
      BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPLASH_PORTRAIT,
      BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPLASH_LANDSCAPE,
    ].includes(x.key)
  ) {
    x.value = await logoSchema.validateAsync(x.value);
  }

  if (x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_CHAIN_TYPE) {
    if (['arcblock', 'ethereum'].includes(x.value) === false) {
      throw new Error('Invalid blocklet wallet type, only "default" and "eth" are supported');
    }
  }

  if (x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_DELETABLE) {
    if (['yes', 'no'].includes(x.value) === false) {
      throw new Error('BLOCKLET_DELETABLE must be either "yes" or "no"');
    }
  }

  if (x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_PASSPORT_COLOR) {
    if (x.value && x.value !== 'auto') {
      if (x.value.length !== 7 || !isHex(x.value.slice(-6))) {
        throw new Error('BLOCKLET_PASSPORT_COLOR must be a hex encoded color, eg. #ffeeaa');
      }
    }
  }

  if (x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPACE_ENDPOINT) {
    // @note: value 置空以表删除
    if (x.value && !isUrl(x.value)) {
      throw new Error(`${x.key}(${x.value}) is not a valid URL`);
    }
  }

  if (x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPACES_URL) {
    if (isEmpty(x.value)) {
      throw new Error(`${x.key} can not be empty`);
    }

    if (!isUrl(x.value)) {
      throw new Error(`${x.key}(${x.value}) is not a valid URL`);
    }
  }

  if (x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_BACKUP_ENDPOINT) {
    // @note: value 置空以表删除
    if (isEmpty(x.value)) {
      x.value = '';
    }

    if (!isEmpty(x.value) && !isUrl(x.value)) {
      throw new Error(`${x.key}(${x.value}) is not a valid URL`);
    }
  }

  if (x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_CLUSTER_SIZE) {
    if (isEmpty(x.value)) {
      x.value = '';
    }

    const v = Number(x.value);
    if (Number.isNaN(v)) {
      throw new Error(`${x.key} must be number`);
    }
    if (!Number.isInteger(v)) {
      throw new Error(`${x.key} must be integer`);
    }
  }
};

/**
 * Check for duplicate app secret key
 * @param {object} options - Options
 * @param {string} options.sk - Secret key
 * @param {string} options.did - Blocklet DID
 * @param {object} options.states - State manager
 */
const checkDuplicateAppSk = async ({ sk, did, states }) => {
  if (!sk && !did) {
    throw new Error('sk and did is empty');
  }

  let appSk = sk;
  if (!sk) {
    const nodeInfo = await states.node.read();
    const blocklet = await states.blocklet.getBlocklet(did);
    const configs = await states.blockletExtras.getConfigs([did]);
    const { wallet } = getBlockletInfo(
      {
        meta: blocklet.meta,
        environments: (configs || []).filter((x) => x.value),
      },
      nodeInfo.sk
    );
    appSk = wallet.secretKey;
  }

  let wallet;
  try {
    wallet = fromSecretKey(appSk, { role: types.RoleType.ROLE_APPLICATION });
  } catch {
    try {
      wallet = fromSecretKey(appSk, 'eth');
    } catch {
      throw new Error('Invalid custom blocklet secret key');
    }
  }

  const exist = await states.blocklet.hasBlocklet(wallet.address);
  if (exist) {
    throw new Error(`blocklet secret key already used by ${exist.meta.title || exist.meta.name}`);
  }
};

/**
 * Check for duplicate mount point
 * @param {object} app - App blocklet
 * @param {string} mountPoint - Mount point to check
 */
const checkDuplicateMountPoint = (app, mountPoint) => {
  const err = new Error(`cannot add duplicate mount point, ${mountPoint || '/'} already exist`);

  for (const component of app.children || []) {
    if (
      hasStartEngine(component.meta) &&
      normalizePathPrefix(component.mountPoint) === normalizePathPrefix(mountPoint)
    ) {
      throw err;
    }
  }
};

/**
 * Resolve mount point conflict by generating alternative mount point
 * @param {object} comp - Component
 * @param {object} blocklet - Parent blocklet
 * @returns {object} Component with resolved mount point
 */
const resolveMountPointConflict = (comp, blocklet) => {
  try {
    if (!comp?.mountPoint) return comp;

    const children = (blocklet?.children || []).filter((x) => x?.meta && hasMountPoint(x.meta));

    const existingComponent = children.find((x) => x.mountPoint === comp.mountPoint && x.meta?.did !== comp.meta?.did);
    if (!existingComponent) return comp;

    const baseName = formatName(comp?.meta?.name) || formatName(comp?.meta?.title);
    comp.mountPoint = children.some((x) => x.mountPoint === `/${baseName}`)
      ? comp.meta.did
      : baseName.toLocaleLowerCase();

    return comp;
  } catch (error) {
    logger.error('Failed to resolve mount point:', error);
    comp.mountPoint = comp.meta.did;
    return comp;
  }
};

/**
 * Validate store URL in serverless mode
 * @param {object} nodeInfo - Node info
 * @param {string} storeUrl - Store URL
 */
const validateStore = (nodeInfo, storeUrl) => {
  if (nodeInfo.mode !== 'serverless') {
    return;
  }

  const storeUrlObj = new URL(storeUrl);

  // Check trusted blocklet sources from environment variable first
  const trustedSources = process.env.ABT_NODE_TRUSTED_SOURCES;
  if (trustedSources) {
    const trustedHosts = trustedSources
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url) => new URL(url).host);

    if (trustedHosts.includes(storeUrlObj.host)) {
      return;
    }
  }

  const registerUrlObj = new URL(nodeInfo.registerUrl);

  // 信任 Launcher 打包的应用
  if (registerUrlObj.host === storeUrlObj.host) {
    return;
  }

  const inStoreList = nodeInfo.blockletRegistryList.find((item) => {
    const itemURLObj = new URL(item.url);

    return itemURLObj.host === storeUrlObj.host;
  });

  if (!inStoreList) {
    throw new Error('Must be installed from the compliant blocklet store list');
  }
};

/**
 * Validate blocklet in serverless mode
 * @param {object} options - Options
 * @param {object} options.blockletMeta - Blocklet meta
 */
const validateInServerless = ({ blockletMeta }) => {
  const { interfaces } = blockletMeta;
  const externalPortInterfaces = (interfaces || []).filter((item) => !!item.port?.external);

  if (externalPortInterfaces.length > 0) {
    throw new Error('Blocklets with exposed ports cannot be installed');
  }
};

/**
 * Check struct version
 * @param {object} blocklet - Blocklet object
 */
const checkStructVersion = (blocklet) => {
  if (blocklet.structVersion !== APP_STRUCT_VERSION) {
    throw new Error('You should migrate the application first');
  }
};

/**
 * Check if version is compatible
 * @param {string} actualVersion - Actual version
 * @param {string} expectedRange - Expected version range
 * @returns {boolean}
 */
const isVersionCompatible = (actualVersion, expectedRange) =>
  !expectedRange || expectedRange === 'latest' || semver.satisfies(actualVersion, expectedRange);

/**
 * Check version compatibility of components
 * @param {Array} components - Array of components
 */
const checkVersionCompatibility = (components) => {
  for (const component of components) {
    // eslint-disable-next-line no-loop-func
    forEachBlockletSync(component, (x) => {
      const dependencies = x.dependencies || [];
      dependencies.forEach((dep) => {
        const { did, version: expectedRange } = dep;
        const exist = components.find((y) => y.meta.did === did);
        if (exist && !isVersionCompatible(exist.meta.version, expectedRange)) {
          throw new Error(
            `Check version compatible failed: ${component.meta.title || component.meta.did} expects ${
              exist.meta.title || exist.meta.did
            }'s version to be ${expectedRange}, but actual is ${exist.meta.version}`
          );
        }
      });
    });
  }
};

module.exports = {
  validateBlocklet,
  validateBlockletChainInfo,
  checkDuplicateComponents,
  validateAppConfig,
  checkDuplicateAppSk,
  checkDuplicateMountPoint,
  resolveMountPointConflict,
  validateStore,
  validateInServerless,
  checkStructVersion,
  isVersionCompatible,
  checkVersionCompatibility,
};
