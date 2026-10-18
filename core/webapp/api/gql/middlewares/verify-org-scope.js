const { CustomError } = require('@blocklet/error');
const { SERVER_ROLES } = require('@abtnode/constant');
const { isAdminUser } = require('@abtnode/core/lib/util/org');

/**
 * Org scoped role apis skip RBAC (see libs/white-list.js), so we must ensure:
 * 1. the caller is a member of the org (read) or the owner of the org (write)
 * 2. the caller can not grant permissions through org roles
 * 3. the caller can only update roles belong to the org
 */
module.exports = async (input, context, node, action) => {
  const { teamDid, orgId } = input || {};
  if (!orgId) {
    return;
  }

  const { user } = context || {};
  if (!user) {
    throw new CustomError(401, 'You are not logged in');
  }
  if (isAdminUser(user) || user.role === SERVER_ROLES.BLOCKLET_SDK) {
    return;
  }

  // getOrg ensures the caller is a member of the org
  const org = await node.getOrg({ teamDid, id: orgId }, context);
  if (!org) {
    throw new CustomError(404, `Org does not exist: ${orgId}`);
  }
  if (action === 'getRoles') {
    return;
  }
  if (org.ownerDid !== user.did) {
    throw new CustomError(403, `You are not the owner of the org: ${orgId}`);
  }

  if (action === 'createRole') {
    if ((input.permissions || []).length > 0 || input.childName) {
      throw new CustomError(403, 'You can not grant permissions to org roles');
    }
  }

  if (action === 'updateRole') {
    const role = await node.getRole({ teamDid, role: { name: input.role?.name } });
    if (!role || role.orgId !== orgId) {
      throw new CustomError(403, 'You can only update roles of your own org');
    }
  }
};
