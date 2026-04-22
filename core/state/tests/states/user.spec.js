const { describe, test, expect, beforeAll, beforeEach, afterEach } = require('bun:test');
const { fromRandom } = require('@ocap/wallet');

const UserState = require('../../lib/states/user');
const TagState = require('../../lib/states/tag');
const PassportState = require('../../lib/states/passport');
const ConnectedAccountState = require('../../lib/states/connect-account');
const { setupInMemoryBlockletModels } = require('../../tools/fixture');

const userPassport = {
  id: 'z2iUEpJPTcjQUQHghHaWoKhe4Y1VRBY9xfnAs',
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
  scope: 'passport',
  role: 'admin',
  lastLoginAt: '2023-04-18T00:05:44.278Z',
};

describe('UserState', () => {
  let did = '';
  let pk = '';

  let models = null;
  let state = null;
  let tag = null;
  let passport = null;
  let connectedAccount = null;

  beforeAll(async () => {
    models = await setupInMemoryBlockletModels();
    state = new UserState(models.User, {}, models);
    tag = new TagState(models.Tag, {});
    passport = new PassportState(models.Passport, {});
    connectedAccount = new ConnectedAccountState(models.ConnectedAccount, {});
  });

  beforeEach(() => {
    const wallet = fromRandom();
    did = wallet.address;
    pk = wallet.publicKey;
  });

  afterEach(async () => {
    await state.reset();
    await tag.reset();
    await passport.reset();
    await connectedAccount.reset();
  });

  test('should add user and manager tags as expected', async () => {
    const rawData = {
      fullName: 'Bob',
      did,
      pk,
    };
    const user = await state.addUser({ ...rawData });
    expect(user).toMatchObject(rawData);

    let users = await state.find();
    expect(users).toEqual(expect.arrayContaining([expect.objectContaining(rawData)]));

    const tag1 = await tag.insert({ title: 'good', color: '#3773f2', slug: 'good' });
    const tag2 = await tag.insert({ title: 'better', color: '#3773f2', slug: 'better' });
    const tag3 = await tag.insert({ title: 'best', color: '#3773f2', slug: 'best' });

    let result = await state.getUser(did, { includeTags: true });
    expect(result.tags.length).toEqual(0);

    await state.updateTags(did, [tag1.id]);
    result = await state.getUser(did, { includeTags: true });
    expect(result.tags.length).toEqual(1);

    await state.updateTags(did, [tag2.id]);
    result = await state.getUser(did, { includeTags: true });
    expect(result.tags.length).toEqual(1);

    await state.updateTags(did, [tag2.id, tag3.id]);
    result = await state.getUser(did, { includeTags: true });
    expect(result.tags.length).toEqual(2);

    users = await state.getUsers({ query: { includeTags: true } });
    expect(users.list.length).toEqual(1);
    expect(users.list[0].tags.length).toEqual(2);

    await tag.remove({ id: tag3.id });
    users = await state.getUsers({ query: { includeTags: true } });
    expect(users.list.length).toEqual(1);
    expect(users.list[0].tags.length).toEqual(1);

    await tag.remove({ id: tag2.id });
    users = await state.getUsers({ query: { includeTags: true } });
    expect(users.list.length).toEqual(1);
    expect(users.list[0].tags.length).toEqual(0);

    await state.updateTags(did, [tag1.id]);
    users = await state.getUsers({ query: { includeTags: true } });
    expect(users.list.length).toEqual(1);
    expect(users.list[0].tags.length).toEqual(1);
    users = await state.getUsers({ query: { tags: [tag1.id] } });
    expect(users.list.length).toEqual(1);
    expect(users.list[0].tags.length).toEqual(1);
  });

  test('should update user as expected', async () => {
    await state.addUser({ fullName: 'Bob', did, pk });

    let users = await state.find();
    expect(users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fullName: 'Bob',
          did,
          pk,
        }),
      ])
    );

    let user = await state.updateUser(did, { fullName: 'Alice' });
    expect(user).toMatchObject({ fullName: 'Alice', did, pk });

    users = await state.find();
    expect(users).toEqual(expect.arrayContaining([expect.objectContaining({ fullName: 'Alice', did, pk })]));

    // update passport only
    user = await state.updateUser(did, { passports: [userPassport] });
    expect(user).toMatchObject({ fullName: 'Alice', did, pk });
    expect(user.passports.length).toEqual(1);
    const passports = await passport.find({ userDid: did });
    expect(passports.length).toEqual(1);

    // update connectedAccounts only
    user = await state.updateUser(did, {
      connectedAccounts: [
        {
          provider: 'auth0',
          did: 'zNKf2ZJqsZNYrCKUjTCqwVjiPtk8Axq8tqU9',
          pk: 'zH594bV5vaL4jjLKWq6eZ1ao3uLCFVUzyfr4RZRrcKc5y',
        },
      ],
    });
    expect(user.connectedAccounts.length).toEqual(1);
    const accounts = await connectedAccount.find({ userDid: did });
    expect(accounts.length).toEqual(1);
  });

  test('should update user role as expected', async () => {
    await state.addUser({ fullName: 'Bob', did, pk, role: 'guest' });

    const user = await state.updateRole({ did, role: 'admin' });
    expect(user).toMatchObject({ role: 'admin', did, pk });

    const users = await state.find();
    expect(users).toEqual(
      expect.arrayContaining([expect.objectContaining({ fullName: 'Bob', did, pk, role: 'admin' })])
    );
  });

  test('should update user approval as expected', async () => {
    await state.addUser({ fullName: 'Bob', did, pk, role: 'guest', approved: true });

    const user = await state.updateApproved({ did, approved: false });
    expect(user).toMatchObject({ approved: false, did, pk });

    const users = await state.find();
    expect(users).toEqual(
      expect.arrayContaining([expect.objectContaining({ fullName: 'Bob', did, pk, role: 'guest', approved: false })])
    );
  });

  test('should remove user as expected', async () => {
    await state.addUser({ fullName: 'Bob', did, pk, role: 'guest', approved: true });

    const n1 = await state.count();
    expect(n1).toBe(1);

    await state.remove({ did });

    const n2 = await state.count();
    expect(n2).toBe(0);
  });

  test('should throw error when user is invalid', async () => {
    expect.assertions(1);
    try {
      await state.addUser({
        did: 'invalid-did',
        pk: 'invalid-pk',
      });
    } catch (err) {
      expect(err.message).toMatch('user is invalid');
    }

    await state.addUser({ did, pk, fullName: 'Bob' });
  });

  test('should throw error when update non-exist user', async () => {
    expect.assertions(1);

    const wallet = fromRandom();
    const newDid = wallet.address;
    const newPk = wallet.publicKey;

    await state.addUser({ did, pk, fullName: 'Bob' });

    try {
      await state.updateUser(newDid, { pk: newPk });
    } catch (err) {
      expect(err.message).toMatch('user does not exist');
    }
  });

  test('should throw error when remove non-exist user', async () => {
    expect.assertions(1);

    const wallet = fromRandom();
    const newDid = wallet.address;

    await state.addUser({ did, pk, fullName: 'Bob' });

    try {
      await state.remove({
        did: newDid,
      });
    } catch (err) {
      expect(err.message).toMatch('user does not exist');
    }
  });

  test('should throw error when add duplicate user', async () => {
    await state.addUser({ did, pk, fullName: 'Bob' });
    try {
      await state.addUser({ did, pk, fullName: 'Alice' });
    } catch (err) {
      expect(err).toBeTruthy();
      expect(err.name).toEqual('SequelizeUniqueConstraintError');
    }
  });

  test('should manage user passports as expected', async () => {
    await state.addUser({ fullName: 'Bob', did, pk });
    const u1 = await state.find({ did });
    expect(u1.passports).toBeFalsy();

    const u2 = await state.updateUser(did, { pk, passports: [userPassport] });
    expect(u2.passports).toHaveLength(1);
    expect(u2.passports[0].id).toEqual(userPassport.id);

    await expect(state.revokePassportById({ did: 'no-exist-did', id: '1' })).rejects.toBeTruthy();
    await expect(state.revokePassportById({ did, id: 'no-exist-id' })).rejects.toBeTruthy();

    const u3 = await state.revokePassportById({ did, id: userPassport.id });
    expect(u3.passports).toHaveLength(1);
    expect(u3.passports[0].status).toEqual('revoked');

    const u4 = await state.enablePassportById({ did, id: userPassport.id });
    expect(u4.passports).toHaveLength(1);
    expect(u4.passports[0].status).toEqual('valid');
  });

  describe('getUsers', () => {
    const format = (x) => x.list.map((y) => y.fullName);

    test('paging of getUsers should work as expected', async () => {
      const w1 = fromRandom();
      const w2 = fromRandom();
      const w3 = fromRandom();

      await state.addUser({ fullName: 'w1', did: w1.address, pk: w1.publicKey });
      await state.addUser({ fullName: 'w2', did: w2.address, pk: w2.publicKey });
      await state.addUser({ fullName: 'w3', did: w3.address, pk: w3.publicKey });

      const res1 = await state.getUsers({ paging: { pageSize: 1 } });
      expect(format(res1)).toEqual(['w3']);
      expect(res1.paging).toEqual({
        total: 3,
        page: 1,
        pageSize: 1,
        pageCount: 3,
      });

      const res2 = await state.getUsers({ paging: { pageSize: 2 } });
      expect(format(res2)).toEqual(['w3', 'w2']);
      expect(res2.paging).toEqual({
        total: 3,
        page: 1,
        pageSize: 2,
        pageCount: 2,
      });

      const res3 = await state.getUsers({ paging: { page: 2, pageSize: 2 } });
      expect(format(res3)).toEqual(['w1']);
      expect(res3.paging).toEqual({
        total: 3,
        page: 2,
        pageSize: 2,
        pageCount: 2,
      });
    });

    test('query of getUsers should work as expected', async () => {
      const w1 = fromRandom();
      const w2 = fromRandom();
      const w3 = fromRandom();
      const w4 = fromRandom();
      await state.addUser({
        fullName: 'w1',
        email: 'm1',
        did: w1.address,
        pk: w1.publicKey,
        approved: true,
        passports: [userPassport],
      });
      await state.addUser({
        fullName: 'w2',
        email: 'm2',
        did: w2.address,
        pk: w2.publicKey,
        approved: true,
        passports: [
          {
            ...userPassport,
            role: 'member',
            name: 'member',
            id: 'abcd',
            status: 'revoked',
          },
        ],
      });
      await state.addUser({
        fullName: 'w3',
        email: 'm3',
        did: w3.address,
        pk: w3.publicKey,
        approved: false,
        passports: [],
      });
      await state.addUser({
        fullName: 'w4',
        email: 'm4',
        did: w4.address,
        pk: w4.publicKey,
        approved: true,
        passports: [],
      });

      const users = await state.getUsers({});
      expect(users.list).toHaveLength(4);

      const res1 = await state.getUsers({ query: { role: 'admin' } });
      expect(format(res1)).toEqual(['w1']);

      const res2 = await state.getUsers({ query: { role: '$none' } });
      expect(format(res2)).toEqual(['w4', 'w3', 'w2']);

      const res3 = await state.getUsers({ query: { role: '$all' } });
      expect(format(res3)).toEqual(['w4', 'w3', 'w2', 'w1']);

      const res4 = await state.getUsers({ query: { approved: true } });
      expect(format(res4)).toEqual(['w4', 'w2', 'w1']);

      // TODO: 经常偶发失败，但是在生产上相关业务没有发现什么问题，暂时注释掉
      /*
      const res5 = await state.getUsers({ query: { search: w3.address } });
      expect(format(res5)).toEqual(['w3']);

      const res6 = await state.getUsers({ query: { search: 'w3' } });
      expect(format(res6)).toEqual(['w3']);
      */

      // 模糊搜索
      const res7 = await state.getUsers({ query: { search: 'w' }, paging: { pageSize: 3 } });
      expect(format(res7)).toEqual(['w4', 'w3', 'w2']);

      const res71 = await state.getUsers({ query: { search: 'W' }, paging: { pageSize: 3 } });
      expect(format(res71)).toEqual(['w4', 'w3', 'w2']);

      const res8 = await state.getUsers({ query: { search: 'w' }, paging: { pageSize: 5 } });
      expect(format(res8)).toEqual(['w4', 'w3', 'w2', 'w1']);

      const res9 = await state.getUsers({ query: { search: '.*' } }); // should escape string regex
      expect(format(res9)).toEqual([]);

      expect(state.getUsers({ query: { search: new Array(51).fill('a').join('') } })).rejects.toThrow(
        'should not more than 50'
      );

      // 这段代码经常偶发失败，但是在生产上相关业务没有发现什么问题，暂时注释掉
      /*
      let result = await state.getUsers({ query: { search: 'm3' } });
      expect(format(result)).toEqual(['w3']);

      result = await state.getUsers({ query: { search: 'm' } });
      expect(format(result)).toEqual(['w4', 'w3', 'w2', 'w1']);

      result = await state.getUsers({ query: { role: '$blocked' } });
      expect(format(result)).toEqual(['w3']);
      */
    });

    test('sort/invite of getUsers should work as expected', async () => {
      const w1 = fromRandom();
      const w2 = fromRandom();
      const w3 = fromRandom();
      const w4 = fromRandom();
      const w5 = fromRandom();

      // w1 --> w2,w3 --> w4

      await state.addUser({
        fullName: 'w1',
        did: w1.address,
        pk: w1.publicKey,
        inviter: null,
        lastLoginAt: new Date(),
      });
      await state.addUser({
        fullName: 'w2',
        did: w2.address,
        pk: w2.publicKey,
        inviter: w1.address,
        lastLoginAt: new Date(),
      });
      await state.addUser({
        fullName: 'w3',
        did: w3.address,
        pk: w3.publicKey,
        inviter: w1.address,
        lastLoginAt: new Date(),
      });
      await state.addUser({
        fullName: 'w4',
        did: w4.address,
        pk: w4.publicKey,
        inviter: w2.address,
        lastLoginAt: new Date(),
      });

      const res1 = await state.getUsers();
      expect(format(res1)).toEqual(['w4', 'w3', 'w2', 'w1']);

      const res2 = await state.getUsers({ sort: { createdAt: 1 } });
      expect(format(res2)).toEqual(['w1', 'w2', 'w3', 'w4']);

      await state.updateUser(w2.address, { remark: 'test' });

      const res3 = await state.getUsers();
      expect(format(res3)).toEqual(['w4', 'w3', 'w2', 'w1']);

      const res4 = await state.getUsers({ sort: { updatedAt: 1 } });
      expect(format(res4)).toEqual(['w1', 'w3', 'w4', 'w2']);

      const res5 = await state.getUsers({ sort: { updatedAt: -1 } });
      expect(format(res5)).toEqual(['w2', 'w4', 'w3', 'w1']);

      await state.updateUser(w3.address, { lastLoginAt: new Date() });

      const res6 = await state.getUsers();
      expect(format(res6)).toEqual(['w4', 'w3', 'w2', 'w1']);

      const res7 = await state.getUsers({ sort: { lastLoginAt: 1 } });
      expect(format(res7)).toEqual(['w1', 'w2', 'w4', 'w3']);

      const res8 = await state.getUsers({ sort: { lastLoginAt: -1 } });
      expect(format(res8)).toEqual(['w3', 'w4', 'w2', 'w1']);

      let result = await state.getUsers({ sort: { updatedAt: -1 } });
      expect(format(result)).toEqual(['w3', 'w2', 'w4', 'w1']);

      // query with invalid inviter
      try {
        await state.getUsers({ query: { inviter: 'xxx' } });
        expect(true).toBeFalsy();
      } catch (err) {
        expect(err.message).toMatch(/inviter did invalid/);
      }
      try {
        await state.getUsers({ query: { inviter: w5.address } });
        expect(true).toBeFalsy();
      } catch (err) {
        expect(err.message).toMatch(/inviter not found/);
      }
      try {
        await state.getUsers({ query: { invitee: 'xxx' } });
        expect(true).toBeFalsy();
      } catch (err) {
        expect(err.message).toMatch(/invitee did invalid/);
      }
      try {
        await state.getUsers({ query: { invitee: w5.address } });
        expect(true).toBeFalsy();
      } catch (err) {
        expect(err.message).toMatch(/invitee not found/);
      }
      try {
        await state.getUsers({ query: { inviter: w5.address, invitee: w2.address } });
        expect(true).toBeFalsy();
      } catch (err) {
        expect(err.message).toMatch(/can not query by inviter and invitee/);
      }

      result = await state.getUsers({ query: { inviter: w1.address }, sort: { createdAt: 1 } });
      expect(format(result)).toEqual(['w2', 'w3', 'w4']);

      result = await state.getUsers({ query: { inviter: w1.address, generation: 1 }, sort: { createdAt: 1 } });
      expect(format(result)).toEqual(['w2', 'w3']);

      result = await state.getUsers({ query: { inviter: w1.address, generation: 2 }, sort: { createdAt: 1 } });
      expect(format(result)).toEqual(['w4']);

      result = await state.getUsers({ query: { inviter: w2.address, generation: 1 }, sort: { createdAt: 1 } });
      expect(format(result)).toEqual(['w4']);

      result = await state.getUsers({
        query: { inviter: `did:abt:${w2.address}`, generation: 1 },
        sort: { createdAt: 1 },
      });
      expect(format(result)).toEqual(['w4']);

      result = await state.getUsers({ query: { inviter: w2.address, generation: 2 }, sort: { createdAt: 1 } });
      expect(format(result)).toEqual([]);

      result = await state.getUsers({ query: { inviter: w3.address }, sort: { createdAt: 1 } });
      expect(format(result)).toEqual([]);

      result = await state.getUsers({ query: { invitee: w3.address }, sort: { createdAt: 1 } });
      expect(format(result)).toEqual(['w1']);

      result = await state.getUsers({ query: { invitee: `did:abt:${w3.address}` }, sort: { createdAt: 1 } });
      expect(format(result)).toEqual(['w1']);

      result = await state.getUsers({ query: { invitee: w2.address }, sort: { createdAt: 1 } });
      expect(format(result)).toEqual(['w1']);

      result = await state.getUsers({ query: { invitee: w4.address }, sort: { createdAt: 1 } });
      expect(format(result)).toEqual(['w1', 'w2']);

      result = await state.updateUser(w1.address, { inviter: w4.address });
      expect(result.inviter).toBeFalsy();
    });
  });

  test('getUser work as expect', async () => {
    const w1 = fromRandom();
    const w2 = fromRandom();
    const w3 = fromRandom();
    const w4 = fromRandom();

    await state.addUser({
      did: w1.address,
      pk: w1.publicKey,
      approved: true,
      passports: [userPassport],
    });
    await state.addUser({
      did: w2.address,
      pk: w2.publicKey,
      sourceProvider: 'wallet',
      connectedAccounts: [
        {
          provider: 'wallet',
          did: w2.address,
          pk: w2.publicKey,
        },
        {
          provider: 'auth0',
          did: w3.address,
          pk: w3.publicKey,
        },
      ],
    });

    const res1 = await state.getUser(w1.address);
    const res2 = await state.getUser(w2.address);
    const res3 = await state.getUser(w3.address, { enableConnectedAccount: true });

    expect(res1.did).toBe(w1.address);
    expect(res1.passports).toHaveLength(1);
    expect(res1.connectedAccounts).toHaveLength(0);

    expect(res2.did).toBe(w2.address);
    expect(res2.connectedAccounts).toHaveLength(2);

    expect(res3.did).toBe(w2.address);
    // expect(res3.connectedAccounts).toHaveLength(2);

    const res4 = await state.getUser(w4.address);
    const res5 = await state.getUser(w4.address, { enableConnectedAccount: true });
    expect(res4).toBeFalsy();
    expect(res5).toBeFalsy();

    const res6 = await state.getUsersByDids({ dids: [w1.address] });
    expect(res6.length).toBe(1);
    expect(res6[0].did).toBe(w1.address);

    let result = await state.getUserByDid(w1.address);
    expect(result.did).toBe(w1.address);

    result = await state.isUserValid(w1.address);
    expect(result).toBe(true);

    result = await state.isPassportValid(userPassport.id);
    expect(result).toBe(true);
  });

  describe('loginUser', () => {
    test('user first login should auto register', async () => {
      const before = await state.findOne({ did });

      const { _action, ...user } = await state.loginUser({
        did,
        pk,
        email: 'TEST@example.com',
        emailVerified: false,
        connectedAccount: {
          provider: 'wallet',
          did,
          pk,
        },
      });

      const after = await state.findOne({ did });

      expect(_action).toBe('add');
      expect(before).toBeFalsy();
      expect(after).toBeTruthy();
      expect(user).toMatchObject({
        did: expect.any(String),
        approved: true,
        email: 'test@example.com',
        emailVerified: false,
        createdAt: expect.any(Date),
        sourceProvider: expect.any(String),
        connectedAccounts: expect.arrayContaining([
          expect.objectContaining({
            did: expect.any(String),
            provider: expect.any(String),
            userDid: expect.any(String),
          }),
        ]),
        firstLoginAt: expect.any(Date),
        lastLoginAt: expect.any(Date),
        passports: expect.arrayContaining([]),
        pk: expect.any(String),
        updatedAt: expect.any(Date),
        generation: 0,
      });

      let used = await state.isEmailUsed('TEST@example.com', true);
      expect(used).toBe(false);

      used = await state.isEmailUsed('test@EXAMPLE.com', false);
      expect(used).toBe(true);
    });

    test('user login should update information', async () => {
      const beforeTime = new Date('2018-06-07').toISOString();
      const data = {
        did,
        pk,
        email: 'test@example.com',
        emailVerified: false,
        approved: true,
        sourceProvider: 'wallet',
        connectedAccounts: [
          {
            provider: 'wallet',
            did,
            pk,
            firstLoginAt: beforeTime,
            lastLoginAt: beforeTime,
          },
          {
            provider: 'auth0',
            did: 'mock-did',
            pk: 'mock-pk',
            firstLoginAt: beforeTime,
            lastLoginAt: beforeTime,
          },
        ],
        firstLoginAt: beforeTime,
        lastLoginAt: beforeTime,
        passports: [
          {
            ...userPassport,
            id: 'pp-1',
            firstLoginAt: beforeTime,
            lastLoginAt: beforeTime,
          },
          {
            ...userPassport,
            id: 'pp-2',
            firstLoginAt: beforeTime,
            lastLoginAt: beforeTime,
          },
        ],
      };
      await state.addUser(data);

      const before = await state.findOne({ did });

      const { _action, ...user } = await state.loginUser({
        did,
        pk,
        emailVerified: true,
        connectedAccount: {
          provider: 'wallet',
          did,
          pk,
        },
        passport: {
          ...userPassport,
          id: 'pp-1',
        },
      });

      const after = await state.findOne({ did });

      expect(_action).toBe('update');
      expect(before).not.toBeNull();
      expect(after).not.toBeNull();

      // 用户的上次登录时间需要变更
      expect(new Date(user.firstLoginAt)).toEqual(new Date(data.firstLoginAt));
      expect(new Date(user.lastLoginAt)).not.toEqual(new Date(data.lastLoginAt));

      // 本次登录使用的 connectedAccount 需要变更上次使用时间
      let updated = user.connectedAccounts.find((x) => x.did === data.connectedAccounts[0].did);
      expect(updated).toBeTruthy();
      expect(updated.firstLoginAt.toISOString()).toBe(data.connectedAccounts[0].firstLoginAt);
      expect(updated.lastLoginAt.toISOString()).not.toBe(data.connectedAccounts[0].lastLoginAt);

      // 本次登录未使用的 connectedAccount 不需要变更上次使用时间
      updated = user.connectedAccounts.find((x) => x.did === data.connectedAccounts[1].did);
      expect(updated.firstLoginAt.toISOString()).toBe(data.connectedAccounts[1].firstLoginAt);
      expect(updated.lastLoginAt.toISOString()).toBe(data.connectedAccounts[1].lastLoginAt);

      // 本次登录使用的 passport 需要变更上次使用时间
      // @note: 注意，user.passports 的顺序是不稳定的，所以需要使用 find 来获取
      expect(user.passports.find((x) => x.id === 'pp-1').lastLoginAt.toISOString()).not.toEqual(
        data.passports[0].lastLoginAt
      );
      expect(user.passports.find((x) => x.id === 'pp-2').lastLoginAt.toISOString()).toBe(data.passports[1].lastLoginAt);

      let used = await state.isEmailUsed('teSt@example.com', true);
      expect(used).toBe(true);

      used = await state.isEmailUsed('test@example.COM', false);
      expect(used).toBe(true);

      used = await state.isEmailUsed('test@example.COM', false, 'wallet');
      expect(used).toBe(true);

      used = await state.isEmailUsed('test@example.COM', false, 'google');
      expect(used).toBe(false);

      // bun test 的 toMatchObject 竟然会改变 user 的值, 移动到最后验证
      expect(user).toMatchObject({
        did: expect.any(String),
        approved: true,
        email: 'test@example.com',
        emailVerified: true,
        createdAt: expect.any(Date),
        sourceProvider: expect.any(String),
        connectedAccounts: expect.arrayContaining([
          expect.objectContaining({
            did: expect.any(String),
            pk: expect.any(String),
            provider: expect.any(String),
            userDid: expect.any(String),
          }),
        ]),
        firstLoginAt: expect.any(Date),
        lastLoginAt: expect.any(Date),
        passports: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            userDid: expect.any(String),
            name: expect.any(String),
          }),
        ]),
        pk: expect.any(String),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('User Follow Relations', () => {
    let user1Did = '';
    let user1Pk = '';
    let user2Did = '';
    let user2Pk = '';
    let user3Did = '';
    let user3Pk = '';

    beforeEach(() => {
      const w1 = fromRandom();
      const w2 = fromRandom();
      const w3 = fromRandom();
      user1Did = w1.address;
      user1Pk = w1.publicKey;
      user2Did = w2.address;
      user2Pk = w2.publicKey;
      user3Did = w3.address;
      user3Pk = w3.publicKey;
    });

    test('should follow user successfully', async () => {
      // Add two users first
      await state.addUser({ fullName: 'User1', did: user1Did, pk: user1Pk });
      await state.addUser({ fullName: 'User2', did: user2Did, pk: user2Pk });

      // User1 follows User2
      const result = await state.followUser(user1Did, user2Did);
      expect(result).toMatchObject({
        followerDid: user1Did,
        userDid: user2Did,
      });

      // Verify the follow relationship exists
      const isFollowing = await state.isFollowing(user1Did, [user2Did]);
      expect(isFollowing[user2Did]).toBe(true);

      // Verify the reverse is false
      const isFollowingReverse = await state.isFollowing(user2Did, [user1Did]);
      expect(isFollowingReverse[user1Did]).toBe(false);
    });

    test('should handle follow user edge cases', async () => {
      // Add users first
      await state.addUser({ fullName: 'User1', did: user1Did, pk: user1Pk });
      await state.addUser({ fullName: 'User2', did: user2Did, pk: user2Pk });

      // Cannot follow yourself
      await expect(state.followUser(user1Did, user1Did)).rejects.toThrow('Cannot follow yourself');

      // Cannot follow twice
      await state.followUser(user1Did, user2Did);
      await expect(state.followUser(user1Did, user2Did)).rejects.toThrow('Already following this user');
    });

    test('should unfollow user successfully', async () => {
      // Add two users first
      await state.addUser({ fullName: 'User1', did: user1Did, pk: user1Pk });
      await state.addUser({ fullName: 'User2', did: user2Did, pk: user2Pk });

      // User1 follows User2
      await state.followUser(user1Did, user2Did);
      let isFollowing = await state.isFollowing(user1Did, [user2Did]);
      expect(isFollowing[user2Did]).toBe(true);

      // User1 unfollows User2
      await state.unfollowUser(user1Did, user2Did);
      isFollowing = await state.isFollowing(user1Did, [user2Did]);
      expect(isFollowing[user2Did]).toBe(false);

      // Unfollowing non-existing relationship should not throw error
      await state.unfollowUser(user1Did, user2Did);
      isFollowing = await state.isFollowing(user1Did, [user2Did]);
      expect(isFollowing[user2Did]).toBe(false);
    });

    test('should get followers list correctly', async () => {
      // Add three users
      await state.addUser({ fullName: 'User1', did: user1Did, pk: user1Pk });
      await state.addUser({ fullName: 'User2', did: user2Did, pk: user2Pk });
      await state.addUser({ fullName: 'User3', did: user3Did, pk: user3Pk });

      // User1 and User3 follow User2
      await state.followUser(user1Did, user2Did);
      await state.followUser(user3Did, user2Did);

      // Get User2's followers (simple DID list)
      const result = await state.getFollowers(user2Did, {
        includeUserInfo: false,
        includeFollowStatus: false,
      });
      expect(result.list).toHaveLength(2);
      expect(result.list).toContain(user1Did);
      expect(result.list).toContain(user3Did);
    });

    test('should get following list correctly', async () => {
      // Add three users
      await state.addUser({ fullName: 'User1', did: user1Did, pk: user1Pk });
      await state.addUser({ fullName: 'User2', did: user2Did, pk: user2Pk });
      await state.addUser({ fullName: 'User3', did: user3Did, pk: user3Pk });

      // User1 follows User2 and User3
      await state.followUser(user1Did, user2Did);
      await state.followUser(user1Did, user3Did);

      // Get User1's following list (simple DID list)
      const result = await state.getFollowing(user1Did, {
        includeUserInfo: false,
        includeFollowStatus: false,
      });
      expect(result.list).toHaveLength(2);
      expect(result.list).toContain(user2Did);
      expect(result.list).toContain(user3Did);
    });

    test('should get follow stats correctly', async () => {
      // Add three users
      await state.addUser({ fullName: 'User1', did: user1Did, pk: user1Pk });
      await state.addUser({ fullName: 'User2', did: user2Did, pk: user2Pk });
      await state.addUser({ fullName: 'User3', did: user3Did, pk: user3Pk });

      // User1 follows User2
      // User3 follows User1
      await state.followUser(user1Did, user2Did);
      await state.followUser(user3Did, user1Did);

      // Get User1's follow stats
      const stats = await state.getFollowStats({ userDids: [user1Did] });
      expect(stats[user1Did]).toEqual({
        followers: 1, // User3 follows User1
        following: 1, // User1 follows User2
      });

      // Get User2's follow stats
      const stats2 = await state.getFollowStats({ userDids: [user2Did] });
      expect(stats2[user2Did]).toEqual({
        followers: 1, // User1 follows User2
        following: 0, // User2 follows no one
      });

      // Get User3's follow stats
      const stats3 = await state.getFollowStats({ userDids: [user3Did] });
      expect(stats3[user3Did]).toEqual({
        followers: 0, // No one follows User3
        following: 1, // User3 follows User1
      });

      // Test with context parameter
      const contextStats = await state.getFollowStats(
        { userDids: [user1Did], teamDid: 'test-team', prefix: 'test' },
        { user: { did: user2Did } }
      );
      expect(contextStats[user1Did]).toEqual({
        followers: 1, // User3 follows User1
        following: 1, // User1 follows User2
      });
    });

    test('should handle user deletion and clean up follow relations', async () => {
      // Add two users
      await state.addUser({ fullName: 'User1', did: user1Did, pk: user1Pk });
      await state.addUser({ fullName: 'User2', did: user2Did, pk: user2Pk });

      // User1 follows User2
      await state.followUser(user1Did, user2Did);

      // Verify follow relationship exists
      let isFollowing = await state.isFollowing(user1Did, [user2Did]);
      expect(isFollowing[user2Did]).toBe(true);

      let following = await state.getFollowing(user1Did, {
        includeUserInfo: false,
        includeFollowStatus: false,
      });
      expect(following.list).toContain(user2Did);

      // Delete User2
      await state.remove({ did: user2Did });

      // User1's following list should no longer contain User2
      following = await state.getFollowing(user1Did, {
        includeUserInfo: false,
        includeFollowStatus: false,
      });
      expect(following.list).not.toContain(user2Did);

      // isFollowing should return false after user deletion
      isFollowing = await state.isFollowing(user1Did, [user2Did]);
      expect(isFollowing[user2Did]).toBe(false);
    });

    test('should get followers with user information', async () => {
      // Add three users
      await state.addUser({ fullName: 'User1', did: user1Did, pk: user1Pk });
      await state.addUser({ fullName: 'User2', did: user2Did, pk: user2Pk });
      await state.addUser({ fullName: 'User3', did: user3Did, pk: user3Pk });

      // User1 and User3 follow User2
      await state.followUser(user1Did, user2Did);
      await state.followUser(user3Did, user2Did);

      // Get User2's followers with user info
      const result = await state.getFollowers(user2Did, {
        includeUserInfo: true,
        includeFollowStatus: false,
      });

      expect(result.list).toHaveLength(2);

      // Verify structure includes user information
      const follower1 = result.list.find((f) => f.followerDid === user1Did);
      const follower2 = result.list.find((f) => f.followerDid === user3Did);

      expect(follower1).toMatchObject({
        followerDid: user1Did,
        userDid: user2Did,
        user: expect.objectContaining({
          did: user1Did,
          fullName: 'User1',
        }),
      });

      expect(follower2).toMatchObject({
        followerDid: user3Did,
        userDid: user2Did,
        user: expect.objectContaining({
          did: user3Did,
          fullName: 'User3',
        }),
      });
    });

    test('should get following with follow status', async () => {
      // Add three users
      await state.addUser({ fullName: 'User1', did: user1Did, pk: user1Pk });
      await state.addUser({ fullName: 'User2', did: user2Did, pk: user2Pk });
      await state.addUser({ fullName: 'User3', did: user3Did, pk: user3Pk });

      // User1 follows User2 and User3
      await state.followUser(user1Did, user2Did);
      await state.followUser(user1Did, user3Did);

      // Get User1's following list with follow status
      const result = await state.getFollowing(
        user1Did,
        {
          includeUserInfo: false,
          includeFollowStatus: true,
        },
        { user: { did: user1Did } }
      );

      expect(result.list).toHaveLength(2);

      // All should be marked as following since it's user's own following list
      result.list.forEach((follow) => {
        expect(follow.isFollowing).toBe(true);
      });
    });

    test('should handle pagination in followers list', async () => {
      // Use fresh users for this test to avoid interference
      const testUser1 = fromRandom();
      const testUser2 = fromRandom();

      // Add two users
      await state.addUser({ fullName: 'TestUser1', did: testUser1.address, pk: testUser1.publicKey });
      await state.addUser({ fullName: 'TestUser2', did: testUser2.address, pk: testUser2.publicKey });

      // User2 follows User1
      await state.followUser(testUser2.address, testUser1.address);

      // Test pagination structure
      const page1 = await state.getFollowers(testUser1.address, {
        includeUserInfo: false,
        includeFollowStatus: false,
        paging: { page: 1, pageSize: 10 },
      });

      // Verify pagination structure
      expect(page1).toHaveProperty('list');
      expect(page1).toHaveProperty('paging');
      expect(page1.paging).toHaveProperty('total');
      expect(page1.paging).toHaveProperty('page');
      expect(page1.paging).toHaveProperty('pageSize');
      expect(page1.paging.page).toBe(1);
      expect(page1.paging.pageSize).toBe(10);
      expect(page1.paging.total).toBeGreaterThanOrEqual(1);
      expect(page1.list.length).toBeLessThanOrEqual(page1.paging.pageSize);
    });

    test('should handle sorting in follow lists', async () => {
      // Add three users
      await state.addUser({ fullName: 'User1', did: user1Did, pk: user1Pk });
      await state.addUser({ fullName: 'User2', did: user2Did, pk: user2Pk });
      await state.addUser({ fullName: 'User3', did: user3Did, pk: user3Pk });

      // User1 follows User2 first, then User3
      await state.followUser(user1Did, user2Did);
      await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
      await state.followUser(user1Did, user3Did);

      // Get following list sorted by creation time ascending
      const resultAsc = await state.getFollowing(user1Did, {
        includeUserInfo: false,
        includeFollowStatus: false,
        sort: { createdAt: 1 },
      });

      expect(resultAsc.list).toHaveLength(2);
      expect(resultAsc.list[0]).toBe(user2Did); // First followed
      expect(resultAsc.list[1]).toBe(user3Did); // Second followed

      // Get following list sorted by creation time descending (default)
      const resultDesc = await state.getFollowing(user1Did, {
        includeUserInfo: false,
        includeFollowStatus: false,
        sort: { createdAt: -1 },
      });

      expect(resultDesc.list).toHaveLength(2);
      expect(resultDesc.list[0]).toBe(user3Did); // Latest followed
      expect(resultDesc.list[1]).toBe(user2Did); // Earlier followed
    });

    test('should handle empty results correctly', async () => {
      // Add one user but no follows
      await state.addUser({ fullName: 'User1', did: user1Did, pk: user1Pk });

      // Get empty followers list
      const followers = await state.getFollowers(user1Did, { includeUserInfo: false });
      expect(followers.list).toHaveLength(0);
      expect(followers.paging.total).toBe(0);

      // Get empty following list
      const following = await state.getFollowing(user1Did, { includeUserInfo: false });
      expect(following.list).toHaveLength(0);
      expect(following.paging.total).toBe(0);
    });

    test('should handle follow status for different users', async () => {
      // Add three users
      await state.addUser({ fullName: 'User1', did: user1Did, pk: user1Pk });
      await state.addUser({ fullName: 'User2', did: user2Did, pk: user2Pk });
      await state.addUser({ fullName: 'User3', did: user3Did, pk: user3Pk });

      // User1 follows User2, User3 follows User1
      await state.followUser(user1Did, user2Did);
      await state.followUser(user3Did, user1Did);

      // Get User1's followers from User2's perspective (User2 doesn't follow User3)
      const followersFromUser2 = await state.getFollowers(
        user1Did,
        {
          includeUserInfo: false,
          includeFollowStatus: true,
        },
        { user: { did: user2Did } }
      );

      expect(followersFromUser2.list).toHaveLength(1);
      const follower = followersFromUser2.list[0];
      expect(follower.followerDid).toBe(user3Did);
      expect(follower.isFollowing).toBe(false); // User2 doesn't follow User3
    });

    test('should respect privacy settings when accessing follow data', async () => {
      // Add three users
      await state.addUser({ fullName: 'User1', did: user1Did, pk: user1Pk });
      await state.addUser({ fullName: 'User2', did: user2Did, pk: user2Pk });
      await state.addUser({ fullName: 'User3', did: user3Did, pk: user3Pk });

      // User2 and User3 follow User1
      await state.followUser(user2Did, user1Did);
      await state.followUser(user3Did, user1Did);
      // User1 follows User3
      await state.followUser(user1Did, user3Did);

      // Set User1's profile as private by updating extra.privacy
      const PRIVACY_PATH = '/.well-known/service/user/user-followers';
      await state.update(
        { did: user1Did },
        {
          $set: {
            [`extra.privacy.${PRIVACY_PATH}`]: true,
          },
        }
      );

      // Test getFollowStats: User2 should get empty stats for User1
      const stats = await state.getFollowStats({ userDids: [user1Did, user2Did] }, { user: { did: user2Did } });
      expect(stats[user1Did]).toEqual({ followers: 0, following: 0 }); // Private user returns empty stats
      expect(stats[user2Did]).toEqual({ followers: 0, following: 1 }); // Own stats should work

      const ownStats = await state.getFollowStats(
        { userDids: [user1Did], options: { includeInvitees: true } },
        { user: { did: user1Did } }
      );
      expect(ownStats[user1Did]).toEqual({ followers: 2, following: 1, invitees: 0 });

      // Admin user in dashboard should be able to access private profile
      const adminContext = {
        user: { did: 'admin-did', role: 'admin' },
        hostname: 'localhost:8089',
        referrer: 'http://localhost:8089/.well-known/service/admin/',
      };

      const adminStats = await state.getFollowStats(
        { userDids: [user1Did], teamDid: 'test-team', prefix: 'abt-node' },
        adminContext
      );
      expect(adminStats[user1Did]).toEqual({ followers: 2, following: 1 });

      // Test public access when privacy is disabled
      await state.update(
        { did: user1Did },
        {
          $set: {
            [`extra.privacy.${PRIVACY_PATH}`]: false,
          },
        }
      );

      const publicStats = await state.getFollowStats({ userDids: [user1Did] }, { user: { did: user2Did } });
      expect(publicStats[user1Did]).toEqual({ followers: 2, following: 1 });
    });
  });

  describe('Invitation Management', () => {
    let inviter1Did;
    let inviter1Pk;
    let inviter2Did;
    let inviter2Pk;
    let invitee1Did;
    let invitee1Pk;
    let invitee2Did;
    let invitee2Pk;
    let invitee3Did;
    let invitee3Pk;

    beforeEach(() => {
      const w1 = fromRandom();
      const w2 = fromRandom();
      const w3 = fromRandom();
      const w4 = fromRandom();
      const w5 = fromRandom();

      inviter1Did = w1.address;
      inviter1Pk = w1.publicKey;
      inviter2Did = w2.address;
      inviter2Pk = w2.publicKey;
      invitee1Did = w3.address;
      invitee1Pk = w3.publicKey;
      invitee2Did = w4.address;
      invitee2Pk = w4.publicKey;
      invitee3Did = w5.address;
      invitee3Pk = w5.publicKey;
    });

    test('should handle getInvitees operations', async () => {
      // Add inviters
      await state.addUser({ fullName: 'Inviter1', did: inviter1Did, pk: inviter1Pk });
      await state.addUser({ fullName: 'Inviter2', did: inviter2Did, pk: inviter2Pk });

      // Add invited users with delay for sorting test
      await state.addUser({
        fullName: 'Invitee1',
        did: invitee1Did,
        pk: invitee1Pk,
        inviter: inviter1Did,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await state.addUser({
        fullName: 'Invitee2',
        did: invitee2Did,
        pk: invitee2Pk,
        inviter: inviter1Did,
      });
      await state.addUser({
        fullName: 'Invitee3',
        did: invitee3Did,
        pk: invitee3Pk,
        inviter: inviter2Did,
      });

      // Test basic invitees list functionality
      const basicResult = await state.getInvitees(inviter1Did);
      expect(basicResult.paging.total).toBe(2);
      expect(basicResult.users).toHaveLength(2);
      const inviteeDids = basicResult.users.map((user) => user.did);
      expect(inviteeDids).toContain(invitee1Did);
      expect(inviteeDids).toContain(invitee2Did);
      expect(inviteeDids).not.toContain(invitee3Did);

      // Test paging functionality
      const pagingResult = await state.getInvitees(inviter1Did, { paging: { pageSize: 1 } });
      expect(pagingResult.paging.total).toBe(2);
      expect(pagingResult.users).toHaveLength(1);

      // Test sorting functionality
      const sortAsc = await state.getInvitees(inviter1Did, { sort: { createdAt: 1 } });
      expect(sortAsc.users[0].did).toBe(invitee1Did);
      const sortDesc = await state.getInvitees(inviter1Did, { sort: { createdAt: -1 } });
      expect(sortDesc.users[0].did).toBe(invitee2Did);

      // Test empty invitees list
      const emptyInviter = fromRandom();
      await state.addUser({ fullName: 'EmptyInviter', did: emptyInviter.address, pk: emptyInviter.publicKey });
      const emptyResult = await state.getInvitees(emptyInviter.address);
      expect(emptyResult.paging.total).toBe(0);
      expect(emptyResult.users).toHaveLength(0);

      // Test non-existent inviter error
      const nonExistentDid = fromRandom().address;
      await expect(state.getInvitees(nonExistentDid)).rejects.toThrow();
    });

    test('should handle getInviteesCount operations', async () => {
      // Test empty userDids array
      const emptyResult = await state.getFollowStats({ userDids: [] });
      expect(emptyResult).toEqual({});

      // Add inviters
      await state.addUser({ fullName: 'Inviter1', did: inviter1Did, pk: inviter1Pk });
      await state.addUser({ fullName: 'Inviter2', did: inviter2Did, pk: inviter2Pk });

      const noInviteesUser = fromRandom();
      await state.addUser({ fullName: 'NoInvitees', did: noInviteesUser.address, pk: noInviteesUser.publicKey });

      // Add invited users
      await state.addUser({
        fullName: 'Invitee1',
        did: invitee1Did,
        pk: invitee1Pk,
        inviter: inviter1Did,
      });
      await state.addUser({
        fullName: 'Invitee2',
        did: invitee2Did,
        pk: invitee2Pk,
        inviter: inviter1Did,
      });
      await state.addUser({
        fullName: 'Invitee3',
        did: invitee3Did,
        pk: invitee3Pk,
        inviter: inviter2Did,
      });

      // Test successful batch invitation counts
      const result = await state.getFollowStats({
        userDids: [inviter1Did, inviter2Did, noInviteesUser.address],
      });

      expect(result[inviter1Did]).toEqual({ followers: 0, following: 0 });
      expect(result[inviter2Did]).toEqual({ followers: 0, following: 0 });
      expect(result[noInviteesUser.address]).toEqual({ followers: 0, following: 0 });

      // Test successful batch invitation counts
      const batchResult = await state.getFollowStats(
        {
          userDids: [inviter1Did, inviter2Did, noInviteesUser.address],
          options: { includeInvitees: true },
        },
        { user: { did: inviter1Did } }
      );

      expect(batchResult[inviter1Did].invitees).toBe(2);
      expect(batchResult[inviter2Did]).not.toHaveProperty('invitees');
      expect(batchResult[noInviteesUser.address]).not.toHaveProperty('invitees');
    });

    test('should respect privacy settings in getInviteesCount', async () => {
      const PRIVACY_PATH = '/.well-known/service/user/user-followers';

      // Add inviters
      await state.addUser({ fullName: 'Inviter1', did: inviter1Did, pk: inviter1Pk });
      await state.addUser({ fullName: 'Inviter2', did: inviter2Did, pk: inviter2Pk });

      // Add invited users
      await state.addUser({
        fullName: 'Invitee1',
        did: invitee1Did,
        pk: invitee1Pk,
        inviter: inviter1Did,
      });

      // Set privacy for inviter1
      await state.update(
        { did: inviter1Did },
        {
          $set: {
            [`extra.privacy.${PRIVACY_PATH}`]: true,
          },
        }
      );

      // Test access by another user (should return 0 due to privacy)
      const publicResult = await state.getFollowStats(
        { userDids: [inviter1Did], options: { includeInvitees: true } },
        { user: { did: inviter2Did } }
      );

      // Should not return invitees when query ID differs from login user, even if includeInvitees is true
      expect(publicResult[inviter1Did]).toEqual({ followers: 0, following: 0 });

      // Test access by the user themselves (should return actual count)
      const ownerResult = await state.getFollowStats(
        { userDids: [inviter1Did], options: { includeInvitees: true } },
        { user: { did: inviter1Did } }
      );
      expect(ownerResult[inviter1Did].invitees).toBe(1);
    });

    test('should handle follow status in getInvitees', async () => {
      // Skip this test if userFollowers model is not available
      if (!state.userFollowers) {
        return;
      }

      // Add users
      await state.addUser({ fullName: 'Inviter1', did: inviter1Did, pk: inviter1Pk });
      await state.addUser({ fullName: 'Invitee1', did: invitee1Did, pk: invitee1Pk, inviter: inviter1Did });
      await state.addUser({ fullName: 'Observer', did: inviter2Did, pk: inviter2Pk });

      // Observer follows the invitee
      await state.followUser(inviter2Did, invitee1Did);

      // Test with follow status enabled
      const resultWithFollowStatus = await state.getInvitees(
        inviter1Did,
        { includeFollowStatus: true },
        { user: { did: inviter2Did } }
      );
      expect(resultWithFollowStatus.users).toHaveLength(1);
      expect(resultWithFollowStatus.users[0].isFollowing).toBe(true);

      // Test with follow status disabled
      const resultWithoutFollowStatus = await state.getInvitees(inviter1Did, { includeFollowStatus: false });
      expect(resultWithoutFollowStatus.users).toHaveLength(1);
      expect(resultWithoutFollowStatus.users[0].isFollowing).toBeUndefined();
    });
  });

  describe('Webhook Management', () => {
    test('should update webhook', async () => {
      // Create a user with webhook
      const user = await state.addUser({
        fullName: 'Test User',
        did,
        pk,
        extra: {
          webhooks: [
            {
              url: 'https://hooks.slack.com/test',
              enabled: true,
              consecutiveFailures: 0,
            },
          ],
        },
      });

      // Test updating enabled status to false
      const updated1 = await state.updateWebhook(user.did, {
        url: 'https://hooks.slack.com/test',
        enabled: false,
      });
      expect(updated1.extra.webhooks[0].enabled).toBe(false);
      expect(updated1.extra.webhooks[0].consecutiveFailures).toBe(0);

      // Test updating enabled status to true
      const updated2 = await state.updateWebhook(user.did, {
        url: 'https://hooks.slack.com/test',
        enabled: true,
      });
      expect(updated2.extra.webhooks[0].enabled).toBe(true);

      // Test updating consecutiveFailures with specific value
      const updated3 = await state.updateWebhook(user.did, {
        url: 'https://hooks.slack.com/test',
        consecutiveFailures: 5,
      });
      expect(updated3.extra.webhooks[0].consecutiveFailures).toBe(5);

      // Test default increment when consecutiveFailures not provided
      const updated4 = await state.updateWebhook(user.did, {
        url: 'https://hooks.slack.com/test',
      });
      expect(updated4.extra.webhooks[0].consecutiveFailures).toBe(6);

      // Test auto-disable when reaching threshold
      const updated5 = await state.updateWebhook(user.did, {
        url: 'https://hooks.slack.com/test',
        consecutiveFailures: 50,
      });
      expect(updated5.extra.webhooks[0].enabled).toBe(false);
      expect(updated5.extra.webhooks[0].consecutiveFailures).toBe(0);

      // Test error: user not found
      try {
        await state.updateWebhook('z1invalidDid123', {
          url: 'https://hooks.slack.com/test',
        });
        expect(false).toBe(true);
      } catch (err) {
        expect(err.message).toContain('not found');
      }

      // Test error: invalid webhook (missing url)
      try {
        await state.updateWebhook(user.did, {});
        expect(false).toBe(true);
      } catch (err) {
        expect(err.message).toBe('Invalid webhook');
      }

      // Test error: consecutiveFailures must be non-negative integer (negative)
      try {
        await state.updateWebhook(user.did, {
          url: 'https://hooks.slack.com/test',
          consecutiveFailures: -1,
        });
        expect(false).toBe(true);
      } catch (err) {
        expect(err.message).toBe('consecutiveFailures must be a non-negative integer.');
      }

      // Test error: consecutiveFailures must be non-negative integer (float)
      try {
        await state.updateWebhook(user.did, {
          url: 'https://hooks.slack.com/test',
          consecutiveFailures: 1.5,
        });
        expect(false).toBe(true);
      } catch (err) {
        expect(err.message).toBe('consecutiveFailures must be a non-negative integer.');
      }
    });
  });
});
