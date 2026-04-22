const path = require('path');
const DynamicStorage = require('@abtnode/connect-storage');
const { Authenticator } = require('@did-connect/authenticator');
const { createConnectHandlers: createHandlers } = require('@blocklet/sdk/lib/connect/handler');
const { sendToUser } = require('@blocklet/sdk/lib/util/send-notification');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');

const logger = require('../logger')('connect');
const { appInfo, chainInfo } = require('./shared');

module.exports = (node, opts) => {
  const authenticator = new Authenticator({
    appInfo,
    chainInfo,
    wallet: async ({ request }) => {
      const { wallet } = await request.getBlockletInfo();
      return wallet;
    },
  });

  const handlers = createHandlers({
    logger,
    authenticator,
    storage: new DynamicStorage({ dbPath: path.join(opts.dataDir, 'connections.db'), v2: true }),
    socketPathname: `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/connect/relay/websocket`,
    sendNotificationFn: async (connectedDid, message, { request }) => {
      const { wallet } = await request.getBlockletInfo();
      const sender = { appDid: wallet.address, appSk: wallet.secretKey };
      return sendToUser(connectedDid, message, sender, process.env.ABT_NODE_SERVICE_PORT);
    },
  });

  return {
    authenticator,
    handlers,
  };
};
