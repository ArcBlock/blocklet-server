/* eslint-disable no-console */
const logger = require('@abtnode/logger')('@abtnode/core:ready');

const createStateReadyHandler =
  () =>
  ({ states }) => {
    return states.node
      .read()
      .then((state) => {
        // Set default sender/receiver for notification center
        states.notification.setDefaultSender(state.did);
        if (state.nodeOwner) {
          states.notification.setDefaultReceiver(state.nodeOwner.did);
        }
        // deleted states.node.count() check
      })
      .catch((err) => {
        console.error('Can not ready node state on Blocklet Server start:', err.message);
        process.exit(1);
      });
  };

const createStateReadyQueue = ({ states, options, dataDirs }) => {
  const readyState = Object.keys(states).reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {});

  const readyCallbacks = [];
  const markReady = async (key) => {
    logger.debug('mark ready', key);
    readyState[key] = true;
    if (Object.keys(readyState).every((x) => readyState[x])) {
      if (readyCallbacks.length) {
        // eslint-disable-next-line no-restricted-syntax
        for (const cb of readyCallbacks) {
          // eslint-disable-next-line no-await-in-loop
          await cb({ states, options, dataDirs });
        }
      }
    }
  };

  Object.keys(states).forEach((key) => {
    const state = states[key];
    if (typeof state.onReady === 'function') {
      state.onReady(() => markReady(key));
    }
  });

  return (cb) => {
    if (Object.keys(readyState).every((x) => readyState[x])) {
      cb({ states, options, dataDirs });
    } else {
      readyCallbacks.push(cb);
    }
  };
};

module.exports = {
  createStateReadyQueue,
  createStateReadyHandler,
};
