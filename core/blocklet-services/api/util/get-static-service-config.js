const omit = require('lodash/omit');
const { findWebInterface, forEachBlockletSync } = require('@blocklet/meta/lib/util');
const { findService } = require('@blocklet/meta/lib/service');
const { NODE_SERVICES } = require('@abtnode/constant');

const getAuthConfig = (app, componentId) => {
  const ret = {};

  let rootConfig = null;
  let hasComponent = false;

  forEachBlockletSync(app, (component, { id, level }) => {
    if (id === componentId) {
      hasComponent = true;
    }

    const _interface = findWebInterface(component);
    if (_interface) {
      const service = findService(_interface.services, NODE_SERVICES.AUTH);
      const { config } = service || {};
      if (config) {
        if (level === 0) {
          rootConfig = config;
          // 统一使用 root component 的 allowSwitchProfile
          if (config.allowSwitchProfile !== undefined) {
            ret.allowSwitchProfile = config.allowSwitchProfile;
          }
        }

        if (id === componentId) {
          hasComponent = true;
          // 忽略 component 的 allowSwitchProfile
          Object.assign(ret, omit(config, ['allowSwitchProfile']));
        }
      }
    }
  });

  // 如果没找到 component 时, 使用 root component 的 config #6101
  if (!hasComponent && rootConfig) {
    Object.assign(ret, rootConfig);
  }

  return ret;
};

const getStaticServiceConfig = (serviceName, app, componentId) => {
  if (serviceName === NODE_SERVICES.AUTH) {
    return getAuthConfig(app, componentId);
  }

  throw new Error(`Invalid service name: ${serviceName}`);
};

module.exports = getStaticServiceConfig;
