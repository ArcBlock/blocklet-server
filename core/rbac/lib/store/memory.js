const Storage = require('../core/storage');
const Permission = require('../core/permission');
const Role = require('../core/role');

class Memory extends Storage {
  constructor() {
    super();
    this.items = {};
  }

  add(item) {
    const { name } = item;
    if (this.items[name]) {
      throw new Error(`Item ${name} already exists`);
    }

    if (item instanceof Role) {
      item.grants = [];
    }

    this.items[name] = {
      instance: item,
      grants: [],
    };

    return true;
  }

  remove(item) {
    const { items } = this;
    const { name } = item;
    if (!items[name]) {
      throw new Error(`Item ${name} is not presented in storage`);
    }

    // revoke from all instances
    Object.keys(items).forEach((itemName) => {
      const { grants } = items[itemName];
      const newGrants = grants.filter((grant) => grant !== name);
      items[itemName].grants = newGrants;
      if (items[itemName].instance instanceof Role) {
        items[itemName].instance.grants = newGrants;
      }
    });

    // delete from items
    delete this.items[name];

    return true;
  }

  update(item, { title, description, extra }) {
    const { items } = this;
    const { name } = item;
    if (!items[name]) {
      throw new Error(`Item ${name} is not presented in storage`);
    }

    if (title !== undefined) {
      this.items[name].instance.title = title;
    }

    if (description !== undefined) {
      this.items[name].instance.description = description;
    }

    this.items[name].instance.extra = extra;

    return items[name].instance;
  }

  grant(role, child) {
    const { name } = role;
    const { name: childName } = child;

    if (!this.items[name]) {
      throw new Error(`Role ${name} is not exist`);
    }

    if (!this.items[childName]) {
      throw new Error(`Base ${childName} is not exist`);
    }

    if (!(role instanceof Role)) {
      throw new Error('Role is not instance of Role');
    }

    if (name === childName) {
      throw new Error(`You can grant yourself ${name}`);
    }

    const { grants } = this.items[name];
    if (!grants.includes(childName)) {
      grants.push(childName);
      role.grants = grants;
    }

    return true;
  }

  revoke(role, child) {
    const { name } = role;
    const { name: childName } = child;

    if (!this.items[name] || !this.items[childName]) {
      throw new Error('Role is not exist');
    }

    const { grants } = this.items[name];
    if (!grants.includes(childName)) {
      throw new Error('Item is not associated to this item');
    }

    const newGrants = grants.filter((grant) => grant !== childName);
    this.items[name].grants = newGrants;

    if (role instanceof Role) {
      role.grants = newGrants;
    }

    return true;
  }

  get(name) {
    if (name && this.items[name]) {
      return this.items[name].instance;
    }

    return undefined;
  }

  getRoles(orgId) {
    return Object.keys(this.items)
      .filter((k) => {
        const { instance } = this.items[k];
        if (!orgId) {
          return true;
        }
        if (instance instanceof Role) {
          return instance.orgId === orgId;
        }
        return false;
      })
      .map((k) => this.items[k])
      .reduce((filtered, item) => {
        const { instance } = item;

        if (instance instanceof Role) {
          filtered.push(instance);
        }

        return filtered;
      }, []);
  }

  getPermissions() {
    return Object.keys(this.items)
      .map((k) => this.items[k])
      .reduce((filtered, item) => {
        const { instance } = item;

        if (instance instanceof Permission) {
          filtered.push(instance);
        }

        return filtered;
      }, []);
  }

  getGrants(role) {
    if (role && this.items[role]) {
      const currentGrants = this.items[role].grants;

      return currentGrants.reduce((filtered, grantName) => {
        const grant = this.items[grantName];
        if (grant) {
          filtered.push(grant.instance);
        }

        return filtered;
      }, []);
    }

    return [];
  }

  // custom
  async updateGrants(roleName, grantNames = []) {
    if (!this.items[roleName]) {
      throw new Error(`Role ${roleName} is not exist`);
    }

    grantNames.forEach((grantName) => {
      if (!this.items[grantName]) {
        throw new Error(`Base ${grantName} is not exist`);
      }

      if (roleName === grantName) {
        throw new Error(`You can grant yourself ${roleName}`);
      }
    });

    const role = await this.get(roleName);
    if (!(role instanceof Role)) {
      throw new Error('Role is not instance of Role');
    }

    const item = this.items[roleName];
    item.grants = grantNames;
    role.grants = grantNames;

    return role;
  }
}

module.exports = Memory;
