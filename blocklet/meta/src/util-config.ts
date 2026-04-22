import path from 'node:path';
import fs from 'fs-extra';
import get from 'lodash/get';
import unset from 'lodash/unset';
import { BLOCKLET_PREFERENCE_FILE, BLOCKLET_PREFERENCE_PREFIX } from '@blocklet/constant';

import { forEachBlockletSync, getSharedConfigObj, isEnvShareableToClient, isPreferenceKey } from './util';

export const fromProperty2SecureConfigKey = (properties: object, result: Array<string>, prefix = '') => {
  Object.keys(properties || {}).forEach((key) => {
    const prop = properties[key];
    if (prop.items && ['ArrayTable', 'ArrayCards'].includes(prop['x-component'])) {
      fromProperty2SecureConfigKey(prop.items.properties, result, [prefix, prop.name, '[]'].filter(Boolean).join('.'));
    } else if (prop.properties && ['FormGrid'].includes(prop['x-component'])) {
      fromProperty2SecureConfigKey(prop.properties, result, prefix);
    } else if (prop.properties && ['ArrayTable.Column', 'FormGrid.GridColumn'].includes(prop['x-component'])) {
      fromProperty2SecureConfigKey(prop.properties, result, prefix);
    } else if (prop.name && ['FormItem'].includes(prop['x-decorator'])) {
      const secure = prop['x-component'] === 'Password';
      const shared = typeof prop.shared === 'undefined' ? true : !!prop.shared;
      if (secure || !shared) {
        result.push([prefix, prop.name].filter(Boolean).join('.'));
      }
    }
  });
};

export const getSecureConfigKeys = (blocklet: { env?: { appDir?: string } }) => {
  const result = [];
  if (!blocklet?.env?.appDir) {
    return result;
  }

  const schemaFile = path.join(blocklet.env.appDir, BLOCKLET_PREFERENCE_FILE);
  if (fs.existsSync(schemaFile)) {
    try {
      const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));
      fromProperty2SecureConfigKey(schema.schema?.properties, result);
    } catch {
      // do nothing
    }
  }

  return result.map((x) => [BLOCKLET_PREFERENCE_PREFIX, x].join(''));
};

export const removeSecureConfigs = (source: object, keysToRemove: Array<string>) => {
  keysToRemove.forEach((key) => {
    if (key.includes('.[].')) {
      const parts = key.split('.[].');
      const list = get(source, parts[0]);
      if (Array.isArray(list)) {
        list.forEach((x) => unset(x, parts[1]));
      }
    } else {
      unset(source, key);
    }
  });

  return source;
};

export const formatEnv = (raw: any, stringifyObject = true) => {
  let value = raw;

  // ensure no
  if (Array.isArray(value) && value.every((x) => x.originFileObj && x.url)) {
    value = value.map((x) => x.url);
    if (value.length === 1) {
      [value] = value;
    }
  }

  // ensure no objects
  if (stringifyObject) {
    if (value && typeof value === 'object') {
      value = JSON.stringify(value);
    }
  }

  // ensure no line breaks for environment variables
  if (value && typeof value === 'string') {
    value = value.replace(/(\r\n|\n|\r)/gm, ' ');
  }

  return value;
};

export const getConfigs = (blocklet: object, componentId: string) => {
  let res = {};

  forEachBlockletSync(blocklet, (component, { id, ancestors }) => {
    if (id !== componentId) {
      return;
    }

    const configs = component.configs.filter((x) => isEnvShareableToClient(x));
    const configObj = configs.reduce((o, x) => {
      o[x.key] = isPreferenceKey(x) ? formatEnv(x.value, false) : x.value;
      return o;
    }, {});

    const secureKeys = getSecureConfigKeys(component);
    removeSecureConfigs(configObj, secureKeys);

    const sharedObj = getSharedConfigObj(ancestors[0], component);
    for (const [key, value] of Object.entries(sharedObj)) {
      configObj[key] = value;
    }

    res = configObj;
  });

  return Object.entries(res).map(([key, value]) => ({ key, value }));
};
