const { test, expect, describe, beforeAll, afterAll, mock } = require('bun:test');
const http = require('http');
const { minimatch } = require('minimatch');
const bodyParser = require('body-parser');
const { default: axios } = require('axios');
const { WsClient } = require('@arcblock/ws');
const JWT = require('@arcblock/jwt');
const getPort = require('get-port');
const { fromRandom } = require('@ocap/wallet');
const { types } = require('@ocap/mcrypto');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const normalizePathPrefix = require('@abtnode/util/lib/normalize-path-prefix');

const express = require('express');
// const request = require('supertest');
const createRelayServer = require('../../../api/ws/relay');

const wallet = fromRandom({
  role: types.RoleType.ROLE_APPLICATION,
  pk: types.KeyType.ED25519,
  hash: types.HashType.SHA3,
});

const getRelayChannel = (appId = wallet.address) => `relay:${appId}:topic`;
const sleep = t =>
  new Promise(r => {
    setTimeout(r, t || 400);
  });

describe('socket relay', () => {
  const OLD_ENV = process.env;

  let node;
  let app;
  let server;

  let serverPort = null;

  const sendToRelay = async ({ data, channel = getRelayChannel(), event = 'message', sender = null, options = {} }) => {
    try {
      const { data: res } = await axios.post(
        `http://127.0.0.1:${serverPort}${WELLKNOWN_SERVICE_PATH_PREFIX}/relay/api/send-to-relay-channel`,
        {
          apiVersion: '1.0.0',
          data: {
            sender: sender || {
              token: await JWT.sign(wallet.address, wallet.secretKey),
              appDid: wallet.address,
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
    const client = new WsClient(`ws://127.0.0.1:${serverPort}${WELLKNOWN_SERVICE_PATH_PREFIX}/relay`);
    client.connect();
    return client;
  };

  beforeAll(async () => {
    mock.restore();
    process.env = { ...OLD_ENV };

    node = {
      dataDirs: { data: '/tmp' },
      getSessionSecret: () => '1234567890',
      getNodeInfo: () => ({
        did: wallet.address,
        pk: wallet.publicKey,
        sk: wallet.secretKey,
        name: 'test',
        description: 'test',
      }),
    };

    app = express();
    app.use(bodyParser.json({ limit: '4mb' }));

    // A simple websocket router
    const wsRoutingRules = [];
    const wsRouter = {
      use(mountPoint, handler) {
        wsRoutingRules.push({ path: mountPoint, handle: handler });
      },
    };

    server = http.createServer(app);
    server.on('upgrade', (req, socket, head) => {
      const { pathname } = new URL(req.url, `http://${req.headers.host || 'unknown'}`);
      const routes = wsRoutingRules.filter(x => minimatch(normalizePathPrefix(pathname), normalizePathPrefix(x.path)));
      let routeIndex = 0;
      const next = () => {
        const route = routes[routeIndex];
        if (route) {
          routeIndex++;
          route.handle(req, socket, head, next);
        }
      };
      next();
    });

    const relayServer = createRelayServer({ node });

    relayServer.attachWs(wsRouter);
    relayServer.attachHttp(app);

    serverPort = await getPort();
    server.listen(serverPort);
  });

  test(
    'send to relay channel',
    done => {
      (() => {
        const client = createClient();
        const channel = client.channel(getRelayChannel(), {});

        // eslint-disable-next-line require-await
        channel.on('message', async ({ response }) => {
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
          expect(sendToRelay({ data: { title: 'a' }, channel: wallet.address })).rejects.toThrow(
            'Cannot send message to non-relay channel'
          );

          const fake = fromRandom();
          expect(sendToRelay({ data: { title: 'a' }, channel: getRelayChannel(fake.address) })).rejects.toThrow(
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
    },
    1000 * 100
  );

  afterAll(() => {
    process.env = OLD_ENV;
    server.close();
  });
});
