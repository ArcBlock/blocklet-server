const get = require('lodash/get');
const { WsServer } = require('@arcblock/ws');
const { WELLKNOWN_SERVICE_PATH_PREFIX, ROLES, EVENTS } = require('@abtnode/constant');
const { createStreamLogManager, getLogFiles } = require('@abtnode/core/lib/util/log');
const { BlockletEvents, TeamEvents } = require('@blocklet/constant');
const eventHub =
  process.env.NODE_ENV === 'test'
    ? require('@arcblock/event-hub/single').default
    : require('@arcblock/event-hub').default;

const logger = require('../../libs/logger')('ws');
const { getTokenFromWsConnect } = require('../auth');

function commonListen(wsServer, node) {
  const streamLogManager = createStreamLogManager({
    onGetLogFiles: (name) => getLogFiles({ name, node }),
    onLog: ({ topic, level, logFiles, data }) => {
      const arr = topic.split('-');
      const blockletDid = arr[arr.length - 1]?.split('/')[0];
      const blockletTopic = `${blockletDid}/${topic}`;

      wsServer.broadcast(
        blockletTopic,
        blockletTopic,
        { level, logFiles, data },
        { enableLog: false, noCluster: true }
      );
    },
  });

  const onChannelEvent = (eventName, { socket, topic: blockletTopic }) => {
    const [, ...tmpTopic] = blockletTopic.split('/');
    const topic = tmpTopic.join('/');
    const [type, ...names] = topic.split('.');
    if (type === 'log') {
      const name = names.join('.');
      if (eventName === 'channel.join') {
        streamLogManager.add(name, topic, (level, data, logFiles) => {
          wsServer.send(socket, blockletTopic, blockletTopic, { level, data, logFiles }, { enableLog: false });
        });
      }

      if (eventName === 'channel.destroy') {
        streamLogManager.destroy(name);
      }
    }
  };

  ['channel.join', 'channel.leave', 'channel.destroy'].forEach((name) => {
    wsServer.on(name, (payload) => onChannelEvent(name, payload));
  });
  return streamLogManager;
}

function createWebsocketAuthenticator(ensureWsUser, roles, options) {
  return async (req, cb) => {
    const token = getTokenFromWsConnect(req, options);
    if (!token) {
      cb(new Error('token not found'), null);
      return;
    }

    await ensureWsUser(req);

    if (!req.user) {
      cb(new Error('user not found'), null);
      return;
    }

    if (roles.length && !roles.includes(req.user.role)) {
      cb(new Error('user does not have permission'), null);
      return;
    }

    const teamDid = req.getBlockletDid();

    cb(null, { did: req.user.did, teamDid });
  };
}

function createWebsocketServer(node, ensureWsUser, options) {
  const wsServer = new WsServer({
    broadcastEventName: '@abtnode/blocklet-services:dashboard',
    heartbeatTimeout: 60 * 1000 * 10,

    logger,

    authenticate: createWebsocketAuthenticator(ensureWsUser, [ROLES.OWNER, ROLES.ADMIN], options),

    hooks: {
      authenticateJoinChannel: ({ topic: channel, socket }) => {
        const [blockletDid] = channel.split('/');
        if (get(socket, 'authInfo.teamDid') !== blockletDid) {
          throw new Error("You cannot join other blocklet's channel");
        }
      },

      receiveMessage: ({ socket, topic, event, payload }) => {
        wsServer.emit(`${topic}/${event}`, { socket, topic, event, payload });
      },
    },
  });

  // blocklet events
  Object.values(BlockletEvents).forEach((name) => {
    eventHub.on(name, (data) => {
      // 注意，此处的 did 指的是 appPid
      const did = get(data, 'meta.did');
      const eventName = `${did}/${name}`;
      wsServer.broadcast(eventName, eventName, data, { noCluster: true });
    });
  });

  // team events
  [TeamEvents.userAdded, TeamEvents.userUpdated, TeamEvents.userRemoved].forEach((name) => {
    eventHub.on(name, (data) => {
      const did = get(data, 'teamDid');
      const eventName = `${did}/${name}`;
      wsServer.broadcast(eventName, eventName, data, { noCluster: true });
    });
  });

  eventHub.on(EVENTS.NOTIFICATION_CREATE, (data) => {
    if (data?.entityType === 'blocklet' && data.entityId) {
      const did = data.entityId;
      const eventName = `${did}/${EVENTS.NOTIFICATION_CREATE}`;
      wsServer.broadcast(eventName, eventName, data, { noCluster: true });
    }
  });

  eventHub.on(EVENTS.WEBHOOK_ATTEMPT, (data) => {
    if (data.teamDid) {
      const did = data.teamDid;
      const eventName = `${did}/${EVENTS.WEBHOOK_ATTEMPT}`;
      wsServer.broadcast(eventName, eventName, data, { noCluster: true });
    }
  });

  eventHub.on(EVENTS.NOTIFICATION_BLOCKLET_UPDATE, (data) => {
    const did = data.teamDid;
    const eventName = `${did}/${EVENTS.NOTIFICATION_BLOCKLET_UPDATE}`;
    wsServer.broadcast(eventName, eventName, data, { noCluster: true });
  });

  eventHub.on(EVENTS.NOTIFICATION_READ, (data) => {
    const did = data.teamDid;
    if (did) {
      const eventName = `${did}/${EVENTS.NOTIFICATION_READ}`;
      wsServer.broadcast(eventName, eventName, data, { noCluster: true });
    }
  });

  // 发送给 admin
  eventHub.on(EVENTS.NOTIFICATION_BLOCKLET_CREATE, (data) => {
    if (data?.entityType === 'blocklet' && data.entityId) {
      const did = data.entityId;
      const eventName = `${did}/${EVENTS.NOTIFICATION_BLOCKLET_CREATE}`;
      wsServer.broadcast(eventName, eventName, data, { noCluster: true });
    }
  });

  const streamLogManager = commonListen(wsServer, node);

  eventHub.on(BlockletEvents.removed, (data) => {
    try {
      const { did } = data.meta;
      const logName = `blocklet-${did}`;
      logger.info('destroy blocklet log stream', { name: logName });
      streamLogManager.destroy(logName);
    } catch (error) {
      logger.error('destroy blocklet log stream error', { error });
    }
  });

  return wsServer;
}

