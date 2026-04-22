const { verify } = require('@arcblock/jwt');
const { WsServer } = require('@arcblock/ws');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { CHANNEL_TYPE, parseChannel, getRelayChannel } = require('@blocklet/meta/lib/channel');
const { joinURL } = require('ufo');
const { getApplicationInfo } = require('@abtnode/auth/lib/auth');

// eslint-disable-next-line global-require
const logger = require('@abtnode/logger')(`${require('../../package.json').name}:relay`);

logger.debug = () => null;

const createRelayServer = ({ node }) => {
  const wsServer = new WsServer({
    logger,
    heartbeatTimeout: 60 * 1000 * 10,
    hooks: {
      authenticateJoinChannel: ({ topic: channel }) => {
        const parsed = parseChannel(channel);
        if (parsed.type === CHANNEL_TYPE.RELAY) {
          return parsed;
        }
        throw new Error(`Can not join non-relay channel: ${channel}`);
      },
    },
  });

  const broadcast = (...args) => {
    const cb = typeof args[args.length - 1] === 'function' ? args.pop() : () => {};
    const [channel, event, data, options] = args;
    wsServer.broadcast(channel, event, data, options || {}, ({ count }) => {
      logger.info('Broadcast message to relay channel', { channel, sendCount: count });
      cb(count);
    });
  };

  const sendToRelay = async ({ sender, channel, event, data }) => {
    const channelInfo = parseChannel(channel);
    if (channelInfo.type !== CHANNEL_TYPE.RELAY) {
      throw new Error('Cannot send message to non-relay channel');
    }

    const nodeInfo = await node.getNodeInfo();
    const appInfo = await getApplicationInfo({ node, nodeInfo, teamDid: sender.appDid });
    const { wallet } = appInfo;
    if (!(await verify(sender.token, wallet.publicKey))) {
      throw new Error(`Invalid authentication token for sender: ${sender.did}`);
    }

    if (![appInfo.wallet.address, appInfo.permanentWallet.address].includes(channelInfo.appDid)) {
      throw new Error('Cannot sent message to relay channel of other app');
    }

    const actualChannel = getRelayChannel(appInfo.permanentWallet.address, channelInfo.topic);

    const socketFilters = { [`channel.${actualChannel}.authInfo.topic`]: channelInfo.topic };

    broadcast(actualChannel, event, data, { socketFilters });
  };

  return {
    attachWs: router => {
      router.use(joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/relay/websocket'), wsServer.onConnect.bind(wsServer));
    },
    attachHttp: router => {
      router.post(`${WELLKNOWN_SERVICE_PATH_PREFIX}/relay/api/send-to-relay-channel`, async (req, res) => {
        try {
          await sendToRelay(req.body.data);
          res.status(200).send('');
        } catch (error) {
          logger.error('Send message to server relay channel failed', { error });
          res.statusMessage = error.message;
          res.status(400).send(error.message);
        }
      });
    },
  };
};

module.exports = createRelayServer;
