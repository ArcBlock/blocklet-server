/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const { test, describe, expect, beforeAll, mock, beforeEach, afterAll } = require('bun:test');
const fs = require('fs-extra');
const path = require('path');
const { http } = require('follow-redirects');
const os = require('os');
const { default: axios } = require('axios');
const detectPort = require('detect-port');
const express = require('express');
const bodyParser = require('body-parser');
const { WsClient } = require('@arcblock/ws');
const JWT = require('@arcblock/jwt');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { getApplicationWallet } = require('@blocklet/meta/lib/wallet');
const { init } = require('../../../api/services/relay');
const { init: initStates } = require('../../../api/state');

const sleep = (t) =>
  new Promise((r) => {
    setTimeout(r, t || 400);
  });

// this account is in team
const account = {
  address: 'z1b1vpz9r9Tj4e6CAqpuccSiPLD4FfR7sLV',
  pk: '0xfc018b861fa16f1679acdc7ce64c690a4cc9c3cff2d23622a730d7c14cedf4ab',
  sk: '0x2bb79d6b5a8395dbe1df011f9220e39e874123ee15a911ba31d70cca82070bb8fc018b861fa16f1679acdc7ce64c690a4cc9c3cff2d23622a730d7c14cedf4ab',
};

// this account is not in team
const account2 = {
  address: 'zNKe9V1yu9omc7zUKvUp1nCKjq9H6TdaPn9i',
  pk: '0xba3a47823bcb9a5ec6159190bb230e114089c53519df3a6d32e79dc200061b79',
  sk: '0x38419160e281002da42506be9aa1488ad16c22ade6f49921965f8a47a99a2a02ba3a47823bcb9a5ec6159190bb230e114089c53519df3a6d32e79dc200061b79',
};

const blocklet = {
  did: 'z8iZjySpAu4jzbMochL9k1okuji1GcS7RRRDM',
  appId: 'zNKb2kbCvDHo9APDhD1trbAV1EVoYF6PcSJ3',
  appSk:
    '0xd6a7260750eca3420310e26cfb3021c1cd5f22e1acef2c75267913ff132e0778e2a689d16eb6b99d3deb887638138790ad76d5b6b31e6a583c66915cd5d05b4d',
};

const blocklet3 = {
  did: 'zNKbHjWJJJnsWwKnSpCxgo3twc6oeuWSoNLg',
  appPid: 'zNKbHjWJJJnsWwKnSpCxgo3twc6oeuWSoNLg',
  appPsk:
    '0x7d64c050a2881b451a91771bad3e5846c9ab4b847b8edfcb974bc92f9519a0daf9befa6daea2a51a2b3fd3062ae26d9cf44531d089f0b624a1648b930c6b2635',
  appId: 'zNKtpWZypRaUNyDDct5frsKUPf1nUK7vWrQ1',
  appSk:
    '0x122b720d271490f5831377c2c2e24d7b9666c3e58a68789a71ee01dd552519ffd32a58553e21c9d4f9173005832fcb17eb6e590d26c6f02936ecaafd85361347',
};

const getRelayChannel = (appId = blocklet.appId) => `relay:${appId}:topic`;

beforeEach(() => {
  mock.clearAllMocks();
});

