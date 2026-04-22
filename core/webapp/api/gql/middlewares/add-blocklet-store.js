const { NODE_MODES, isBlockletRole, isBlockletMultipleTenantRole } = require('@abtnode/constant');
const { BLOCKLET_TENANT_MODES } = require('@blocklet/constant');

module.exports = (input, context) => {
  const { role, tenantMode, did } = context?.user || {};

  if (input.scope === 'studio' && tenantMode === BLOCKLET_TENANT_MODES.MULTIPLE) {
    if (!isBlockletMultipleTenantRole(role)) {
      throw new Error(`Serverless mode does not allow to edit store for the role: ${role}`);
    }
    input.scope = did;
    return;
  }

  if (context.nodeMode !== NODE_MODES.SERVERLESS) {
    return;
  }

  if (input.scope && (input.scope === 'studio' || input.scope === did)) {
    return;
  }

  if (!role || isBlockletRole(role)) {
    throw new Error('Serverless mode does not allow to add blocklet store');
  }
};