function createNotificationWebsocketServer(node, ensureWsUser, options) {
  const wsServer = new WsServer({
    broadcastEventName: '@abtnode/blocklet-services:dashboard',
    heartbeatTimeout: 60 * 1000 * 10,

    logger,

    authenticate: createWebsocketAuthenticator(ensureWsUser, [], options),

    hooks: {
      authenticateJoinChannel: async ({ topic: channel, socket }) => {
        const [blockletDid, userDid] = channel.split('/');
        if (get(socket, 'authInfo.teamDid') !== blockletDid) {
          throw new Error("You cannot join other blocklet's channel");
        }
        const did = get(socket, 'authInfo.did');
        const user = await node.getUser({
          teamDid: blockletDid,
          user: { did },
          options: { enableConnectedAccount: true },
        });
        const dids = (user?.connectedAccounts || [])?.map((item) => item.did);

        if (!dids.includes(userDid)) {
          throw new Error("You cannot join other user's channel");
        }
      },

      receiveMessage: ({ socket, topic, event, payload }) => {
        wsServer.emit(`${topic}/${event}`, { socket, topic, event, payload });
      },
    },
  });

  // 发送给用户
  eventHub.on(EVENTS.NOTIFICATION_BLOCKLET_CREATE, async (data) => {
    if (data?.entityType === 'blocklet' && data.entityId) {
      const did = data.entityId;
      const { receiver } = data.receivers[0] ?? {};
      const user = await node.getUser({
        teamDid: did,
        user: { did: receiver },
        options: { enableConnectedAccount: true },
      });
      const eventName = `${did}/${user.did}/${EVENTS.NOTIFICATION_BLOCKLET_CREATE}`;
      wsServer.broadcast(eventName, eventName, data, { noCluster: true });
    }
  });

  eventHub.on(EVENTS.NOTIFICATION_BLOCKLET_READ, async (data) => {
    const did = data.teamDid;
    const { receiver } = data;
    if (receiver && did) {
      const user = await node.getUser({
        teamDid: did,
        user: { did: receiver },
        options: { enableConnectedAccount: true },
      });
      const eventName = `${did}/${user.did}/${EVENTS.NOTIFICATION_BLOCKLET_READ}`;
      wsServer.broadcast(eventName, eventName, data, { noCluster: true });
    }
  });
  commonListen(wsServer, node);

  return wsServer;
}

const init = ({ node, ensureWsUser, options }) => {
  const dashboardWsServer = createWebsocketServer(node, ensureWsUser, options);
  const notificationWsServer = createNotificationWebsocketServer(node, ensureWsUser, options);

  return {
    attachWsServer: (wsRouter) => {
      wsRouter.use(
        `${WELLKNOWN_SERVICE_PATH_PREFIX}/admin/websocket`,
        dashboardWsServer.onConnect.bind(dashboardWsServer)
      );
      wsRouter.use(
        `${WELLKNOWN_SERVICE_PATH_PREFIX}/user/websocket`,
        notificationWsServer.onConnect.bind(notificationWsServer)
      );
    },
  };
};

module.exports = { init };
