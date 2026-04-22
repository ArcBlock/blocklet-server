import { test, expect, describe, beforeAll, afterAll, afterEach } from 'bun:test';
import { Op, Sequelize } from 'sequelize';
import {
  BaseState,
  getBlockletModels,
  setupModels,
  UserState,
  TagState,
  PassportState,
  ConnectedAccountState,
} from '../../src';

const users = [
  {
    fullName: 'Robert',
    email: 'alice@example.com',
    avatar: 'bn://avatar/268dfb4db630b3b42c976717b1ed6a6f.png',
    did: 'z1j2xA3Yc2w4ukUoiM5ap8kotd4b7aDoKrN',
    pk: 'zBCPNRPhwAYFwVrhPCMzW2STiUYrHJUhS2JxLS933abCd',
    approved: true,
    locale: 'en',
    firstLoginAt: '2022-11-20T17:40:23.761Z',
    lastLoginAt: '2023-05-04T06:04:05.115Z',
    remark: 'robert',
    createdAt: 1668966023763,
    updatedAt: 1683180245127,
    lastLoginIp: '24.17.183.19',
    sourceProvider: 'wallet',
  },
  {
    type: 'profile',
    fullName: 'linchen',
    email: 'bob@example.com',
    avatar: 'bn://avatar/2fcae9fea6c08ff05d4415c2e1e93cb5.jpg',
    did: 'z1kPYmBG3SwmEhPwzipG9qJBtiHRR3FpRmX',
    pk: 'zFwNMZF4qBq2RB5pJrQYwVMfHsaU9zHjE8fUhAUEag14S',
    approved: true,
    locale: 'zh',
    firstLoginAt: '2022-11-21T03:40:32.821Z',
    lastLoginAt: '2023-05-04T05:54:55.985Z',
    remark: 'linchen',
    createdAt: { $$date: 1669002032823 },
    updatedAt: { $$date: 1683179695988 },
    lastLoginIp: '122.96.44.10',
    sourceProvider: 'wallet',
  },
];

const passports = [
  {
    id: 'z2iUEpJPTcjQUQHghHaWoKhe4Y1VRBY9xfnAs',
    type: ['NFTPassport', 'VerifiableCredential'],
    issuer: {
      id: 'zNKf2ZJqsZNYrCKUjTCqwVjiPtk8Axq8tqU9',
      name: 'ArcBlock Team',
      pk: 'zH594bV5vaL4jjLKWq6eZ1ao3uLCFVUzyfr4RZRrcKc5y',
    },
    issuanceDate: '2022-11-21T03:40:32.731Z',
    endpoint: 'https://team.arcblock.io',
    name: 'member',
    specVersion: '1.0.0',
    title: 'Member',
    status: 'valid',
    role: 'member',
    lastLoginAt: '2023-04-18T00:05:44.278Z',
  },
  {
    id: 'z2iUFMVdeEGA27wXmb7CDemDYP3WBeriWj523',
    type: ['NFTPassport', 'VerifiableCredential'],
    issuer: {
      name: 'ArcVote',
      id: 'zNKf2ZJqsZNYrCKUjTCqwVjiPtk8Axq8tqU9',
      pk: 'zH594bV5vaL4jjLKWq6eZ1ao3uLCFVUzyfr4RZRrcKc5y',
    },
    issuanceDate: '2022-09-15T05:53:34.136Z',
    title: 'Admin',
    endpoint: 'https://vote.arcblock.io',
    name: 'admin',
    specVersion: '1.0.0',
    status: 'valid',
    role: 'admin',
    lastLoginAt: '2023-04-02T23:16:05.957Z',
  },
  {
    id: 'z2iUF2kQoDCvjdwezHwmmF4oN5HKnzrJgM3MG',
    type: ['NFTPassport', 'VerifiableCredential'],
    issuer: {
      id: 'zNKXSSSsga18dk1YygnzV43fnxh2xqXEGXy7',
      name: 'ArcBlock Team',
      pk: 'z4UPfihyE7ksvx1qYTooq5F3U69DBbhC8KhiYnD3E8fP8',
    },
    issuanceDate: '2023-03-27T08:38:04.977Z',
    endpoint: 'https://team.arcblock.io',
    name: 'blogEditor',
    specVersion: '1.0.0',
    title: 'Blog Editor',
    status: 'valid',
    role: 'blogEditor',
    lastLoginAt: '2023-04-13T09:25:24.406Z',
  },
];

