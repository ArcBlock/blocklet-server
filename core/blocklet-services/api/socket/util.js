const JWT = require('@arcblock/jwt');

const { getApplicationInfo } = require('@abtnode/auth/lib/auth');

const logger = require('../libs/logger')('socket');

/**
 * @param {import('@blocklet/sdk/lib/types/notification').TNotification} notification
 * @param {{
 *   {string} name
 *   {Wallet} wallet
 * }} senderInfo
 */
const parseNotification = (notification, senderInfo) => {
  const notifications = [].concat(notification);

  // TODO: 如果通过 message id 实现消息去重, 消息顺序等
  notifications.forEach((x) => {
    x.createdAt = x.createdAt || new Date();
    x.type = x.type || 'notification';

    x.sender = {
      // did is permanent did of an application that is used to identify the application by DID Wallet
      did: senderInfo.permanentWallet.address,
      pk: senderInfo.permanentWallet.pk,
      name: senderInfo.name,
      logo: senderInfo.logo,
      // actualDid is the did of the application that is used to decrypt the message if needed
      actualDid: senderInfo.wallet.address,
      actualPk: senderInfo.wallet.pk,
      componentDid: senderInfo.componentDid,
    };
  });

  return notifications;
};

const broadcast = (...args) => {
  const cb = typeof args[args.length - 1] === 'function' ? args.pop() : () => {};
  const [wsServer, channel, event, data, options] = args;

  wsServer.broadcast(channel, event, data, options || {}, ({ count } = {}) => {
    // Only log when there are actual subscribers to reduce noise
    if (count > 0) {
      logger.info('Broadcast message to channel', { channel, sendCount: count });
    } else {
      logger.debug('Broadcast message to channel (no subscribers)', { channel });
    }
    cb(count);
  });
};

const ensureSenderApp = async ({ sender, node, nodeInfo }) => {
  let appInfo;
  try {
    appInfo = await getApplicationInfo({ node, nodeInfo, teamDid: sender.appDid });
  } catch (err) {
    if (err.message === 'Blocklet state must be an object') {
      err.message = `Sender blocklet does not exist: ${sender.appDid}`;
    }
    throw err;
  }

  if (!sender.verified) {
    // Requests from blocklet are signed by accessWallet
    let isValid = appInfo.accessWallet && (await JWT.verify(sender.token, appInfo.accessWallet.publicKey));
    // Requests from service are signed by wallet
    if (!isValid) {
      isValid = await JWT.verify(sender.token, appInfo.wallet.publicKey);
    }
    if (!isValid) {
      throw new Error(`Invalid authentication token for sender blocklet: ${sender.appDid}`);
    }
  }

  appInfo.componentDid = sender.componentDid;

  return appInfo;
};

const getSenderServer = async ({ node }) => {
  const nodeInfo = await node.getNodeInfo({ useCache: true });
  const senderInfo = await getApplicationInfo({ node, nodeInfo, teamDid: nodeInfo.did });
  return senderInfo;
};

const getTokenInfo = (decoded) => ({
  did: decoded.iss.replace(/^did:abt:/, ''),
});

const EVENTS = {
  MESSAGE: 'message',
};

module.exports = {
  parseNotification,
  broadcast,
  ensureSenderApp,
  getSenderServer,
  getTokenInfo,
  EVENTS,
};
