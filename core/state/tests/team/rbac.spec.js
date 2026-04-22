const { describe, test, expect, beforeAll, afterAll } = require('bun:test');
const path = require('path');
const pick = require('lodash/pick');
const { fromRandom } = require('@ocap/wallet');
const { types } = require('@ocap/mcrypto');
const { BlockletEvents } = require('@blocklet/constant');

const { setupInstance, tearDownInstance } = require('../../tools/fixture');

const formatRole = (x) => pick(x, ['name', 'title', 'grants']);

describe('RBAC', () => {
  let instance = null;
  let teamAPI = null;
  let context = {};
  let nodeDid = '';
  let installStaticDemo = () => {};
  let removeStaticDemo = () => {};
  let waitForEvent = async (event, instance = null) => ({}); // eslint-disable-line
  let appWallet;
  let appDid;
  let appSk;
  let blockletInstalled = false;

  const staticDemoDid = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';

  beforeAll(async () => {
    instance = await setupInstance('team-rbac');
    teamAPI = instance.teamAPI;
    context = {
      hostname: 'test.abtnode.com',
      user: {
        did: fromRandom().address,
      },
    };
    nodeDid = (await instance.states.node.read()).did;

    const manager = instance.blockletManager;

    waitForEvent = (event) => new Promise((resolve) => instance.on(event, resolve));

    // 初始化 appWallet/appDid/appSk 一次，所有测试共享
    appWallet = fromRandom({ role: types.RoleType.ROLE_APPLICATION });
    appDid = appWallet.address;
    appSk = appWallet.secretKey;

    installStaticDemo = async () => {
      if (blockletInstalled) return;
      const url = `file://${path.join(__dirname, `../assets/api/blocklets/${staticDemoDid}/blocklet.json`)}`;
      await manager.install({ url, appSk }, context);
      await new Promise((resolve) => manager.on(BlockletEvents.installed, resolve));
      blockletInstalled = true;
    };

    removeStaticDemo = async (keepData = false) => {
      if (!blockletInstalled) return;
      const blocklet = await instance.states.blocklet.getBlocklet(appDid);
      if (blocklet) {
        await manager.delete({ did: appDid, keepData });
        await waitForEvent(BlockletEvents.removed);
        blockletInstalled = false;
      }
    };

    // 所有测试都需要 blocklet，在 beforeAll 中安装一次
    await installStaticDemo();
  });

  test('Api should be a function', () => {
    expect(typeof teamAPI.getRoles).toEqual('function');
    expect(typeof teamAPI.createRole).toEqual('function');
    expect(typeof teamAPI.getPermissions).toEqual('function');
    expect(typeof teamAPI.createPermission).toEqual('function');
    expect(typeof teamAPI.grant).toEqual('function');
    expect(typeof teamAPI.revoke).toEqual('function');
    expect(typeof teamAPI.updateGrants).toEqual('function');
    expect(typeof teamAPI.deleteRole).toEqual('function');
    expect(typeof teamAPI.deletePermission).toEqual('function');
  });

  test('Should get roles of abtnode', async () => {
    const res = await teamAPI.getRoles({ teamDid: nodeDid });

    expect(res).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'owner', title: 'Owner' }),
        expect.objectContaining({ name: 'member', title: 'Member' }),
        expect.objectContaining({ name: 'admin' }),
        expect.objectContaining({ name: 'guest' }),
      ])
    );
  });

  test('Should get roles of static-demo', async () => {
    const res = await teamAPI.getRoles({ teamDid: appDid });

    expect(res.map(formatRole)).toEqual(
      expect.arrayContaining([
        {
          name: 'guest',
          title: 'Guest',
          grants: [],
        },
      ])
    );
  });

  test('Should get permissions of static-demo', async () => {
    const res = await teamAPI.getPermissions({ teamDid: appDid });

    expect(res).toEqual([]);
  });

  test('Should create role to static-demo', async () => {
    const did = appDid;
    const name = 'developer';
    const title = 'Developer';
    const description = 'develop role description';

    const r1 = await teamAPI.getRoles({ teamDid: did });
    expect(r1.map(formatRole)).toEqual(
      expect.arrayContaining([
        {
          name: 'guest',
          title: 'Guest',
          grants: [],
        },
      ])
    );

    let role = await teamAPI.createRole({ teamDid: did, name, title, description });
    expect(role).toEqual({
      extra: null,
      name: 'developer',
      title: 'Developer',
      description: 'develop role description',
      orgId: null,
      grants: [],
    });

    role = await teamAPI.getRole({ teamDid: did, role: { name } });
    expect(role).toEqual({
      extra: null,
      name: 'developer',
      title: 'Developer',
      description: 'develop role description',
      orgId: null,
      grants: [],
    });

    const r2 = await teamAPI.getRoles({ teamDid: did });
    expect(r2).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'developer' }),
        expect.objectContaining({ name: 'guest' }),
      ])
    );

    expect(
      teamAPI.createRole({ teamDid: did, name: 'blocklet-xxxx', title: 'test title', description: 'test desc' })
    ).rejects.toThrow('start with "blocklet"');

    expect(
      teamAPI.createRole({ teamDid: did, name: 'owner,admin', title: 'test title', description: 'test desc' })
    ).rejects.toThrow('only numbers or letters');
  });

  test('Should update role to static-demo', async () => {
    const did = appDid;
    const name = 'developer';
    const title = 'Developer';
    const description = 'develop role description';

    // 如果角色已存在（来自之前的测试），先删除
    try {
      await teamAPI.deleteRole({ teamDid: did, name });
    } catch (err) {
      // 忽略删除失败（角色不存在）
    }

    const role = await teamAPI.createRole({ teamDid: did, name, title, description });
    expect(role).toEqual({
      extra: null,
      name: 'developer',
      title: 'Developer',
      description: 'develop role description',
      orgId: null,
      grants: [],
    });

    const l2 = await teamAPI.getRoles({ teamDid: did });
    expect(l2).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'developer', title: 'Developer' })]));

    const r3 = await teamAPI.updateRole({
      teamDid: did,
      role: { name, title: 'Developer2', description: 'develop role description2' },
    });
    expect(r3).toEqual({
      extra: null,
      name: 'developer',
      title: 'Developer2',
      description: 'develop role description2',
      orgId: null,
      grants: [],
    });

    const l4 = await teamAPI.getRoles({ teamDid: did });
    expect(l4).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'developer', title: 'Developer2', description: 'develop role description2' }),
      ])
    );

    expect(
      teamAPI.updateRole({
        teamDid: did,
        role: { name: 'blocklet-xxx', title: 'test title', description: 'test desc' },
      })
    ).rejects.toThrow('start with "blocklet"');
  });

  test('Should create permission to static-demo', async () => {
    const did = appDid;
    const name = 'query_user';
    const description = 'Query User';

    // 如果权限已存在（来自之前的测试），先删除
    try {
      await teamAPI.deletePermission({ teamDid: did, name });
    } catch (err) {
      // 忽略删除失败（权限不存在或受保护）
    }

    const r1 = await teamAPI.getPermissions({ teamDid: appDid });
    // 可能包含其他权限，只检查不包含我们要创建的
    const existingPermission = r1.find((p) => p.name === name);
    expect(existingPermission).toBeUndefined();

    const permission = await teamAPI.createPermission({ teamDid: did, name, description });
    expect(permission).toEqual({ name, description });

    const r2 = await teamAPI.getPermissions({ teamDid: did });
    expect(r2).toEqual(expect.arrayContaining([{ name, description, isProtected: false }]));
  });

  test('Should refresh blocklet interface permissions as expected', async () => {
    expect.assertions(2);

    const meta = {
      did: appDid,
      interfaces: [
        { type: 'web', name: 'publicUrl' },
        { type: 'web', name: 'adminUrl' },
        { type: 'service', name: 'xxx' },
      ],
    };

    await teamAPI.refreshBlockletInterfacePermissions(meta);
    const r2 = await teamAPI.getPermissions({ teamDid: appDid });
    expect(r2).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'access_publicUrl', isProtected: true }),
        expect.objectContaining({ name: 'access_adminUrl', isProtected: true }),
      ])
    );

    try {
      await teamAPI.deletePermission({ teamDid: appDid, name: 'access_publicUrl' });
    } catch (error) {
      expect(error.message).toMatch('is reserved');
    }
  });

  test('Should update permission to static-demo', async () => {
    const did = appDid;
    const name = 'query_user';
    const description = 'Query User';

    // 如果权限已存在（来自之前的测试），先删除
    try {
      await teamAPI.deletePermission({ teamDid: did, name });
    } catch (err) {
      // 忽略删除失败（权限不存在或受保护）
    }

    const permission = await teamAPI.createPermission({ teamDid: did, name, description });
    expect(permission).toEqual({
      name,
      description,
    });

    const l2 = await teamAPI.getPermissions({ teamDid: did });
    expect(l2).toEqual(expect.arrayContaining([{ name, description, isProtected: false }]));

    const p3 = await teamAPI.updatePermission({ teamDid: did, permission: { name, description: 'hello world' } });
    expect(p3).toEqual({ name, description: 'hello world' });

    const l4 = await teamAPI.getPermissions({ teamDid: did });
    expect(l4).toEqual(expect.arrayContaining([{ name, description: 'hello world', isProtected: false }]));
  });

  test('Should grant and revoke permission to static-demo', async () => {
    const did = appDid;

    const r1 = await teamAPI.getRoles({ teamDid: did });
    expect(r1.map(formatRole)).toEqual(
      expect.arrayContaining([
        {
          name: 'guest',
          title: 'Guest',
          grants: [],
        },
      ])
    );

    // 如果权限已存在，先删除
    try {
      await teamAPI.deletePermission({ teamDid: did, name: 'query_user' });
    } catch (err) {
      // 忽略删除失败
    }
    // 确保 guest 角色没有 grants
    const guestRole = r1.find((r) => r.name === 'guest');
    if (guestRole && guestRole.grants && guestRole.grants.includes('query_user')) {
      await teamAPI.revoke({ teamDid: did, roleName: 'guest', grantName: 'query_user' });
    }

    await teamAPI.createPermission({ teamDid: did, name: 'query_user', description: 'desc' });
    await teamAPI.grant({ teamDid: did, roleName: 'guest', grantName: 'query_user' });

    const r2 = await teamAPI.getRoles({ teamDid: did });
    expect(r2.map(formatRole)).toEqual(
      expect.arrayContaining([
        {
          name: 'guest',
          title: 'Guest',
          grants: ['query_user'],
        },
      ])
    );

    await teamAPI.revoke({ teamDid: did, roleName: 'guest', grantName: 'query_user' });

    const r3 = await teamAPI.getRoles({ teamDid: did });
    expect(r3.map(formatRole)).toEqual(
      expect.arrayContaining([
        {
          name: 'guest',
          title: 'Guest',
          grants: [],
        },
      ])
    );
  });

  test('Should grant and revoke child role to static-demo', async () => {
    const did = appDid;

    const r1 = await teamAPI.getRoles({ teamDid: did });
    // 清理可能存在的权限和 grants
    try {
      await teamAPI.deletePermission({ teamDid: did, name: 'query_user' });
    } catch (err) {
      // 忽略删除失败
    }
    const guestRole = r1.find((r) => r.name === 'guest');
    if (guestRole && guestRole.grants && guestRole.grants.includes('query_user')) {
      await teamAPI.revoke({ teamDid: did, roleName: 'guest', grantName: 'query_user' });
    }
    const adminRole = r1.find((r) => r.name === 'admin');
    if (adminRole && adminRole.grants && adminRole.grants.includes('guest')) {
      await teamAPI.revoke({ teamDid: did, roleName: 'admin', grantName: 'guest' });
    }

    expect(r1.map(formatRole)).toEqual(
      expect.arrayContaining([
        {
          name: 'guest',
          title: 'Guest',
          grants: [],
        },
      ])
    );

    await teamAPI.createPermission({ teamDid: did, name: 'query_user', description: 'desc' });
    await teamAPI.grant({ teamDid: did, roleName: 'guest', grantName: 'query_user' });
    await teamAPI.grant({ teamDid: did, roleName: 'admin', grantName: 'guest' });

    const r2 = await teamAPI.getRoles({ teamDid: did });
    expect(r2.map(formatRole)).toEqual(
      expect.arrayContaining([
        {
          name: 'guest',
          title: 'Guest',
          grants: ['query_user'],
        },
        {
          name: 'admin',
          title: 'Admin',
          grants: ['guest'],
        },
      ])
    );

    await teamAPI.revoke({ teamDid: did, roleName: 'admin', grantName: 'guest' });

    const r3 = await teamAPI.getRoles({ teamDid: did });
    expect(r3.map(formatRole)).toEqual(
      expect.arrayContaining([
        {
          name: 'guest',
          title: 'Guest',
          grants: ['query_user'],
        },
        {
          name: 'admin',
          title: 'Admin',
          grants: [],
        },
      ])
    );
  });

  test('Should batch update grants to static-demo', async () => {
    const did = appDid;

    // 清理可能存在的角色
    try {
      await teamAPI.deleteRole({ teamDid: did, name: 'developer' });
    } catch (err) {
      // 忽略删除失败
    }

    // 清理可能存在的权限和 grants
    try {
      await teamAPI.deletePermission({ teamDid: did, name: 'query_user' });
    } catch (err) {
      // 忽略删除失败
    }
    try {
      await teamAPI.deletePermission({ teamDid: did, name: 'update_user' });
    } catch (err) {
      // 忽略删除失败
    }

    // 清理 grants
    const r1Before = await teamAPI.getRoles({ teamDid: did });
    const guestRole = r1Before.find((r) => r.name === 'guest');
    if (guestRole && guestRole.grants && guestRole.grants.length > 0) {
      await teamAPI.updateGrants({ teamDid: did, roleName: 'guest', grantNames: [] });
    }
    const adminRole = r1Before.find((r) => r.name === 'admin');
    if (adminRole && adminRole.grants && adminRole.grants.length > 0) {
      await teamAPI.updateGrants({ teamDid: did, roleName: 'admin', grantNames: [] });
    }

    // 重新获取角色列表来验证清理结果
    const r1 = await teamAPI.getRoles({ teamDid: did });
    expect(r1.map(formatRole)).toEqual(
      expect.arrayContaining([
        {
          name: 'guest',
          title: 'Guest',
          grants: [],
        },
      ])
    );

    await teamAPI.createPermission({ teamDid: did, name: 'query_user', description: 'desc' });
    await teamAPI.createPermission({ teamDid: did, name: 'update_user', description: 'desc' });
    await teamAPI.updateGrants({ teamDid: did, roleName: 'guest', grantNames: ['query_user'] });
    await teamAPI.updateGrants({ teamDid: did, roleName: 'admin', grantNames: ['guest', 'update_user'] });

    const r2 = await teamAPI.getRoles({ teamDid: did });
    expect(r2.map(formatRole)).toEqual(
      expect.arrayContaining([
        {
          name: 'guest',
          title: 'Guest',
          grants: ['query_user'],
        },
        {
          name: 'admin',
          title: 'Admin',
          grants: ['guest', 'update_user'],
        },
      ])
    );
  });

  test('Should get permissions by role of static-demo', async () => {
    const did = appDid;

    // 清理可能存在的权限和 grants
    try {
      await teamAPI.deletePermission({ teamDid: did, name: 'query_user' });
    } catch (err) {
      // 忽略删除失败
    }
    try {
      await teamAPI.deletePermission({ teamDid: did, name: 'update_user' });
    } catch (err) {
      // 忽略删除失败
    }
    const r1 = await teamAPI.getRoles({ teamDid: did });
    const guestRole = r1.find((r) => r.name === 'guest');
    if (guestRole && guestRole.grants && guestRole.grants.length > 0) {
      await teamAPI.updateGrants({ teamDid: did, roleName: 'guest', grantNames: [] });
    }
    const adminRole = r1.find((r) => r.name === 'admin');
    if (adminRole && adminRole.grants && adminRole.grants.length > 0) {
      await teamAPI.updateGrants({ teamDid: did, roleName: 'admin', grantNames: [] });
    }

    await teamAPI.createPermission({ teamDid: did, name: 'query_user', description: 'desc' });
    await teamAPI.createPermission({ teamDid: did, name: 'update_user', description: 'Update User' });
    await teamAPI.updateGrants({ teamDid: did, roleName: 'guest', grantNames: ['query_user'] });
    await teamAPI.updateGrants({ teamDid: did, roleName: 'admin', grantNames: ['guest', 'update_user'] });

    const p1 = await teamAPI.getPermissionsByRole({ teamDid: did, role: { name: 'guest' } });
    expect(p1).toEqual([{ name: 'query_user', description: 'desc' }]);

    const p2 = await teamAPI.getPermissionsByRole({ teamDid: did, role: { name: 'admin' } });
    expect(p2).toEqual(
      expect.arrayContaining([
        { name: 'query_user', description: 'desc' },
        { name: 'update_user', description: 'Update User' },
      ])
    );
  });

  test('Should throw error if create role is empty', async () => {
    expect.assertions(1);

    try {
      await teamAPI.createRole({ teamDid: appDid, name: '' });
    } catch (err) {
      expect(err.message).toBeTruthy();
    }
  });

  test('Should throw error if custom role name is owner or guest', async () => {
    expect.assertions(4);

    try {
      await teamAPI.createRole({ teamDid: appDid, name: 'owner' });
    } catch (err) {
      expect(err.message).toBeTruthy();
    }

    try {
      await teamAPI.deleteRole({ teamDid: appDid, name: 'owner' });
    } catch (err) {
      expect(err.message).toBeTruthy();
    }

    try {
      await teamAPI.createRole({ teamDid: appDid, name: 'guest' });
    } catch (err) {
      expect(err.message).toBeTruthy();
    }

    try {
      await teamAPI.deleteRole({ teamDid: appDid, name: 'guest' });
    } catch (err) {
      expect(err.message).toBeTruthy();
    }
  });

  test('Should throw error if permission is empty', async () => {
    expect.assertions(1);

    try {
      await teamAPI.createPermission({ teamDid: appDid, name: '' });
    } catch (err) {
      expect(err.message).toBeTruthy();
    }
  });

  test('Should throw error if grant data is empty', async () => {
    expect.assertions(5);

    const did = appDid;

    // 清理可能存在的权限
    try {
      await teamAPI.deletePermission({ teamDid: did, name: 'query_user' });
    } catch (err) {
      // 忽略删除失败
    }

    await teamAPI.createPermission({ teamDid: did, name: 'query_user', description: 'desc' });

    try {
      await teamAPI.grant({ teamDid: did, roleName: '', grantName: '' });
    } catch (err) {
      expect(err.message).toBeTruthy();
    }

    try {
      await teamAPI.grant({ teamDid: did, roleName: 'guest', grantName: '' });
    } catch (err) {
      expect(err.message).toBeTruthy();
    }

    try {
      await teamAPI.grant({ teamDid: did, roleName: '', grantName: 'query_user' });
    } catch (err) {
      expect(err.message).toBeTruthy();
    }

    try {
      await teamAPI.grant({ teamDid: did, roleName: 'guest', grantName: 'no-exist' });
    } catch (err) {
      expect(err.message).toBeTruthy();
    }

    try {
      await teamAPI.grant({ teamDid: did, roleName: 'no-exist', grantName: 'query_user' });
    } catch (err) {
      expect(err.message).toBeTruthy();
    }
  });

  test('Should throw error if length of role exceed 64', async () => {
    expect.assertions(1);

    const name = new Array(65).fill('a').join();

    try {
      await teamAPI.createRole({ teamDid: appDid, name });
    } catch (err) {
      expect(err.message).toMatch('64');
    }
  });

  test('Should throw error if length of role title exceed 25', async () => {
    expect.assertions(1);

    const title = new Array(26).fill('a').join('');

    try {
      await teamAPI.createRole({ teamDid: appDid, name: 'a', title });
    } catch (err) {
      expect(err.message).toMatch('25');
    }
  });

  test('Should throw error if length of permission exceed 64', async () => {
    expect.assertions(1);

    const name = new Array(65).fill('a').join();

    try {
      await teamAPI.createPermission({ teamDid: appDid, name });
    } catch (err) {
      expect(err.message).toMatch('64');
    }
  });

  test('Should get permissions of abtnode', async () => {
    const res = await teamAPI.getPermissions({ teamDid: nodeDid });

    expect(res).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'query_blocklets' }),
        expect.objectContaining({ name: 'query_router' }),
        expect.objectContaining({ name: 'query_webhook' }),
        expect.objectContaining({ name: 'query_notification' }),
        expect.objectContaining({ name: 'query_team' }),
        expect.objectContaining({ name: 'query_node' }),
      ])
    );
  });

  test('Should throw error when get roles of non-exist blocklet', async () => {
    expect.assertions(1);

    try {
      await teamAPI.getRoles({ teamDid: 'no-exist' });
    } catch (err) {
      expect(err.message).toMatch('Did does not exist');
    }
  });

  test('Should throw error when get roles of removed blocklet', async () => {
    expect.assertions(3);

    const res = await teamAPI.getRoles({ teamDid: appDid });
    expect(res.length).toBe(4);
    expect(res.map(formatRole)).toEqual(
      expect.arrayContaining([
        {
          name: 'guest',
          title: 'Guest',
          grants: [],
        },
      ])
    );

    await removeStaticDemo();

    try {
      await teamAPI.getRoles({ teamDid: appDid });
    } catch (err) {
      expect(err.message).toMatch('Did does not exist');
    } finally {
      // 重新安装，因为其他测试可能需要
      await installStaticDemo();
    }
  });

  afterAll(async () => {
    await removeStaticDemo();
    await tearDownInstance(instance);
  });
});