const connectedAccounts = [
  {
    provider: 'wallet',
    did: 'z1j2xA3Yc2w4ukUoiM5ap8kotd4b7aDoKrN',
    pk: 'zBCPNRPhwAYFwVrhPCMzW2STiUYrHJUhS2JxLS933abCd',
    firstLoginAt: '2022-11-20T17:40:23.761Z',
    lastLoginAt: '2023-05-01T21:11:01.212Z',
  },
  {
    provider: 'auth0',
    id: 'google-oauth2|107448805506182346590',
    lastLoginAt: '2023-05-04T06:04:05.117Z',
    did: 'z1kSqUZm7rtgRUPeuM61biRfs1SLX8FeRgF',
    pk: '0xc4bf0ff4d0c8bd63834ba2f34da6c0a775a10c8e87b878020cfe4d278e61ad4e',
    firstLoginAt: '2023-04-13T09:47:43.698Z',
  },
  {
    provider: 'wallet',
    did: 'z1kPYmBG3SwmEhPwzipG9qJBtiHRR3FpRmX',
    pk: 'zFwNMZF4qBq2RB5pJrQYwVMfHsaU9zHjE8fUhAUEag14S',
    firstLoginAt: '2022-11-21T03:40:32.821Z',
    lastLoginAt: '2023-05-04T05:54:55.986Z',
  },
  {
    provider: 'auth0',
    id: 'google-oauth2|106664790835561540259',
    did: 'z1WFNAhNS8XewZrSzJNzubREd2y44dLKGiQ',
    pk: '0x3bba753c8b6c35a695a8c627d7be2f73ec14c51c227f8c84f3ea916ad0ee3f61',
    firstLoginAt: '2023-04-18T00:03:52.057Z',
    lastLoginAt: '2023-04-18T00:03:52.057Z',
  },
];

