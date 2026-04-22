const { test, expect, describe, beforeEach, afterEach, mock, spyOn, beforeAll, afterAll } = require('bun:test');

mock.module('@abtnode/util/lib/axios', () => ({
  get: mock(),
}));
mock.module('@abtnode/auth/lib/launcher', () => ({
  getLauncherUser: mock(),
  getLauncherSession: mock(),
  getLauncherInfo: mock(),
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const fs = require('fs-extra');
const path = require('path');
const omit = require('lodash/omit');
const axios = require('@abtnode/util/lib/axios');
const dayjs = require('@abtnode/util/lib/dayjs');
const launcher = require('@abtnode/auth/lib/launcher');
const { USER_AVATAR_DIR, NODE_DATA_DIR_NAME, LAUNCH_SESSION_STATUS } = require('@abtnode/constant');
const { fromRandom } = require('@ocap/wallet');

const { BlockletStatus } = require('@blocklet/constant');

const {
  setupAppOwner,
  isBlockletExpired,
  isBlockletTerminated,
  isDataRetentionExceeded,
} = require('../../lib/util/launcher');
const { setupInstance, tearDownInstance } = require('../../tools/fixture');

const launcherUrl = 'https://launcher.arcblock.io';
const launcherSessionId = 'GzwrsLxiKDdiZsZX';

const session = {
  id: 'sessionId',
  appDid: 'zNKnTry8ptmrCTY8b2MnMAPP4bs3bx8N844d',
  userDid: 'z1QXnLGLUM38BdUTaKJ5cS7gtihLuz7bL4b',
  ownerDid: 'z1aCiVUzXSrNPfVVC5m8WxdhNBi6VzrtLnE',
  ownerPk: 'z8KmE56VEEM73dbnQxLJdKn4a38A1Tgu1NjCFczjthBvP',
  lastLoginIp: '127.0.0.1',
  context: {},
  locale: 'en',
  launcherUrl,
  launcherSessionId,
};

const avatarFile = 'e4846d93940be214cac1349c28755924.jpeg';
const user = {
  did: 'z1aCiVUzXSrNPfVVC5m8WxdhNBi6VzrtLnE',
  pk: 'z8KmE56VEEM73dbnQxLJdKn4a38A1Tgu1NjCFczjthBvP',
  fullName: 'test-user',
  email: 'test-user@example.com',
  avatar: `bn://avatar/${avatarFile}`,
  role: 'guest',
  remark: 'shijun',
  sourceProvider: 'wallet',
  locale: 'en',
  approved: true,
  extra: {},
  firstLoginAt: '2022-03-24T08:04:31.064Z',
  lastLoginAt: '2023-05-26T09:05:55.490Z',
  lastLoginIp: '192.243.124.90',
  createdAt: '2022-03-24T08:04:31.073Z',
  updatedAt: '2023-05-26T09:05:55.495Z',
  connectedAccounts: [],
  passports: [],
  permissions: [],
};

const getEnvironments = (instance) => [
  {
    key: 'BLOCKLET_APP_URL',
    value: 'https://bbqawkfxa6vhusm6ylonacafqoientxluwn5sr6kb2i.did.abtnet.io',
  },
  {
    key: 'BLOCKLET_DATA_DIR',
    value: path.join(instance.dataDirs.data, session.appDid),
  },
];

describe('LauncherUtil', () => {
  let instance = null;

  beforeAll(async () => {
    instance = await setupInstance('launcher');
    const avatarPath = path.join(
      instance.dataDirs.data,
      NODE_DATA_DIR_NAME,
      USER_AVATAR_DIR,
      avatarFile.slice(0, 2),
      avatarFile.slice(2)
    );
    fs.mkdirpSync(path.dirname(avatarPath));
    fs.writeFileSync(avatarPath, Buffer.from('abc'));
  });

  afterAll(async () => {
    await tearDownInstance(instance);
  });

  beforeEach(() => {
    mock.clearAllMocks();
    instance.getUser = mock().mockResolvedValue(user);
    instance.getRoles = mock().mockResolvedValue([{ name: 'owner' }]);
    instance.loginUser = mock().mockResolvedValue(user);
    instance.createAuditLog = mock().mockResolvedValue({});
    instance.setBlockletOwner = mock().mockResolvedValue({});
    instance.getSession = mock().mockResolvedValue(session);
    instance.endSession = mock().mockResolvedValue(session);
    instance.upsertUserSession = mock().mockResolvedValue({ visitorId: 'test-visitor-id' });
    instance.createPassportLog = mock().mockResolvedValue({
      inviteId: 'test-invite-id',
      passportExpireTime: '',
    });
  });

  afterEach(() => {
    mock.clearAllMocks();
  });

  describe('setupAppOwner', () => {
    test('should work without launcher', async () => {
      instance.getSession = mock().mockResolvedValue(null);
      await expect(setupAppOwner({ node: instance, sessionId: session.id })).rejects.toThrow(/session not found/);

      instance.getSession = mock().mockResolvedValue(omit(session, ['launcherUrl']));
      instance.getBlocklet = mock().mockResolvedValue(null);
      await expect(setupAppOwner({ node: instance, sessionId: session.id })).rejects.toThrow(/Blocklet not found/);

      instance.getBlocklet = mock().mockResolvedValue({
        meta: { did: session.appDid },
        status: BlockletStatus.running,
        environments: getEnvironments(instance),
      });

      instance.getBlocklet = mock().mockResolvedValue({
        meta: { did: session.appDid },
        status: BlockletStatus.installed,
        environments: getEnvironments(instance),
      });
      instance.getUser = mock().mockResolvedValue(null);
      await expect(setupAppOwner({ node: instance, sessionId: session.id })).rejects.toThrow(/user not found/);

      instance.getUser = mock().mockResolvedValue(user);
      const result = await setupAppOwner({ node: instance, sessionId: session.id });
      expect(result.blocklet).toBeTruthy();
      expect(result.session).toBeTruthy();
      expect(result.passport).toBeTruthy();
      expect(result.setupToken).toBeTruthy();
      expect(instance.upsertUserSession).toHaveBeenCalledTimes(1);
    });

    test('should work with launcher', async () => {
      instance.getBlocklet = mock().mockResolvedValue({
        meta: { did: session.appDid },
        status: BlockletStatus.installed,
        environments: getEnvironments(instance),
      });
      spyOn(launcher, 'getLauncherUser').mockResolvedValue(null);
      await expect(setupAppOwner({ node: instance, sessionId: session.id })).rejects.toThrow(/user not found/);

      spyOn(launcher, 'getLauncherUser').mockResolvedValue(user);
      spyOn(axios, 'get').mockImplementationOnce(() => ({ data: Buffer.from('abc') }));
      const result = await setupAppOwner({ node: instance, sessionId: session.id });
      expect(result.blocklet).toBeTruthy();
      expect(result.session).toBeTruthy();
      expect(result.passport).toBeTruthy();
      expect(result.setupToken).toBeTruthy();

      expect(launcher.getLauncherUser).toHaveBeenCalledTimes(2);
      expect(instance.upsertUserSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('isBlockletExpired', () => {
    test('should return false if the blocklet does not expired', async () => {
      const wallet = fromRandom();
      const blockletDid = wallet.address;
      spyOn(launcher, 'getLauncherSession').mockResolvedValue({
        error: '',
        launcherSession: {
          status: LAUNCH_SESSION_STATUS.overdue - 1,
        },
      });

      const result = await isBlockletExpired(blockletDid, {
        launcherSessionId,
      });

      expect(result).toBe(false);
      expect(launcher.getLauncherSession).toHaveBeenCalledTimes(1);
    });

    test('should return true if the blocklet already expired', async () => {
      const wallet = fromRandom();
      const blockletDid = wallet.address;
      spyOn(launcher, 'getLauncherSession').mockResolvedValue({
        error: '',
        launcherSession: {
          status: LAUNCH_SESSION_STATUS.overdue,
        },
      });

      const result = await isBlockletExpired(blockletDid, {
        launcherSessionId,
      });

      expect(result).toBe(true);
      expect(launcher.getLauncherSession).toHaveBeenCalledTimes(1);
    });

    test('should return true if the blocklet already terminated', async () => {
      const wallet = fromRandom();
      const blockletDid = wallet.address;
      spyOn(launcher, 'getLauncherSession').mockResolvedValue({
        error: '',
        launcherSession: {
          status: LAUNCH_SESSION_STATUS.terminated,
        },
      });

      const result = await isBlockletExpired(blockletDid, {
        launcherSessionId,
      });

      expect(result).toBe(true);
      expect(launcher.getLauncherSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('isBlockletTerminated', () => {
    test('should return false if the blocklet does not terminated', async () => {
      const wallet = fromRandom();
      const blockletDid = wallet.address;
      spyOn(launcher, 'getLauncherSession').mockResolvedValue({
        error: '',
        launcherSession: {
          status: LAUNCH_SESSION_STATUS.overdue,
        },
      });

      const result = await isBlockletTerminated(blockletDid, {
        launcherSessionId,
      });

      expect(result).toBe(false);
      expect(launcher.getLauncherSession).toHaveBeenCalledTimes(1);
    });

    test('should return false if the blocklet does not terminated', async () => {
      const wallet = fromRandom();
      const blockletDid = wallet.address;
      spyOn(launcher, 'getLauncherSession').mockResolvedValue({
        error: '',
        launcherSession: {
          status: 70,
        },
      });

      const result = await isBlockletTerminated(blockletDid, {
        launcherSessionId,
      });

      expect(result).toBe(true);
      expect(launcher.getLauncherSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('isDataRetentionExceeded', () => {
    test('should return false if launcherSession is empty', () => {
      expect(isDataRetentionExceeded()).toBe(false);
      expect(isDataRetentionExceeded(null)).toBe(false);
    });

    test('should return false if terminatedAt is empty', () => {
      expect(isDataRetentionExceeded({})).toBe(false);
      expect(isDataRetentionExceeded({ terminatedAt: '' })).toBe(false);
      expect(isDataRetentionExceeded({ terminatedAt: null })).toBe(false);
    });

    test('should return false if terminatedAt is not exceeded', () => {
      // 未来的时间
      expect(
        isDataRetentionExceeded({
          terminatedAt: dayjs().add(1, 'day').toISOString(),
          metadata: {},
        })
      ).toBe(false);
      expect(
        isDataRetentionExceeded({
          terminatedAt: dayjs().add(30, 'day').toISOString(),
          metadata: {},
        })
      ).toBe(false);

      // 过去的时间但未超过保留期
      expect(
        isDataRetentionExceeded({
          terminatedAt: dayjs().subtract(1, 'day').toISOString(),
          metadata: {},
        })
      ).toBe(false);
      expect(
        isDataRetentionExceeded({
          terminatedAt: dayjs().subtract(29, 'day').toISOString(),
          metadata: {},
        })
      ).toBe(false);
      expect(
        isDataRetentionExceeded({
          terminatedAt: dayjs().subtract(30, 'day').toISOString(),
          metadata: {},
        })
      ).toBe(false);
    });

    test('should return true if terminatedAt is exceeded', () => {
      expect(
        isDataRetentionExceeded({
          terminatedAt: dayjs().subtract(31, 'day').toISOString(),
          metadata: {},
        })
      ).toBe(true);
    });

    test('should return true if terminateImmediately is true even if retention period not exceeded', () => {
      expect(
        isDataRetentionExceeded({
          terminatedAt: dayjs().subtract(1, 'day').toISOString(),
          metadata: { terminateImmediately: true },
        })
      ).toBe(true);
      expect(
        isDataRetentionExceeded({
          terminatedAt: dayjs().subtract(15, 'day').toISOString(),
          metadata: { terminateImmediately: true },
        })
      ).toBe(true);
    });

    test('should return false if terminateImmediately is false', () => {
      expect(
        isDataRetentionExceeded({
          terminatedAt: dayjs().subtract(1, 'day').toISOString(),
          metadata: { terminateImmediately: false },
        })
      ).toBe(false);
    });
  });
});
