const { describe, test, expect, beforeAll, afterAll } = require('bun:test');
const path = require('path');
const { fromRandom } = require('@ocap/wallet');
const { types } = require('@ocap/mcrypto');
const { BlockletEvents } = require('@blocklet/constant');

// 在覆盖率模式下 Date.now() 可能不准确，使用 performance.now() 来修正
const originalDateNow = Date.now;
const startTime = originalDateNow();
const startPerf = performance.now();
Date.now = () => Math.floor(startTime + (performance.now() - startPerf));

// 使用 performance.now() 确保在覆盖率模式下时间准确
const sleep = (ms) =>
  new Promise((resolve) => {
    const start = performance.now();
    const check = () => {
      if (performance.now() - start >= ms) {
        resolve();
      } else {
        setTimeout(check, Math.min(50, ms / 10));
      }
    };
    setTimeout(check, Math.min(50, ms / 10));
  });

const { setupInstance, tearDownInstance } = require('../../tools/fixture');

const appWallet = fromRandom({ role: types.RoleType.ROLE_APPLICATION });
const appDid = appWallet.address;
const appSk = appWallet.secretKey;

const passport = {
  id: '1',
  type: ['NFTPassport', 'VerifiableCredential'],
  issuer: {
    id: 'zNKf2ZJqsZNYrCKUjTCqwVjiPtk8Axq8tqU9',
    name: 'ArcBlock Team',
    pk: 'zH594bV5vaL4jjLKWq6eZ1ao3uLCFVUzyfr4RZRrcKc5y',
  },
  issuanceDate: '2022-11-21T03:40:32.731Z',
  endpoint: 'https://team.arcblock.io',
  name: 'admin',
  specVersion: '1.0.0',
  title: 'Admin',
  status: 'valid',
  role: 'admin',
  lastLoginAt: '2023-04-18T00:05:44.278Z',
};

