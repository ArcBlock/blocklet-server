const { CHANNEL_TYPE, parseChannel } = require('@blocklet/meta/lib/channel');

const AppChannel = require('./app');
const DidChannel = require('./did');
const ConnectChannel = require('./relay');
const ComponentChannel = require('./component');
const EventBusChannel = require('./eventbus');

const getHooksByChannel = (channel) => {
  const { type } = parseChannel(channel);
  if (type === CHANNEL_TYPE.DID) {
    return DidChannel;
  }
  if (type === CHANNEL_TYPE.APP) {
    return AppChannel;
  }
  if (type === CHANNEL_TYPE.RELAY) {
    return ConnectChannel;
  }
  if (type === CHANNEL_TYPE.COMPONENT) {
    return ComponentChannel;
  }
  if (type === CHANNEL_TYPE.EVENT_BUS) {
    return EventBusChannel;
  }

  throw new Error('Unknown channel type');
};

module.exports = getHooksByChannel;
