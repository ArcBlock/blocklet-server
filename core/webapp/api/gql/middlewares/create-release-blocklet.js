const { NODE_MODES, isBlockletRole, isBlockletMultipleTenantRole } = require('@abtnode/constant');
const { BLOCKLET_TENANT_MODES } = require('@blocklet/constant');

module.exports = (input, context) => {
  const { role, tenantMode } = context.user;
  if (context.nodeMode !== NODE_MODES.SERVERLESS) {
    return;
  }

  if (tenantMode === BLOCKLET_TENANT_MODES.MULTIPLE) {
    if (!isBlockletMultipleTenantRole(role)) {
      throw new Error(`Serverless mode does not allow to create release for the role: ${role}`);
    }
    return;
  }

  if (!isBlockletRole(role)) {
    throw new Error('Serverless mode does not allow to mutate blocklet');
  }
};