// FIXME: 容易超时, 需要优化
describe('User', () => {
  let instance = null;
  let teamAPI = null;
  let blockletManager = null;
  let context = {};
  let nodeDid = '';
  let installStaticDemo = () => {};
  let removeStaticDemo = () => {};
  let blockletInstalled = false;
  const staticDemoDid = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
  const appDid2 = fromRandom({ role: types.RoleType.ROLE_APPLICATION }).address;
  beforeAll(async () => {
    instance = await setupInstance('team-user');
    teamAPI = instance.teamAPI;
    blockletManager = instance.blockletManager;
    nodeDid = (await instance.states.node.read()).did;

    const wallet = fromRandom();
    const user = {
      did: wallet.address,
      pk: wallet.publicKey,
      fullName: 'Bob',
      role: 'admin',
      locale: 'en',
    };

    await teamAPI.addUser({
      teamDid: nodeDid,
      user: {
        fullName: user.fullName,
        role: user.role,
        locale: 'en',
        did: user.did,
        pk: user.pk,
        name: user.name,
        passports: [passport],
      },
    });

    context = {
      hostname: 'test.server.com',
      user,
    };

    installStaticDemo = async () => {
      if (blockletInstalled) return;
      const url = `file://${path.join(__dirname, `../assets/api/blocklets/${staticDemoDid}/blocklet.json`)}`;
      await blockletManager.install({ url, appSk }, context);
      await new Promise((resolve) => blockletManager.on(BlockletEvents.installed, resolve));
      blockletInstalled = true;
    };

    removeStaticDemo = async (keepData = false) => {
      if (!blockletInstalled) return;
      const blocklet = await instance.states.blocklet.getBlocklet(appDid);
      if (blocklet) {
        await blockletManager.delete({ did: appDid, keepData });
        blockletInstalled = false;
      }
    };
  });

  test('Api should be a function', () => {
    expect(typeof teamAPI.createMemberInvitation).toEqual('function');
    expect(typeof teamAPI.checkInvitation).toEqual('function');
  });

  // Invitation
  test('Should create and delete invitation for server', async () => {
    const res = await teamAPI.createMemberInvitation({ teamDid: nodeDid, role: 'member' }, context);
    expect(typeof res.inviteId).toBe('string');
    await teamAPI.deleteInvitation({ teamDid: nodeDid, inviteId: res.inviteId });
  });

  test('Should create and delete invitation for blocklet', async () => {
    await installStaticDemo();
    try {
      const res = await teamAPI.createMemberInvitation({ teamDid: appDid, role: 'member' }, context);
      expect(typeof res.inviteId).toBe('string');
      await teamAPI.deleteInvitation({ teamDid: appDid, inviteId: res.inviteId });
    } catch (err) {
      expect(err.message).toMatch("No valid passport found: you don't have the required role");
    } finally {
      await removeStaticDemo();
    }
  });

  test('validate blocklet user role passport can be used to invite new members', async () => {
    try {
      const res = await teamAPI.createMemberInvitation(
        { teamDid: nodeDid, role: 'member' },
        {
          user: {
            did: context.user.did,
            role: 'blocklet-member',
          },
        }
      );
      expect(typeof res.inviteId).toBe('string');
      await teamAPI.deleteInvitation({ teamDid: nodeDid, inviteId: res.inviteId });
    } catch (error) {
      expect(error.message).toMatch("No valid passport found: you don't have the required role");
    }

    try {
      const res = await teamAPI.createMemberInvitation(
        { teamDid: nodeDid, role: 'admin' },
        {
          user: {
            did: context.user.did,
            role: 'blocklet-admin',
          },
        }
      );
      expect(typeof res.inviteId).toBe('string');
      await teamAPI.deleteInvitation({ teamDid: nodeDid, inviteId: res.inviteId });
    } catch (error) {
      console.error(error);
      throw error;
    }

    try {
      const res = await teamAPI.createMemberInvitation(
        { teamDid: nodeDid, role: 'member' },
        {
          user: {
            did: context.user.did,
            role: 'blocklet-admin',
          },
        }
      );
      expect(typeof res.inviteId).toBe('string');
      await teamAPI.deleteInvitation({ teamDid: nodeDid, inviteId: res.inviteId });
    } catch (error) {
      console.error(error);
      throw error;
    }
  });

  test('Should throw error if invite role does not exist', async () => {
    expect.assertions(2);
    await installStaticDemo();
    try {
      try {
        await teamAPI.createMemberInvitation({ teamDid: appDid, role: 'no-exist-role' }, context);
      } catch (err) {
        expect(err.message).toMatch('Role does not exist');
      }

      try {
        await teamAPI.createRole({ teamDid: appDid, name: 'developer', title: 'Developer', description: 'desc' });
        const { inviteId } = await teamAPI.createMemberInvitation({ teamDid: appDid, role: 'developer' }, context);
        await teamAPI.deleteRole({ teamDid: appDid, name: 'developer' });
        await teamAPI.checkInvitation({ teamDid: appDid, inviteId });
      } catch (err) {
        expect(err.message).toMatch('Role does not exist');
      }
    } finally {
      await removeStaticDemo();
    }
  });

  test('Should throw error if inviteId does not exist', async () => {
    expect.assertions(1);
    const res = await teamAPI.createMemberInvitation({ teamDid: nodeDid, role: 'member' }, context);

    try {
      await teamAPI.deleteInvitation({}, context);
    } catch (err) {
      expect(err.message).toMatch('InviteId cannot be empty');
    }

    await teamAPI.deleteInvitation({ teamDid: nodeDid, inviteId: res.inviteId });
  });

  test('Should get invitations', async () => {
    const d1 = await teamAPI.getInvitations({ teamDid: nodeDid });
    expect(d1.length).toBe(0);

    const res = await teamAPI.createMemberInvitation({ teamDid: nodeDid, role: 'member' }, context);

    const d2 = await teamAPI.getInvitations({ teamDid: nodeDid });
    expect(d2.length).toBe(1);
    expect(d2[0]).toMatchObject({ role: 'member' });

    const d3 = await teamAPI.getInvitations({ teamDid: nodeDid, filter: () => false });
    expect(d3.length).toBe(0);

    await teamAPI.deleteInvitation({ teamDid: nodeDid, inviteId: res.inviteId });
  });

  test('Should check and close invite request', async () => {
    const { inviteId } = await teamAPI.createMemberInvitation({ teamDid: nodeDid, role: 'member' }, context);

    const res = await teamAPI.checkInvitation({ teamDid: nodeDid, inviteId });

    expect(res.role).toBe('member');

    const res2 = await teamAPI.getInvitation({ teamDid: nodeDid, inviteId });
    expect(res2).toBeTruthy();
    expect(res2.status).toBeUndefined();
    expect(res2.receiver).toBeUndefined();

    await teamAPI.closeInvitation({
      teamDid: nodeDid,
      inviteId,
      status: 'success',
      receiver: { did: 'xxx' },
      timeout: 1000,
    });

    const res3 = await teamAPI.getInvitation({ teamDid: nodeDid, inviteId });
    expect(res3).toBeTruthy();
    expect(res3.status).toBe('success');
    expect(res3.receiver).toEqual({ did: 'xxx' });

    await sleep(1100);

    const res4 = await teamAPI.getInvitation({ teamDid: nodeDid, inviteId });
    expect(res4).toBeFalsy();
  });

  test('Should throw error if inviteId does not exist', async () => {
    expect.assertions(1);
    try {
      await teamAPI.checkInvitation({ teamDid: nodeDid, inviteId: 'no-exist' });
    } catch (err) {
      expect(err.message).toMatch('The invitation does not exist');
    }
  });

  test('Should throw error if invite role is empty', async () => {
    expect.assertions(1);

    try {
      await teamAPI.createMemberInvitation({ teamDid: nodeDid }, context);
    } catch (err) {
      expect(err.message).toMatch('Role cannot be empty');
    }
  });

  test('Should throw error if inviter is empty', async () => {
    expect.assertions(1);

    try {
      await teamAPI.createMemberInvitation({ teamDid: nodeDid, role: 'member' }, { user: null });
    } catch (err) {
      expect(err.message).toBeTruthy();
    }
  });

  test('Should throw error if remark length is more than 50', async () => {
    expect.assertions(1);

    const remark = '123456789012345678901234567890123456789012345678901';
    try {
      await teamAPI.createMemberInvitation({ teamDid: nodeDid, role: 'member', remark }, context);
    } catch (err) {
      expect(err.message).toMatch('Remark length should NOT be more than 50 characters');
    }
  });

  test('Should throw error if invitation is expired', async () => {
    expect.assertions(1);

    teamAPI.setInviteExpireTime(10);
    const backup = teamAPI.memberInviteExpireTime;

    try {
      const { inviteId } = await teamAPI.createMemberInvitation({ teamDid: nodeDid, role: 'member' }, context);
      await sleep(15);
      await teamAPI.checkInvitation({ teamDid: nodeDid, inviteId });
    } catch (err) {
      expect(err.message).toMatch('The invitation has expired');
    } finally {
      teamAPI.memberInviteExpireTime = backup;
    }
  });

  // Transfer
  test('Should create and delete transfer session for blocklet', async () => {
    await installStaticDemo();
    try {
      const expected = expect.objectContaining({
        transferId: expect.any(String),
        remark: expect.any(String),
        expireDate: expect.any(String),
        appDid: expect.any(String),
        status: expect.any(String),
      });

      const res = await teamAPI.createTransferAppOwnerSession({ appDid });

      expect(res).toEqual(expected);

      const { transferId } = res;

      const res2 = await teamAPI.getTransferAppOwnerSession({ appDid, transferId });
      expect(res2).toEqual(expected);

      const res3 = await teamAPI.checkTransferAppOwnerSession({ appDid, transferId });
      expect(res3).toEqual(expected);

      await teamAPI.closeTransferAppOwnerSession({ appPid: appDid, transferId, timeout: 300 });
      await sleep(350);
      const res99 = await teamAPI.getTransferAppOwnerSession({ appDid, transferId });
      expect(res99).toBe(null);

      const backup = teamAPI.transferOwnerExpireTime;
      teamAPI.transferOwnerExpireTime = 1 * 1000;
      const { transferId: transferId2 } = await teamAPI.createTransferAppOwnerSession({ appDid });
      expect(teamAPI.checkTransferAppOwnerSession({ appDid, transferId: transferId2 })).resolves.toBeTruthy();
      await sleep(1100);
      expect(teamAPI.checkTransferAppOwnerSession({ appDid, transferId: transferId2 })).rejects.toBeTruthy();
      teamAPI.transferOwnerExpireTime = backup;
    } finally {
      await removeStaticDemo();
    }
  });

  // Users
  test('Should get users for server', async () => {
    try {
      const res = await teamAPI.getUsers({ teamDid: nodeDid }, context);
      expect(res.users.length).toBe(1);
    } catch (err) {
      console.error(err);
      throw err;
    }
  });

  test('Should get owner for server', async () => {
    const res = await teamAPI.getOwner({ teamDid: nodeDid }, context);
    expect(res).toBeTruthy();
  });

  test('Should get counts of users for server', async () => {
    const res = await teamAPI.getUsersCount({ teamDid: nodeDid }, context);
    expect(res).toBe(1);
  });

  test('Should get users for blocklet', async () => {
    await installStaticDemo();
    try {
      const res = await teamAPI.getUsers({ teamDid: appDid }, context);
      expect(res.users.length).toBe(0);
    } finally {
      await removeStaticDemo();
    }
  });

  test('Should throw error if team does not exist when get users', async () => {
    expect.assertions(1);

    try {
      await teamAPI.getUsers({ teamDid: appDid2 }, context);
    } catch (err) {
      expect(err.message).toMatch('Did does not exist');
    }
  });

  test('Should add, get and delete user for server', async () => {
    await installStaticDemo();
    try {
      const { did } = context.user;

      const res = await teamAPI.getUsers({ teamDid: nodeDid }, context);
      const resBlocklet = await teamAPI.getUsers({ teamDid: appDid }, context);

      expect(res.users.length).toBe(1);
      expect(res.users[0].locale).toBe('en');

      expect(resBlocklet.users.length).toBe(0);

      const u3 = await teamAPI.getUser({ teamDid: nodeDid, user: { did } });
      expect(u3).toMatchObject({
        did,
        fullName: 'Bob',
        role: 'admin',
        locale: 'en',
      });
    } finally {
      await removeStaticDemo();
    }
  });

  test('Should add and delete user for blocklet', async () => {
    await installStaticDemo();
    try {
      const wallet = fromRandom();
      const did = wallet.address;
      const pk = wallet.publicKey;

      const user = await teamAPI.addUser(
        {
          teamDid: appDid,
          user: {
            did,
            pk,
            fullName: 'Bob',
            role: 'admin',
          },
        },
        context
      );
      expect(user).toMatchObject({ fullName: 'Bob', did, pk, role: 'admin' });

      const res = await teamAPI.getUsers({ teamDid: appDid }, context);

      expect(res.users.length).toBe(1);

      await teamAPI.removeUser(
        {
          teamDid: appDid,
          user: {
            did,
          },
        },
        context
      );

      const res2 = await teamAPI.getUsers({ teamDid: appDid }, context);
      expect(res2.users.length).toBe(0);
    } finally {
      await removeStaticDemo();
    }
  });

  test('Should update user approval for server', async () => {
    const wallet = fromRandom();
    const did = wallet.address;
    const pk = wallet.publicKey;

    const user = await teamAPI.addUser(
      {
        teamDid: nodeDid,
        user: {
          did,
          pk,
          fullName: 'Bob',
          role: 'admin',
          approved: true,
        },
      },
      context
    );
    expect(user).toMatchObject({ fullName: 'Bob', did, pk, role: 'admin', approved: true });

    const user2 = await teamAPI.updateUserApproval(
      {
        teamDid: nodeDid,
        user: {
          did,
          approved: false,
        },
      },
      context
    );
    expect(user2).toMatchObject({ fullName: 'Bob', did, pk, role: 'admin', approved: false });

    const res = await teamAPI.getUsers({ teamDid: nodeDid }, context);
    expect(res.users.length).toBe(2);
    expect(res.users).toEqual(expect.arrayContaining([expect.objectContaining({ approved: false })]));

    await teamAPI.removeUser(
      {
        teamDid: nodeDid,
        user: {
          did,
        },
      },
      context
    );
  });

  test('Should get blocklet owner', async () => {
    await installStaticDemo();
    try {
      const wallet = fromRandom();
      const did = wallet.address;
      const pk = wallet.publicKey;

      const res1 = await teamAPI.getOwner({ teamDid: appDid }, context);
      expect(res1).toBeFalsy();

      expect(blockletManager.setInitialized({ did: appDid, owner: { did, pk: 'invalid pk' } })).rejects.toThrow(
        'Blocklet owner is invalid'
      );

      await blockletManager.setInitialized({ did: appDid, owner: { did, pk } });
      const res2 = await teamAPI.getOwner({ teamDid: appDid }, context);
      expect(res2.did).toBe(did);
      expect(res2.pk).toBe(pk);
      expect(res2.fullName).toBeUndefined();

      await teamAPI.addUser(
        {
          teamDid: appDid,
          user: {
            did,
            pk,
            fullName: 'Bob',
          },
        },
        context
      );

      const res3 = await teamAPI.getOwner({ teamDid: appDid }, context);
      expect(res3.did).toBe(did);
      expect(res3.pk).toBe(pk);
      expect(res3.fullName).toBe('Bob');
    } finally {
      await removeStaticDemo();
    }
  });

  test('Should getUsers (paging) work as expected', async () => {
    const teamDid = nodeDid;

    // getUsersCountPerRole
    const res = await teamAPI.getUsersCountPerRole({ teamDid }, context);
    expect(res).toEqual(
      expect.arrayContaining([
        { key: '$all', value: 1 },
        { key: 'owner', value: 0 },
        { key: 'admin', value: 1 },
        { key: 'member', value: 0 },
        { key: 'guest', value: 0 },
        { key: '$none', value: 0 },
      ])
    );

    // throw error if paging exceed
    expect(teamAPI.getUsers({ teamDid, paging: { pageSize: 101 } }, context)).rejects.toThrow(
      'Length of users should not exceed'
    );
  });

  test('Should getUsers by userDids', async () => {
    const users = Array(5).fill(null);
    users.forEach((_, index) => {
      const wallet = fromRandom();
      const user = {
        did: wallet.address,
        pk: wallet.publicKey,
        fullName: `user${index}`,
        role: 'admin',
        approved: index !== 3,
      };
      users[index] = user;
    });

    const teamDid = nodeDid;

    await Promise.all(
      users.map((user) => {
        return teamAPI.addUser(
          {
            teamDid: nodeDid,
            user,
          },
          context
        );
      })
    );

    const { users: u1 } = await teamAPI.getUsers({ teamDid, dids: [] }, context);
    expect(u1.length).toBe(0);

    const { users: u2 } = await teamAPI.getUsers({ teamDid, dids: ['non-exist'] }, context);
    expect(u2.length).toBe(0);

    const { users: u3 } = await teamAPI.getUsers({ teamDid, dids: [users[0].did] }, context);
    expect(u3.length).toBe(1);

    const { users: u4 } = await teamAPI.getUsers({ teamDid, dids: [users[0].did, 'non-exist'] }, context);
    expect(u4.length).toBe(1);

    const { users: u5 } = await teamAPI.getUsers({ teamDid, dids: [users[0].did, users[1].did] }, context);
    expect(u5.length).toBe(2);

    const { users: u6, paging } = await teamAPI.getUsers({ teamDid, dids: users.map((x) => x.did) }, context);
    expect(u6.length).toBe(5);
    expect(paging).toEqual({
      total: 5,
      pageSize: 5,
      pageCount: 1,
      page: 1,
    });

    const { users: u7 } = await teamAPI.getUsers(
      { teamDid, dids: users.map((x) => x.did), query: { approved: true } },
      context
    );
    expect(u7.length).toBe(4);

    const { users: u8 } = await teamAPI.getUsers(
      { teamDid, dids: users.map((x) => x.did), query: { approved: false } },
      context
    );
    expect(u8.length).toBe(1);

    // throw error if paging exceed
    expect(teamAPI.getUsers({ teamDid, dids: Array(101) }, context)).rejects.toThrow(
      'Length of users should not exceed'
    );
  });

  test('validate temporary user role passport can not be used to invite new members', async () => {
    const wallet = fromRandom();
    const user = {
      did: wallet.address,
      pk: wallet.publicKey,
      fullName: 'Bob',
      role: 'admin',
      locale: 'en',
    };

    await teamAPI.addUser({
      teamDid: nodeDid,
      user: {
        fullName: user.fullName,
        role: user.role,
        locale: 'en',
        did: user.did,
        pk: user.pk,
        name: user.name,
        passports: [{ ...passport, expirationDate: '2023-04-18T00:05:44.278Z', id: '2' }],
      },
    });

    try {
      await teamAPI.createMemberInvitation(
        { teamDid: nodeDid, role: 'member' },
        { user: { did: user.did, role: 'blocklet-admin' } }
      );
    } catch (err) {
      expect(err.message).toMatch(
        'The passport for role "admin" is only temporary and cannot be used to invite new members.'
      );
    }

    try {
      await teamAPI.createMemberInvitation(
        { teamDid: nodeDid, role: 'admin' },
        { user: { did: user.did, role: 'blocklet-admin' } }
      );
    } catch (err) {
      expect(err.message).toMatch(
        'The passport for role "admin" is only temporary and cannot be used to invite new members.'
      );
    }
  });

  afterAll(async () => {
    // 恢复原始 Date.now
    Date.now = originalDateNow;
    await removeStaticDemo();
    await tearDownInstance(instance);
  });
});
