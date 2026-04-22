const fs = require('fs-extra');
const path = require('path');
const { BLOCKLET_PREFERENCE_FILE, BLOCKLET_PREFERENCE_PREFIX } = require('@blocklet/constant');

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
        shared: secure ? false : prop.shared,
      });
    }
  });
};

const getConfigFromPreferences = (dir) => {
  const result = [];
  const schemaFile = path.join(dir, BLOCKLET_PREFERENCE_FILE);
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

console.log(getConfigFromPreferences('/Users/wangshijun/Develop/blocklet/image-bin/blocklets/image-bin/'));
