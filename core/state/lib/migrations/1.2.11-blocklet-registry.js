const { defaultNodeConfigs } = require('../util/default-node-config');

module.exports = async ({ states, printInfo }) => {
  printInfo('Try to use registry origin in config...');

  const info = await states.node.read();
  info.blockletRegistryList = defaultNodeConfigs.blockletRegistryList.getDefaultValue();

  await states.node.updateNodeInfo(info);
};
