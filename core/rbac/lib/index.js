const { RBAC } = require('./core');

const NedbStorage = require('./store/nedb');
const SequelizeStorage = require('./store/sequelize');
const MemoryStorage = require('./store/memory');

/**
 * @param {object} options
 * @param {import('./core/storage')} options.storage
 * @param {object} [options.data]
 * @param {Array<string>} options.data.roles
 * @param {object} options.data.permissions
 * @param {object} options.data.grants
 */
const createRBAC = async ({ storage, data = {} } = {}) => {
  if (!storage) {
    throw new Error('storage cannot be empty');
  }

  const rbac = new RBAC({
    roles: data.roles || [],
    permissions: data.permissions || [],
    grants: data.grants || {},
    storage,
  });

  await rbac.init();

  const createRole = async ({ name, title, description, extra, childName, permissions = [], orgId } = {}) => {
    // add role
    await rbac.createRole(name, true, { title, description, extra, orgId });

    // add grants
    const grants = [childName, ...permissions].filter(Boolean);
    if (grants.length) {
      await rbac.storage.updateGrants(name, grants);
    }

    return rbac.getRole(name);
  };

  const createPermission = async ({ name, title, description, extra }) => {
    const [action, resource] = name.split('_');
    const added = await rbac.createPermission(action, resource, true, { title, description, extra });

    return added;
  };

  return {
    // role
    getRoles: rbac.getRoles.bind(rbac),
    getRole: rbac.getRole.bind(rbac),
    createRole,
    updateRole: ({ name, title, description, extra }) => rbac.updateByName(name, { title, description, extra }),
    removeRole: rbac.removeByName.bind(rbac),

    // permission
    getPermissions: rbac.getPermissions.bind(rbac),
    getPermission: rbac.getPermissionByName.bind(rbac),
    getScope: rbac.getScope.bind(rbac),
    createPermission,
    updatePermission: ({ name, title, description, extra }) => rbac.updateByName(name, { title, description, extra }),
    removePermission: rbac.removeByName.bind(rbac),

    // grant
    grant: rbac.grantByName.bind(rbac),
    revoke: rbac.revokeByName.bind(rbac),
    updateGrants: rbac.storage.updateGrants.bind(rbac.storage),

    // check
    canAny: rbac.canAny.bind(rbac),
    canAll: rbac.canAll.bind(rbac),
    can: rbac.can.bind(rbac),

    storage: rbac.storage,
  };
};

module.exports = {
  NedbStorage,
  MemoryStorage,
  SequelizeStorage,
  createRBAC,
};
