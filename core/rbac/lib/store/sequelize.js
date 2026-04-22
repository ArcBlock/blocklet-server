const pick = require('lodash/pick');

const Storage = require('../core/storage');
const Permission = require('../core/permission');
const Role = require('../core/role');

const ItemTypes = Object.freeze({
  Role: 'role',
  Permission: 'permission',
});

class SequelizeStorage extends Storage {
  constructor(db) {
    super();
    this.db = db;
  }

  async add(item) {
    const { name } = item;

    if (await this.db.count({ name })) {
      throw new Error(`Item ${name} already exists`);
    }

    const doc = {
      name: item.name,
      title: item.title,
      description: item.description,
      extra: item.extra,
      orgId: item.orgId,
    };

    if (item instanceof Role) {
      doc.type = ItemTypes.Role;
      doc.grants = [];
    }

    if (item instanceof Permission) {
      doc.type = ItemTypes.Permission;
    }

    await this.db.insert(doc);

    return true;
  }

  async remove(item) {
    const { name } = item;

    if (!(await this.db.count({ name }))) {
      throw new Error(`Item ${name} is not presented in storage`);
    }

    await this.db.remove({ name });
    const docs = await this.db.find({ type: ItemTypes.Role });
    await Promise.all(
      docs.map((doc) => this.db.update({ id: doc.id }, { $set: { grants: doc.grants.filter((x) => x !== name) } }))
    );
    return true;
  }

  async update(item, { title, description, extra } = {}) {
    const { name } = item;

    if (!(await this.db.count({ name }))) {
      throw new Error(`Item ${name} is not presented in storage`);
    }

    await this.db.update({ name }, pick({ title, description, extra }, 'title', 'description', 'extra'));
    return this.get(name);
  }

  async grant(role, child) {
    const { name } = role;
    const { name: childName } = child;

    if (!(await this.db.count({ name }))) {
      throw new Error(`Role ${name} is not exist`);
    }

    if (!(await this.db.count({ name: childName }))) {
      throw new Error(`Base ${childName} is not exist`);
    }

    if (!(role instanceof Role)) {
      throw new Error('Role is not instance of Role');
    }

    if (name === childName) {
      throw new Error(`You can grant yourself ${name}`);
    }

    const docs = await this.db.find({ name });
    await Promise.all(
      docs.map((doc) =>
        this.db.update({ id: doc.id }, { grants: [...doc.grants.filter((x) => x !== childName), childName] })
      )
    );

    return true;
  }

  async revoke(role, child) {
    const { name } = role;
    const { name: childName } = child;

    if (!(await this.db.count({ name })) || !(await this.db.count({ name: childName }))) {
      throw new Error('Role is not exist');
    }

    const docs = await this.db.find({ name });
    await Promise.all(
      docs.map((doc) => this.db.update({ id: doc.id }, { grants: doc.grants.filter((x) => x !== childName) }))
    );

    return true;
  }

  async get(name) {
    const item = await this.db.findOne({ name });

    if (!item) {
      return undefined;
    }

    if (item.type === ItemTypes.Role) {
      return this.resolveRole(item);
    }

    if (item.type === ItemTypes.Permission) {
      return this.resolvePermission(item);
    }

    return undefined;
  }

  async getRoles(orgId) {
    // 因为对象 JSON 有循环引用, 所以无法用原来的缓存
    const where = { type: ItemTypes.Role };
    if (orgId) {
      where.orgId = orgId;
    }
    const roles = await this.db.find(where, {}, { createdAt: -1 });
    return roles.map((item) => this.resolveRole(item));
  }

  async getPermissions() {
    // 因为对象 JSON 有循环引用, 所以无法用原来的缓存
    const permissions = await this.db.find({ type: ItemTypes.Permission }, {}, { createdAt: -1 });
    return permissions.map((item) => this.resolvePermission(item));
  }

  async getGrants(name) {
    const item = await this.db.findOne({ name });

    if (item) {
      const grants = await Promise.all((item.grants || []).map((x) => this.get(x)));
      return grants;
    }

    return [];
  }
  // custom

  async updateGrants(roleName, grantNames = []) {
    const role = await this.db.findOne({ name: roleName });

    if (!role) {
      throw new Error(`Role ${roleName} is not exist`);
    }

    if (role.type !== ItemTypes.Role) {
      throw new Error(`${roleName} is not a role`);
    }

    const names = await this.db.find({}, { name: 1 });
    const namesMap = names.reduce((o, { name }) => {
      o[name] = true;
      return o;
    }, {});

    grantNames.forEach((grantName) => {
      if (!namesMap[grantName]) {
        throw new Error(`${grantName} is not exist`);
      }

      if (roleName === grantName) {
        throw new Error(`You can grant yourself ${roleName}`);
      }
    });

    await this.db.update({ name: roleName }, { grants: grantNames });
    return this.get(roleName);
  }

  // private

  /**
   * @param {Object} item
   *  name: string
   *  type: ItemTypes
   *  grants: string[]
   */
  resolveRole(item) {
    const { name, title, description, extra, orgId } = item;
    const role = new Role(this.rbac, name, { title, description, extra, orgId });
    role.grants = item.grants;
    return role;
  }

  /**
   * @param {Object} item
   *  name: string
   *  type: ItemTypes
   */
  resolvePermission(item) {
    const { name, title, description, extra } = item;
    const { action, resource } = Permission.decodeName(name, this.rbac.options.delimiter);
    const permission = new Permission(this.rbac, action, resource, { title, description, extra });
    return permission;
  }
}

module.exports = SequelizeStorage;
