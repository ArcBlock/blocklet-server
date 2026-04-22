const { BLOCKLET_TENANT_MODES } = require('@blocklet/constant');

const getIsMultipleTenant = async (manager, did) => {
  const env = await manager.getBlockletEnvironments(did);
  return env?.appSystemEnvironments?.BLOCKLET_APP_TENANT_MODE === BLOCKLET_TENANT_MODES.MULTIPLE;
};

module.exports = getIsMultipleTenant;
