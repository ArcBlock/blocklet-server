const path = require('path');
const { joinURL } = require('ufo');
const DynamicStorage = require('@abtnode/connect-storage');
const { WalletAuthenticator } = require('@arcblock/did-connect-js');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { WalletHandlers } = require('@blocklet/sdk/lib/wallet-handler');
const { sendToUser, sendToRelay } = require('@blocklet/sdk/lib/util/send-notification');
const getNodeWallet = require('@abtnode/util/lib/get-app-wallet');

const env = require('./env');

const wallet = getNodeWallet(process.env.ABT_NODE_SK);
const sender = {
  appDid: wallet.address,
  appSk: wallet.secretKey,
  type: 'server',
};

const context = (() => {
  const store = {};
  return {
    get: key => store[key],
    set: (key, value) => {
      store[key] = value;
    },
  };
})();

const authenticator = new WalletAuthenticator({
  wallet,
  baseUrl: env.baseUrl,
  appInfo: async ({ baseUrl }) => {
    const info = await context.get('node').getNodeInfo();
    return {
      name: info.name,
      description: info.description,
      icon: `${env.baseUrl || baseUrl}/images/node.png?version=${info.version}`,
      link: env.baseUrl || baseUrl,
      updateSubEndpoint: true,
      subscriptionEndpoint: joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, 'websocket'),
      nodeDid: info.did,
    };
  },
  chainInfo: {
    host: 'none',
    id: 'none',
  },
});

const handlers = new WalletHandlers({
  authenticator,
  tokenStorage: new DynamicStorage({ dbPath: path.join(process.env.ABT_NODE_DATA_DIR, 'core/connections.db') }),
  sendNotificationFn: (connectedDid, message) => {
    return sendToUser(connectedDid, message, sender);
  },
  sendToRelayFn: (topic, event, data) => {
    return sendToRelay(topic, event, data, sender, process.env.ABT_NODE_PORT);
  },
});

module.exports = {
  authenticator,
  handlers,
  wallet,
  context,
};
