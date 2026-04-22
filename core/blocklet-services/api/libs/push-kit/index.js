const uniqWith = require('lodash/uniqWith');
const { getSignData } = require('@blocklet/sdk/lib/util/verify-sign');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { joinURL } = require('ufo');
const pRetry = require('p-retry');
const pMap = require('p-map');
const { api } = require('../api');
const logger = require('../logger')('blocklet-services:notification');

async function sendPush(receiver, notification, { node, teamDid }) {
  const blocklet = await node.getBlocklet({ did: teamDid, useCache: true });
  if (!blocklet) {
    throw new Error(`Failed to get blocklet: ${teamDid}`);
  }

  const config = blocklet.settings?.notification?.pushKit || {};

  if (!config.enabled || !config.endpoint) {
    const error = new Error(`Push Kit Service is not Enabled, teamDid: ${teamDid}`);
    error.logLevel = 'debug';
    throw error;
  }

  const pushKitConfig = {
    // @see https://test.store.blocklet.dev/blocklets/z2qa6xfPH6zHq5AQjb2Qm5CfmpndyQsvZrTKH
    did: config.did || 'z2qa6xfPH6zHq5AQjb2Qm5CfmpndyQsvZrTKH',
    pushPath: config.pushPath || '/api/push',
  };

  let pushKitUrl;
  try {
    const pushKitOrigin = new URL(config.endpoint).origin;
    const { data: blockletJson } = await api.get(joinURL(pushKitOrigin, '/__blocklet__.js?type=json'));
    const componentMountPoints = blockletJson?.componentMountPoints || [];
    const findPushKitComponent = componentMountPoints.find((x) => x.did === pushKitConfig.did);
    if (!findPushKitComponent) {
      throw new Error(`Endpoint(${config.endpoint}) does not have push kit component`);
    }
    pushKitUrl = joinURL(pushKitOrigin, findPushKitComponent.mountPoint, pushKitConfig.pushPath);
  } catch (error) {
    logger.error(`Failed to get push kit endpoint: ${config.endpoint}`, { error });
    throw new Error(`Invalid push kit endpoint: ${config.endpoint}`);
  }

  const userSessionList = await pMap(
    receiver,
    async (x) => {
      const result = await node.getUserSessions({
        teamDid,
        query: {
          userDid: x,
        },
      });
      return result.list;
    },
    { concurrency: 10 }
  );

  const targets = userSessionList.reduce((acc, userSessions) => {
    if (userSessions?.length > 0) {
      userSessions.forEach((x) => {
        // NOTICE: 这里需要转为小写来判断
        const platform = x?.extra?.walletOS?.toLowerCase();
        // 兼容处理，支持读取 walletDeviceMessageToken
        const deviceToken = x?.extra?.device?.messageToken || x?.extra?.walletDeviceMessageToken;
        const deviceClientName = x?.extra?.device?.clientName;
        if (platform && ['ios', 'android', 'ios-sandbox'].includes(platform) && deviceToken) {
          acc.push({
            platform,
            deviceClientName,
            deviceToken,
            userDid: x.userDid,
          });
        }
      });
    }
    return acc;
  }, []);

  const filterTargets = uniqWith(targets, (a, b) => {
    return a.deviceToken === b.deviceToken && a.platform === b.platform && a.deviceClientName === b.deviceClientName;
  });

  if (filterTargets.length === 0) {
    throw new Error('Invalid receiver: empty target');
  }

  const blockletInfo = getBlockletInfo(blocklet);

  const { iat, exp, sig, version } = await getSignData(
    {
      data: {
        targets: filterTargets,
        data: notification,
      },
      method: 'post',
      // NOTICE: 这里只能使用 push-kit 中接收到的 req.originalUrl 值，不能使用完整路径，否则会校验失败
      url: pushKitConfig.pushPath,
      params: {},
    },
    { appSk: blockletInfo.wallet.secretKey }
  );

  try {
    const result = await pRetry(
      () =>
        // FIXME: 需要在 SDK 中暴露一个工具函数，用于发起 blocklet-sig 的请求，这样才能确保签名前后序列化的数据是一致的
        api.post(
          pushKitUrl,
          {
            targets: filterTargets,
            data: notification,
          },
          {
            headers: {
              'x-blocklet-sig': sig,
              'x-blocklet-sig-pk': blockletInfo.wallet.publicKey,
              'x-blocklet-sig-iat': iat,
              'x-blocklet-sig-exp': exp,
              'x-blocklet-sig-version': version,
            },
          }
        ),
      { retries: 3 }
    );
    return result?.data;
  } catch (error) {
    logger.error('Failed to send push kit', { error });
    throw error;
  }
}

module.exports = {
  sendPush,
};
