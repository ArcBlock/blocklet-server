const Permission = require('./permission');
const Role = require('./role');

module.exports = class Storage {
  useRBAC(rbac) {
    if (this.rbac) {
      throw new Error('Storage is already in use with another instance of RBAC');
    }

    this.rbac = rbac;
  }

  /**
   * Add permission or role
   * @method Storage#add
   * @param {Base} item Instance of role or permission
   */
  // eslint-disable-next-line no-unused-vars
  add(item) {
    throw new Error('Storage method add is not implemented');
  }

  /**
   * Remove permission or role
   * @method Storage#remove
   * @param {Base} item Instance of role or permission
   */
  // eslint-disable-next-line no-unused-vars
  remove(item) {
    throw new Error('Storage method remove is not implemented');
  }

  /**
   * Add (grant) permission or role to hierarchy of actual role
   * @method Storage#grant
   * @param  {Role} role  Instance of role
   * @param  {Base} child Instance of role or permission
   */
  // eslint-disable-next-line no-unused-vars
  grant(role, child) {
    throw new Error('Storage method grant is not implemented');
  }

  /**
   * Remove (revoke) permission or role from hierarchy of actual role
   * @method Storage#revoke
   * @param  {Role} role  Instance of role
   * @param  {Base} child Instance of role or permission
   */
  // eslint-disable-next-line no-unused-vars
  revoke(role, child) {
    throw new Error('Storage method revoke is not implemented');
  }

  /**
   * Get instance of permission or role by his name
   * @method Storage#get
   * @param  {String} name Name of role or permission
   * @return {Base}
   */
  // eslint-disable-next-line no-unused-vars
  get(name) {
    throw new Error('Storage method get is not implemented');
  }

  /**
   * Get all instances of Roles
   * @method Storage#getRoles
   * @return {Role[]}
   */
  getRoles() {
    throw new Error('Storage method getRoles is not implemented');
  }

  updateGrants() {
    throw new Error('Storage method updateGrants is not implemented');
  }

  /**
   * Get all instances of Permissions
   * @method Storage#getPermissions
   * @return {Permission[]}
   */
  getPermissions() {
    throw new Error('Storage method getPermissions is not implemented');
  }

  /**
   * Get instances of Roles and Permissions assigned to role
   * @method Storage#getGrants
   * @param  {String} role Name of role
   * @return {Base[]}
   */
  // eslint-disable-next-line no-unused-vars
  getGrants(role) {
    throw new Error('Storage method getGrants is not implemented');
  }

  /**
   * Get instance of role by his name
   * @method Storage#getRole
   * @param  {String} name Name of role
   * @return {Role}
   */
  async getRole(name) {
    const role = await this.get(name);
    if (role && role instanceof Role) {
      return role;
    }

    return undefined;
  }

  /**
   * Get instance of permission by his name
   * @method Storage#getPermission
   * @param  {string} action   Name of action
   * @param  {string} resource Name of resource
   * @return {Permission}           Instance of actual storage
   */
  async getPermission(action, resource) {
    const name = Permission.createName(action, resource, this.rbac.options.delimiter);
    const item = await this.get(name);
    if (item && item instanceof Permission) {
      return item;
    }

    return undefined;
  }

  /**
   * Return true with callback if role or permission exists
   * @method Storage#exists
   * @param  {string} name Name of role or permission
   * @return {boolean}
   */
  async exists(name) {
    const item = await this.get(name);
    return !!item;
  }

  /**
   * Return true with callback if role exists
   * @method Storage#existsRole
   * @param  {string} name Name of role
   * @return {boolean}
   */
  async existsRole(name) {
    const role = await this.getRole(name);
    return !!role;
  }

  /**
   * Return true with callback if permission exists
   * @method Storage#existsPermission
   * @param  {string} action Name of action
   * @param  {string} resource Name of resource
   * @return {boolean}
   */
  async existsPermission(action, resource) {
    const permission = await this.getPermission(action, resource);
    return !!permission;
  }
};
