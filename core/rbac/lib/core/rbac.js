const isPlainObject = require('lodash/isPlainObject');
const Role = require('./role');
const Permission = require('./permission');
const MemoryStorage = require('../store/memory');

const DEFAULT_OPTIONS = {
  permissions: [],
  roles: [],
  grant: {},
  delimiter: '_',
};

module.exports = class RBAC {
  /**
   * Convert Array of permissions to permission name
   * @function getPermissionNames
   * @memberof RBAC
   * @param  {Array} permissions List of array items of permission names. It contan action and resource
   * @param  {string} delimiter
   * @return {string[]}
   * @static
   */
  static getPermissionNames(permissions, delimiter) {
    if (!delimiter) {
      throw new Error('Delimiter is not defined');
    }

    return permissions.map((permission) => Permission.createName(permission[0], permission[1], delimiter));
  }

  /**
   * RBAC constructor
   * @constructor RBAC
   * @param  {Object} options             Options for RBAC
   * @param  {import('./storage')}  [options.storage]  Storage of grants
   * @param  {Array}    [options.roles]            List of role names (String)
   * @param  {Object}   [options.permissions]      List of permissions
   * @param  {Object}   [options.grants]           List of grants
   */
  constructor(options) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    this.storage = this.options.storage || new MemoryStorage();
    this.storage.useRBAC(this);
  }

  init() {
    const { roles, permissions, grants } = this.options;

    return this.create(roles, permissions, grants);
  }

  /**
   * Get instance of Role or Permission by his name
   * @method RBAC#get
   * @param {String} name Name of item
   */
  get(name) {
    return this.storage.get(name);
  }

  /**
   * Register role or permission to actual RBAC instance
   * @method RBAC#add
   * @param {Base} item Instance of Base
   */
  add(item) {
    if (!item) {
      throw new Error('Item is undefined');
    }

    if (item.rbac !== this) {
      throw new Error('Item is associated to another RBAC instance');
    }

    return this.storage.add(item);
  }

  /**
   * Remove role or permission from RBAC
   * @method RBAC#remove
   * @param {Base} item Instance of role or permission
   */
  remove(item) {
    if (!item) {
      throw new Error('Item is undefined');
    }

    if (item.rbac !== this) {
      throw new Error('Item is associated to another RBAC instance');
    }

    return this.storage.remove(item);
  }

  /**
   * Remove role or permission from RBAC
   * @method RBAC#removeByName
   * @param {String} name Name of role or permission
   */
  async removeByName(name) {
    const item = await this.get(name);
    if (!item) {
      return true;
    }

    return item.remove();
  }

  /**
   * Grant permission or role to the role
   * @method RBAC#grant
   * @param {Role} role Instance of the role
   * @param {Base} child Instance of the role or permission
   */
  grant(role, child) {
    if (!role || !child) {
      throw new Error('One of item is undefined');
    }

    if (role.rbac !== this || child.rbac !== this) {
      throw new Error('Item is associated to another RBAC instance');
    }

    if (!(role instanceof Role)) {
      throw new Error('Role is not instance of Role');
    }

    return this.storage.grant(role, child);
  }

  /**
   * Revoke permission or role from the role
   * @method RBAC#revoke
   * @param {Role} role Instance of the role
   * @param {Base} child Instance of the role or permission
   */
  revoke(role, child) {
    if (!role || !child) {
      throw new Error('One of item is undefined');
    }

    if (role.rbac !== this || child.rbac !== this) {
      throw new Error('Item is associated to another RBAC instance');
    }

    return this.storage.revoke(role, child);
  }

  /**
   * Revoke permission or role from the role by names
   * @method RBAC#revokeByName
   * @param {String} roleName Instance of the role
   * @param {String} childName Instance of the role or permission
   */
  async revokeByName(roleName, childName) {
    const [role, child] = await Promise.all([this.get(roleName), this.get(childName)]);

    return this.revoke(role, child);
  }

  /**
   * Grant permission or role from the role by names
   * @method RBAC#grantByName
   * @param {String} roleName Instance of the role
   * @param {String} childName Instance of the role or permission
   */
  async grantByName(roleName, childName) {
    const [role, child] = await Promise.all([this.get(roleName), this.get(childName)]);

    return this.grant(role, child);
  }

  /**
   * Create a new role assigned to actual instance of RBAC
   * @method RBAC#createRole
   * @param {String} roleName Name of new Role
   * @param {Boolean} [add] True if you need to add it to the storage
   * @param {object} opt
   * @param {String} opt.title Title of new Role
   * @param {String} opt.description Description of new Role
   * @param {String} opt.extra Extra info of new Role
   * @return {Role} Instance of the Role
   */
  async createRole(roleName, add, { title, description, extra, orgId } = {}) {
    const role = new Role(this, roleName, { title, description, extra, orgId });
    if (add) {
      await role.add();
    }

    return role;
  }

  /**
   * Create a new permission assigned to actual instance of RBAC
   * @method RBAC#createPermission
   * @param {String} action Name of action
   * @param {String} resource Name of resource
   * @param {Boolean} [add] True if you need to add it to the storage
   * @param {object} opt
   * @param {String} opt.title Title of permission
   * @param {String} opt.description Description of permission
   * @param {String} opt.extra Extra info of permission
   * @return {Permission} Instance of the Permission
   */
  async createPermission(action, resource, add, { title, description, extra } = {}) {
    const permission = new Permission(this, action, resource, { title, description, extra });
    if (add) {
      await permission.add();
    }

    return permission;
  }

  /**
   * Callback returns true if role or permission exists
   * @method RBAC#exists
   * @param {String} name Name of item
   */
  exists(name) {
    return this.storage.exists(name);
  }

  /**
   * Callback returns true if role exists
   * @method RBAC#existsRole
   * @param {String} name Name of item
   */
  existsRole(name) {
    return this.storage.existsRole(name);
  }

  /**
   * Callback returns true if permission exists
   * @method RBAC#existsPermission
   * @param {String} action Name of action
   * @param {String} resource Name of resource
   */
  existsPermission(action, resource) {
    return this.storage.existsPermission(action, resource);
  }

  /**
   * Return instance of Role by his name
   * @method RBAC#getRole
   * @param {String} name Name of role
   */
  getRole(name) {
    return this.storage.getRole(name);
  }

  /**
   * Return all instances of Role
   * @method RBAC#getRoles
   */
  getRoles(orgId) {
    return this.storage.getRoles(orgId);
  }

  /**
   * Return instance of Permission by his action and resource
   * @method RBAC#getPermission
   * @param {String} action Name of action
   * @param {String} resource Name of resource
   */
  getPermission(action, resource) {
    return this.storage.getPermission(action, resource);
  }

  /**
   * Return instance of Permission by his name
   * @method RBAC#getPermission
   * @param {String} name Name of permission
   */
  getPermissionByName(name) {
    const data = Permission.decodeName(name, this.options.delimiter);
    return this.storage.getPermission(data.action, data.resource);
  }

  /**
   * Return all instances of Permission
   * @method RBAC#getPermissions
   */
  getPermissions() {
    return this.storage.getPermissions();
  }

  /**
   * Create multiple permissions in one step
   * @method RBAC#createPermissions
   * @param {Array} permissions List of permission object
   * @param {Boolean} [add=true] True if you need to add it to the storage
   */
  async createPermissions(permissions, add = true) {
    const res = {};

    await Promise.all(
      permissions.map(async (item) => {
        const { name, title, description, extra } = item;
        const { action, resource } = Permission.decodeName(name, this.options.delimiter);

        const permission = await this.createPermission(action, resource, add, { title, description, extra });
        res[permission.name] = permission;
      })
    );

    return res;
  }

  /**
   * Create multiple roles in one step assigned to actual instance of RBAC
   * @method RBAC#createRoles
   * @param {Array} roles List of role object
   * @param {Boolean} [add=true] True if you need to add it to the storage
   */
  async createRoles(roles, add = true) {
    const res = {};
    await Promise.all(
      roles.map(async (item) => {
        const { name, title, description, extra } = item;
        const role = await this.createRole(name, add, { title, description, extra });

        res[role.name] = role;
      })
    );

    return res;
  }

  /**
   * Grant multiple items in one function
   * @method RBAC#grants
   * @param {Object} List of roles
   */
  async grants(roles) {
    if (!isPlainObject(roles)) {
      throw new Error('Grants is not a plain object');
    }

    await Promise.all(
      Object.keys(roles).map(async (roleName) => {
        const grants = roles[roleName];

        await Promise.all(
          grants.map(async (grant) => {
            await this.grantByName(roleName, grant);
          })
        );
      })
    );
  }

  /**
   * Create multiple permissions and roles in one step
   * @method RBAC#create
   * @param {Object[]} roleList List of role objects
   * @param {Object[]} permissionList List of permission objects
   * @param {Object} [grants] List of grants
   */
  async create(roleList, permissionList, grantsData) {
    const [permissions, roles] = await Promise.all([
      this.createPermissions(permissionList),
      this.createRoles(roleList),
    ]);

    if (grantsData) {
      await this.grants(grantsData);
    }

    return {
      permissions,
      roles,
    };
  }

  /**
   * Traverse hierarchy of roles.
   * Callback function returns as second parameter item from hierarchy or null if we are on the end of hierarchy.
   * @method RBAC#_traverseGrants
   * @param {string} roleName  Name of role
   * @param {Function} cb Callback function
   * @private
   */
  // eslint-disable-next-line consistent-return
  async traverseGrants(roleName, cb, next, used = {}) {
    if (!next) {
      // eslint-disable-next-line no-param-reassign
      next = [roleName];
    }
    const actualRole = next.shift();
    used[actualRole] = true;

    const grants = await this.storage.getGrants(actualRole);
    for (let i = 0; i < grants.length; i += 1) {
      const item = grants[i];
      const { name } = item;

      if (item instanceof Role && !used[name]) {
        used[name] = true;
        next.push(name);
      }

      // eslint-disable-next-line no-await-in-loop
      const result = await cb(item);
      if (result !== undefined) {
        return result;
      }
    }

    if (next.length) {
      return this.traverseGrants(null, cb, next, used);
    }
  }

  /**
   * Return true if role has allowed permission
   * @method RBAC#can
   * @param {string} roleName Name of role
   * @param {string} action Name of action
   * @param {string} resource Name of resource
   * @return {boolean}
   */
  async can(roleName, action, resource) {
    const can = await this.traverseGrants(roleName, (item) => {
      if (item instanceof Permission && item.can(action, resource)) {
        return true;
      }
      return undefined;
    });

    return can || false;
  }

  /**
   * Check if the role has any of the given permissions.
   * @method RBAC#canAny
   * @param  {string} roleName Name of role
   * @param  {Object[]}  permissions Array (String action, String resource)
   * @return {boolean}
   */
  async canAny(roleName, permissions) {
    // prepare the names of permissions
    const permissionNames = RBAC.getPermissionNames(permissions, this.options.delimiter);

    // traverse hierarchy
    const can = await this.traverseGrants(roleName, (item) => {
      if (item instanceof Permission && permissionNames.includes(item.name)) {
        return true;
      }

      return undefined;
    });

    return can || false;
  }

  /**
   * Check if the model has all of the given permissions.
   * @method RBAC#canAll
   * @param {string} roleName Name of role
   * @param {Object[]} permissions Array (String action, String resource)
   * @return {boolean} Current instance
   */
  async canAll(roleName, permissions) {
    // prepare the names of permissions
    const permissionNames = RBAC.getPermissionNames(permissions, this.options.delimiter);
    const founded = {};
    let foundedCount = 0;

    // traverse hierarchy
    await this.traverseGrants(roleName, (item) => {
      if (item instanceof Permission && permissionNames.includes(item.name) && !founded[item.name]) {
        founded[item.name] = true;
        foundedCount += 1;

        if (foundedCount === permissionNames.length) {
          return true;
        }
      }

      return undefined;
    });

    return foundedCount === permissionNames.length;
  }

  /**
   * Return true if role has allowed permission
   * @method RBAC#hasRole
   * @param {String} roleName Name of role
   * @param {String} roleChildName Name of child role
   * @return {boolean}
   */
  async hasRole(roleName, roleChildName) {
    if (roleName === roleChildName) {
      return true;
    }

    const has = await this.traverseGrants(roleName, (item) => {
      if (item instanceof Role && item.name === roleChildName) {
        return true;
      }

      return undefined;
    });

    return has || false;
  }

  /**
   * Return array of all permission assigned to role of RBAC
   * @method RBAC#getScope
   * @param  {string} roleName   Name of role
   * @return {string[]}
   */
  async getScope(roleName, returnObj = false) {
    const scope = [];

    // traverse hierarchy
    await this.traverseGrants(roleName, (item) => {
      if (item instanceof Permission && !scope.includes(item.name)) {
        if (returnObj) {
          scope.push({
            name: item.name,
            description: item.description,
          });
        } else {
          scope.push(item.name);
        }
      }
    });

    return scope;
  }

  // custom

  /**
   * Update role or permission from RBAC
   * @method RBAC#updateByName
   * @param {String} name Name of role or permission
   * @param {object} opt
   * @param {String} opt.title Title of role or permission
   * @param {String} opt.description Description of role or permission
   * @param {String} opt.extra Extra Info of role or permission
   */
  async updateByName(name, { title, description, extra } = {}) {
    const item = await this.get(name);
    if (!item) {
      throw new Error('Item does not exist');
    }

    if (item.rbac !== this) {
      throw new Error('Item is associated to another RBAC instance');
    }

    return this.storage.update(item, { title, description, extra });
  }
};
