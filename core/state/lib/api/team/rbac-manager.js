const pick = require('lodash/pick');
const logger = require('@abtnode/logger')('@abtnode/core:api:team:rbac');
const { ROLES, genPermissionName } = require('@abtnode/constant');

const { validateCreateRole, validateUpdateRole } = require('../../validators/role');
const { validateCreatePermission, validateUpdatePermission } = require('../../validators/permission');

const validateReservedRole = (role) => {
  if (Object.values(ROLES).includes(role)) {
    throw new Error(`The role ${role} is reserved`);
  }
  return true;
};

/**
 * Get role
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.role - Role data
 * @returns {Promise<Object>}
 */
async function getRole(api, { teamDid, role: { name } = {} }) {
  if (!name) {
    throw new Error('role name is invalid');
  }
  const rbac = await api.getRBAC(teamDid);
  const role = await rbac.getRole(name);
  return role ? pick(role, ['name', 'grants', 'title', 'description', 'extra', 'orgId']) : null;
}

/**
 * Create role
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.name - Role name
 * @param {string} params.description - Role description
 * @param {string} params.title - Role title
 * @param {string} params.childName - Child name
 * @param {Array} params.permissions - Permissions
 * @param {string} params.extra - Extra data (JSON string)
 * @param {string} params.orgId - Organization ID
 * @returns {Promise<Object>}
 */
async function createRole(api, { teamDid, name, description, title, childName, permissions = [], extra: raw, orgId }) {
  logger.info('create role', { teamDid, name, description, childName, permissions, raw });
  const attrs = { name, title, description, childName, permissions, orgId };

  if (raw) {
    try {
      attrs.extra = JSON.parse(raw);
    } catch (err) {
      throw new Error('extra should be a valid json string');
    }
  }

  await validateCreateRole(pick(attrs, ['name', 'title', 'description', 'extra']));

  validateReservedRole(name);

  const rbac = await api.getRBAC(teamDid);

  let role;
  try {
    role = await rbac.createRole(attrs);
    return pick(role, ['name', 'title', 'grants', 'description', 'extra', 'orgId']);
  } catch (err) {
    if (new RegExp(`Item ${name} already exists`).test(err.message)) {
      throw new Error(`Id ${name} already exists`);
    }
    throw err;
  }
}

/**
 * Update role
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.role - Role data
 * @param {string} params.orgId - Organization ID
 * @returns {Promise<Object>}
 */
async function updateRole(api, { teamDid, role: { name, title, description, extra: raw } = {}, orgId }) {
  logger.info('update role', { teamDid, name, title, description, raw });

  const attrs = { name, title, description, orgId };

  if (raw) {
    try {
      attrs.extra = JSON.parse(raw);
    } catch (err) {
      throw new Error('extra should be a valid json string');
    }
  }

  await validateUpdateRole(pick(attrs, ['name', 'title', 'description', 'extra']));
  const rbac = await api.getRBAC(teamDid);
  const state = await rbac.updateRole(attrs);
  return pick(state, ['name', 'title', 'grants', 'description', 'extra', 'orgId']);
}

/**
 * Get permissions
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @returns {Promise<Array>}
 */
async function getPermissions(api, { teamDid }) {
  const rbac = await api.getRBAC(teamDid);
  const permissions = await rbac.getPermissions();
  return permissions.map((d) => {
    d.isProtected = !!(d.extra && d.extra.isProtected);
    return pick(d, ['name', 'description', 'isProtected']);
  });
}

/**
 * Create permission
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.name - Permission name
 * @param {string} params.description - Permission description
 * @returns {Promise<Object>}
 */
async function createPermission(api, { teamDid, name, description }) {
  logger.info('create permissions', { teamDid, name });

  await validateCreatePermission({ name, description });

  const rbac = await api.getRBAC(teamDid);
  const added = await rbac.createPermission({ name, description });

  return pick(added, ['name', 'description']);
}

/**
 * Update permission
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.permission - Permission data
 * @returns {Promise<Object>}
 */
