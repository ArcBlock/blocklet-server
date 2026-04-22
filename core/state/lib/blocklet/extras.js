const uniqBy = require('lodash/uniqBy');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const security = require('@abtnode/util/lib/security');
const { BLOCKLET_CONFIGURABLE_KEY } = require('@blocklet/constant');

const removeDeletedMetaConfigs = (oldConfigs, newConfigs) =>
  oldConfigs.filter((old) => newConfigs.some(({ key, name }) => [key, name].includes(old.key)));

/**
 * 从 blocklet.yml:environment 中导入配置：配置项字段是 name
 * 主动配置：配置项字段是 key
 *
 * 自定义配置(customConfigs): 配置项的 custom 为 true
 * 系统配置(appConfigs): 系统保留的配置项名，且 custom 为 false
 * 组件配置(metaConfigs): 配置项的 custom 为 false, 且不是系统保留的配置项名
 *   如果从 blocklet.yml 中导入组件配置，会删除已经删除的配置项
 */
const mergeConfigs = ({ old: oldConfigs, cur: newConfigs = [], did = '', dek = '' }) => {
  const enableSecurity = dek && did;

  const isConfigFromMeta = newConfigs.every((x) => x.key);

  const customConfigs = (oldConfigs || []).filter((x) => x.custom);
  const appConfigs = (oldConfigs || []).filter((x) => !x.custom && !!BLOCKLET_CONFIGURABLE_KEY[x.key]);

  const allMetaConfigs = (oldConfigs || []).filter((x) => !x.custom && !BLOCKLET_CONFIGURABLE_KEY[x.key]);

  const metaConfigs = isConfigFromMeta ? allMetaConfigs : removeDeletedMetaConfigs(allMetaConfigs, newConfigs);

  // oldConfig 表示从数据库中可以用的字段
  const oldConfig = [...metaConfigs, ...appConfigs, ...customConfigs].reduce((acc, x) => {
    acc[x.key] = {
      value: x.value,
      required: x.required,
      description: x.description || '',
      secure: x.secure || false,
      validation: x.validation || '',
      custom: x.custom,
      shared: x.shared,
    };
    return acc;
  }, {});

  // newConfig 为用户传的,也可以是从环境变量中去读的
  const uniqConfigs = uniqBy(newConfigs, (x) => x.key || x.name);

  // `BLOCKLET_*` and `ABT_NODE_*`  vars can only be set by Blocklet Server Daemon with only a few exceptions.
  const newConfig = cloneDeep(
    uniqConfigs.filter((x) => {
      const key = x.key || x.name;

      if (!key) {
        return false;
      }

      if (BLOCKLET_CONFIGURABLE_KEY[key]) {
        return true;
      }

      return !(key.toString().startsWith('ABT_NODE_') || key.toString().startsWith('BLOCKLET_'));
    })
  );

  if (enableSecurity) {
    newConfig.forEach((x) => {
      if (x.secure || oldConfig[x.key]?.secure) {
        x.value = security.encrypt(x.value, did, dek);
        if (x.default) {
          x.default = security.encrypt(x.default, did, dek);
        }
      }
    });
  }

  newConfig.forEach((config) => {
    const { name, key, value, default: defaultVal, required, description, secure, validation, custom, shared } = config;
    // 新增、更新或者删除
    if (key) {
      const origin = oldConfig[key] || {};
      oldConfig[key] = {
        value,
        required: required === undefined ? !!origin.required : required,
        description: description || origin.description || '',
        validation: validation || origin.validation || '',
        secure: secure === undefined ? !!origin.secure : secure,
        custom: custom === undefined ? !!origin.custom : custom,
        shared: shared === undefined ? origin.shared : shared,
      };
      return;
    }
    // 安装 或者 重装
    if (name) {
      // 重装时 name 和 value不覆盖
      if (oldConfig[name]) {
        const oldSecure = oldConfig[name].secure;
        const oldValue =
          enableSecurity && oldSecure ? security.decrypt(oldConfig[name].value, did, dek) : oldConfig[name].value;

        const newSecure = secure === undefined ? false : secure;

        oldConfig[name] = {
          value: enableSecurity && newSecure ? security.encrypt(oldValue, did, dek) : oldValue,
          required: required === undefined ? false : required,
          description: description || '',
          validation: validation || '',
          secure: newSecure,
          custom: custom === undefined ? false : custom,
          shared,
        };
        return;
      }

      // 新增添加
      oldConfig[name] = {
        value: defaultVal,
        required: required === undefined ? false : required,
        description: description || '',
        validation: validation || '',
        secure: secure === undefined ? false : secure,
        custom: custom === undefined ? false : custom,
        shared,
      };
    }
  });

  const mergedObj = Object.assign({}, oldConfig);
  const mergedConfig = Object.keys(mergedObj)
    .filter((x) => typeof mergedObj[x].value !== 'undefined') // removes the key that have value set to undefined
    .map((key) => ({
      key,
      value: mergedObj[key].value,
      required: mergedObj[key].required,
      description: mergedObj[key].description,
      secure: mergedObj[key].secure,
      validation: mergedObj[key].validation,
      custom: mergedObj[key].custom,
      shared: mergedObj[key].shared,
    }));

  return mergedConfig;
};

const parseConfigs = ({ data, did, dek }) => {
  const enableSecurity = dek && did;

  if (enableSecurity && Array.isArray(data)) {
    return cloneDeep(data).map((x) => {
      if (x.secure) {
        x.value = security.decrypt(x.value, did, dek);
      }

      return x;
    });
  }

  return data;
};

const encryptConfigs = ({ data, did, dek }) => {
  const enableSecurity = dek && did;

  if (enableSecurity && Array.isArray(data)) {
    data.forEach((x) => {
      if (x.secure) {
        x.value = security.encrypt(x.value, did, dek);
      }
    });
  }

  return data;
};

module.exports = {
  mergeConfigs,
  parseConfigs,
  encryptConfigs,
};
