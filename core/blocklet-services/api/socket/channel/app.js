const get = require('lodash/get');

const { CHANNEL_TYPE, parseChannel, getAppPublicChannel } = require('@blocklet/meta/lib/channel');
const { validateNotification } = require('@blocklet/sdk/lib/validators/notification');
const { NODE_MODES } = require('@abtnode/constant');

const { ensureSenderApp, parseNotification, broadcast, EVENTS } = require('../util');

/**
 *
 * @param {ABTNode} node
 * @param {{
 *   {{
 *     {String} did
 *     {String} token
 *   }} sender
 *   {String} channel
 *   {String} event
 *   {Array|Object} notification
 * }} payload
 * @param {WsServer} wsServer
 * @returns
 */
const sendToAppChannel = async ({
  sender,
  channel,
  event = EVENTS.MESSAGE,
  notification,
  options,
  node,
  wsServer,
} = {}) => {
  const { socketId, socketDid } = options || {};

  const channelInfo = parseChannel(channel);

  if (channelInfo.type !== CHANNEL_TYPE.APP) {
    throw new Error('Cannot send message to non-app channel');
  }

  const nodeInfo = await node.getNodeInfo();

  // get socket match
  const socketFilters = {};
  if (socketId) {
    socketFilters.id = socketId;
  }

  // validate

  if (nodeInfo.mode !== NODE_MODES.DEBUG) {
    await validateNotification(notification);
  }

  // parse sender

  const appInfo = await ensureSenderApp({ sender, node, nodeInfo });

  if (![appInfo.wallet.address, appInfo.permanentWallet.address].includes(channelInfo.appDid)) {
    throw new Error('Cannot sent message to channel of other app');
  }

  // parse notification

  const notifications = parseNotification(notification, appInfo);

  const actualChannel = getAppPublicChannel(appInfo.permanentWallet.address);

  if (socketDid) {
    socketFilters[`channel.${actualChannel}.authInfo.did`] = socketDid;
  }

  // send notification
  notifications.forEach((data) => {
    broadcast(wsServer, actualChannel, event, data, { socketFilters });
  });
};

const onAuthenticate = ({ channel }) => {
  const { type } = parseChannel(channel);
  if (type !== CHANNEL_TYPE.APP) {
    throw new Error(`Can not join non-app channel: ${channel}`);
  }

  // Do not check app exist in server
  // Because app may be deleted from this server but still in DID Wallet
  // Even if DID Wallet joins the channel, no message will be sent to this channel
};

const onJoin = ({ socket, channel, wsServer }) => {
  const { appDid } = parseChannel(channel);

  const senderDid = get(socket, `channel.${channel}.authInfo.did`);

  if (senderDid === appDid) {
    return;
  }

  broadcast(
    wsServer,
    channel,
    'hi',
    {
      sender: {
        socketId: socket.id,
        did: senderDid,
      },
    },
    {
      socketFilters: {
        [`channel.${channel}.authInfo.did`]: appDid,
      },
    }
  );
};

const onMessage = () => {};

module.exports = { onAuthenticate, onJoin, onMessage, sendToAppChannel };
