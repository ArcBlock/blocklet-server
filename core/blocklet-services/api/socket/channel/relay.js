const { CHANNEL_TYPE, parseChannel, getRelayChannel } = require('@blocklet/meta/lib/channel');
const { ensureSenderApp, broadcast, EVENTS } = require('../util');

// Only an application can send message to a relay channel
// But multiple clients can subscribe to the same relay channel
const sendToRelay = async ({ sender, channel, event = EVENTS.MESSAGE, data, node, wsServer }) => {
  const channelInfo = parseChannel(channel);
  if (channelInfo.type !== CHANNEL_TYPE.RELAY) {
    throw new Error('Cannot send message to non-relay channel');
  }

  const nodeInfo = await node.getNodeInfo();

  // Sender is appDid of application
  const appInfo = await ensureSenderApp({ sender, node, nodeInfo });

  if (![appInfo.wallet.address, appInfo.permanentWallet.address].includes(channelInfo.appDid)) {
    throw new Error('Cannot sent message to relay channel of other app');
  }

  const actualChannel = getRelayChannel(appInfo.permanentWallet.address, channelInfo.topic);

  const socketFilters = { [`channel.${actualChannel}.authInfo.topic`]: channelInfo.topic };

  broadcast(wsServer, actualChannel, event, data, { socketFilters });
};

const onAuthenticate = () => {};

const onJoin = () => {};

const onMessage = () => {};

module.exports = { onAuthenticate, onJoin, onMessage, sendToRelay };
