const pick = require('lodash/pick');
const defaultsDeep = require('lodash/defaultsDeep');
const logger = require('@abtnode/logger')('@abtnode/core:blocklet:manager:config');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { CustomError } = require('@blocklet/error');
const { sendToUser } = require('@blocklet/sdk/lib/util/send-notification');
const { emailConfigSchema } = require('@abtnode/auth/lib/email');
const { BlockletEvents, BlockletInternalEvents } = require('@blocklet/constant');

const states = require('../../../states');
const { blockletThemeSchema } = require('../../../validators/theme');

/**
 * Config navigations
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function configNavigations(manager, { did, navigations = [] }, context) {
  if (!Array.isArray(navigations)) {
    throw new Error('navigations is not an array');
  }
  await states.blockletExtras.setSettings(did, { navigations });

  const newState = await manager.getBlocklet(did);
  manager.emit(BlockletInternalEvents.appSettingChanged, { appDid: did });
  manager.emit(BlockletEvents.updated, { ...newState, context });
  return newState;
}

/**
 * Config theme
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function configTheme(manager, { did, theme = {} }, context) {
  const { error, value } = blockletThemeSchema.validate(theme);
  if (error) {
    throw new Error(error.message);
  }

  const currentSettings = await states.blockletExtras.getSettings(did);
  const currentTheme = currentSettings.theme || {};

  if (value.concepts && currentTheme.meta?.locked) {
    throw new CustomError(403, 'Theme is locked and cannot be modified');
  }

  const updatedTheme = { ...currentTheme, ...value };
  await states.blockletExtras.setSettings(did, { theme: updatedTheme });

  const newState = await manager.getBlocklet(did);
  manager.emit(BlockletInternalEvents.appSettingChanged, { appDid: did });
  manager.emit(BlockletEvents.updated, { ...newState, context });
  manager.emit(BlockletEvents.configTheme, { args: { did, theme }, result: newState.settings.theme, context });
  return newState;
}

/**
 * Config authentication
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function configAuthentication(manager, { did, authentication = {} }, context) {
  const oldConfig = await states.blockletExtras.getSettings(did, 'authentication', {});
  const parsedData = JSON.parse(authentication);
  const mergeConfig = defaultsDeep(parsedData, oldConfig);
  await states.blockletExtras.setSettings(did, { authentication: mergeConfig });
  const newState = await manager.getBlocklet(did);
  manager.emit(BlockletInternalEvents.appSettingChanged, { appDid: did });
  manager.emit(BlockletEvents.updated, { ...newState, context });
  return newState;
}

/**
 * Config DID connect
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function configDidConnect(manager, { did, didConnect = {} }, context) {
  const oldConfig = await states.blockletExtras.getSettings(did, 'didConnect', {});
  const parsedData = JSON.parse(didConnect);
  const mergeConfig = defaultsDeep(parsedData, oldConfig);
  await states.blockletExtras.setSettings(did, { didConnect: mergeConfig });
  const newState = await manager.getBlocklet(did);
  manager.emit(BlockletInternalEvents.appSettingChanged, { appDid: did });
  manager.emit(BlockletEvents.updated, { ...newState, context });
  return newState;
}

/**
 * Config notification
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function configNotification(manager, { did, notification = {} }, context) {
  let newConfig = {};
  try {
    newConfig = JSON.parse(notification);
  } catch (error) {
    logger.error('parse configNotification error', { error });
    throw new Error('parse configNotification error');
  }
  const enabled = newConfig?.email?.enabled;
  if (enabled) {
    const { error } = emailConfigSchema.validate(
      pick(newConfig?.email || {}, ['from', 'host', 'port', 'user', 'password', 'secure'])
    );
    if (error) {
      logger.error('configNotification validate error', { error });
      throw new Error(error.message);
    }
  }
  const oldConfig = await states.blockletExtras.getSettings(did, 'notification', {});
  const mergeConfig = { ...oldConfig, ...newConfig };
  await states.blockletExtras.setSettings(did, { notification: mergeConfig });
  const newState = await manager.getBlocklet(did);
  manager.emit(BlockletInternalEvents.appSettingChanged, { appDid: did });
  manager.emit(BlockletEvents.updated, { ...newState, context });
  return newState;
}

/**
 * Send test email
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @returns {Promise<Object>}
 */
async function sendEmail(manager, { did, receiver, email }) {
  const blocklet = await manager.getBlocklet(did);
  const nodeInfo = await states.node.read();
  const { wallet } = getBlockletInfo(blocklet, nodeInfo.sk);

  const [result] = await sendToUser(
    receiver,
    JSON.parse(email),
    {
      appDid: wallet.address,
      appSk: wallet.secretKey,
    },
    undefined,
    'send-to-mail'
  );
  if (result && result.status === 'fulfilled') {
    return result.value;
  }
  throw new Error(result?.reason || 'failed to send email');
}

/**
 * Send push notification
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @returns {Promise<Object>}
 */
async function sendPush(manager, { did, receiver, notification }) {
  const blocklet = await manager.getBlocklet(did);
  const nodeInfo = await states.node.read();
  const { wallet } = getBlockletInfo(blocklet, nodeInfo.sk);

  const result = await sendToUser(
    receiver,
    JSON.parse(notification),
    {
      appDid: wallet.address,
      appSk: wallet.secretKey,
    },
    undefined,
    'send-to-push-kit'
  );
  return result;
}

module.exports = {
  configNavigations,
  configTheme,
  configAuthentication,
  configDidConnect,
  configNotification,
  sendEmail,
  sendPush,
};
