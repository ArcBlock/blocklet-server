const pick = require('lodash/pick');
const { DataStore } = require('@abtnode/db/lib/base');

const Storage = require('../core/storage');
const Permission = require('../core/permission');
const Role = require('../core/role');

const ItemTypes = Object.freeze({
  Role: 'role',
  Permission: 'permission',
});

class Nedb extends Storage {
  constructor({ file }) {
    super();

    this.db = new DataStore({
      filename: file,
      autoload: true,
      timestampData: true,
    });

    this.db.loadDatabase((err) => {
      if (err) {
        console.error(err);
      } else {
        // eslint-disable-next-line no-shadow
        this.db.ensureIndex({ fieldName: 'name', unique: true }, (err) => {
          if (err) {
            console.error('Failed to ensure unique index', err);
          }
        });
      }
    });
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
    await this.db.update(
      {
        type: ItemTypes.Role,
      },
      {
        $pull: {
          grants: name,
        },
      },
      {
        multi: true,
      }
    );

    return true;
  }

  async update(item, { title, description, extra } = {}) {
    const { name } = item;

    if (!(await this.db.count({ name }))) {
      throw new Error(`Item ${name} is not presented in storage`);
    }

    await this.db.update(
      { name },
      {
        $set: pick({ title, description, extra }, 'title', 'description', 'extra'),
      }
    );

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

    await this.db.update(
      {
        name,
      },
      {
        $addToSet: {
          grants: childName,
        },
      }
    );

    return true;
  }

  async revoke(role, child) {
    const { name } = role;
    const { name: childName } = child;

    if (!(await this.db.count({ name })) || !(await this.db.count({ name: childName }))) {
      throw new Error('Role is not exist');
    }

    await this.db.update(
      {
        name,
      },
      {
        $pull: {
          grants: childName,
        },
      }
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
    const where = { type: ItemTypes.Role };
    if (orgId) {
      where.orgId = orgId;
    }
    const roles = await new Promise((resolve, reject) => {
      this.db
        .cursor(where)
        .sort({ createdAt: -1 })
        .exec((err, docs) => {
          if (err) {
            return reject(err);
          }

          return resolve(docs);
        });
    });

    return roles.map((item) => this.resolveRole(item));
  }

  async getPermissions() {
    const permissions = await new Promise((resolve, reject) => {
      this.db
        .cursor({ type: ItemTypes.Permission })
        .sort({ createdAt: -1 })
        .exec((err, docs) => {
          if (err) {
            return reject(err);
          }

          return resolve(docs);
        });
    });

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

    const names = await this.db.find(
      {},
      {
        name: 1,
        _id: 0,
      }
    );
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

    await this.db.update(
      { name: roleName },
      {
        $set: {
          grants: grantNames,
        },
      }
    );

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

module.exports = Nedb;
