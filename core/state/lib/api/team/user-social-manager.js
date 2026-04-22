const omit = require('lodash/omit');
const { joinURL } = require('ufo');
const logger = require('@abtnode/logger')('@abtnode/core:api:team:user-social');
const {
  MAX_USER_PAGE_SIZE,
  USER_AVATAR_URL_PREFIX,
  WELLKNOWN_SERVICE_PATH_PREFIX,
  NOTIFICATION_SEND_CHANNEL,
  WEBHOOK_CONSECUTIVE_FAILURES_THRESHOLD,
} = require('@abtnode/constant');
const { CustomError } = require('@blocklet/error');
const { getUserAvatarUrl: getFederatedUserAvatarUrl } = require('@abtnode/auth/lib/util/federated');

const { getBlocklet } = require('../../util/blocklet');

// 关注取消关注相关接口
const USER_RELATION_ACTIONS = {
  follow: (state, followerDid, userDid, options) => state.followUser(followerDid, userDid, options),
  unfollow: (state, followerDid, userDid, options) => state.unfollowUser(followerDid, userDid, options),
};

// 获取用户相关接口
const USER_RELATION_QUERIES = {
  followers: (state, userDid, options, context) => state.getFollowers(userDid, options, context),
  following: (state, userDid, options, context) => state.getFollowing(userDid, options, context),
};

/**
 * User follow action
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.userDid - User DID
 * @param {string} params.followerDid - Follower DID
 * @param {string} params.action - Action
 * @param {Object} params.options - Options
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function userFollowAction(api, { teamDid, userDid, followerDid, action = 'follow', options = {} }, context = {}) {
  const targetDid = followerDid || context.userDid;

  if (!USER_RELATION_ACTIONS[action]) {
    throw new CustomError(
      400,
      `Invalid action: ${action}. Supported: ${Object.keys(USER_RELATION_ACTIONS).join(', ')}`
    );
  }
  let result;
  try {
    const state = await api.getUserState(teamDid);
    result = await USER_RELATION_ACTIONS[action](state, targetDid, userDid, options);
  } catch (error) {
    logger.error(`Failed to ${action} user`, {
      followerDid: targetDid,
      userDid,
      error,
    });
    throw error;
  }

  try {
    if (action === 'follow' && !options.skipNotification) {
      const state = await api.getUserState(teamDid);
      const currentUser = await state.getUser(targetDid);
      await api.createNotification({
        teamDid,
        receiver: userDid,
        title: 'Followed',
        description: `<${currentUser.fullName}(did:abt:${currentUser.did})> followed you`,
        activity: {
          type: 'follow',
          actor: followerDid,
          target: {
            type: 'user',
            id: followerDid,
          },
        },
        entityId: teamDid,
        source: 'system',
        severity: 'success',
      });
    }
  } catch (error) {
    // 消息创建失败，不影响 follow 操作
    logger.error('Failed to create notification', { error });
  }

  return result;
}

/**
 * Get user follows
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.userDid - User DID
 * @param {string} params.type - Type
 * @param {Object} params.paging - Paging
 * @param {Object} params.sort - Sort
 * @param {Object} params.options - Options
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function getUserFollows(api, { teamDid, userDid, type = 'following', paging, sort, options = {} }, context = {}) {
  const state = await api.getUserState(teamDid);

  const blocklet = await getBlocklet({ did: teamDid, states: api.states, dataDirs: api.dataDirs });

  if (paging?.pageSize > MAX_USER_PAGE_SIZE) {
    throw new Error(`Length of users should not exceed ${MAX_USER_PAGE_SIZE} per page`);
  }

  if (!USER_RELATION_QUERIES[type]) {
    throw new CustomError(400, `Invalid type: ${type}. Supported: ${Object.keys(USER_RELATION_QUERIES).join(', ')}`);
  }

  try {
    const { list, paging: resultPaging } = await USER_RELATION_QUERIES[type](
      state,
      userDid,
      {
        paging,
        sort,
        ...options,
      },
      context
    );

    list.forEach((item) => {
      const { user } = item;
      if (user && user?.avatar && user?.avatar?.startsWith(USER_AVATAR_URL_PREFIX)) {
        user.avatar = `${getFederatedUserAvatarUrl(user.avatar, blocklet)}?imageFilter=resize&w=48&h=48`;
      }
    });

    return {
      data: list,
      paging: resultPaging,
    };
  } catch (error) {
    logger.error('Failed to get user follows', { error });
    throw error;
  }
}

/**
 * Get user follow stats
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Array} params.userDids - User DIDs
 * @param {Object} params.options - Options
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function getUserFollowStats(api, { teamDid, userDids, options = {} }, context = {}) {
  const state = await api.getUserState(teamDid);
  const info = await api.node.read();
  const prefix = process.env.NODE_ENV === 'production' ? info.routing.adminPath : '';
  return state.getFollowStats({ userDids, teamDid, prefix, options }, context);
}

/**
 * Check following
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Array} params.userDids - User DIDs
 * @param {string} params.followerDid - Follower DID
 * @returns {Promise<Object>}
 */
async function checkFollowing(api, { teamDid, userDids = [], followerDid }) {
  if (!followerDid) {
    throw new CustomError(400, 'Follower DID is required');
  }
  const state = await api.getUserState(teamDid);
  return state.isFollowing(followerDid, userDids);
}

