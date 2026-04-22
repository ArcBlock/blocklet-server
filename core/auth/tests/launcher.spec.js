const { test, expect, describe, beforeEach, afterEach } = require('bun:test');
const MockAdapter = require('axios-mock-adapter');
const { fromRandom } = require('@ocap/wallet');
const _axios = require('@abtnode/util/lib/axios');

const axios = new MockAdapter(_axios);

const { doRequest, getLauncherSession, getLauncherUser, LAUNCHER_BLOCKLET_DID } = require('../lib/launcher');

const launcherUrl = 'https://launcher.arcblock.io';
const launcherSessionId = 'GzwrsLxiKDdiZsZX';

const user = {
  did: 'z1aCiVUzXSrNPfVVC5m8WxdhNBi6VzrtLnE',
  pk: 'z8KmE56VEEM73dbnQxLJdKn4a38A1Tgu1NjCFczjthBvP',
  fullName: 'test-user',
  email: 'test-user@example.com',
  avatar: '/.well-known/service/user/avatar/e4846d93940be214cac1349c28755924.jpeg',
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

const launchSession = {
  blockletMetaUrl:
    'https://bbqawkfxa6vhusm6ylonacafqoientxluwn5sr6kb2i.did.abtnet.io/api/blocklets/z8iZiDFg3vkkrPwsiba1TLXy3H9XHzFERsP8o/blocklet.json',
  userDid: 'z1QXnLGLUM38BdUTaKJ5cS7gtihLuz7bL4b',
  status: 40,
  type: 'serverless',
  planId: 'PUVy1ctQHJ1Imwdp',
  nftDid: 'zjdwerRwcfcKneGMpLKKrVfJ2yGyA9WFNqbK',
  paymentId: 'YWTbcQKTNj0d07tL',
  serverDid: 'zNKnTry8ptmrCTY8b2MnMAPP4bs3bx8N844d',
  serverPk: '0x31114a967bff06e6f5f83217a07bbe00bff1155233a0eefb3ee34df77e70d451',
  appDid: '',
  appUrl: '',
  appName: '',
  ownerDid: '',
  _id: 'GzwrsLxiKDdiZsZX',
  createdAt: 1684980494810,
  updatedAt: 1684980524327,
};

describe('LauncherUtil', () => {
  const serverSk = fromRandom().secretKey;

  beforeEach(() => {
    axios.reset();
  });

  afterEach(() => {
    axios.reset();
  });

  describe('doRequest', () => {
    test('should work', async () => {
      await expect(doRequest('', {})).rejects.toThrow(/serverSk is required/);
    });
  });

  describe('getLauncherSession', () => {
    test('should work without valid sessionId', async () => {
      // Mock the getLauncherInfo request (for __blocklet__.js)
      axios.onGet().replyOnce(200, {
        componentMountPoints: [{ did: LAUNCHER_BLOCKLET_DID, mountPoint: '/app' }],
      });
      // Mock the actual getLauncherSession request
      axios.onGet().replyOnce(200, { launch: launchSession });

      const result = await getLauncherSession(serverSk, { launcherUrl, launcherSessionId });
      expect(result.error).toBeFalsy();
      expect(result.launcherSession).toEqual(launchSession);
    });

    test('should work with launcher', async () => {
      // Mock the getLauncherInfo request (for __blocklet__.js)
      axios.onGet().replyOnce(200, {
        componentMountPoints: [{ did: LAUNCHER_BLOCKLET_DID, mountPoint: '/app' }],
      });
      // Mock the actual getLauncherSession request
      axios.onGet().replyOnce(200, { launch: null });

      const result = await getLauncherSession(serverSk, { launcherUrl, launcherSessionId: 'a' });

      expect(result.error).toBeFalsy();
      expect(result.launcherSession).toBeFalsy();
    });
  });

  describe('getLauncherUser', () => {
    test('should work', async () => {
      // Mock the getLauncherInfo request (for __blocklet__.js)
      axios.onGet().replyOnce(200, {
        componentMountPoints: [{ did: LAUNCHER_BLOCKLET_DID, mountPoint: '/app' }],
      });
      // Mock the actual getLauncherUser request
      axios.onGet().replyOnce(200, { user });

      const result = await getLauncherUser(serverSk, { launcherUrl, launcherSessionId });

      expect(result).toEqual(user);
    });
  });
});
