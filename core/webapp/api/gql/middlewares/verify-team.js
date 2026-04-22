const { isBlockletRole } = require('@abtnode/constant');

module.exports = ({ teamDid }, context) => {
  const { role, blockletDid } = context.user;

  // NOTICE: teamDid must be blocklet.appPid or blocklet.meta.did if isBlockletRole
  // Allow access if:
  // 1. Root blocklet accessing its own data (blockletDid === teamDid)
  // 2. Component accessing its own data (componentDid === teamDid)
  if (isBlockletRole(role) && blockletDid !== teamDid) {
    throw new Error("You cannot request other blocklet's data");
  }
};
