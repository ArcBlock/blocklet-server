const { joinURL } = require('ufo');
const isEmpty = require('lodash/isEmpty');
const { getConfigByChainId, EVM_PREFIX } = require('./config');

const isEVMChain = (chainId) => {
  if (!chainId) {
    return false;
  }

  return chainId.startsWith(EVM_PREFIX);
};

const getExplorerUrl = (chainId) => {
  const chain = getConfigByChainId(chainId);
  if (chain) {
    return chain.explorer;
  }

  return '';
};

/**
 * persistent notifications list key
 */
const generateKey = () => {
  const did = window?.env?.appId;
  if (!did) {
    return '';
  }
  return `notifications-durable-list-${did}`;
};

const getNotificationQueryParams = (key) => {
  try {
    const params = JSON.parse(localStorage.getItem(key));
    return params;
  } catch (error) {
    return {};
  }
};

const setNotificationQueryParams = (key, params) => {
  localStorage.setItem(key, JSON.stringify(params));
};

const removeNotificationQueryParams = (key) => {
  localStorage.removeItem(key);
};

const getImageBinFilePath = (fileName) => {
  const { blocklet = {} } = window;
  // @ts-ignore
  const { componentMountPoints = [] } = blocklet;
  const imageBin = componentMountPoints.find((x) => x.did === 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9');
  return joinURL(imageBin?.mountPoint || '/', '/uploads', fileName);
};

const getImagePath = (url) => {
  if (url?.startsWith('http')) {
    return url;
  }
  return getImageBinFilePath(url);
};

/**
 * Check whether the notification includes an activity
 * @param {Object} notification - the notification object
 * @returns {boolean} - whether the notification includes an activity
 */
const isActivityIncluded = (notification) => {
  return !isEmpty(notification.activity) && !!notification.activity.type && !!notification.activity.actor;
};

/**
 * Check whether the actor is a user DID
 * actor can be one of two types: 1) user 2) component
 * @param {*} notification
 * @returns
 */
const isUserActor = (notification) => {
  // 1. if isActivityIncluded and the notification has actorInfo, treat as a user
  // 2. if isActivityIncluded but actorInfo does not resolve to a user, treat as a component
  return isActivityIncluded(notification) && !!notification.actorInfo && !!notification.actorInfo.did;
};

/**
 * Activity types enum for type safety
 * @readonly
 * @enum {string}
 */
const ACTIVITY_TYPES = {
  COMMENT: 'comment',
  LIKE: 'like',
  FOLLOW: 'follow',
  TIPS: 'tips',
  MENTION: 'mention',
  ASSIGN: 'assign',
  UN_ASSIGN: 'un_assign',
};

/**
 * Activity descriptions mapping
 * @type {Object.<string, React.ReactNode>}
 */
const ACTIVITY_DESCRIPTIONS = {
  [ACTIVITY_TYPES.COMMENT]: (targetType, count, isAuthor) =>
    count > 1
      ? `have left ${count} comments on ${isAuthor ? 'your' : 'the'} ${targetType}:`
      : `has commented on ${isAuthor ? 'your' : 'the'} ${targetType}:`,
  [ACTIVITY_TYPES.LIKE]: (targetType, count, isAuthor) =>
    count > 1
      ? `have liked ${isAuthor ? 'your' : 'the'} ${targetType}:`
      : `has liked ${isAuthor ? 'your' : 'the'} ${targetType}:`,
  [ACTIVITY_TYPES.FOLLOW]: (targetType, count) => (count > 1 ? 'have followed you' : 'has followed you'),
  [ACTIVITY_TYPES.TIPS]: (targetType, count, isAuthor) =>
    count > 1
      ? `left tips for ${isAuthor ? 'your' : 'the'} ${targetType}:`
      : `left a tip for ${isAuthor ? 'your' : 'the'} ${targetType}:`,
  [ACTIVITY_TYPES.MENTION]: (targetType, count, isAuthor) =>
    count > 1
      ? `have mentioned you in ${isAuthor ? 'your' : 'the'} ${targetType}:`
      : `mentioned you in ${isAuthor ? 'your' : 'the'} ${targetType}:`,
  [ACTIVITY_TYPES.ASSIGN]: () => 'has assigned you a task: ',
  [ACTIVITY_TYPES.UN_ASSIGN]: () => 'has revoked your task assignment: ',
};

module.exports = {
  isEVMChain,
  getExplorerUrl,
  generateKey,
  getNotificationQueryParams,
  setNotificationQueryParams,
  removeNotificationQueryParams,
  getImagePath,
  getImageBinFilePath,
  isActivityIncluded,
  isUserActor,
  ACTIVITY_DESCRIPTIONS,
};
