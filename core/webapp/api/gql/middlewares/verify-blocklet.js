const { isBlockletRole } = require('@abtnode/constant');

module.exports = ({ did, rootDid, scope, teamDid }, context) => {
  const { role, blockletDid } = context.user;

  let id;
  if (rootDid) {
    id = rootDid;
  } else if (teamDid) {
    id = teamDid;
  } else if (scope) {
    // e.g. scope is blocklet did in getAuditLog
    id = scope;
  } else if (did) {
    id = Array.isArray(did) ? did[0] : did;
  }

  // NOTICE: id must be blocklet.appPid or blocklet.meta.did if isBlockletRole
  if (isBlockletRole(role) && blockletDid !== id) {
    throw new Error("You cannot request other blocklet's data");
  }
};
