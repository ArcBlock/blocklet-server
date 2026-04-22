const { test, expect, describe, afterEach, beforeEach } = require('bun:test');
const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const pick = require('lodash/pick');
const { DBCache } = require('@abtnode/db-cache');
// eslint-disable-next-line import/no-extraneous-dependencies
const { BaseState, getBlockletModels, createSequelize } = require('@abtnode/models');

const { createRBAC, NedbStorage, MemoryStorage, SequelizeStorage } = require('../lib/index');

const file = path.join(os.tmpdir(), `${Date.now()}.db`);
const sequelize = createSequelize('/core/rbac::memory:', { logging: false });
const models = getBlockletModels();
const db = new BaseState(models.Rbac);

// 初始化 User, Org 和 Rbac 模型，保持完整的外键约束
models.User.initialize(sequelize);
models.Org.initialize(sequelize);
models.Rbac.initialize(sequelize);

// 辅助函数：创建测试用的 user 和 org
const createTestOrg = async (orgId, orgName = 'Test Org') => {
  const userDid = `did:abt:test${orgId}`;

  // 创建 user (添加所有必填字段)
  await models.User.create({
    did: userDid,
    pk: `test-pk-${orgId}`, // 公钥（必填）
    fullName: `Test User ${orgId}`,
    role: 'owner',
    email: `test${orgId}@example.com`,
  });

  // 创建 org
  await models.Org.create({
    id: orgId,
    name: orgName,
    ownerDid: userDid,
    description: `Test organization ${orgId}`,
    metadata: {},
  });
};

const roles = [{ name: 'superadmin' }, { name: 'admin' }, { name: 'user' }, { name: 'guest' }];

const permissions = [{ name: 'create_article' }, { name: 'update_article' }, { name: 'delete_user' }];

const splittedPermissions = [
  ['create', 'article'],
  ['delete', 'user'],
  ['update', 'article'],
];

const grants = [
  ['admin', ['user', 'delete_user']],
  ['user', ['create_article', 'update_article']],
];

const storageModes = [
  {
    name: 'memory',
    create: async () => {
      const rbac = await createRBAC({
        storage: new MemoryStorage(),
        data: {
          roles,
          permissions,
          grants: grants.reduce((obj, [name, list]) => {
            obj[name] = list;
            return obj;
          }, {}),
        },
      });
      return rbac;
    },
    createEmpty: () => createRBAC({ storage: new MemoryStorage() }),
    refresh: () => createRBAC({ storage: new MemoryStorage() }),
  },
  {
    name: 'nedb',
    create: async () => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
      const rbac = await createRBAC({ storage: new NedbStorage({ file }) });
      await Promise.all(roles.map((d) => rbac.createRole(d)));
      await Promise.all(permissions.map((d) => rbac.createPermission(d)));
      await Promise.all(grants.map(([role, grantNames]) => rbac.updateGrants(role, grantNames)));
      return rbac;
    },
    createEmpty: () => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
      return createRBAC({ storage: new NedbStorage({ file }) });
    },
    refresh: () => createRBAC({ storage: new NedbStorage({ file }) }),
  },
  {
    name: 'sequelize',
    create: async () => {
      await sequelize.sync({ force: true });
      const rbac = await createRBAC({ storage: new SequelizeStorage(db, 'test') });
      await Promise.all(roles.map((d) => rbac.createRole(d)));
      await Promise.all(permissions.map((d) => rbac.createPermission(d)));
      await Promise.all(grants.map(([role, grantNames]) => rbac.updateGrants(role, grantNames)));
      return rbac;
    },
    createEmpty: async () => {
      await sequelize.sync({ force: true });
      return createRBAC({ storage: new SequelizeStorage(db, 'test') });
    },
    refresh: async () => {
      await sequelize.sync({ force: true });
      return createRBAC({ storage: new SequelizeStorage(db, 'test') });
    },
  },
];

