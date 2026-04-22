const noop = require('lodash/noop');
const { CHANNEL_TYPE, parseChannel, getEventBusChannel } = require('@blocklet/meta/lib/channel');
const { validateEvent } = require('@blocklet/sdk/lib/validators/event');
const { findComponentV2 } = require('@blocklet/meta/lib/util');

const { EVENT_BUS_EVENT } = require('@abtnode/constant');
const eventHub =
  process.env.NODE_ENV === 'test'
    ? require('@arcblock/event-hub/single').default
    : require('@arcblock/event-hub').default;

const { ensureSenderApp, broadcast } = require('../util');
const logger = require('../../libs/logger')('channel:eventbus');

// Only server and blocklets can send message to a event bus channel
// But multiple clients can subscribe to the same event bus channel
const sendToEventBus = async ({ sender, channel, event, node, wsServer }) => {
  const { type, appDid } = parseChannel(channel);
  if (type !== CHANNEL_TYPE.EVENT_BUS) {
    throw new Error('Cannot send message to non event bus channel');
  }

  const { error } = await validateEvent(event);
  if (error) {
    throw new Error(`Invalid event: ${error}`);
  }

  logger.info('broadcast event to eventbus', { sender, channel, event });

  const nodeInfo = await node.getNodeInfo();
  const appInfo = await ensureSenderApp({ sender, node, nodeInfo });
  if (![appInfo.wallet.address, appInfo.permanentWallet.address].includes(appDid)) {
    throw new Error('Cannot sent message to relay channelInfo of other app');
  }

  // Ensure the event is registered in blocklet.yml#events
  const blocklet = await node.getBlocklet({ did: appDid, useCache: true });
  if (!blocklet) {
    throw new Error(`Blocklet not found: ${appDid}`);
  }
  const component = findComponentV2(blocklet, (x) => x.meta.did === event.source);
  if (!component) {
    throw new Error(`Component not found: ${event.source}`);
  }
  if (!Array.isArray(component.meta.events)) {
    throw new Error(`Component ${component.meta.did} does not support events`);
  }
  if (!component.meta.events.find((e) => e.type === event.type)) {
    throw new Error(`Event ${event.type} is not registered by component ${component.meta.did}`);
  }

  const actualChannel = getEventBusChannel(appInfo.permanentWallet.address);
  broadcast(wsServer, actualChannel, 'event', event);

  eventHub.broadcast(EVENT_BUS_EVENT, {
    appDid,
    event,
    appInfo: {
      appUrl: appInfo?.appUrl,
      name: appInfo?.name,
      did: appInfo?.wallet?.address,
      pk: appInfo?.wallet?.publicKey,
    },
    appInfo1: appInfo,
  });
};

const onAuthenticate = async ({ channel, node }) => {
  const { type, appDid } = parseChannel(channel);
  if (type !== CHANNEL_TYPE.EVENT_BUS) {
    throw new Error(`Can not join non eventbus channel: ${channel}`);
  }

  const blocklet = await node.getBlocklet({ did: appDid, useCache: true });
  if (!blocklet) {
    throw new Error(`Blocklet not found: ${appDid}`);
  }
};

const onJoin = noop;

const onMessage = noop;

module.exports = { onAuthenticate, onJoin, onMessage, sendToEventBus };
