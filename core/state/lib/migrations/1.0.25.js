const fs = require('fs');
const yaml = require('js-yaml');
const get = require('lodash/get');
const set = require('lodash/set');

const { BLOCKLET_LAUNCHER_URL, NODE_COMMAND_NAME, NODE_PACKAGE_NAME } = require('@abtnode/constant');
const canPackageReadWrite = require('@abtnode/util/lib/can-pkg-rw');

module.exports = async ({ states, config, configFile, printInfo }) => {
  printInfo('Try to update node config to 1.0.25...');
  let changed = false;

  const rawConfig = yaml.load(fs.readFileSync(configFile).toString());
  const info = await states.node.read();

  const updates = [
    { key: 'registerUrl', value: BLOCKLET_LAUNCHER_URL },
    { key: 'autoUpgrade', value: canPackageReadWrite(NODE_COMMAND_NAME, NODE_PACKAGE_NAME) },
  ];
  updates.forEach(({ key, value }) => {
    if (!get(info, key)) {
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