describe('Association', () => {
  const sequelize = new Sequelize('sqlite::memory:', { logging: false });
  const models = getBlockletModels();
  setupModels(models, sequelize);

  let user: BaseState<UserState>;
  let tag: BaseState<TagState>;
  let passport: BaseState<PassportState>;
  let connectedAccount: BaseState<ConnectedAccountState>;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    user = new BaseState(models.User);
    tag = new BaseState(models.Tag);
    passport = new BaseState(models.Passport);
    connectedAccount = new BaseState(models.ConnectedAccount);
  });

  afterEach(async () => {
    await connectedAccount.reset();
    await passport.reset();
    await user.reset();
    await tag.reset();
  });

  afterAll(async () => {
    try {
      await sequelize.close();
    } catch {
      // Do nothing
    }
  });

  test('find', async () => {
    await user.insertMany(users);

    let result = await user.find({ fullName: 'linchen' });
    expect(result).toHaveLength(1);

    result = await user.find({ where: { fullName: 'linchen' } });
    expect(result).toHaveLength(1);
  });

  test('findOne & many-to-many', async () => {
    const userDid = users[0].did;
    await user.insert(users[0]);
    await passport.insert({ ...passports[0], userDid });
    await passport.insert({ ...passports[1], userDid });
    await connectedAccount.insert({ ...connectedAccounts[0], userDid });
    await connectedAccount.insert({ ...connectedAccounts[1], userDid });

    let result = await user.findOne({
      where: { did: userDid },
      include: [
        {
          model: models.Passport,
          as: 'passports',
        },
        {
          model: models.ConnectedAccount,
          as: 'connectedAccounts',
        },
      ],
    });

    // @ts-ignore
    expect(result.passports).toHaveLength(2);
    // @ts-ignore
    expect(result.connectedAccounts).toHaveLength(2);

    // add tags
    const instance = user.build(result);
    const tag1 = await tag.insert({ title: 'good', color: '#3773f2', slug: 'good' });
    const tag2 = await tag.insert({ title: 'better', color: '#3773f2', slug: 'better' });

    const getUser = () =>
      user.findOne({
        where: { did: userDid },
        include: [
          {
            model: models.Tag,
            as: 'tags',
            through: {
              attributes: [],
            },
          },
        ],
      });

    // @ts-ignore
    result = await instance.addTags([tag1.id, tag2.id]);
    result = await getUser();

    // @ts-ignore
    expect(result.tags).toHaveLength(2);
    // @ts-ignore
    expect(result.tags.find((x) => x.id === tag1.id)).toBeTruthy();
    // @ts-ignore
    expect(result.tags.find((x) => x.id === tag2.id)).toBeTruthy();

    // @ts-ignore
    result = await instance.removeTags([tag2.id]);
    result = await getUser();
    // @ts-ignore
    expect(result.tags).toHaveLength(1);
    // @ts-ignore
    expect(result.tags.find((x) => x.id === tag1.id)).toBeTruthy();
    // @ts-ignore
    expect(result.tags.find((x) => x.id === tag2.id)).toBeFalsy();
  });

  test('count', async () => {
    await user.insert(users[0]);
    await user.insert(users[1]);
    await passport.insert({ ...passports[0], userDid: users[0].did });
    await connectedAccount.insert({ ...connectedAccounts[0], userDid: users[0].did });
    await connectedAccount.insert({ ...connectedAccounts[1], userDid: users[1].did });

    const numOfMembers = await user.count({
      distinct: true,
      col: 'did',
      include: [
        {
          model: models.Passport,
          where: { name: 'member' },
          as: 'passports',
          required: true,
        },
      ],
    });
    expect(numOfMembers).toEqual(1);

    const numOfGuests = await user.count({
      where: {
        did: {
          [Op.notIn]: Sequelize.literal('(SELECT DISTINCT "userDid" FROM passports)'),
        },
      },
    });
    expect(numOfGuests).toEqual(1);
  });

  test('paginate', async () => {
    const userDid = users[0].did;
    await user.insert(users[0]);
    await passport.insert({ ...passports[0], userDid });
    await passport.insert({ ...passports[1], userDid });
    await connectedAccount.insert({ ...connectedAccounts[0], userDid });
    await connectedAccount.insert({ ...connectedAccounts[1], userDid });

    const result = await user.paginate(
      {
        where: {},
        include: [
          {
            model: models.Passport,
            as: 'passports',
          },
          {
            model: models.ConnectedAccount,
            as: 'connectedAccounts',
          },
        ],
      },
      { createdAt: -1 },
      { pageSize: 1, page: 1 }
    );

    expect(result.list).toHaveLength(1);
    expect(result.paging.total).toEqual(1);
    expect(result.paging.pageSize).toEqual(1);
    expect(result.paging.pageCount).toEqual(1);
    expect(result.paging.page).toEqual(1);
  });

  test('remove', async () => {
    const userDid = users[0].did;
    await user.insert(users[0]);
    await passport.insert({ ...passports[0], userDid });
    await passport.insert({ ...passports[1], userDid });

    let count = await user.count({ where: { fullName: users[0].fullName } });
    expect(count).toEqual(1);

    count = await passport.count({ where: { userDid: users[0].did } });
    expect(count).toEqual(2);

    await user.remove({ did: users[0].did });
    count = await user.count({ where: { did: users[0].did } });
    expect(count).toEqual(0);

    await passport.remove({ userDid: users[0].did });
    count = await passport.count({ where: { userDid: users[0].did } });
    expect(count).toEqual(0);
  });
});
