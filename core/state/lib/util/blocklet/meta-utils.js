/**
 * Meta Utils Module
 *
 * Functions for managing blocklet metadata, themes, and status utilities
 * Extracted from blocklet.js for better modularity
 */

const cloneDeep = require('lodash/cloneDeep');
const mergeWith = require('lodash/mergeWith');
const semver = require('semver');

const { BLOCKLET_THEME_LIGHT, BLOCKLET_THEME_DARK } = require('@blocklet/theme');
const { getComponentConfig } = require('@blocklet/resolver');
const { BlockletStatus, BlockletGroup, BlockletSource } = require('@blocklet/constant');
const {
  forEachChildSync,
  findWebInterface,
  forEachComponentV2Sync,
  isInProgress,
  isRunning,
} = require('@blocklet/meta/lib/util');

/**
 * Format blocklet theme configuration
 * @param {object} rawTheme - Raw theme configuration
 * @returns {object} Formatted theme configuration
 */
const formatBlockletTheme = (rawTheme) => {
  let themeConfig = {};

  if (rawTheme) {
    if (Array.isArray(rawTheme.concepts) && rawTheme.currentConceptId) {
      const concept = rawTheme.concepts.find((x) => x.id === rawTheme.currentConceptId);
      themeConfig = {
        ...concept.themeConfig,
        prefer: concept.prefer,
        name: concept.name,
      };
    } else {
      // 兼容旧数据
      themeConfig = {
        light: rawTheme.light || {},
        dark: rawTheme.dark || {},
        common: rawTheme.common || {},
        prefer: rawTheme.prefer || 'system',
        name: rawTheme.name || 'Default',
      };
    }
  }

  const result = mergeWith(
    // 至少提供 palette 色板值（客户端会使用）
    cloneDeep({
      light: { palette: BLOCKLET_THEME_LIGHT.palette },
      dark: { palette: BLOCKLET_THEME_DARK.palette },
      prefer: 'system',
    }),
    themeConfig,
    // 数组值直接替换
    (_, srcValue) => {
      if (Array.isArray(srcValue)) {
        return srcValue;
      }
      return undefined;
    }
  );

  // 保留原始数据，用于 settings 保存
  Object.defineProperty(result, 'raw', {
    value: rawTheme,
    enumerable: false,
    writable: false,
  });

  return result;
};

/**
 * merge services
 * from meta.children[].mountPoints[].services, meta.children[].services
 * to childrenMeta[].interfaces[].services
 *
 * @param {array<child>|object{children:array}} source e.g. [<config>] or { children: [<config>] }
 * @param {array<meta|{meta}>} childrenMeta e.g. [<meta>] or [{ meta: <meta> }]
 */
const mergeMeta = (source, childrenMeta = []) => {
  // configMap
  const configMap = {};
  (Array.isArray(source) ? source : getComponentConfig(source) || []).forEach((x) => {
    configMap[x.name] = x;
  });

  // merge service from config to child meta
  childrenMeta.forEach((child) => {
    const childMeta = child.meta || child;
    const config = configMap[childMeta.name];
    if (!config) {
      return;
    }

    (config.mountPoints || []).forEach((mountPoint) => {
      if (!mountPoint.services) {
        return;
      }

      const childInterface = childMeta.interfaces.find((y) => y.name === mountPoint.child.interfaceName);
      if (childInterface) {
        // merge
        const services = childInterface.services || [];
        mountPoint.services.forEach((x) => {
          const index = services.findIndex((y) => y.name === x.name);
          if (index >= 0) {
            services.splice(index, 1, x);
          } else {
            services.push(x);
          }
        });
        childInterface.services = services;
      }
    });

    if (config.services) {
      const childInterface = findWebInterface(childMeta);
      if (childInterface) {
        // merge
        const services = childInterface.services || [];
        config.services.forEach((x) => {
          const index = services.findIndex((y) => y.name === x.name);
          if (index >= 0) {
            services.splice(index, 1, x);
          } else {
            services.push(x);
          }
        });
        childInterface.services = services;
      }
    }
  });
};

/**
 * Get list of components that need updates based on version comparison
 * @param {object} oldBlocklet - Old blocklet state
 * @param {object} newBlocklet - New blocklet state
 * @returns {Array} Array of {id, meta} for components needing update
 */
const getUpdateMetaList = (oldBlocklet = {}, newBlocklet = {}) => {
  const oldMap = {};
  forEachChildSync(oldBlocklet, (b, { id }) => {
    if (b.bundleSource) {
      oldMap[id] = b.meta.version;
    }
  });

  const res = [];

  forEachChildSync(newBlocklet, (b, { id }) => {
    if ((b.bundleSource && semver.gt(b.meta.version, oldMap[id])) || process.env.TEST_UPDATE_ALL_BLOCKLET === 'true') {
      res.push({ id, meta: b.meta });
    }
  });

  return res;
};

/**
 * Get fixed bundle source from component
 * @param {object} component - Component object
 * @returns {object|null} Bundle source object or null
 */
const getFixedBundleSource = (component) => {
  if (!component) {
    return null;
  }

  if (component.bundleSource) {
    return component.bundleSource;
  }

  const { source, deployedFrom, meta: { bundleName } = {} } = component;

  if (!deployedFrom) {
    return null;
  }

  if (source === BlockletSource.registry && bundleName) {
    return {
      store: deployedFrom,
      name: bundleName,
      version: 'latest',
    };
  }

  if (source === BlockletSource.url) {
    return {
      url: deployedFrom,
    };
  }

  return null;
};

/**
 * Get computed status of a blocklet based on its components
 * @param {object} blocklet - Blocklet object
 * @returns {string} Computed status
 */
const getBlockletStatus = (blocklet) => {
  const fallbackStatus = BlockletStatus.stopped;

  if (!blocklet) {
    return fallbackStatus;
  }

  if (!blocklet.children?.length) {
    if (blocklet.meta?.group === BlockletGroup.gateway) {
      return blocklet.status;
    }

    if (blocklet.status === BlockletStatus.added) {
      return BlockletStatus.added;
    }

    // for backward compatibility
    if (!blocklet.structVersion) {
      return blocklet.status;
    }

    return fallbackStatus;
  }

  let inProgressStatus;
  let runningStatus;
  let status;

  forEachComponentV2Sync(blocklet, (component) => {
    if (component.meta?.group === BlockletGroup.gateway) {
      return;
    }

    if (isInProgress(component.status)) {
      if (!inProgressStatus) {
        inProgressStatus = component.status;
      }
      return;
    }

    if (isRunning(component.status) || isRunning(component.greenStatus)) {
      runningStatus = BlockletStatus.running;
      return;
    }

    if (status === BlockletStatus.stopped) {
      return;
    }

    status = component.status;
  });

  return inProgressStatus || runningStatus || status;
};

module.exports = {
  formatBlockletTheme,
  mergeMeta,
  getUpdateMetaList,
  getFixedBundleSource,
  getBlockletStatus,
};
