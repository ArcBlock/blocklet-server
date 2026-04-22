/* eslint-disable arrow-parens */
const JWT = require('@arcblock/jwt');
const Cron = require('@abtnode/cron');
const { WsServer } = require('@arcblock/ws');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');

const states = require('../../state');
const logger = require('../../libs/logger')('notification');
const { sendToAppChannel } = require('../../socket/channel/app');
const { sendToAppComponents } = require('../../socket/channel/component');
const { sendToEventBus } = require('../../socket/channel/eventbus');
const { sendToUserDid, sendToAppDid, sendToMail, sendToPush, sendToWebhook } = require('../../socket/channel/did');
const getHooksByChannel = require('../../socket/channel/hooks');
const { getTokenInfo } = require('../../socket/util');

const authenticateConnect = (req, cb) => {
  const { searchParams } = new URL(req.url, `http://${req.headers.host || 'unknown'}`);

  const token = searchParams.get('token');
  const pk = searchParams.get('pk');

  if (!token) {
    cb(new Error('token not found'), null);
    return;
  }

  JWT.verify(token, pk)
    .then(() => {
      const decoded = JWT.decode(token);
      const info = getTokenInfo(decoded);
      cb(null, info);
    })
    .catch((err) => {
      cb(err, null);
    });
};

const authenticateJoinChannel = async ({ topic: channel, payload, node }) => {
  const decoded = JWT.decode(payload.token);
  const info = getTokenInfo(decoded);

  // Support the web wallet to continue to run for one day
  //
  // if abtnode is restarted when there is a wallet wallet connection
  // then the web wallet will auto reconnect to the abtnode and auto rejoin the channels
  // the web wallet will reuse the JWT token when rejoin channel
  // so we need to support token is valid for one day
  const tolerance = 3600 * 24;

  if (!(await JWT.verify(payload.token, payload.pk, { tolerance }))) {
    logger.error('verify did failed', { info, payload, now: Date.now(), decode: JWT.decode(payload.token) });
    throw new Error(`verify did failed: ${info.did}`);
  }

  const hooks = getHooksByChannel(channel);
  await hooks.onAuthenticate({ channel, did: info.did, payload, node });

  return info;
};

const postJoinChannel = async ({ socket, topic: channel, payload, wsServer, node }) => {
  logger.info('Subscribe notification success', { channel });

  const hooks = getHooksByChannel(channel);
  await hooks.onJoin({ socket, channel, payload, wsServer, node });
};

/**
 * Receive message from channel
 * @param {{
 *   wsServer: WsServer
 *   node: ABTNode
 *   topic: String
 *   event: String
 *   payload: Object
 * }}
 * @returns
 */
const receiveMessage = async ({ socket, topic: channel, event, payload, wsServer, node }) => {
  const hooks = getHooksByChannel(channel);
  await hooks.onMessage({ socket, channel, event, payload, wsServer, node });
};

const init = ({ node }) => {
  // Create ws server
  const wsServer = new WsServer({
    logger,
    authenticate: authenticateConnect,
    hooks: {
      authenticateJoinChannel: (param) => authenticateJoinChannel({ ...param, wsServer, node }),
      postJoinChannel: (param) => postJoinChannel({ ...param, wsServer, node }),
      receiveMessage: (param) => receiveMessage({ ...param, wsServer, node }),
    },
    skipLogOnHookError: true,
    heartbeatTimeout: 60 * 1000 * 10,
  });

  // 清除离线的消息
  Cron.init({
    jobs: [
      {
        name: 'prune messages',
        time: '0 0 0 * * 1', // every Monday per week
        fn: () => states.message.prune(),
      },
      {
        name: 'message-data-cleanup',
        //   time: '0 0 8 * * *', // check every day
        time: '0 0 * * * *', // check every hour
        // time: '*/5 * * * * *', // check every 5 seconds
        fn: () => states.message.pruneExpiredData(),
        options: { runOnInit: false },
      },
    ],
    onError: (error, name) => {
      logger.error('Run job failed', { name, error });
    },
  });

  const wrapSendHandler = (fn, channel) => {
    return async (req, res) => {
      try {
        const results = await fn({ ...req.body.data, node, wsServer });
        if (results) {
          res.status(200).json(results);
        } else {
          res.status(200).send('');
        }
      } catch (error) {
        logger.error(`Send message through ${channel} failed`, { error });
        res.statusMessage = error.message;
        res.status(400).send(error.message);
      }
    };
  };

  const onSendToUser = wrapSendHandler(sendToUserDid, 'user');
  const onSendToMail = wrapSendHandler(sendToMail, 'mail');
  const onSendToPush = wrapSendHandler(sendToPush, 'push');
  const onSendToWebhook = wrapSendHandler(sendToWebhook, 'webhook');
  const onSendToWallet = wrapSendHandler(sendToAppDid, 'wallet');
  const onSendToAppChannel = wrapSendHandler(sendToAppChannel, 'app');
  const onSendToEventBus = wrapSendHandler(sendToEventBus, 'eventbus');

  // mount
  return {
    sendToUser: {
      attach: (app) => {
        app.post(`${WELLKNOWN_SERVICE_PATH_PREFIX}/api/send-to-user`, onSendToUser);
      },
      exec: (data) => sendToUserDid({ ...data, node, wsServer }),
    },

    sendToMail: {
      attach: (app) => {
        app.post(`${WELLKNOWN_SERVICE_PATH_PREFIX}/api/send-to-mail`, onSendToMail);
      },
      exec: (data) => sendToMail({ ...data, node, wsServer }),
    },

    sendToPush: {
      attach: (app) => {
        app.post(`${WELLKNOWN_SERVICE_PATH_PREFIX}/api/send-to-push-kit`, onSendToPush);
      },
      exec: (data) => sendToPush({ ...data, node, wsServer }),
    },

    sendToWebhook: {
      attach: (app) => {
        app.post(`${WELLKNOWN_SERVICE_PATH_PREFIX}/api/send-to-webhook`, onSendToWebhook);
      },
      exec: (data) => sendToWebhook({ ...data, node, wsServer }),
    },

    sendToApp: {
      attach: (app) => {
        app.post(`${WELLKNOWN_SERVICE_PATH_PREFIX}/api/send-to-wallet`, onSendToWallet);
      },
      exec: ({ event, appDid, data, sender, notification, receiver, ...rest }) =>
        sendToAppDid({ event, sender, appDid, data, node, wsServer, notification, receiver, ...rest }),
    },

    sendToAppComponents: {
      exec: ({ event, appDid, componentDid, data }) =>
        sendToAppComponents({ event, appDid, componentDid, data, node, wsServer }),
    },

    sendToAppChannel: {
      attach: (app) => {
        app.post(`${WELLKNOWN_SERVICE_PATH_PREFIX}/api/send-to-app-channel`, onSendToAppChannel);
      },
      exec: (data) => sendToAppChannel({ ...data, node, wsServer }),
    },

    sendToEventBus: {
      attach: (app) => {
        app.post(`${WELLKNOWN_SERVICE_PATH_PREFIX}/api/send-to-event-bus`, onSendToEventBus);
      },
      exec: (data) => sendToEventBus({ ...data, node, wsServer }),
    },

    attach: (wsRouter) => {
      wsRouter.use(`${WELLKNOWN_SERVICE_PATH_PREFIX}/websocket`, wsServer.onConnect.bind(wsServer));
    },
  };
};

module.exports = { init };
