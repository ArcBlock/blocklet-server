const { NODE_MODES, isBlockletRole, isBlockletMultipleTenantRole } = require('@abtnode/constant');
const { BLOCKLET_TENANT_MODES } = require('@blocklet/constant');

module.exports = key => {
  return (input, context) => {
    const { role, tenantMode, did } = context?.user || {};

    if (input[key] && tenantMode === BLOCKLET_TENANT_MODES.MULTIPLE) {
      if (input[key] === 'studio') {
        throw new Error('Serverless mode does not allow to delete other tenant store');
      }
      if (!isBlockletMultipleTenantRole(role)) {
        throw new Error(`Serverless mode does not allow to edit store for the role: ${role}`);
      }
      input[key] = did;
      return;
    }

    if (context.nodeMode !== NODE_MODES.SERVERLESS) {
      return;
    }

    if (input[key] === 'studio' || input[key] === did) {
      return;
    }

    if (!role || isBlockletRole(role)) {
      throw new Error('Serverless mode does not allow to edit blocklet store');
    }
  };
};
