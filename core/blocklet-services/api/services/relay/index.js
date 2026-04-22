const { WsServer } = require('@arcblock/ws');
const { CHANNEL_TYPE, parseChannel } = require('@blocklet/meta/lib/channel');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');

const logger = require('../../libs/logger')('relay');
const { sendToRelay } = require('../../socket/channel/relay');
const getHooksByChannel = require('../../socket/channel/hooks');

const authenticateJoinChannel = ({ topic: channel }) => {
  // Skip client authentication for relay
  const parsed = parseChannel(channel);
  if (parsed.type === CHANNEL_TYPE.RELAY) {
    return parsed;
  }

  throw new Error(`Can not join non-relay channel: ${channel}`);
};

const postJoinChannel = async ({ socket, topic: channel, payload, wsServer, node }) => {
  const hooks = getHooksByChannel(channel);
  await hooks.onJoin({ socket, channel, payload, wsServer, node });
};

const receiveMessage = async ({ socket, topic: channel, event, payload, wsServer, node }) => {
  const hooks = getHooksByChannel(channel);
  await hooks.onMessage({ socket, channel, event, payload, wsServer, node });
};

const init = ({ node }) => {
  const wsServer = new WsServer({
    logger,
    heartbeatTimeout: 60 * 1000 * 10,
    hooks: {
      authenticateJoinChannel: (param) => authenticateJoinChannel({ ...param, wsServer, node }),
      postJoinChannel: (param) => postJoinChannel({ ...param, wsServer, node }),
      receiveMessage: (param) => receiveMessage({ ...param, wsServer, node }),
    },
  });

  const onSendToRelay = async (req, res) => {
    try {
      await sendToRelay({ ...req.body.data, node, wsServer });
      res.status(200).send('');
    } catch (error) {
      logger.error('Send message to relay channel failed', { error });
      res.statusMessage = error.message;
      res.status(400).send(error.message);
    }
  };

  // mount
  return {
    sendToRelay: {
      attach: (app) => {
        app.post(`${WELLKNOWN_SERVICE_PATH_PREFIX}/relay/api/send-to-relay-channel`, onSendToRelay);
      },
      exec: (data) => sendToRelay({ ...data, node, wsServer }),
    },

    attach: (wsRouter) => {
      wsRouter.use(`${WELLKNOWN_SERVICE_PATH_PREFIX}/relay/websocket`, wsServer.onConnect.bind(wsServer));
    },
  };
};

module.exports = { init };