/**
 * Get user invites
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.userDid - User DID
 * @param {Object} params.paging - Paging
 * @param {Object} params.sort - Sort
 * @param {Object} params.options - Options
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function getUserInvites(api, { teamDid, userDid, paging, sort, options = {} }, context = {}) {
  try {
    if (paging?.pageSize > MAX_USER_PAGE_SIZE) {
      throw new CustomError(400, `Length of users should not exceed ${MAX_USER_PAGE_SIZE} per page`);
    }
    const state = await api.getUserState(teamDid);
    const { users, paging: resultPaging } = await state.getInvitees(userDid, { paging, sort, ...options }, context);
    // 处理头像
    const blocklet = await getBlocklet({ did: teamDid, states: api.states, dataDirs: api.dataDirs });
    users.forEach((user) => {
      if (user && user?.avatar && user?.avatar?.startsWith(USER_AVATAR_URL_PREFIX)) {
        user.avatar = `${getFederatedUserAvatarUrl(user.avatar, blocklet)}?imageFilter=resize&w=48&h=48`;
      }
    });
    return {
      users,
      paging: resultPaging,
    };
  } catch (error) {
    logger.error('Failed to get user invites', { teamDid, userDid, error });
    throw error;
  }
}

/**
 * Create webhook disabled notification
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.userDid - User DID
 * @param {Object} params.webhook - Webhook
 * @param {string} params.action - Action
 * @param {string} params.locale - Locale
 * @returns {Promise<void>}
 */
async function createWebhookDisabledNotification(api, { teamDid, userDid, webhook, action = '', locale = 'en' }) {
  const notification = {
    en: {
      title: 'Your webhook has been temporarily disabled',
      description: `Your Webhook has been temporarily disabled after ${WEBHOOK_CONSECUTIVE_FAILURES_THRESHOLD} consecutive failed message delivery attempts. Please check its availability and you can click the button below to reactivate it if needed.`,
      failureCount: 'Number of failures',
      failureUrl: 'Failed Webhook URL',
    },
    zh: {
      title: '您的 webhook 已被暂时禁用',
      description: `您的 Webhook 在连续 ${WEBHOOK_CONSECUTIVE_FAILURES_THRESHOLD} 次消息投递失败后已被暂时禁用。请检查其可用性，如果需要重新激活，请点击下方按钮。`,
      failureCount: '失败次数',
      failureUrl: '失败的 Webhook URL',
    },
  };

  try {
    const nodeInfo = await api.node.read();
    // server 的 webhook 页面地址
    const actionPath = '/settings/integration';
    let _action = process.env.NODE_ENV === 'production' ? joinURL(nodeInfo.routing.adminPath, actionPath) : actionPath;
    const channels = [NOTIFICATION_SEND_CHANNEL.WALLET, NOTIFICATION_SEND_CHANNEL.PUSH];
    if (teamDid && !api.teamManager.isNodeTeam(teamDid)) {
      channels.push(NOTIFICATION_SEND_CHANNEL.EMAIL);
      _action = action || `${WELLKNOWN_SERVICE_PATH_PREFIX}/user/settings`; // 默认返回用户中心页面设置页面
    }
    await api.teamManager.createNotification({
      title: notification[locale].title,
      description: notification[locale].description,
      attachments: [
        {
          type: 'section',
          fields: [
            {
              type: 'text',
              data: {
                type: 'plain',
                color: '#9397A1',
                text: notification[locale].failureUrl,
              },
            },
            {
              type: 'text',
              data: {
                type: 'plain',
                color: '#9397A1',
                text: webhook.url,
              },
            },
            {
              type: 'text',
              data: {
                type: 'plain',
                color: '#9397A1',
                text: notification[locale].failureCount,
              },
            },
            {
              type: 'text',
              data: {
                type: 'plain',
                color: '#9397A1',
                text: `${WEBHOOK_CONSECUTIVE_FAILURES_THRESHOLD}`,
              },
            },
          ],
        },
      ],
      source: 'system',
      severity: 'warning',
      action: _action,
      channels,
      ...(teamDid ? { teamDid } : {}),
      ...(userDid ? { receiver: userDid } : {}),
    });
  } catch (error) {
    logger.error('Failed to create webhook disabled notification', { teamDid, userDid, webhook, error });
  }
}

/**
 * Update webhook state
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Array} params.userDids - User DIDs
 * @param {Object} params.webhook - Webhook
 * @param {boolean} params.enabled - Enabled
 * @param {number} params.consecutiveFailures - Consecutive failures
 * @returns {Promise<Array>}
 */
async function updateWebHookState(api, { teamDid, userDids, webhook, enabled, consecutiveFailures }) {
  const state = await api.getUserState(teamDid);
  return Promise.all(
    userDids.map(async (userDid) => {
      const webhookParams =
        consecutiveFailures === undefined
          ? omit(
              {
                ...webhook,
                enabled: enabled ?? webhook.enabled,
              },
              ['consecutiveFailures']
            )
          : {
              ...webhook,
              enabled: enabled ?? webhook.enabled,
              consecutiveFailures,
            };
      await state.updateWebhook(userDid, webhookParams, (updated) => {
        createWebhookDisabledNotification(api, { teamDid, userDid, webhook: updated });
      });
    })
  );
}

module.exports = {
  USER_RELATION_ACTIONS,
  USER_RELATION_QUERIES,
  userFollowAction,
  getUserFollows,
  getUserFollowStats,
  checkFollowing,
  getUserInvites,
  createWebhookDisabledNotification,
  updateWebHookState,
};