async function updatePermission(api, { teamDid, permission: { name, description } = {} }) {
  logger.info('update permission', { teamDid, name, description });

  await validateUpdatePermission({ name, description });

  const rbac = await api.getRBAC(teamDid);
  const state = await rbac.updatePermission({ name, description });

  return pick(state, ['name', 'description']);
}

/**
 * Grant permission to role
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.roleName - Role name
 * @param {string} params.grantName - Grant name
 * @returns {Promise<boolean>}
 */
async function grant(api, { teamDid, roleName, grantName }) {
  logger.info('grant', { teamDid, roleName, grantName });

  const rbac = await api.getRBAC(teamDid);
  await rbac.grant(roleName, grantName);

  return true;
}

/**
 * Revoke permission from role
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.roleName - Role name
 * @param {string} params.grantName - Grant name
 * @returns {Promise<boolean>}
 */
async function revoke(api, { teamDid, roleName, grantName }) {
  logger.info('revoke', { teamDid, roleName, grantName });

  const rbac = await api.getRBAC(teamDid);
  await rbac.revoke(roleName, grantName);

  return true;
}

/**
 * Update grants for role
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.roleName - Role name
 * @param {Array} params.grantNames - Grant names
 * @returns {Promise<Object>}
 */
async function updateGrants(api, { teamDid, roleName, grantNames }) {
  logger.info('update grants', { teamDid, roleName, grantNames });

  const rbac = await api.getRBAC(teamDid);
  const role = await rbac.updateGrants(roleName, grantNames);

  return pick(role, ['name', 'grants', 'title', 'description']);
}

/**
 * Delete role
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.name - Role name
 * @returns {Promise<boolean>}
 */
async function deleteRole(api, { teamDid, name }) {
  logger.info('delete role', { teamDid, name });

  validateReservedRole(name);

  const rbac = await api.getRBAC(teamDid);
  await rbac.removeRole(name);

  return true;
}

/**
 * Delete permission
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.name - Permission name
 * @returns {Promise<boolean>}
 */
async function deletePermission(api, { teamDid, name }) {
  logger.info('delete permission', { teamDid, name });

  const rbac = await api.getRBAC(teamDid);

  const permission = await rbac.getPermission(name);
  if (permission.extra && permission.extra.isProtected) {
    throw new Error(`The permission ${name} is reserved`);
  }

  await rbac.removePermission(name);

  return true;
}

/**
 * Get permissions by role
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.role - Role data
 * @returns {Promise<Array>}
 */
async function getPermissionsByRole(api, { teamDid, role }) {
  const rbac = await api.getRBAC(teamDid);

  const permissions = await rbac.getScope(role.name, true);

  return permissions.map((d) => pick(d, ['name', 'description']));
}

/**
 * Check if role has permission
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.role - Role name
 * @param {string} params.permission - Permission name
 * @returns {Promise<boolean>}
 */
async function hasPermission(api, { teamDid, role, permission }) {
  const rbac = await api.getRBAC(teamDid);

  const has = await rbac.can(role, ...permission.split('_'));

  return has;
}

/**
 * Refresh blocklet interface permissions
 * @param {Object} api - TeamAPI instance
 * @param {Object} blockletMeta - Blocklet metadata
 * @returns {Promise<void>}
 */
async function refreshBlockletInterfacePermissions(api, blockletMeta) {
  const { did, interfaces } = blockletMeta;

  const rbac = await api.getRBAC(did);

  const oldPermissions = await getPermissions(api, { teamDid: did });

  await Promise.all(
    (interfaces || []).map(async ({ name, type }) => {
      const permissionName = genPermissionName(name);
      if (type === 'web') {
        if (!oldPermissions.some((x) => x.name === permissionName)) {
          await rbac.createPermission({
            name: permissionName,
            description: `Access resources under the ${name} interface`,
            extra: {
              isProtected: true,
            },
          });
        }
      }
    })
  );
}

module.exports = {
  validateReservedRole,
  getRole,
  createRole,
  updateRole,
  getPermissions,
  createPermission,
  updatePermission,
  grant,
  revoke,
  updateGrants,
  deleteRole,
  deletePermission,
  getPermissionsByRole,
  hasPermission,
  refreshBlockletInterfacePermissions,
};
