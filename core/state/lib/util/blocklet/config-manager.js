/**
 * Configuration Manager Module
 *
 * Functions for managing blocklet configurations, preferences, and pack settings
 * Extracted from blocklet.js for better modularity
 */

const fs = require('fs-extra');
const path = require('node:path');

const {
  BlockletGroup,
  BLOCKLET_PREFERENCE_FILE,
  BLOCKLET_PREFERENCE_PREFIX,
  BLOCKLET_RESOURCE_DIR,
} = require('@blocklet/constant');
const { isEnvShareable } = require('@blocklet/meta/lib/util');

const { APP_CONFIG_IMAGE_KEYS } = require('../index');

/**
 * Helper to convert preference schema properties to config format
 * @param {object} properties - Schema properties
 * @param {Array} result - Result array to populate
 */
const fromProperty2Config = (properties = {}, result) => {
  Object.keys(properties).forEach((key) => {
    const prop = properties[key];
    if (prop.properties && ['ArrayTable', 'ArrayCards'].includes(prop['x-component']) === false) {
      fromProperty2Config(prop.properties, result);
    } else if (prop['x-decorator'] === 'FormItem') {
      const secure = prop['x-component'] === 'Password';
      result.push({
        default: prop.default || '',
        description: prop.title || key,
        name: `${BLOCKLET_PREFERENCE_PREFIX}${key}`,
        required: prop.required || false,
        secure,
        // eslint-disable-next-line no-nested-ternary
        shared: secure ? false : typeof prop.shared === 'undefined' ? true : prop.shared,
      });
    }
  });
};

/**
 * Get config from blocklet preferences schema file
 * @param {object} blocklet - Blocklet object with env.appDir
 * @returns {Array} Array of config objects
 */
const getConfigFromPreferences = (blocklet) => {
  const result = [];
  const schemaFile = path.join(blocklet.env.appDir, BLOCKLET_PREFERENCE_FILE);
  if (fs.existsSync(schemaFile)) {
    try {
      const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));
      fromProperty2Config(schema.schema?.properties, result);
    } catch {
      // do nothing
    }
  }

  return result;
};

/**
 * Get app configs from component that should be shared
 * @param {object} meta - Component meta
 * @param {Array} configsInApp - Configs already in app
 * @param {Array} configsInComponent - Configs in component
 * @returns {Array} Array of shared config objects
 */
const getAppConfigsFromComponent = (meta, configsInApp = [], configsInComponent = []) => {
  const configs = [];
  for (const configInMeta of meta?.environments || []) {
    if (isEnvShareable(configInMeta)) {
      const configInApp = (configsInApp || []).find((x) => x.key === configInMeta.name);
      if (!configInApp) {
        const configInComponent = configsInComponent.find((y) => y.key === configInMeta.name);
        if (configInComponent && isEnvShareable(configInComponent)) {
          configs.push(configInComponent);
        }
      }
    }
  }
  return configs;
};

/**
 * Separate configs into shared and self configs
 * @param {Array} configs - Input configs
 * @param {Array} oldConfigs - Existing configs
 * @returns {{ sharedConfigs: Array, selfConfigs: Array }}
 */
const getConfigsFromInput = (configs = [], oldConfigs = []) => {
  const sharedConfigs = [];
  const selfConfigs = [];

  configs.forEach((config) => {
    const oldConfig = oldConfigs.find((y) => y.key === config.key);
    if (!config.key.startsWith(BLOCKLET_PREFERENCE_PREFIX) && (isEnvShareable(config) || isEnvShareable(oldConfig))) {
      sharedConfigs.push(config);
    } else {
      selfConfigs.push(config);
    }
  });

  return { sharedConfigs, selfConfigs };
};

/**
 * Remove app configs if no component uses them
 * @param {Array} componentConfigs - Configs from removed component
 * @param {object} app - App blocklet
 * @param {object} blockletExtraState - Blocklet extra state manager
 */
const removeAppConfigsFromComponent = async (componentConfigs, app, blockletExtraState) => {
  const appConfigs = app.configs || [];
  const remainedConfigs = [].concat(...(app.children || []).map((x) => x.configs || []));
  const removedAppConfigs = [];

  componentConfigs.forEach((config) => {
    const appConfig = appConfigs.find((x) => x.key === config.key);
    if (
      appConfig &&
      !appConfig.custom &&
      !(app.meta.environments || []).find((x) => x.name === config.key) &&
      !remainedConfigs.find((x) => x.key === config.key && isEnvShareable(x))
    ) {
      removedAppConfigs.push({ key: appConfig.key, value: undefined });
    }
  });

  if (removedAppConfigs.length) {
    await blockletExtraState.setConfigs(app.meta.did, removedAppConfigs);
  }
};

/**
 * Get pack component from app children
 * @param {object} app - App blocklet
 * @returns {object|undefined} Pack component
 */
const getPackComponent = (app) => {
  return (app?.children || []).find((x) => x.meta.group === BlockletGroup.pack);
};

/**
 * Get pack config from pack component
 * @param {object} app - App blocklet
 * @returns {object|null} Pack config or null
 */
const getPackConfig = (app) => {
  const packComponent = getPackComponent(app);
  if (!packComponent) {
    return null;
  }

  const resource = (packComponent.meta.resource?.bundles || []).find(
    (x) => x.did === packComponent.meta.did && x.type === 'config'
  );

  if (!resource) {
    return null;
  }

  const { appDir } = packComponent.env;
  const configFile = path.join(appDir, BLOCKLET_RESOURCE_DIR, resource.did, resource.type, 'config.json');

  if (!fs.existsSync(configFile)) {
    return null;
  }

  return fs.readJSON(configFile);
};

/**
 * Copy pack images from pack dir to app data dir
 * @param {object} options - Options
 * @param {string} options.appDataDir - App data directory
 * @param {string} options.packDir - Pack directory
 * @param {object} options.packConfig - Pack config with navigations and configObj
 */
const copyPackImages = async ({ appDataDir, packDir, packConfig = {} }) => {
  const mediaDir = path.join(appDataDir, 'media', 'blocklet-service');
  const { navigations = [], configObj = {} } = packConfig;
  await fs.ensureDir(mediaDir);

  // Filter bottom navigation items with icons
  const bottomNavItems = navigations.filter((item) => {
    const sections = Array.isArray(item.section) ? item.section : [item.section];
    return sections.includes('bottomNavigation') && item.icon;
  });

  // Copy tabbar navigation icons
  if (bottomNavItems.length > 0) {
    await Promise.all(
      bottomNavItems.map(async (item) => {
        const iconFileName = path.basename(item.icon);
        const iconInImages = path.join(packDir, 'images', iconFileName);

        if (fs.existsSync(iconInImages)) {
          await fs.copy(iconInImages, path.join(mediaDir, iconFileName));
        }
      })
    );
  }

  // Copy brand-related images
  await Promise.all(
    APP_CONFIG_IMAGE_KEYS.map(async (key) => {
      const value = configObj[key];
      if (value) {
        const imgFile = path.join(packDir, 'images', value);
        if (fs.existsSync(imgFile)) {
          await fs.copy(imgFile, path.join(appDataDir, value));
        }
      }
    })
  );
};

module.exports = {
  fromProperty2Config,
  getConfigFromPreferences,
  getAppConfigsFromComponent,
  getConfigsFromInput,
  removeAppConfigsFromComponent,
  getPackComponent,
  getPackConfig,
  copyPackImages,
};
