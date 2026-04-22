const fs = require('fs');
const yaml = require('js-yaml');
const get = require('lodash/get');
const set = require('lodash/set');

module.exports = async ({ states, config, configFile, printInfo }) => {
  printInfo('Try to update node config to 1.0.32...');
  let changed = false;

  const rawConfig = yaml.load(fs.readFileSync(configFile).toString());
  const info = await states.node.read();

  const updates = [{ key: 'routing.https', value: true }];
  updates.forEach(({ key, value }) => {
    if (typeof get(info, key) === 'undefined') {
      printInfo(`> Add new config: ${key}`);
      set(rawConfig, `node.${key}`, value);
      set(config, `node.${key}`, value);
      set(info, key, value);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(configFile, yaml.dump(rawConfig));
    printInfo(`> Persist new config to file: ${configFile}`);
    await states.node.updateNodeInfo(info);
    printInfo('> Persist new config to state db');
  }
};
