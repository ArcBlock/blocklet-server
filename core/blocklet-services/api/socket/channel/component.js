const JWT = require('@arcblock/jwt');
const { CHANNEL_TYPE, parseChannel, getComponentChannel } = require('@blocklet/meta/lib/channel');
const { findComponentByIdV2 } = require('@blocklet/meta/lib/util');
const { canReceiveMessages } = require('@blocklet/meta/lib/engine');
const { getComponentApiKey } = require('@abtnode/util/lib/blocklet');
const Lock = require('@abtnode/util/lib/lock');

const logger = require('../../libs/logger')('channel:component');
const { getSenderServer, broadcast } = require('../util');
const states = require('../../state');

const lock = new Lock('');

const getCacheId = (appDid, componentDid) => `${appDid}/${componentDid}`;

const onAuthenticate = async ({ channel, payload, node }) => {
  const { type, appDid, componentDid } = parseChannel(channel);
  if (type !== CHANNEL_TYPE.COMPONENT) {
    throw new Error(`Can not join non-component channel: ${channel}`);
  }

  const { apiKey } = payload;

  const app = await node.getBlocklet({ did: appDid, useCache: true });

  if (!app) {
    throw new Error(`App not found: ${appDid}`);
  }

  const component = findComponentByIdV2(app, componentDid);

  if (!component) {
    throw new Error(`Component not found: ${appDid}/${componentDid}`);
  }

  const nodeInfo = await node.getNodeInfo({ useCache: true });

  const expectedApiKey = getComponentApiKey({ serverSk: nodeInfo.sk, app, component }) || '';
  if (expectedApiKey !== apiKey) {
    throw new Error(
      `Invalid API key. app: ${appDid}, component: ${componentDid}, expected: ${String(expectedApiKey).slice(
        0,
        4
      )}***, actual: ${String(apiKey).slice(0, 4)}***, installedAt: ${component.installedAt}`
    );
  }
};

const sendCachedMessages = async (wsServer, appDid, componentDid) => {
  await lock.acquire();
  try {
    const cacheId = getCacheId(appDid, componentDid);
    const messages = await states.message.find({ did: cacheId });
    if (messages.length) {
      messages.forEach(({ event, data }) => {
        wsServer.broadcast(getComponentChannel(appDid, componentDid), event, data, { noCluster: true });
      });

      await states.message.remove({ did: cacheId });
    }

    lock.release();
  } catch (error) {
    lock.release();
    logger.error('Error on sending cached messages to component', { appDid, componentDid, error });
  }
};

const onJoin = async ({ channel, wsServer }) => {
  const { appDid, componentDid } = parseChannel(channel);
  if (appDid && componentDid) {
    await sendCachedMessages(wsServer, appDid, componentDid);
  } else {
    throw new Error(`onJoin: Invalid channel: ${channel}`);
  }
};

const onMessage = () => {};

const sendToAppComponents = async ({ event, appDid, componentDid: inputComponentDid, data, node, wsServer }) => {
  const app = await node.getBlocklet({ did: appDid, useCache: true });
  if (!app) {
    throw new Error(`App not found: ${appDid}`);
  }

  // Early exit: check if there are any eligible components before expensive operations
  const eligibleComponents = (app.children || []).filter((component) => {
    const componentDid = component.meta.did;
    return canReceiveMessages(component.meta) && (!inputComponentDid || componentDid === inputComponentDid);
  });

  if (eligibleComponents.length === 0) {
    return;
  }

  const senderInfo = await getSenderServer({ node });

  const notification = {
    data,
    time: Date.now(),
    sender: {
      did: senderInfo.wallet.address,
      pk: senderInfo.wallet.publicKey,
      token: await JWT.sign(senderInfo.wallet.address, senderInfo.wallet.secretKey),
      name: senderInfo.name,
    },
  };

  for (const component of eligibleComponents) {
    const componentDid = component.meta.did;
    // appPid is diff with appDid when app development mode
    // appPid is diff with appDid when app has been rotated
    const appPid = app.appPid || appDid;

    // 移除掉消息推送失败时缓存逻辑
    broadcast(wsServer, getComponentChannel(appPid, componentDid), event, notification);
  }
};

module.exports = { onAuthenticate, onJoin, onMessage, sendToAppComponents };