describe('notification', () => {
  const OLD_ENV = process.env;

  const node = {
    getUser: ({ user }) => (user.did === account.address ? { did: account.address } : null),
    ensureBlockletIntegrity: () => ({}),
    getNodeInfo: () => ({
      sk: '0x338003c9b11cd9cb49a8c68db3ddeb860b394ab8d926d94cd917c14c1b9a805b6d4cba304e7f957facb2bfa11132a6688c233d75fa710f8bde469be6cbba5a81',
      pk: '0x6d4cba304e7f957facb2bfa11132a6688c233d75fa710f8bde469be6cbba5a81',
      did: 'zNKZRWaYaMZGgeBVyNU4AjSh2821e9qv5j8U',
    }),
    getBlocklet: ({ did }) => {
      if (did === blocklet.did || did === blocklet.appId) {
        return {
          meta: { did: blocklet.did, name: 'test', title: 'test', description: 'test' },
          appDid: blocklet.appId,
          appPid: blocklet.did,
          environments: [{ key: 'BLOCKLET_APP_SK', value: blocklet.appSk }],
          env: {},
        };
      }

      if (did === account2.address) {
        return {};
      }

      if (did === blocklet3.appId) {
        return {
          meta: { did: blocklet3.did, name: 'test', title: 'test', description: 'test' },
          appDid: blocklet3.appId,
          appPid: blocklet3.appPid,
          environments: [
            { key: 'BLOCKLET_APP_SK', value: blocklet3.appSk },
            { key: 'BLOCKLET_APP_PSK', value: blocklet3.appPsk },
          ],
          env: {},
        };
      }

      return null;
    },
    hasBlocklet: ({ did }) => {
      if ([blocklet.did, blocklet.appId, account2.address].includes(did)) {
        return true;
      }
      return false;
    },
    getRBAC: () => null,
    dataDirs: { data: './' },
  };

  const dataDir = path.join(os.tmpdir(), 'notification');
  initStates(dataDir);
  const httpRouter = express();
  httpRouter.use(bodyParser.json());
  const server = http.createServer(httpRouter);
  const wsRouter = {
    // eslint-disable-next-line no-shadow
    use(path, handler) {
      if (path.startsWith(WELLKNOWN_SERVICE_PATH_PREFIX)) {
        server.on('upgrade', handler);
      }
    },
  };

  let serverPort = null;

  const sendToRelay = async ({ data, channel = getRelayChannel(), event = 'message', sender = null, options = {} }) => {
    try {
      // Generate accessKeyWallet for JWT signing
      const nodeInfo = node.getNodeInfo();
      const accessKeyWallet = getApplicationWallet(blocklet.appId, nodeInfo.sk, undefined, 2);
      const { data: res } = await axios.post(
        `http://127.0.0.1:${serverPort}${WELLKNOWN_SERVICE_PATH_PREFIX}/relay/api/send-to-relay-channel`,
        {
          apiVersion: '1.0.0',
          data: {
            sender: sender || {
              token: await JWT.sign(accessKeyWallet.address, accessKeyWallet.secretKey),
              appDid: blocklet.appId,
            },
            channel,
            event,
            data,
            options,
          },
        }
      );
      await sleep(1000);

      return res;
    } catch (error) {
      throw new Error(error.response ? error.response.statusText : error.message);
    }
  };

  const createClient = () => {
    const client = new WsClient(`ws://localhost:${serverPort}${WELLKNOWN_SERVICE_PATH_PREFIX}/relay`);
    client.connect();
    return client;
  };

  const relayService = init({ node });
  relayService.sendToRelay.attach(httpRouter);
  relayService.attach(wsRouter);

  beforeAll(async () => {
    mock.restore();
    mock.clearAllMocks();

    process.env = { ...OLD_ENV };

    serverPort = await detectPort();
    server.listen(serverPort);
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((r) => setTimeout(r, 400));
  });

  afterAll(() => {
    process.env = OLD_ENV;
    fs.removeSync(dataDir);
  });

  test('send to relay channel', (done) => {
    (() => {
      const client = createClient();
      const channel = client.channel(getRelayChannel(), {});

      channel.on('message', ({ response }) => {
        if (response.title === 'done') {
          client.disconnect(() => {
            done();
          });
        } else {
          expect(['message1', 'message3'].includes(response.title)).toBeTruthy();
        }
      });

      channel.on('another-event', ({ response }) => {
        expect(response.title).toBe('message2');
      });

      channel.join().receive('ok', async () => {
        expect(sendToRelay({ data: { title: 'a' }, channel: blocklet.appId })).rejects.toThrow(
          'Cannot send message to non-relay channel'
        );
        expect(sendToRelay({ data: { title: 'a' }, channel: getRelayChannel(account.address) })).rejects.toThrow(
          'Cannot sent message to relay channel of other app'
        );

        await sendToRelay({ data: { title: 'message1' } });
        await sleep();

        await sendToRelay({ data: { title: 'message2' }, event: 'another-event' });
        await sleep();

        await sendToRelay({ data: { title: 'message3' } });
        await sleep();

        await sendToRelay({ data: { title: 'done' } });
      });
    })();
  });

  test('send to relay channel for migrated application', async () => {
    const walletSubChannel = getRelayChannel(blocklet3.appPid);
    const appPubChannel = getRelayChannel(blocklet3.appId);

    // Generate accessKeyWallet for JWT signing
    const nodeInfo = node.getNodeInfo();
    const accessKeyWallet = getApplicationWallet(blocklet3.appId, nodeInfo.sk, undefined, 2);
    const appSender = {
      token: await JWT.sign(accessKeyWallet.address, accessKeyWallet.secretKey),
      appDid: blocklet3.appId,
    };

    return new Promise((resolve, reject) => {
      const client = createClient();
      const channel = client.channel(walletSubChannel, {});

      channel.on('message', ({ response }) => {
        try {
          if (response.title === 'done') {
            client.disconnect(() => {
              resolve();
            });
          } else {
            expect(['message1', 'message3'].includes(response.title)).toBeTruthy();
          }
        } catch (error) {
          reject(error);
        }
      });

      channel.on('another-event', ({ response }) => {
        try {
          expect(response.title).toBe('message2');
        } catch (error) {
          reject(error);
        }
      });

      channel.join().receive('ok', async () => {
        try {
          expect(sendToRelay({ data: { title: 'a' }, channel: blocklet.appId })).rejects.toThrow(
            'Cannot send message to non-relay channel'
          );
          expect(sendToRelay({ data: { title: 'a' }, channel: getRelayChannel(account.address) })).rejects.toThrow(
            'Cannot sent message to relay channel of other app'
          );

          await sendToRelay({ data: { title: 'message1' }, channel: appPubChannel, sender: appSender });
          await sleep();

          await sendToRelay({
            data: { title: 'message2' },
            channel: appPubChannel,
            sender: appSender,
            event: 'another-event',
          });
          await sleep();

          await sendToRelay({ data: { title: 'message3' }, channel: appPubChannel, sender: appSender });
          await sleep();

          await sendToRelay({ data: { title: 'done' }, channel: appPubChannel, sender: appSender });
        } catch (error) {
          reject(error);
        }
      });
    });
  });
});
