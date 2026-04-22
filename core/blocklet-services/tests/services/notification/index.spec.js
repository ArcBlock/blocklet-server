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
const { WsClient } = require('@arcblock/ws');
const { doSchemaMigration } = require('@abtnode/models');
const bodyParser = require('body-parser');
const JWT = require('@arcblock/jwt');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { BlockletInternalEvents } = require('@blocklet/constant');
const { getDbFilePath } = require('@abtnode/core/lib/util');
const { getComponentApiKey } = require('@abtnode/util/lib/blocklet');
const { getEventBusChannel } = require('@blocklet/meta/lib/channel');
const { getApplicationWallet } = require('@blocklet/meta/lib/wallet');

const Slack = require('@abtnode/core/lib/webhook/sender/slack');
const Api = require('@abtnode/core/lib/webhook/sender/api');
const Wallet = require('@abtnode/core/lib/webhook/sender/wallet');

const SenderMap = new Map([
  [Slack.type, Slack],
  [Api.type, Api],
]);

const getSender = (name) => {
  if (name === Wallet.type) {
    return Wallet;
  }

  if (!SenderMap.has(name)) {
    return null;
  }

  return SenderMap.get(name);
};

const states = require('../../../api/state');
const { init } = require('../../../api/services/notification');

const DEFAULT_WEBHOOK_SLACK_URL = 'https://webhook.site/81535232-441a-4e80-8600-129850112500';
const DEFAULT_WEBHOOK_API_URL = 'https://api.webhook.site/81535232-441a-4e80-8600-129850112500';
const DEFAULT_PASSWORD = '123456';

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

const mockDid = 'zNKmUZWxEnDviFL6wgUQXCT8pe5KUQR1kqgY';

const blocklet = {
  did: 'z8iZjySpAu4jzbMochL9k1okuji1GcS7RRRDM',
  appId: 'zNKb2kbCvDHo9APDhD1trbAV1EVoYF6PcSJ3',
  appSk:
    '0xd6a7260750eca3420310e26cfb3021c1cd5f22e1acef2c75267913ff132e0778e2a689d16eb6b99d3deb887638138790ad76d5b6b31e6a583c66915cd5d05b4d',
};

const blocklet2 = {
  did: 'zNKZVW82UBwJnsLnL7vLsbQoAWnQdfVc28dw',
  appPid: 'zNKZVW82UBwJnsLnL7vLsbQoAWnQdfVc28dw',
  appPsk:
    '0x2d1bc796be7d5c255b49d77ba5f3b6a4730cfeda6384baef6d7010b99cfa8c929e5a38388d815720e336684a7d99b121140eeff08d7e6753c149bf38590c2c1d',
  appId: 'zNKh7g6EpafzWBsELrze2cU8vqeE84ovaYim',
  appSk:
    '0xa64095e176b30bc8195c581da493b4c3efa6aece3b720f7bc126b56accf7118915182a7ef640bf1cd03df1b5a6347b89a3658602b0ea184b89f56cbac2385ff7',
};

const blocklet3 = {
  did: 'z2qaJ8mhcuR3kxwS6mNgXdegofKkpo5EGGJmr',
  appId: 'z2qaJ8mhcuR3kxwS6mNgXdegofKkpo5EGGJmr',
  appSk:
    '0xe39053aa904b33d528c6a07ac2c0678eb45f06b6656620a1ec6834829ea0cdfbfe90a0379f10b8f3483af6d91689a3c369410bb04cd710877a3edb7767b44025',
  appPid: 'zNKWqFE2eANXqyBrxtAP3EVGUUmn6LvpTrAj',
  appPSk:
    '0x874efea7e582daffc2ee1577474888efb1e0b206bbfb7a3b3e2b5f2d04fa1e9b527ea822e6b5578a6a036941ed84ea822a9ee81a4fba04c2887ae22a55b9a1d5',
};

const component1 = {
  did: 'z2qZxvDvj2ejT9B8Ret8SLuPVhZvHnZfLTZb3',
};
const component2 = {
  did: 'z2qaL3cww3KNj9Dn1gTFT25VVwCVsJvwcpSq7',
};
const component3 = {
  did: 'z2qaL3cww3KNj9Dn1gTFT25VVwCVsJvwcpSq7',
};

const serverInfo = {
  sk: '0x338003c9b11cd9cb49a8c68db3ddeb860b394ab8d926d94cd917c14c1b9a805b6d4cba304e7f957facb2bfa11132a6688c233d75fa710f8bde469be6cbba5a81',
  pk: '0x6d4cba304e7f957facb2bfa11132a6688c233d75fa710f8bde469be6cbba5a81',
  did: 'zNKZRWaYaMZGgeBVyNU4AjSh2821e9qv5j8U',
};

