const path = require('path');
const get = require('lodash/get');
const { toAddress } = require('@ocap/util');
const { WalletAuthenticator } = require('@arcblock/did-connect-js');
const { types } = require('@ocap/mcrypto');
const { getBlockletAppIdList } = require('@blocklet/meta/lib/util');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { WalletHandlers } = require('@blocklet/sdk');
const { getDelegation } = require('@blocklet/sdk/lib/connect/shared');
const { sendToUser, sendToRelay } = require('@blocklet/sdk/lib/util/send-notification');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const DynamicStorage = require('@abtnode/connect-storage');
const { fromPublicKey } = require('@ocap/wallet');
const { getSourceAppPid } = require('@blocklet/sdk/lib/util/login');
const { getFederatedMaster } = require('@abtnode/auth/lib/util/federated');

const cache = require('../../cache');
const { appInfo, memberAppInfo, chainInfo } = require('./shared');

module.exports = (node, opts) => {
  const authenticator = new WalletAuthenticator({
    appInfo,
    memberAppInfo,
    chainInfo,
    wallet: async ({ request }) => {
      const { wallet } = await request.getBlockletInfo();
      return wallet.toJSON();
    },
    delegator: async ({ request }) => {
      const sourceAppPid = getSourceAppPid(request);
      const blocklet = await request.getBlocklet();
      if (getBlockletAppIdList(blocklet).includes(sourceAppPid)) {
        return null;
      }

      if (sourceAppPid) {
        const masterSite = getFederatedMaster(blocklet);
        if (masterSite?.pk) {
          // NOTE: 这里的 type 参数必须保持跟生成 blocklet 时使用的是一致的
          const type = {
            role: types.RoleType.ROLE_APPLICATION,
            pk: types.KeyType.ED25519,
            hash: types.HashType.SHA3,
            address: types.EncodingType.BASE58,
          };
          const delegator = fromPublicKey(masterSite.pk, type);
          return delegator;
        }
      }

      const { wallet: delegatee, permanentWallet: delegator } = await request.getBlockletInfo();
      if (delegatee.address !== delegator.address) {
        return delegator;
      }

      return null;
    },
    delegation: async ({ request }) => {
      const { wallet: delegatee, permanentWallet: delegator } = await request.getBlockletInfo();
      const sourceAppPid = getSourceAppPid(request);
      if (sourceAppPid) {
        const blocklet = await request.getBlocklet();
        if (getBlockletAppIdList(blocklet).includes(sourceAppPid)) {
          return null;
        }

        const delegation = get(blocklet, 'settings.federated.config.delegation');
        if (delegation) {
          return delegation;
        }
        throw new Error('federated login master-site granted delegation not found');
      }

      if (delegatee.address !== delegator.address) {
        return getDelegation(delegator, delegatee);
      }

      return null;
    },
  });

  const handlerOpts = {
    authenticator,
    tokenStorage: new DynamicStorage({ dbPath: path.join(opts.dataDir, 'connections.db') }),
    sendNotificationFn: async (connectedDid, message, { req }) => {
      const { wallet } = await req.getBlockletInfo();
      return sendToUser(
        connectedDid,
        message,
        {
          appDid: wallet.address,
          appSk: wallet.secretKey,
        },
        process.env.ABT_NODE_SERVICE_PORT
      );
    },

    // Only handles did-connect updates, because we need to determine the actual app
    sendToRelayFn: async (topic, event, data) => {
      // NOTICE: 这里需要和前端订阅的 ws channel 保持一致
      // 1. 如果是统一登录的环境，那么前端订阅的 channel 是 memberAppInfo.publisher
      // 2. 如果是非统一登录的环境，那么前端订阅的 channel 是 appInfo.publisher
      // 永远保持订阅的通道是当前 blocklet 的 did
      const publisher = get(data, 'memberAppInfo.publisher') || get(data, 'appInfo.publisher');
      if (!publisher) {
        return null;
      }

      const [blocklet, info] = await Promise.all([
        cache.getBlocklet({ did: toAddress(publisher), node, context: {} }),
        cache.getNodeInfo({ node }),
      ]);
      if (!blocklet) {
        return null;
      }

      const { wallet } = getBlockletInfo(blocklet, info.sk);
      if (!wallet) {
        return null;
      }

      return sendToRelay(
        topic,
        event,
        data,
        {
          appDid: wallet.address,
          appSk: wallet.secretKey,
        },
        process.env.ABT_NODE_SERVICE_PORT
      );
    },
  };

  const handler = new WalletHandlers({
    ...handlerOpts,
    options: {
      prefix: `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/did`,
    },
  });

  return {
    authenticator,
    handlers: [handler],
  };
};
