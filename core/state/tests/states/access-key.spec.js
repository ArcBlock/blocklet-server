const { describe, test, expect, beforeAll, beforeEach, afterEach } = require('bun:test');
const { fromSecretKey } = require('@ocap/wallet');

const AccessKeyState = require('../../lib/states/access-key');
const { setupInMemoryModels } = require('../../tools/fixture');

describe('AccessKeyState', () => {
  let state = null;
  let models = null;
  let userContext = null;
  let adminContext = null;

  beforeAll(async () => {
    models = await setupInMemoryModels();

    userContext = {
      hostname: 'https://app.abtnode.com',
      referrer: 'https://app.abtnode.com/.well-known/service/user/settings',
      user: {
        did: 'z1UayehHwLFTgJSZbxqgf2MdkY1Lb1CdNt6',
        passports: [
          {
            role: 'admin',
            status: 'valid',
          },
        ],
      },
    };
    adminContext = {
      hostname: 'https://app.abtnode.com',
      referrer: 'https://app.abtnode.com/.well-known/service/admin/integrations',
      user: {
        fullName: 'name2',
        did: 'z1UayehHwLFTgJSZbxqgf2MdkY1Lb1CdNt7',
        role: 'admin',
      },
    };
  });

  beforeEach(() => {
    state = new AccessKeyState(models.AccessKey);
  });

  afterEach(async () => {
    await state.reset();
  });

  test('should create an accessKey', async () => {
    const res = await state.create(
      {
        remark: 'a',
        passport: 'admin',
        createdVia: 'connect',
        createdBy: 'z1UayehHwLFTgJSZbxqgf2MdkY1Lb1CdNt7',
      },
      userContext
    );

    expect(res.remark).toBe('a');
    expect(res.passport).toBe('admin');
    expect(res.createdVia).toBe('connect');

    const { accessKeySecret } = res;
    const wallet = fromSecretKey(accessKeySecret);
    expect(wallet.publicKey === res.accessKeyPublic).toBeTruthy();
    expect(wallet.address === res.accessKeyId).toBeTruthy();

    // passport must be exist
    await expect(state.create({ passport: '', createdBy: 'z1UayehHwLFTgJSZbxqgf2MdkY1Lb1CdNt7' })).rejects.toBeTruthy();

    // remark should be empty
    await expect(
      state.create({ passport: 'admin', createdBy: 'z1UayehHwLFTgJSZbxqgf2MdkY1Lb1CdNt7' }, userContext)
    ).resolves.toBeTruthy();

    // remark should not more than 200 chars
    await expect(
      state.create({
        remark: new Array(201).fill('a').join(''),
        passport: 'admin',
        createdBy: 'z1UayehHwLFTgJSZbxqgf2MdkY1Lb1CdNt7',
      })
    ).rejects.toBeTruthy();
  });

  test('should get accessKey paginated', async () => {
    const accessKey = await state.create(
      {
        remark: 'a',
        passport: 'admin',
        createdBy: 'z1UayehHwLFTgJSZbxqgf2MdkY1Lb1CdNt7',
      },
      userContext
    );

    // 没有 context 查询
    try {
      await state.findPaginated({}, { user: adminContext.user });
    } catch (err) {
      expect(err).toBeTruthy();
      expect(err.code).toBe(400);
      expect(err.message).toBe('Missing hostname or referrer context');
    }

    // 在 admin 使用其他角色查询
    try {
      await state.findPaginated({}, { ...adminContext, user: { role: 'member' } });
    } catch (err) {
      expect(err).toBeTruthy();
      expect(err.code).toBe(403);
      expect(err.message).toBe('Unauthorized: You cannot access admin page');
    }

    // admin 查询
    const res = await state.findPaginated({}, adminContext);

    expect(res.list.length).toBe(1);
    expect(res.list[0].accessKeyId).toBe(accessKey.accessKeyId);
    expect(res.list[0].accessKeySecret).toBeFalsy();

    // user 查询自己
    const res2 = await state.findPaginated({}, userContext);
    expect(res2.list.length).toBe(1);

    // user 查询别人
    try {
      await state.findPaginated({ userDid: 'z1UayehHwLFTgJSZbxqgf2MdkY1Lb1CdNt8' }, userContext);
    } catch (err) {
      expect(err).toBeTruthy();
      expect(err.code).toBe(403);
      expect(err.message).toBe('Unauthorized: You cannot view access keys created by other users');
    }

    const accessKey2 = await state.create(
      {
        remark: 'b',
        passport: 'admin',
      },
      userContext
    );

    const res3 = await state.findPaginated({ userDid: userContext.user.did }, userContext);
    expect(res3.list.length).toBe(2);
    expect(res3.list[0].accessKeyId).toBe(accessKey2.accessKeyId);
    expect(res3.list[0].accessKeySecret).toBeFalsy();
  });

  test('should update remark and passport of an accessKey', async () => {
    const doc = await state.create(
      {
        remark: 'a',
        passport: 'admin',
        createdBy: 'z1UayehHwLFTgJSZbxqgf2MdkY1Lb1CdNt7',
      },
      userContext
    );

    await state.update(
      {
        accessKeyId: doc.accessKeyId,
        remark: 'b',
        passport: 'member',
      },
      adminContext
    );

    const res = await state.findPaginated({}, adminContext);

    expect(res.list.length).toBe(1);
    expect(res.list[0].accessKeyId).toBe(doc.accessKeyId);
    expect(res.list[0].remark).toBe('b');
    expect(res.list[0].passport).toBe('member');

    // passport must be exist
    await expect(state.update({ passport: '' })).rejects.toBeTruthy();
  });

  test('should delete accessKey', async () => {
    const doc = await state.create(
      {
        remark: 'a',
        passport: 'admin',
        createdBy: 'z1UayehHwLFTgJSZbxqgf2MdkY1Lb1CdNt7',
      },
      userContext
    );

    const res = await state.findPaginated({}, adminContext);
    expect(res.list.length).toBe(1);

    await state.remove({ accessKeyId: doc.accessKeyId }, adminContext);

    const res2 = await state.findPaginated({}, adminContext);
    expect(res2.list.length).toBe(0);
  });
});
