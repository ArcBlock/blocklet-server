/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */

const { BLOCKLET_MAX_MEM_LIMIT_IN_MB } = require('@abtnode/constant');

module.exports = async ({ states, printInfo }) => {
  printInfo('Try to update blockletMaxMemoryLimit...');

  const info = await states.node.read();
  if (
    info?.runtimeConfig?.blockletMaxMemoryLimit &&
    info.runtimeConfig.blockletMaxMemoryLimit < BLOCKLET_MAX_MEM_LIMIT_IN_MB
  ) {
    info.runtimeConfig.blockletMaxMemoryLimit = BLOCKLET_MAX_MEM_LIMIT_IN_MB;
    await states.node.updateNodeInfo(info);
    printInfo(`Update blockletMaxMemoryLimit to ${BLOCKLET_MAX_MEM_LIMIT_IN_MB}MB`);
  } else {
    printInfo(`No need to update blockletMaxMemoryLimit (${info?.runtimeConfig?.blockletMaxMemoryLimit}MB)`);
  }
};
