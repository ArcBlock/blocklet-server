/* eslint-disable no-await-in-loop */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const security = require('@abtnode/util/lib/security');

module.exports = async ({ states, configFile, dataDir }) => {
  if (process.env.CI || process.env.NODE_ENV === 'test') {
    return;
  }

  const file = path.join(dataDir, '.sock');
  if (fs.existsSync(file)) {
    return;
  }

  try {
    fs.writeFileSync(file, crypto.randomBytes(32), { encoding: 'binary', mode: '0600' });

    const config = yaml.load(fs.readFileSync(configFile).toString(), { json: true });
    config.node.sk = security.encrypt(config.node.sk, config.node.did, fs.readFileSync(file));
    fs.writeFileSync(configFile, yaml.dump(config));
    await states.node.updateNodeInfo({ sk: config.node.sk });

    const items = await states.blockletExtras.find();
    for (const item of items) {
      const newConfigs = cloneDeep(item.configs || []).map((c) => {
        if (c.secure) {
          c.value = security.encrypt(c.value, item.did, fs.readFileSync(file));
        }

        return c;
      });

      const newChildren = cloneDeep(item.children || []).map((x) => {
        return {
          ...x,
          configs: cloneDeep(x.configs || []).map((c) => {
            if (c.secure) {
              c.value = security.encrypt(c.value, item.did, fs.readFileSync(file));
            }

            return c;
          }),
        };
      });

      await states.blockletExtras.update({ did: item.did }, { $set: { configs: newConfigs, children: newChildren } });
    }

    states.node.compactDatafile();
    states.blockletExtras.compactDatafile();
  } catch (err) {
    console.error(err);
    throw err;
  }
};
