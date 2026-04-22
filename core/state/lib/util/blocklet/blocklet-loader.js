/**
 * Blocklet Loader Module
 *
 * Functions for loading blocklet state from database and cache
 * Handles blocklet retrieval, caching, and bundle expansion
 */

const fs = require('fs-extra');
const path = require('node:path');
const get = require('lodash/get');
const pick = require('lodash/pick');

const { toAddress } = require('@ocap/util');
const { isValid: isValidDid } = require('@arcblock/did');
const logger = require('@abtnode/logger')('@abtnode/core:util:blocklet:blocklet-loader');
const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');
const { BLOCKLET_CACHE_TTL } = require('@abtnode/constant');
const { BLOCKLET_BUNDLE_FILE } = require('@blocklet/constant');
const { parseOptionalComponents } = require('@blocklet/resolver');
const { forEachBlockletSync, getComponentName } = require('@blocklet/meta/lib/util');
const { getComponentProcessId } = require('@blocklet/meta/lib/get-component-process-id');

const { expandBundle } = require('../index');
const { getComponentDirs, fillBlockletConfigs } = require('./environment');
const { formatBlockletTheme } = require('./meta-utils');

// Blocklet state cache
const blockletCache = new DBCache(() => ({
  prefix: 'blocklet-state',
  ttl: BLOCKLET_CACHE_TTL,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

/**
 * Delete blocklet from cache
 * @param {string} did - Blocklet DID
 */
const deleteBlockletCache = async (did) => {
  await blockletCache.del(did);
};

/**
 * Ensure blocklet bundle is expanded
 * @param {object} _meta - Blocklet meta (unused)
 * @param {string} appDir - App directory path
 */
const ensureBlockletExpanded = async (_meta, appDir) => {
  const bundlePath = path.join(appDir, BLOCKLET_BUNDLE_FILE);
  if (fs.existsSync(bundlePath)) {
    try {
      const nodeModulesPath = path.join(appDir, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        await fs.remove(nodeModulesPath);
      }
      await expandBundle(bundlePath, appDir);
      await fs.remove(bundlePath);
    } catch (err) {
      throw new Error(`Failed to expand blocklet bundle: ${err.message}`);
    }
  }
};

/**
 * Internal function to get blocklet with full state
 * @param {object} options - Options
 * @returns {Promise<object>} Blocklet object
 */
const _getBlocklet = async ({
  did,
  dataDirs,
  states,
  e2eMode = false,
  throwOnNotExist = true,
  ensureIntegrity = false,
  getOptionalComponents = false,
} = {}) => {
  if (!did) {
    throw new Error('Blocklet did does not exist');
  }
  if (!isValidDid(did)) {
    logger.error('Blocklet did is invalid', { did });
    throw new Error('Blocklet did is invalid');
  }

  if (!dataDirs) {
    throw new Error('dataDirs does not exist');
  }

  if (!states) {
    throw new Error('states does not exist');
  }

  const blocklet = await states.blocklet.getBlocklet(did);
  if (!blocklet) {
    if (throwOnNotExist || ensureIntegrity) {
      logger.error('can not find blocklet in database by did', { did });
      throw new Error('can not find blocklet in database by did');
    }
    return null;
  }

  // 优化：并行查询独立数据（只查询一次 extraDoc，然后从内存中同步提取）
  const [extraDoc, nodeInfo, site] = await Promise.all([
    states.blockletExtras.getExtraByDid(blocklet.meta.did),
    states.node.read(),
    states.site.findOneByBlocklet(blocklet.meta.did),
  ]);

  // 从 extraDoc 中同步提取 settings（不需要再次查询数据库）
  const extrasMeta = extraDoc ? pick(extraDoc, ['did', 'meta', 'controller']) : null;
  const settings = states.blockletExtras.getFromDoc({ doc: extraDoc, dids: [blocklet.meta.did], name: 'settings' });

  // app settings
  // FIXME: 在 server 开发模式下，使用 `node /workspace/arcblock/blocklet-server/core/cli/tools/dev.js` 运行的 blocklet，blocklet.meta.did 和 blocklet.appPid 是不一致的
  blocklet.trustedPassports = get(settings, 'trustedPassports') || [];
  blocklet.trustedFactories = (get(settings, 'trustedFactories') || []).map((x) => {
    if (!x.passport.ttlPolicy) {
      x.passport.ttlPolicy = 'never';
      x.passport.ttl = 0;
    }
    if (x.factoryAddress) {
      x.factoryAddress = toAddress(x.factoryAddress);
    }
    return x;
  });
  blocklet.enablePassportIssuance = get(settings, 'enablePassportIssuance', true);
  blocklet.settings = settings || {};

  if (extrasMeta) {
    blocklet.controller = extrasMeta.controller;
  }

  blocklet.settings.storeList = blocklet.settings.storeList || [];
  blocklet.settings.theme = formatBlockletTheme(blocklet.settings.theme);
  blocklet.settings.languages = blocklet.settings.languages || [];

  // 移除第一个版本中 from 为 tmpl 的导航
  if (blocklet?.settings?.navigations && Array.isArray(blocklet.settings.navigations)) {
    blocklet.settings.navigations = (blocklet.settings.navigations || []).filter(
      (item) => !(item?.parent === '/team' && ['tmpl'].includes(item.from))
    );
  }

  (nodeInfo?.blockletRegistryList || []).forEach((store) => {
    if (!blocklet.settings.storeList.find((x) => x.url === store.url)) {
      blocklet.settings.storeList.push({
        ...store,
        protected: true,
      });
    }
  });

  blocklet.site = site;
  blocklet.enableDocker = nodeInfo.enableDocker;
  blocklet.enableDockerNetwork = nodeInfo.enableDockerNetwork;

  // 第一次 forEachBlockletSync：收集所有组件的 dids
  const componentConfigRequests = [];
  forEachBlockletSync(blocklet, (component, { ancestors }) => {
    const dids = [...ancestors.map((x) => x.meta.did), component.meta.did];
    componentConfigRequests.push({
      componentDid: component.meta.did,
      dids,
    });
  });

  // 基于缓存文档，为每个组件提取 configs（同步操作，不需要再次查询数据库）
  const configsMap = new Map();
  componentConfigRequests.forEach(({ componentDid, dids }) => {
    const configs = states.blockletExtras.getFromDoc({ doc: extraDoc, dids, name: 'configs' });
    configsMap.set(componentDid, configs);
  });

  // 第二次 forEachBlockletSync：填充组件
  forEachBlockletSync(blocklet, (component, { id, level, ancestors }) => {
    // component env
    try {
      // Validate component has required meta fields for getComponentDirs
      if (!component.meta) {
        throw new Error(`Component missing meta field: ${component.meta?.did || id}`);
      }
      if (!component.meta.name && !component.meta.bundleName) {
        throw new Error(
          `Component missing meta.name and meta.bundleName: ${component.meta.did || id}. ` +
            'This may indicate a migration issue with blocklet_children table.'
        );
      }

      component.env = {
        id,
        name: getComponentName(component, ancestors),
        processId: getComponentProcessId(component, ancestors),
        ...getComponentDirs(component, {
          dataDirs,
          ensure: ensureIntegrity,
          ancestors,
          e2eMode: level === 0 ? e2eMode : false,
        }),
      };
    } catch (error) {
      logger.error('Failed to set component env in _getBlocklet', {
        componentDid: component.meta?.did,
        componentName: component.meta?.name,
        componentBundleName: component.meta?.bundleName,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }

    // component config - 从预取的 configsMap 中获取
    const configs = configsMap.get(component.meta.did) || [];
    const rootBlocklet = ancestors.length > 0 ? ancestors[0] : blocklet;
    fillBlockletConfigs(component, configs, { rootBlocklet, nodeInfo, dataDirs });
  });

  if (getOptionalComponents) {
    const optionalComponents = await parseOptionalComponents(blocklet);
    blocklet.optionalComponents = optionalComponents;
  } else {
    blocklet.optionalComponents = [];
  }

  return blocklet;
};

/**
 * Get blocklet with optional caching
 * @param {object} options - Options
 * @returns {Promise<object>} Blocklet object
 */
const getBlocklet = ({
  did,
  ensureIntegrity = false,
  getOptionalComponents = false,
  useCache = false,
  ...rest
} = {}) => {
  let cacheKey = '';

  if (useCache) {
    cacheKey = JSON.stringify({
      ensureIntegrity,
      getOptionalComponents,
    });
  }

  return blockletCache.autoCacheGroup(did, cacheKey, () => {
    return _getBlocklet({ did, ensureIntegrity, getOptionalComponents, ...rest });
  });
};

module.exports = {
  blockletCache,
  deleteBlockletCache,
  ensureBlockletExpanded,
  getBlocklet,
};