const sleep = (t = 400) =>
  new Promise((r) => {
    setTimeout(r, t);
  });

describe('RBAC', () => {
  let rbac;

  beforeEach(async () => {
    const cache = new DBCache(() => ({
      prefix: 'rbac',
      ttl: 1000,
      sqlitePath: ':memory:',
    }));

    await cache.flushAll();
  });

  storageModes.forEach((mode) => {
    describe(mode.name, () => {
      beforeEach(async () => {
        rbac = await mode.create();
      });

      afterEach(() => {});

      // construct

      test('should create a rbac instance', async () => {
        const roleList = await rbac.getRoles();
        expect(roleList.length).toBe(roles.length);
      });

      test('should create a rbac instance if file does not exist', async () => {
        rbac = await mode.createEmpty();

        const roleList = await rbac.getRoles();
        expect(roleList.length).toBe(0);

        await rbac.createRole({ name: 'admin' });

        const roleList2 = await rbac.getRoles();
        expect(roleList2.length).toBe(1);

        const permissionList = await rbac.getPermissions();
        expect(permissionList.length).toBe(0);
      });

      // get roles and permissions

      test('should be able to get roles and permissions', async () => {
        const roleList = await rbac.getRoles();

        expect(roleList).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: roles[0].name }),
            expect.objectContaining({ name: roles[1].name }),
            expect.objectContaining({ name: roles[2].name }),
            expect.objectContaining({ name: roles[3].name }),
          ])
        );

        const permissionList = await rbac.getPermissions();

        expect(permissionList).toEqual(
          expect.arrayContaining([expect.objectContaining({ name: permissions[0].name })])
        );
      });

      test('should be able to get role and permission', async () => {
        const role1 = await rbac.getRole('superadmin');
        expect(role1).toEqual(
          expect.objectContaining({
            name: 'superadmin',
          })
        );

        const role2 = await rbac.getRole('xxxx');
        expect(role2).toBeFalsy();

        const permission1 = await rbac.getPermission('create_article');
        expect(permission1).toEqual(
          expect.objectContaining({
            name: 'create_article',
          })
        );

        const permission2 = await rbac.getPermission('xx_xx');
        expect(permission2).toBeFalsy();
      });

      // create and update role
      test('should successfully create role', async () => {
        const l1 = await rbac.getRoles();
        expect(l1).not.toEqual(expect.arrayContaining([expect.objectContaining({ name: 'test1' })]));

        await rbac.createRole({ name: 'test1' });
        await sleep(100);
        await rbac.createRole({ name: 'test2', childName: 'user' });
        await sleep(100);
        await rbac.createRole({ name: 'test3', childName: 'user', permissions: ['delete_user'] });
        await sleep(100);
        await rbac.createRole({ name: 'test4', childName: '', permissions: ['delete_user', 'create_article'] });
        await sleep(100);
        await rbac.createRole({ name: 'test5', title: 'Title', description: 'Description' });
        await sleep(100);
        await rbac.createRole({
          name: 'test6',
          title: 'Title',
          description: 'Description',
          extra: { isProtected: true },
        });

        const expected = expect.arrayContaining([
          expect.objectContaining({ name: 'test1', grants: [] }),
          expect.objectContaining({ name: 'test2', grants: ['user'] }),
          expect.objectContaining({ name: 'test3', grants: ['user', 'delete_user'] }),
          expect.objectContaining({ name: 'test4', grants: ['delete_user', 'create_article'] }),
          expect.objectContaining({ name: 'test5', title: 'Title', description: 'Description' }),
          expect.objectContaining({
            name: 'test6',
            title: 'Title',
            description: 'Description',
            extra: { isProtected: true },
          }),
        ]);

        const l2 = await rbac.getRoles();
        expect(l2).toEqual(expected);

        if (mode.name === 'nedb') {
          rbac = await mode.refresh();
          const l21 = await rbac.getRoles();
          expect(l21).toEqual(expected);
        }

        const r3 = await rbac.updateRole({ name: 'test5', title: 'Update Title ', description: 'Update Description ' });
        expect(r3).toMatchObject({ name: 'test5', title: 'Update Title ', description: 'Update Description ' });

        const l4 = await rbac.getRoles();
        expect(l4).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'test5', title: 'Update Title ', description: 'Update Description ' }),
          ])
        );

        if (mode.name === 'nedb') {
          expect(l4[0].name).toEqual('test6'); // order not change after updated
        }

        const r4 = await rbac.updateRole({
          name: 'test6',
          title: 'Update Title ',
          description: 'Update Description ',
          extra: { isProtected: false },
        });
        expect(r4).toMatchObject({
          name: 'test6',
          title: 'Update Title ',
          description: 'Update Description ',
          extra: { isProtected: false },
        });

        const l5 = await rbac.getRoles();
        expect(l5).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'test6',
              title: 'Update Title ',
              description: 'Update Description ',
              extra: { isProtected: false },
            }),
          ])
        );
      });

      test('should not successfully create or update a role', async () => {
        expect.assertions(6);

        try {
          await rbac.createRole({ name: 'a_b' });
        } catch (error) {
          expect(error.message).toMatch('no valid name');
        }

        try {
          await rbac.createRole({ name: 'test2', childName: 'not-exist' });
        } catch (error) {
          expect(error.message).toMatch('not-exist is not exist');
        }

        try {
          await rbac.createRole({ name: 'test3', permissions: ['a_b'] });
        } catch (error) {
          expect(error.message).toMatch('a_b is not exist');
        }

        try {
          await rbac.createRole({ name: 'test4', permissions: ['cccc'] });
        } catch (error) {
          expect(error.message).toMatch('cccc is not exist');
        }

        try {
          await rbac.createRole({ name: 'admin' });
        } catch (error) {
          expect(error.message).toMatch('admin already exists');
        }

        try {
          await rbac.updateRole({ name: 'no-exist' });
        } catch (error) {
          expect(error.message).toMatch('does not exist');
        }
      });

      // create and update permission

      test('should successfully create and update permission', async () => {
        rbac = await mode.createEmpty();

        const p1 = await rbac.createPermission({ name: 'action_resource' });
        await sleep();
        const p2 = await rbac.createPermission({
          name: 'action_resource2',
          title: 'Title',
          description: 'Description',
        });
        await sleep();

        expect(p1).toMatchObject({ name: 'action_resource' });
        expect(p2).toMatchObject({ name: 'action_resource2', title: 'Title', description: 'Description' });

        const l3 = await rbac.getPermissions();
        expect(l3.length).toBe(2);
        expect(l3).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'action_resource' }),
            expect.objectContaining({ name: 'action_resource2', title: 'Title', description: 'Description' }),
          ])
        );

        if (mode.name === 'nedb') {
          expect(l3[0].name).toEqual('action_resource2'); // newly created item is list first
        }

        const p4 = await rbac.updatePermission({ name: 'action_resource', title: 't1', description: 't1' });
        expect(p4).toMatchObject({ name: 'action_resource', title: 't1', description: 't1' });

        const l5 = await rbac.getPermissions();
        expect(l5).toEqual(
          expect.arrayContaining([expect.objectContaining({ name: 'action_resource', title: 't1', description: 't1' })])
        );
        if (mode.name === 'nedb') {
          expect(l5[0].name).toEqual('action_resource2'); // order not change after updated
        }
      });

      test('should not successfully create or update permission', async () => {
        expect.assertions(3);

        try {
          await rbac.createPermission({ name: 'abc' });
        } catch (error) {
          expect(error.message).toBeTruthy();
        }

        try {
          await rbac.createPermission({ name: 'create_article' });
        } catch (error) {
          expect(error.message).toMatch('already exists');
        }

        try {
          await rbac.updatePermission({ name: 'no-exist' });
        } catch (error) {
          expect(error.message).toMatch('does not exist');
        }
      });

      // can

      test('admin can create article', async () => {
        const can = await rbac.can('admin', 'create', 'article');
        expect(can).toBe(true);
      });

      test('admin can delete user', async () => {
        const can = await rbac.can('admin', 'delete', 'user');
        expect(can).toBe(true);
      });

      test('user can not delete user', async () => {
        const can = await rbac.can('user', 'delete', 'user');
        expect(can).toBe(false);
      });

      test('user can create article', async () => {
        const can = await rbac.can('user', 'create', 'article');
        expect(can).toBe(true);
      });

      test('user can any create article', async () => {
        const can = await rbac.canAny('user', splittedPermissions);
        expect(can).toBe(true);
      });

      test('user can all create article', async () => {
        const can = await rbac.canAll('user', splittedPermissions);
        expect(can).toBe(false);
      });

      test('admin can all create article', async () => {
        const can = await rbac.canAll('admin', splittedPermissions);
        expect(can).toBe(true);
      });

      // grant and revoke

      test('grant permissions for admin', async () => {
        rbac = await mode.createEmpty();
        await Promise.all(roles.map((d) => rbac.createRole(d)));
        await Promise.all(permissions.map((d) => rbac.createPermission(d)));

        const granted = await rbac.grant('admin', 'delete_user');
        expect(granted).toBe(true);
      });

      test('grant permissions for user', async () => {
        rbac = await mode.createEmpty();
        await Promise.all(roles.map((d) => rbac.createRole(d)));
        await Promise.all(permissions.map((d) => rbac.createPermission(d)));

        const granted = await rbac.grant('user', 'create_article');
        expect(granted).toBe(true);
      });

      test('grant role for admin', async () => {
        rbac = await mode.createEmpty();
        await Promise.all(roles.map((d) => rbac.createRole(d)));
        await Promise.all(permissions.map((d) => rbac.createPermission(d)));

        await rbac.grant('admin', 'user');
      });

      test('should able to revoke permission', async () => {
        const revoked = await rbac.revoke('user', 'create_article');
        expect(revoked).toBe(true);

        const revoke2 = await rbac.revoke('user', 'update_article');
        expect(revoke2).toBe(true);
      });

      test('user can not create article because it is revoked', async () => {
        await rbac.revoke('user', 'create_article');

        const can = await rbac.can('user', 'create', 'article');
        expect(can).toBe(false);
      });

      test('should able to grant permission again', async () => {
        await rbac.revoke('user', 'create_article');
        const granted = await rbac.grant('user', 'create_article');
        expect(granted).toBe(true);
      });

      test('user can create article because it is granted again', async () => {
        await rbac.revoke('user', 'create_article');

        const can = await rbac.can('user', 'create', 'article');
        expect(can).toBe(false);

        await rbac.grant('user', 'create_article');

        const can2 = await rbac.can('user', 'create', 'article');
        expect(can2).toBe(true);
      });

      test('should able to update grants', async () => {
        const l1 = await rbac.getRoles();
        expect(l1).toEqual(
          expect.arrayContaining([expect.objectContaining({ name: 'admin', grants: ['user', 'delete_user'] })])
        );

        await rbac.updateGrants('admin', ['user']);
        const l2 = await rbac.getRoles();
        expect(l2).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'admin', grants: ['user'] })]));

        await rbac.updateGrants('admin', ['create_article', 'update_article', 'delete_user']);
        const l3 = await rbac.getRoles();
        expect(l3).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'admin', grants: ['create_article', 'update_article', 'delete_user'] }),
          ])
        );

        if (mode.name === 'nedb') {
          rbac = await mode.refresh();
          const l4 = await rbac.getRoles();
          expect(l4).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ name: 'admin', grants: ['create_article', 'update_article', 'delete_user'] }),
            ])
          );
        }
      });

      // removePermission

      test('should be able to remove permission', async () => {
        const removed = await rbac.removePermission('create_article');
        expect(removed).toBe(true);

        const removed2 = await rbac.removePermission('delete_user');
        expect(removed2).toBe(true);
      });

      test('should not be able to get removed permission', async () => {
        await rbac.removePermission('create_article');
        const permissionList = await rbac.getPermissions();
        expect(permissionList).not.toEqual(
          expect.arrayContaining([expect.objectContaining({ name: 'create_article' })])
        );
      });

      // removeRole

      test('should be able to remove role', async () => {
        const removed = await rbac.removeRole('guest');
        expect(removed).toBe(true);

        const removed2 = await rbac.removeRole('user');
        expect(removed2).toBe(true);

        const removed3 = await rbac.removeRole('admin');
        expect(removed3).toBe(true);
      });

      test('should not be able to get removed role', async () => {
        // remove guest
        await rbac.removeRole('guest');
        const l1 = await rbac.getRoles();
        expect(l1).not.toEqual(expect.arrayContaining([expect.objectContaining({ name: 'guest' })]));

        // remove user
        const l2 = await rbac.getRoles();
        expect(l2).toEqual(
          expect.arrayContaining([expect.objectContaining({ name: 'admin', grants: expect.arrayContaining(['user']) })])
        );

        await rbac.removeRole('user');

        const l3 = await rbac.getRoles();
        expect(l3).not.toEqual(
          expect.arrayContaining([expect.objectContaining({ name: 'admin', grants: expect.arrayContaining(['user']) })])
        );
      });

      // get scope

      test('should be able to get scope for admin', async () => {
        const scope = await rbac.getScope('admin');
        expect(scope).toEqual(['delete_user', 'create_article', 'update_article']);
      });

      test('should be able to get scope for user', async () => {
        const scope = await rbac.getScope('user');
        expect(scope).toEqual(['create_article', 'update_article']);
      });

      test('should be able to get scope for more complex object', async () => {
        rbac = await mode.createEmpty();
        await Promise.all(['superadmin', 'admin', 'user', 'guest'].map((name) => rbac.createRole({ name })));
        await Promise.all(
          ['create_user', 'delete_user', 'change_password', 'forgot_password', 'create_article', 'update_rbac'].map(
            (name) => rbac.createPermission({ name })
          )
        );
        await Promise.all(
          [
            ['guest', ['create_user', 'forgot_password']],
            ['user', ['change_password']],
            ['admin', ['user', 'delete_user', 'update_rbac', 'create_article']],
            ['superadmin', ['admin']],
          ].map(([role, grantNames]) => rbac.updateGrants(role, grantNames))
        );

        const scope = await rbac.getScope('admin');
        expect(scope).toEqual(['delete_user', 'update_rbac', 'create_article', 'change_password']);
      });

      test('should return object when get scope', async () => {
        const scope = await rbac.getScope('admin', true);
        expect(scope.map((x) => pick(x, ['name']))).toEqual([
          {
            name: 'delete_user',
          },
          {
            name: 'create_article',
          },
          {
            name: 'update_article',
          },
        ]);
      });

      // orgId support tests

      test('should successfully create role with orgId', async () => {
        // 为 sequelize 模式创建测试 org
        if (mode.name === 'sequelize') {
          await createTestOrg('org1', 'Test Org 1');
          await createTestOrg('org2', 'Test Org 2');
        }

        await rbac.createRole({ name: 'org1admin', title: 'Org1 Admin', orgId: 'org1' });
        await rbac.createRole({ name: 'org2admin', title: 'Org2 Admin', orgId: 'org2' });
        await rbac.createRole({ name: 'globaladmin', title: 'Global Admin' });

        const allRoles = await rbac.getRoles();
        const rolesData = allRoles.map((r) => pick(r, ['name', 'orgId']));

        expect(rolesData).toEqual(
          expect.arrayContaining([
            { name: 'org1admin', orgId: 'org1' },
            { name: 'org2admin', orgId: 'org2' },
            expect.objectContaining({ name: 'globaladmin' }),
          ])
        );
      });

      test('should filter roles by orgId', async () => {
        rbac = await mode.createEmpty();

        // 为 sequelize 模式创建测试 org
        if (mode.name === 'sequelize') {
          await createTestOrg('org1', 'Test Org 1');
          await createTestOrg('org2', 'Test Org 2');
        }

        await rbac.createRole({ name: 'org1admin', title: 'Org1 Admin', orgId: 'org1' });
        await rbac.createRole({ name: 'org1user', title: 'Org1 User', orgId: 'org1' });
        await rbac.createRole({ name: 'org2admin', title: 'Org2 Admin', orgId: 'org2' });
        await rbac.createRole({ name: 'globaladmin', title: 'Global Admin' });

        const org1Roles = await rbac.getRoles('org1');
        expect(org1Roles.length).toBe(2);
        const org1RolesData = org1Roles.map((r) => pick(r, ['name', 'orgId']));
        expect(org1RolesData).toEqual(
          expect.arrayContaining([
            { name: 'org1admin', orgId: 'org1' },
            { name: 'org1user', orgId: 'org1' },
          ])
        );

        const org2Roles = await rbac.getRoles('org2');
        expect(org2Roles.length).toBe(1);
        expect(org2Roles.map((r) => pick(r, ['name', 'orgId']))).toEqual([{ name: 'org2admin', orgId: 'org2' }]);

        const allRoles = await rbac.getRoles();
        expect(allRoles.length).toBe(4);
      });

      test('should return empty array when filtering by non-existent orgId', async () => {
        rbac = await mode.createEmpty();

        // 为 sequelize 模式创建测试 org
        if (mode.name === 'sequelize') {
          await createTestOrg('org1', 'Test Org 1');
        }

        await rbac.createRole({ name: 'org1admin', orgId: 'org1' });

        const filteredRoles = await rbac.getRoles('non-existent-org');
        expect(filteredRoles.length).toBe(0);
      });

      test('should correctly handle roles with and without orgId', async () => {
        rbac = await mode.createEmpty();

        // 为 sequelize 模式创建测试 org
        if (mode.name === 'sequelize') {
          await createTestOrg('org1', 'Test Org 1');
        }

        await rbac.createRole({ name: 'globalrole1' });
        await rbac.createRole({ name: 'globalrole2' });
        await rbac.createRole({ name: 'org1role', orgId: 'org1' });

        const allRoles = await rbac.getRoles();
        expect(allRoles.length).toBe(3);

        const globalRoles = allRoles.filter((r) => !r.orgId);
        expect(globalRoles.length).toBe(2);

        const org1Roles = await rbac.getRoles('org1');
        expect(org1Roles.length).toBe(1);
        expect(org1Roles[0].orgId).toBe('org1');
      });

      test('should support orgId in role with permissions and grants', async () => {
        rbac = await mode.createEmpty();
        await Promise.all(permissions.map((d) => rbac.createPermission(d)));

        // 为 sequelize 模式创建测试 org
        if (mode.name === 'sequelize') {
          await createTestOrg('org1', 'Test Org 1');
        }

        await rbac.createRole({ name: 'org1user', orgId: 'org1' });
        await rbac.createRole({
          name: 'org1admin',
          orgId: 'org1',
          childName: 'org1user',
          permissions: ['create_article', 'delete_user'],
        });

        const org1Roles = await rbac.getRoles('org1');
        const org1AdminRole = org1Roles.find((r) => r.name === 'org1admin');
        expect(org1AdminRole).toBeTruthy();
        expect(org1AdminRole.orgId).toBe('org1');
        expect(org1AdminRole.grants).toEqual(expect.arrayContaining(['org1user', 'create_article', 'delete_user']));

        const canCreate = await rbac.can('org1admin', 'create', 'article');
        expect(canCreate).toBe(true);
      });
    });
  });
});
