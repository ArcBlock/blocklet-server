const { WsServer } = require('@arcblock/ws');

const { BlockletEvents, BlockletInternalEvents } = require('@blocklet/constant');
const { EVENTS: ServerEvents } = require('@abtnode/constant');
const { createStreamLogManager, getLogFiles } = require('@abtnode/core/lib/util/log');
const getNodeWallet = require('@abtnode/util/lib/get-app-wallet');

const eventHub =
  process.env.NODE_ENV === 'test'
    ? require('@arcblock/event-hub/single').default
    : require('@arcblock/event-hub').default;

// eslint-disable-next-line global-require
const logger = require('@abtnode/logger')(`${require('../../package.json').name}:ws`);

const { authWithJwt } = require('../libs/login');

logger.debug = () => null;

module.exports = function createWebsocketServer({ node }) {
  const wsServer = new WsServer({
    logger,
    heartbeatTimeout: 60 * 1000 * 10,
    authenticate: (req, cb) => {
      const { searchParams } = new URL(req.url, `http://${req.headers.host || 'unknown'}`);
      const token = searchParams.get('token');
      const timestamp = searchParams.get('timestamp');
      if (!token) {
        cb(new Error('token not found'), null);
        return;
      }

      // Authentication CLI: who knows the SK of the node
      if (token && timestamp) {
        node.getNodeInfo().then(async info => {
          const wallet = getNodeWallet(info.sk);
          if (await wallet.verify(timestamp, token)) {
            cb(null, { did: info.did });
          } else {
            cb(new Error('Signature is invalid'), null);
          }
        });
      } else {
        // Authentication web users
        authWithJwt(token, node)
          .then(user => {
            cb(null, { did: user.did });
          })
          .catch(() => {
            cb(new Error('token parse fail'), null);
          });
      }
    },
    hooks: {
      receiveMessage: ({ socket, topic, event, payload }) => {
        wsServer.emit(`${topic}/${event}`, { socket, topic, event, payload });
        logger.info('client pushed socket message', { topic, event });
      },
    },
  });

  // Publish CLI generated events to web dashboard clients
  const onCLIEvent = ({ event, payload }) => {
    if (event) {
      logger.info('received event from cli', { event });

      if (Object.values(BlockletEvents).includes(event) && typeof node.handleBlockletEvent === 'function') {
        node.handleBlockletEvent(event, payload);
        return;
      }

      if (
        [ServerEvents.NODE_STARTED, ServerEvents.NODE_STOPPED].includes(event) &&
        typeof node.handleServerEvent === 'function'
      ) {
        node.handleServerEvent(event, payload);
        return;
      }

      if (Object.values(BlockletInternalEvents).includes(event)) {
        eventHub.broadcast(event, payload);
        return;
      }

      wsServer.broadcast(event, payload);
    }
  };
  wsServer.on(`cli/${BlockletEvents.installed}`, onCLIEvent);
  wsServer.on(`cli/${BlockletEvents.upgraded}`, onCLIEvent);
  wsServer.on(`cli/${BlockletEvents.statusChange}`, onCLIEvent);
  wsServer.on(`cli/${BlockletEvents.started}`, onCLIEvent);
  wsServer.on(`cli/${BlockletEvents.removed}`, onCLIEvent);
  wsServer.on(`cli/${BlockletEvents.updated}`, onCLIEvent);
  wsServer.on(`cli/${ServerEvents.ROUTING_UPDATED}`, onCLIEvent);
  wsServer.on(`cli/${ServerEvents.NODE_STOPPED}`, onCLIEvent);
  wsServer.on(`cli/${ServerEvents.NODE_STARTED}`, onCLIEvent);
  wsServer.on(`cli/${BlockletInternalEvents.componentInstalled}`, onCLIEvent);
  wsServer.on(`cli/${BlockletInternalEvents.componentStarted}`, onCLIEvent);

  const streamLogManager = createStreamLogManager({
    onGetLogFiles: name => getLogFiles({ name, node }),
    onLog: ({ topic, level, logFiles, data }) => {
      wsServer.broadcast(topic, topic, { level, logFiles, data }, { enableLog: false });
    },
  });

  const onChannelEvent = (eventName, { socket, topic }) => {
    const [type, ...names] = topic.split('.');
    if (type === 'log') {
      const name = names.join('.');
      if (eventName === 'channel.join') {
        streamLogManager.add(name, topic, (level, data, logFiles) => {
          wsServer.send(socket, topic, topic, { level, data, logFiles }, { enableLog: false });
        });
      }

      if (eventName === 'channel.destroy') {
        streamLogManager.destroy(name);
      }
    }

    if (topic === ServerEvents.NODE_RUNTIME_INFO) {
      if (eventName === 'channel.join') {
        const info = node.getNodeRuntimeInfo();
        wsServer.send(socket, topic, topic, info, { enableLog: false });
      }
    }
  };

  ['channel.join', 'channel.leave', 'channel.destroy'].forEach(name => {
    wsServer.on(name, payload => onChannelEvent(name, payload));
  });

  node.setEventHandler(({ name, data }) => {
    if (name === BlockletEvents.removed) {
      // remove blocklet log stream
      try {
        const { did } = data.meta;
        const logName = `blocklet-${did}`;
        logger.info('destroy blocklet log stream', { name: logName });
        streamLogManager.destroy(logName);
      } catch (error) {
        logger.error('destroy blocklet log stream error', { error });
      }
    }

    if (name) {
      wsServer.broadcast(name, data);
    }
  });

  return {
    attachWs: router => {
      router.use('/websocket', wsServer.onConnect.bind(wsServer));
    },
  };
};
