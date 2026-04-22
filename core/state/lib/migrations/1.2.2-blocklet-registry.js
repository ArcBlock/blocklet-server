const { defaultNodeConfigs } = require('../util/default-node-config');

module.exports = async ({ states, printInfo }) => {
  printInfo('Try to move blockletRegistry to blockletRegistryList...');

  const info = await states.node.read();
  info.blockletRegistryList = defaultNodeConfigs.blockletRegistryList.getDefaultValue();

  await states.node.updateNodeInfo(info);
};