// Create access key wallets for blocklets (index=1 matches server-side accessKeyWallet)
// Note: Must use appId (not did) to match server-side verification in getApplicationInfo
const blockletAccessKeyWallet = getApplicationWallet(blocklet.appId, serverInfo.sk, undefined, 2);
const blocklet2AccessKeyWallet = getApplicationWallet(blocklet2.appId, serverInfo.sk, undefined, 2);
const blocklet3AccessKeyWallet = getApplicationWallet(blocklet3.appId, serverInfo.sk, undefined, 2);

// Map blocklet appId to access key wallet for easy lookup
const blockletToAccessKeyWalletMap = {
  [blocklet.appId]: blockletAccessKeyWallet,
  [blocklet2.appId]: blocklet2AccessKeyWallet,
  [blocklet3.appId]: blocklet3AccessKeyWallet,
};

const getAppPublicChannel = (appId = blocklet.appId) => `app:${appId}:public`;

const getComponentChannel = () => `component:${blocklet.did}:${component1.did}`;

beforeEach(() => {
  mock.clearAllMocks();
});

describe('notification', () => {
  const OLD_ENV = process.env;
  const node = {
    getUser: ({ user }) => (user.did === account.address ? { did: account.address } : null),
    ensureBlockletIntegrity: () => ({}),
    getSessionSecret: () => '1234567890',
    getNodeInfo: () => ({
      sk: serverInfo.sk,
      pk: serverInfo.pk,
      did: serverInfo.did,
    }),
    getBlocklet: ({ did }) => {
      if (did === blocklet.did || did === blocklet.appId) {
        return {
          meta: { did: blocklet.did, name: 'test', title: 'test', description: 'test' },
          appDid: blocklet.appId,
          appPid: blocklet.did,
          environments: [{ key: 'BLOCKLET_APP_SK', value: blocklet.appSk }],
          env: {},
          children: [
            {
              meta: { did: component1.did, name: 'test', title: 'test', description: 'test' },
            },
            {
              meta: {
                did: component3.did,
                name: 'test3',
                title: 'test3',
                description: 'test3',
                events: [
                  {
                    type: 'dummy.event',
                    description: 'dummy event',
                  },
                ],
              },
            },
          ],
          settings: {
            notification: {
              email: {
                enabled: true,
                from: 'test@mail.arcblockio.cn',
                host: 'smtpdm.aliyun.com',
                user: 'test@mail.arcblockio.cn',
                secure: true,
                port: '465',
                password: process.env.TEST_ALIYUN_MAIL_PASSWD || DEFAULT_PASSWORD,
              },
              pushKit: {
                endpoint: 'https://bbqaufnnsc3kq2fyvebddqkqxn6emk4ajoy4w7lohxm.did.abtnet.io',
                enabled: true,
              },
            },
          },
        };
      }

      if (did === blocklet2.did || did === blocklet2.appId) {
        return {
          meta: { did: blocklet2.did, name: 'test', title: 'test', description: 'test' },
          appDid: blocklet2.appId,
          appPid: blocklet2.did,
          environments: [
            { key: 'BLOCKLET_APP_SK', value: blocklet2.appSk },
            { key: 'BLOCKLET_APP_PSK', value: blocklet2.appPsk },
          ],
          env: {},
        };
      }

      if (did === blocklet3.did || did === blocklet3.appPid) {
        return {
          appDid: blocklet3.appId,
          appPid: blocklet3.appPid,
          meta: { did: blocklet3.appPid, name: 'test', title: 'test', description: 'test' },
          environments: [
            { key: 'BLOCKLET_APP_SK', value: blocklet3.appSk },
            { key: 'BLOCKLET_APP_PSK', value: blocklet3.appPsk },
          ],
          env: {},
          children: [
            {
              meta: { did: component1.did, name: 'test', title: 'test', description: 'test' },
            },
            {
              meta: { did: component2.did, name: 'test2', title: 'test2', description: 'test2' },
            },
          ],
        };
      }

      if (did === account2.address) {
        return {};
      }

      return null;
    },
    hasBlocklet: ({ did }) => {
      if ([blocklet.did, blocklet.appId, account2.address, blocklet2.did].includes(did)) {
        return true;
      }
      return false;
    },
    getRBAC: () => null,
    dataDirs: { data: './' },
    // eslint-disable-next-line no-unused-vars
    getUsers: ({ teamDid, dids }) => {
      const users = [account, account2].filter((i) => dids.includes(i.address));

      return { users };
    },
    getNotificationReceivers: ({ userDids }) => {
      return userDids.map((i) => ({ did: i }));
    },
    getNotificationById: ({ id }) => id,
    createNotification: () => {},
    updateNotificationStatus: () => {},
    getMessageSender: (type) => {
      const Sender = getSender(type);
      if (Sender) {
        return new Sender();
      }

      return {};
    },
    getUserSessions: () => {
      return {
        list: [],
        paging: {
          page: 1,
          pageSize: 10,
          total: 0,
        },
      };
    },
  };

  const dataDir = path.join(os.tmpdir(), 'notification', Math.random().toString());
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

  const sendToUser = async ({ receiver, notification, sender, options }) => {
    try {
      const { data: res } = await axios.post(
        `http://127.0.0.1:${serverPort}${WELLKNOWN_SERVICE_PATH_PREFIX}/api/send-to-wallet`,
        {
          apiVersion: '1.0.0',
          data: {
            sender: sender || {
              token: await JWT.sign(blockletAccessKeyWallet.address, blockletAccessKeyWallet.secretKey),
              appDid: blocklet.appId,
            },
            receiver,
            notification,
            options,
          },
        }
      );

      return res;
    } catch (error) {
      throw new Error(error.response ? error.response.statusText : error.message);
    }
  };

  const sendToMail = async ({ receiver, notification, sender, options, _blocklet = blocklet }) => {
    const accessKeyWallet = blockletToAccessKeyWalletMap[_blocklet.appId || _blocklet.did] || blockletAccessKeyWallet;

    try {
      const { data: res } = await axios.post(
        `http://127.0.0.1:${serverPort}${WELLKNOWN_SERVICE_PATH_PREFIX}/api/send-to-mail`,
        {
          apiVersion: '1.0.0',
          data: {
            sender: sender || {
              token: await JWT.sign(accessKeyWallet.address, accessKeyWallet.secretKey),
              appDid: _blocklet.appId,
            },
            receiver,
            notification,
            options,
          },
        }
      );

      return res;
    } catch (error) {
      throw new Error(error.response ? error.response.statusText : error.message);
    }
  };

  const sendToPush = async ({ receiver, notification, sender, options, _blocklet = blocklet }) => {
    const accessKeyWallet = blockletToAccessKeyWalletMap[_blocklet.appId || _blocklet.did] || blockletAccessKeyWallet;

    try {
      const { data: res } = await axios.post(
        `http://127.0.0.1:${serverPort}${WELLKNOWN_SERVICE_PATH_PREFIX}/api/send-to-push-kit`,
        {
          apiVersion: '1.0.0',
          data: {
            sender: sender || {
              token: await JWT.sign(accessKeyWallet.address, accessKeyWallet.secretKey),
              appDid: _blocklet.appId,
            },
            receiver,
            notification,
            options,
          },
        }
      );

      return res;
    } catch (error) {
      throw new Error(error.response ? error.response.statusText : error.message);
    }
  };

  const sendToWebhook = async ({ receiver, notification, sender, options, _blocklet = blocklet }) => {
    const accessKeyWallet = blockletToAccessKeyWalletMap[_blocklet.appId || _blocklet.did] || blockletAccessKeyWallet;

    try {
      const { data: res } = await axios.post(
        `http://127.0.0.1:${serverPort}${WELLKNOWN_SERVICE_PATH_PREFIX}/api/send-to-webhook`,
        {
          apiVersion: '1.0.0',
          data: {
            sender: sender || {
              token: await JWT.sign(accessKeyWallet.address, accessKeyWallet.secretKey),
              appDid: _blocklet.appId,
            },
            receiver,
            notification,
            options,
          },
        }
      );

      return res;
    } catch (error) {
      console.error('sendToWebhook error', error);
      throw new Error(error.response ? error.response.statusText : error.message);
    }
  };

  const sendToAppChannel = async ({
    channel = getAppPublicChannel(),
    event = 'message',
    notification,
    sender = null,
    options = {},
  }) => {
    try {
      const { data: res } = await axios.post(
        `http://127.0.0.1:${serverPort}${WELLKNOWN_SERVICE_PATH_PREFIX}/api/send-to-app-channel`,
        {
          apiVersion: '1.0.0',
          data: {
            sender: sender || {
              token: await JWT.sign(blockletAccessKeyWallet.address, blockletAccessKeyWallet.secretKey),
              appDid: blocklet.appId,
            },
            event,
            channel,
            notification,
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

  const sendToEventBus = async ({ event, sender = null }) => {
    try {
      const { data: res } = await axios.post(
        `http://127.0.0.1:${serverPort}${WELLKNOWN_SERVICE_PATH_PREFIX}/api/send-to-event-bus`,
        {
          apiVersion: '1.0.0',
          data: {
            sender: sender || {
              appDid: blocklet.appId,
              token: await JWT.sign(blockletAccessKeyWallet.address, blockletAccessKeyWallet.secretKey),
            },
            channel: getEventBusChannel(blocklet.appId),
            event,
          },
        }
      );
      await sleep(1000);
      return res;
    } catch (error) {
      throw new Error(error.response ? error.response.statusText : error.message);
    }
  };

  const createClient = async (
    // eslint-disable-next-line default-param-last
    _account = account,
    channelOpts,
    appChannel = getAppPublicChannel(),
    {
      componentChannel = getComponentChannel(),
      apiKey = getComponentApiKey({
        serverSk: serverInfo.sk,
        app: { meta: { did: blocklet.did } },
        component: { meta: { did: component1.did } },
      }),
    } = {}
  ) => {
    const token = await JWT.sign(_account.address, _account.sk);
    const client = new WsClient(`ws://localhost:${serverPort}${WELLKNOWN_SERVICE_PATH_PREFIX}`, {
      params: () => ({
        token,
        pk: _account.pk,
      }),
    });
    client.connect();

    client.didChannel = client.channel(_account.address, { token, pk: _account.pk, ...channelOpts });

    client.appChannel = client.channel(appChannel, { token, pk: _account.pk, ...channelOpts });

    client.componentChannel = client.channel(componentChannel, {
      token,
      pk: _account.pk,
      apiKey,
      ...channelOpts,
    });

    return client;
  };

  const notificationService = init({ node });
  notificationService.sendToUser.attach(httpRouter);
  notificationService.sendToMail.attach(httpRouter);
  notificationService.sendToApp.attach(httpRouter);
  notificationService.sendToPush.attach(httpRouter);
  notificationService.sendToWebhook.attach(httpRouter);
  notificationService.sendToAppChannel.attach(httpRouter);
  notificationService.sendToEventBus.attach(httpRouter);
  notificationService.attach(wsRouter);

  beforeAll(async () => {
    try {
      await doSchemaMigration(getDbFilePath(path.join(dataDir, 'service.db')), 'service');
      states.init(dataDir);

      process.env = { ...OLD_ENV };

      serverPort = await detectPort();
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((r) => {
        server.listen(serverPort, () => {
          console.log(`${serverPort} is started`);
          r();
        });
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  });

  afterAll(() => {
    process.env = OLD_ENV;
    if (fs.existsSync(dataDir)) {
      fs.rmSync(dataDir, { recursive: true });
    }
  });

  test('should temporary storage notification for offline client', async () => {
    await sendToUser({ receiver: account.address, notification: { title: 'title', body: 'body' } });
    await sleep(1000);

    const client = await createClient();
    client.didChannel.join();
    await new Promise((resolve) => {
      client.didChannel.on('message', ({ status, response }) => {
        if (status === 'ok') {
          expect(response.createdAt).toBeTruthy();
          expect(response.sender.did).toBe(blocklet.appId);
          expect(response.title).toBe('title');
          expect(response.body).toBe('body');
          client.disconnect(() => {
            resolve();
          });
        }
      });
    });
  });

  test('should send notification to online client', async () => {
    const actions = [
      {
        name: 'link',
        title: 'Link',
        color: '#333',
        bgColor: '#eee',
        link: 'https://arcblock.io',
      },
    ];

    const attachments = [
      {
        type: 'token',
        data: {
          address: mockDid,
          amount: '1',
          symbol: '123',
          senderDid: mockDid,
          chainHost: 'https://chain.api',
          decimal: 16,
        },
      },
    ];

    const client = await createClient();

    await new Promise((resolve) => {
      client.didChannel.join().receive('ok', async () => {
        await sendToUser({
          receiver: account.address,
          notification: {
            title: 'title2',
            body: 'body2',
            attachments,
            actions,
          },
        });
      });

      client.didChannel.on('message', ({ status, response }) => {
        if (status === 'ok') {
          expect(response.createdAt).toBeTruthy();
          expect(response.sender.did).toBe(blocklet.appId);
          expect(response.title).toBe('title2');
          expect(response.body).toBe('body2');
          expect(response.attachments).toEqual(attachments);
          expect(response.actions).toEqual(actions);
          client.disconnect(() => {
            resolve();
          });
        }
      });
    });
  });

  test('should not storage notification for offline client', async () => {
    await sendToUser({
      receiver: account.address,
      notification: { title: 'title', body: 'body' },
      options: { keepForOfflineUser: false },
    });
    await sleep(1000);

    let receiveMessage = false;

    const client = await createClient();
    client.didChannel.join();
    client.didChannel.on('message', () => {
      receiveMessage = true;
    });

    await new Promise((resolve) => {
      setTimeout(() => {
        client.disconnect(() => {
          expect(receiveMessage).toBe(false);
          resolve();
        });
      }, 2000);
    });
  });

  test('should send to user which is not in team', async () => {
    await sendToUser({ receiver: account2.address, notification: { title: 'title', body: 'body' } });
    await sleep(1000);

    const client = await createClient(account2);
    client.didChannel.join();
    await new Promise((resolve) => {
      client.didChannel.on('message', ({ status }) => {
        if (status === 'ok') {
          client.disconnect(() => {
            resolve();
          });
        }
      });
    });
  });

  test('should batch send notifications to client', async () => {
    let receiveNum = 0;
    const client = await createClient();
    client.didChannel.join();

    const client2 = await createClient(account2);
    client2.didChannel.join().receive('ok', async () => {
      await sendToUser({
        receiver: account.address,
        notification: { title: 'title', body: 'batch1' },
      });
    });

    await new Promise((resolve) => {
      client.didChannel.on('message', ({ status, response }) => {
        if (status === 'ok') {
          expect(response.body).toMatch(/^(batch1|batch2)$/);
          receiveNum++;
          if (receiveNum === 1) {
            client2.disconnect();
            client.disconnect(() => {
              resolve();
            });
          }
        }
      });

      client2.didChannel.on('message', ({ status, response }) => {
        if (status === 'ok') {
          expect(response.body).toMatch(/^(batch1|batch2)$/);
          receiveNum++;
          if (receiveNum === 1) {
            client.disconnect();
            client2.disconnect(() => {
              resolve();
            });
          }
        }
      });
    });
  });

  test('uninstalled blocklet can not send notification', () => {
    const p = sendToUser({
      receiver: account.address,
      notification: { title: 'title', body: 'body' },
      sender: { did: account.address, token: '123', appDid: '' },
    });
    expect(p).rejects.toBeTruthy();
  });

  test('should send by websocket work as expected', async () => {
    const client = await createClient(account2);
    client.didChannel.join();

    const message = {
      id: 'xxx',
      createdAt: '2022-02-02T00:00:00Z',
      receiver: {
        did: account2.address, // mock send message to self
      },
      type: 'hi',
      otherProps: 'xxx',
    };

    client.didChannel.push('message', message);

    await new Promise((resolve) => {
      client.didChannel.on('message', ({ status, response }) => {
        if (status === 'ok') {
          expect(status).toBe('ok');
          expect(response).toEqual({
            id: message.id,
            createdAt: message.createdAt,
            type: message.type,
            otherProps: message.otherProps,
            sender: { did: account2.address },
          });
          client.disconnect(() => {
            resolve();
          });
        }
      });
    });
  });

  test('should send by websocket failed if blocklet does not exist', async () => {
    const client = await createClient(account2);
    client.didChannel.join();

    const message = {
      id: 'xxx',
      createdAt: '2022-02-02T00:00:00Z',
      receiver: {
        did: account.address, // non-exist blocklet
      },
      type: 'hi',
    };

    await new Promise((resolve) => {
      client.didChannel.push('message', message).receive('error', (err) => {
        expect(err.message).toMatch('App is not installed in the server');
        client.disconnect(() => {
          resolve();
        });
      });
    });
  });

  test('should send by websocket work as expected', async () => {
    const message = {
      id: 'xxx',
      createdAt: '2022-02-02T00:00:00Z',
      receiver: {
        did: account2.address, // mock send message to self
      },
      type: 'hi',
      otherProps: 'xxx',
    };

    const client = await createClient(account2, { message });
    client.didChannel.join();

    await new Promise((resolve) => {
      client.didChannel.on('message', ({ status, response }) => {
        if (status === 'ok') {
          expect(status).toBe('ok');
          expect(response).toEqual({
            id: message.id,
            createdAt: message.createdAt,
            type: message.type,
            otherProps: message.otherProps,
            sender: { did: account2.address },
          });
          client.disconnect(() => {
            resolve();
          });
        }
      });
    });
  });

  test('should send by websocket failed if invalid message type in join payload', async () => {
    // invalid message type
    const message = {};

    const client = await createClient(account2, { message });
    await new Promise((resolve) => {
      client.didChannel.join().receive('error', (err) => {
        expect(err.message).toBeTruthy();
        client.disconnect(() => {
          resolve();
        });
      });
    });
  });

  test(
    'send to app channel',
    async () => {
      const client = await createClient();

      await new Promise((resolve) => {
        client.appChannel.on('message', ({ status, response }) => {
          if (status === 'ok') {
            expect(response.createdAt).toBeTruthy();
            expect(response.sender.did).toBe(blocklet.appId);
            expect(['done', 'socket-did'].includes(response.title)).toBeTruthy();

            if (response.title === 'done') {
              client.disconnect(() => {
                resolve();
              });
            }
          }
        });

        client.appChannel.on('another-event', ({ response }) => {
          expect(response.title).toBe('another-event');
        });

        client.appChannel.join().receive('ok', async () => {
          expect(sendToAppChannel({ channel: blocklet.appId, notification: { title: 'a' } })).rejects.toThrow(
            'Cannot send message to non-app channel'
          );

          expect(
            sendToAppChannel({ channel: `app:${account.address}:public`, notification: { title: 'a' } })
          ).rejects.toThrow('Cannot sent message to channel of other app');

          await sendToAppChannel({
            notification: { title: 'not-exist-socket-id' },
            options: {
              socketId: 'not-exist',
            },
          });
          await sleep();

          await sendToAppChannel({
            notification: { title: 'another-event' },
            event: 'another-event',
          });
          await sleep();

          await sendToAppChannel({
            notification: { title: 'not-exist-socket-id' },
            options: {
              socketId: 'not-exist',
            },
          });
          await sleep();

          await sendToAppChannel({
            notification: { title: 'socket-did' },
            options: {
              socketDid: account.address,
            },
          });
          await sleep();

          await sendToAppChannel({
            notification: { title: 'done' },
          });
        });
      });
    },
    1000 * 20
  );

  test('should send notification to online client with new block', async () => {
    const attachments = [
      {
        type: 'text',
        data: {
          type: 'any',
          text: 'hello world',
          color: 'any',
          size: 'small',
        },
      },
      {
        type: 'image',
        data: {
          url: 'https://img',
          alt: 'any',
        },
      },
      {
        type: 'transaction',
        data: {
          hash: 'any',
          chainId: 'any',
        },
      },
      {
        type: 'dapp',
        data: {
          url: 'https://a',
          appDID: mockDid,
          logo: 'https://logo',
          title: 'any',
          desc: 'any',
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'link',
        data: {
          url: 'http://link',
          title: 'any',
          description: 'any',
          image: 'http://img',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'text',
            data: {
              type: 'any',
              text: 'hello world',
            },
          },
          {
            type: 'text',
            data: {
              type: 'any',
              text: 'hello world 2',
            },
          },
        ],
      },
    ];

    const client = await createClient();

    await new Promise((resolve) => {
      client.didChannel.join().receive('ok', async () => {
        await sendToUser({
          receiver: account.address,
          notification: {
            title: 'title2',
            body: 'body2',
            severity: 'error',
            attachments,
          },
        });
      });

      client.didChannel.on('message', ({ status, response }) => {
        if (status === 'ok') {
          expect(response.createdAt).toBeTruthy();
          expect(response.sender.did).toBe(blocklet.appId);
          expect(response.title).toBe('title2');
          expect(response.body).toBe('body2');
          expect(response.severity).toBe('error');
          expect(response.attachments).toEqual(attachments);
          client.disconnect(() => {
            resolve();
          });
        }
      });
    });
  });

  test(
    'send to app channel for migrated application',
    async () => {
      const walletSubChannel = getAppPublicChannel(blocklet2.appPid);
      const appPubChannel = getAppPublicChannel(blocklet2.appId);
      const appSender = {
        token: await JWT.sign(blocklet2AccessKeyWallet.address, blocklet2AccessKeyWallet.secretKey),
        appDid: blocklet2.appId,
      };

      const client = await createClient(undefined, undefined, walletSubChannel);

      await new Promise((resolve) => {
        client.appChannel.on('message', ({ status, response }) => {
          if (status === 'ok') {
            expect(response.createdAt).toBeTruthy();
            expect(response.sender.did).toBe(blocklet2.appPid);
            expect(['done', 'socket-did'].includes(response.title)).toBeTruthy();

            if (response.title === 'done') {
              client.disconnect(() => {
                resolve();
              });
            }
          }
        });

        client.appChannel.on('another-event', ({ response }) => {
          expect(response.title).toBe('another-event');
        });

        client.appChannel.join().receive('ok', async () => {
          expect(sendToAppChannel({ channel: blocklet.appId, notification: { title: 'a' } })).rejects.toThrow(
            'Cannot send message to non-app channel'
          );

          expect(
            sendToAppChannel({ channel: `app:${account.address}:public`, notification: { title: 'a' } })
          ).rejects.toThrow('Cannot sent message to channel of other app');

          await sendToAppChannel({
            channel: appPubChannel,
            sender: appSender,
            notification: { title: 'not-exist-socket-id' },
            options: {
              socketId: 'not-exist',
            },
          });
          await sleep();

          await sendToAppChannel({
            channel: appPubChannel,
            sender: appSender,
            notification: { title: 'another-event' },
            event: 'another-event',
          });
          await sleep();

          await sendToAppChannel({
            channel: appPubChannel,
            sender: appSender,
            notification: { title: 'not-exist-socket-id' },
            options: {
              socketId: 'not-exist',
            },
          });
          await sleep();

          await sendToAppChannel({
            channel: appPubChannel,
            sender: appSender,
            notification: { title: 'socket-did' },
            options: {
              socketDid: account.address,
            },
          });
          await sleep();

          await sendToAppChannel({
            channel: appPubChannel,
            sender: appSender,
            notification: { title: 'done' },
          });
        });
      });
    },
    1000 * 20
  );

  test('should server send notification to app', async () => {
    const client = await createClient(account2);
    await sleep(1000);

    await new Promise((resolve) => {
      client.didChannel.join().receive('ok', () => {
        notificationService.sendToApp.exec({
          event: 'any internal event',
          appDid: account2.address,
          data: { a: 123 },
        });
      });

      // eslint-disable-next-line no-unused-vars
      client.didChannel.on('any internal event', async ({ status, response }) => {
        if (status === 'ok') {
          expect(response.sender.did).toBe(node.getNodeInfo().did);
          expect(await JWT.verify(response.sender.token, node.getNodeInfo().pk)).toBeTruthy();
          expect(response.data).toEqual({ a: 123 });
          client.disconnect(() => {
            resolve();
          });
        }
      });
    });
  });

  test('should server send notification to app component channel', async () => {
    const client = await createClient();
    await sleep(1000);

    await new Promise((resolve) => {
      // eslint-disable-next-line no-unused-vars
      client.componentChannel.on(BlockletInternalEvents.componentStarted, async ({ status, response } = {}) => {
        if (status === 'ok') {
          expect(response.sender.did).toBe(node.getNodeInfo().did);
          expect(await JWT.verify(response.sender.token, node.getNodeInfo().pk)).toBeTruthy();
          expect(response.data).toEqual({ components: [{ did: component1.did }] });
          expect(response.time).toEqual(expect.any(Number));
          client.disconnect(() => {
            resolve();
          });
        }
      });

      client.componentChannel.join().receive('ok', () => {
        notificationService.sendToAppComponents.exec({
          event: BlockletInternalEvents.componentStarted,
          appDid: blocklet.appId,
          data: { components: [{ did: component1.did }] },
        });
      });
    });
  });

  test('should server send notification to app component channel (component length > 1)', async () => {
    const client = await createClient(undefined, undefined, undefined, {
      componentChannel: `component:${blocklet3.appPid}:${component2.did}`,
      apiKey: getComponentApiKey({
        serverSk: serverInfo.sk,
        app: { meta: { did: blocklet3.appPid } },
        component: { meta: { did: component2.did } },
      }),
    });
    await sleep(1000);

    await new Promise((resolve) => {
      // eslint-disable-next-line no-unused-vars
      client.componentChannel.on(BlockletInternalEvents.componentStarted, async ({ status, response } = {}) => {
        if (status === 'ok') {
          expect(response.sender.did).toBe(node.getNodeInfo().did);
          expect(await JWT.verify(response.sender.token, node.getNodeInfo().pk)).toBeTruthy();
          expect(response.data).toEqual({ components: [{ did: component2.did }] });
          expect(response.time).toEqual(expect.any(Number));
          client.disconnect(() => {
            resolve();
          });
        }
      });

      client.componentChannel.join().receive('ok', () => {
        notificationService.sendToAppComponents.exec({
          event: BlockletInternalEvents.componentStarted,
          appDid: blocklet3.appId,
          componentDid: component2.did,
          data: { components: [{ did: component2.did }] },
        });
      });
    });
  });

  test('should send mail works', async () => {
    let result = await sendToMail({
      receiver: 'test@arcblock.io',
      notification: { title: 'title', body: 'body' },
      sender: undefined,
      options: {},
      _blocklet: blocklet2,
    });
    expect(result.length).toEqual(1);
    expect(result.every((x) => x.status === 'rejected' && x.reason === 'Email Service is not available.')).toBeTruthy();

    result = await sendToMail({
      receiver: ['test@arcblock.io', 'rob@arcblock.io'],
      notification: { title: 'title', body: 'body' },
    });
    expect(result.length).toEqual(2);
    expect(result.every((x) => x.status === 'fulfilled')).toBeTruthy();

    try {
      await sendToMail({ receiver: '', notification: { title: 'title', body: 'body' } });
      expect(true).toBeFalsy();
    } catch (err) {
      expect(err.message).toMatch('receiver: empty');
    }

    try {
      await sendToMail({ receiver: ['abcd'], notification: { title: 'title', body: 'body' } });
      expect(true).toBeFalsy();
    } catch (err) {
      expect(err.message).toMatch('invalid email');
    }

    try {
      await sendToMail({ receiver: 'test@arcblock.io', notification: [{ title: 'title', body: 'body' }] });
      expect(true).toBeFalsy();
    } catch (err) {
      expect(err.message).toMatch('1 message');
    }

    try {
      await sendToMail({ receiver: 'test@arcblock.io', notification: { title: '', body: 'body' } });
      expect(true).toBeFalsy();
    } catch (err) {
      expect(err.message).toMatch('title empty');
    }

    try {
      await sendToMail({ receiver: 'test@arcblock.io', notification: { title: 'title', body: '' } });
      expect(true).toBeFalsy();
    } catch (err) {
      expect(err.message).toMatch('body empty');
    }
  }, 10_000);

  test('should send push Kit works', async () => {
    try {
      await sendToPush({
        receiver: account.address,
        notification: { title: 'title', body: 'body' },
        sender: undefined,
        options: {},
        _blocklet: blocklet2,
      });
    } catch (err) {
      expect(err.message).toContain('Push Kit Service is not Enabled');
    }

    try {
      await sendToPush({
        receiver: account.address,
        notification: { title: 'title', body: 'body' },
      });
    } catch (err) {
      expect(err.message).toMatch('Invalid receiver: empty target');
    }
  }, 20_000);

  test('should send webhook works', async () => {
    try {
      await sendToWebhook({
        receiver: account.address,
        notification: { title: 'title', body: 'body' },
      });
    } catch (err) {
      expect(err.message).toMatch('Invalid webhook: empty target');
    }

    const result = await sendToWebhook({
      receiver: account.address,
      notification: {
        title: 'title',
        body: 'body',
        appInfo: {
          webhooks: [
            { url: process.env.TEST_WEBHOOK_SLACK || DEFAULT_WEBHOOK_SLACK_URL, type: 'slack' },
            { url: '', type: 'api' },
          ],
        },
      },
    });
    expect(result.length).toEqual(1);
    expect(result.every((x) => x.text.toLowerCase() === 'ok')).toBeTruthy();

    const result1 = await sendToWebhook({
      receiver: account.address,
      notification: {
        title: 'title',
        body: 'body',
        appInfo: {
          webhooks: [
            { url: process.env.TEST_WEBHOOK_SLACK || DEFAULT_WEBHOOK_SLACK_URL, type: 'slack' },
            { url: process.env.TEST_WEBHOOK_FEISHU || DEFAULT_WEBHOOK_API_URL, type: 'api' },
          ],
        },
      },
    });
    expect(result1.length).toEqual(2);
    expect(result1.every((x) => x.text.toLowerCase() === 'ok')).toBeTruthy();
  }, 10000);

  test('should send event bus works', async () => {
    const event = {
      id: '123',
      time: '2021-01-01T00:00:00.000Z',
      type: 'dummy.event',
      data: {},
      spec_version: '1.0.0',
    };
    // Should throw error if event is invalid
    try {
      await sendToEventBus({
        event: {
          ...event,
          source: 'invalid',
        },
      });
    } catch (err) {
      expect(err.message).toMatch('not valid');
    }

    try {
      await sendToEventBus({
        event: {
          ...event,
          source: blocklet.did,
        },
      });
    } catch (err) {
      expect(err.message).toMatch('Component not found');
    }

    try {
      await sendToEventBus({
        event: {
          ...event,
          source: component1.did,
        },
      });
    } catch (err) {
      expect(err.message).toMatch('does not support events');
    }

    try {
      await sendToEventBus({
        event: {
          ...event,
          type: 'dummy.invalid',
          source: component3.did,
        },
      });
    } catch (err) {
      expect(err.message).toMatch('not registered');
    }

    await sendToEventBus({
      event: {
        ...event,
        source: component3.did,
      },
    });
  }, 10_000);
});
