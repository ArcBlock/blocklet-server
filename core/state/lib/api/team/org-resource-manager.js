const dayjs = require('@abtnode/util/lib/dayjs');
const logger = require('@abtnode/logger')('@abtnode/core:api:team:org-resource');
const { NOTIFICATION_SEND_CHANNEL } = require('@abtnode/constant');
const { getBlockletAppIdList } = require('@blocklet/meta/lib/util');

const { getBlocklet } = require('../../util/blocklet');
const { checkPushChannelAvailable, getNotificationPushState } = require('../../util/notification');

/**
 * Get org resource
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.orgId - Org ID
 * @param {string} params.resourceId - Resource ID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function getOrgResource(api, { teamDid, orgId, resourceId }, context) {
  try {
    const state = await api.getOrgState(teamDid);
    return state.getOrgResource({ orgId, resourceId }, context);
  } catch (err) {
    logger.error('Get org resource failed', { err, teamDid, orgId, resourceId });
    throw err;
  }
}

/**
 * Add org resource
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.orgId - Org ID
 * @param {Array} params.resourceIds - Resource IDs
 * @param {string} params.type - Type
 * @param {Object} params.metadata - Metadata
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function addOrgResource(api, { teamDid, orgId, resourceIds, type, metadata }, context) {
  try {
    const state = await api.getOrgState(teamDid);
    return state.addOrgResource({ orgId, resourceIds, type, metadata }, context);
  } catch (err) {
    logger.error('Add org resource failed', { err, teamDid, orgId, resourceIds, type, metadata });
    throw err;
  }
}

/**
 * Remove org resource
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.orgId - Org ID
 * @param {Array} params.resourceIds - Resource IDs
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function removeOrgResource(api, { teamDid, orgId, resourceIds }, context) {
  try {
    const state = await api.getOrgState(teamDid);
    return state.removeOrgResource({ orgId, resourceIds }, context);
  } catch (err) {
    logger.error('Remove org resource failed', { err, teamDid, orgId, resourceIds });
    throw err;
  }
}

/**
 * Migrate org resource
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.from - From org ID
 * @param {string} params.to - To org ID
 * @param {Array} params.resourceIds - Resource IDs
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function migrateOrgResource(api, { teamDid, from, to, resourceIds }, context) {
  try {
    const state = await api.getOrgState(teamDid);
    return state.migrateOrgResource({ from, to, resourceIds }, context);
  } catch (err) {
    logger.error('Migrate org resource failed', { err, teamDid, from, to, resourceIds });
    throw err;
  }
}

/**
 * Get notification stats
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.since - Since time (e.g., '1h')
 * @returns {Promise<Object>}
 */
async function getNotificationStats(api, { teamDid, since = '1h' }) {
  let startTime = dayjs().subtract(1, 'hours').toDate();

  if (since && typeof since === 'string') {
    const sinceMatch = since.match(/^(\d+)h$/);
    if (sinceMatch) {
      let hours = parseInt(sinceMatch[1], 10);
      if (hours < 1 || hours > 24) {
        hours = Math.min(Math.max(hours, 1), 24);
      }
      startTime = dayjs().subtract(hours, 'hours').toDate();
    }
  }

  try {
    const state = await api.getNotificationState(teamDid);
    const isServer = api.teamManager.isNodeTeam(teamDid);
    const blocklet = isServer ? {} : await getBlocklet({ did: teamDid, states: api.states, dataDirs: api.dataDirs });
    const channelsAvailable = checkPushChannelAvailable(blocklet, isServer);
    const results = await state.getNotificationsBySince({ since });

    if (results.length === 0) {
      return {
        healthy: true,
        message: `There have been no push records since ${startTime}. Please choose another time range`,
        since: startTime,
        channels: channelsAvailable,
      };
    }

    const pushState = getNotificationPushState(results, channelsAvailable, isServer);

    let teamDids = [teamDid];
    if (isServer) {
      const nodeInfo = await api.node.read();
      teamDids = [nodeInfo.did];
    } else {
      teamDids = getBlockletAppIdList(blocklet);
    }

    const pendingResult = await api.states.job.getPendingNotifications({
      teamDids,
      isServer,
      channels: Object.keys(channelsAvailable),
      createdAt: startTime,
    });

    // pushState 的 key 与 pendingResult 的 key 映射关系
    const channelKeyMap = {
      pushKit: NOTIFICATION_SEND_CHANNEL.PUSH,
      wallet: NOTIFICATION_SEND_CHANNEL.WALLET,
      email: NOTIFICATION_SEND_CHANNEL.EMAIL,
      webhook: NOTIFICATION_SEND_CHANNEL.WEBHOOK,
    };

    // 合并 pending 数量到对应的 channel
    const channels = Object.entries(pushState).reduce((acc, [key, value]) => {
      const pendingKey = channelKeyMap[key] || key;
      acc[key] = {
        ...value,
        pending: pendingResult[pendingKey] || 0,
      };
      return acc;
    }, {});

    return {
      healthy: true,
      since: startTime,
      channels,
    };
  } catch (err) {
    logger.error('Get notification service health failed', err, { teamDid });
    return {
      healthy: false,
      error: err.message,
      since: startTime,
    };
  }
}

module.exports = {
  getOrgResource,
  addOrgResource,
  removeOrgResource,
  migrateOrgResource,
  getNotificationStats,
};
