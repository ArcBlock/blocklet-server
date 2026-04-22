const defaults = require('lodash/defaults');
const logger = require('@abtnode/logger')('@abtnode/core:api:team:session');
const { Op } = require('sequelize');
const { USER_SESSION_STATUS, SESSION_TTL } = require('@abtnode/constant');
const { BlockletEvents } = require('@blocklet/constant');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { callFederated, getFederatedMaster, findFederatedSite } = require('@abtnode/auth/lib/util/federated');

const { getBlocklet } = require('../../util/blocklet');

/**
 * Get user session where clause
 * @param {Object} params
 * @param {string} params.status - Session status
 * @param {Object} params.blocklet - Blocklet
 * @returns {Object}
 */
const getUserSessionWhere = ({ status, blocklet }) => {
  const now = Date.now();
  const sessionTtl = blocklet.settings?.session?.ttl || SESSION_TTL;
  if (status === USER_SESSION_STATUS.ONLINE) {
    return {
      updatedAt: {
        [Op.gt]: new Date(now - sessionTtl * 1000),
      },
      status: {
        [Op.ne]: USER_SESSION_STATUS.OFFLINE,
      },
    };
  }
  if (status === USER_SESSION_STATUS.EXPIRED) {
    return {
      updatedAt: {
        [Op.lt]: new Date(now - sessionTtl * 1000),
      },
      status: {
        [Op.ne]: USER_SESSION_STATUS.OFFLINE,
      },
    };
  }
  if (status === USER_SESSION_STATUS.OFFLINE) {
    return {
      status: USER_SESSION_STATUS.OFFLINE,
    };
  }
  return {};
};

/**
 * Get user session
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.id - Session ID
 * @param {boolean} params.includeUser - Include user data
 * @returns {Promise<Object>}
 */
async function getUserSession(api, { teamDid, id, includeUser = false }) {
  const state = await api.getUserSessionState(teamDid);
  const userState = await api.getUserState(teamDid);

  const where = {
    status: USER_SESSION_STATUS.ONLINE,
    id,
  };
  const include = [];
  if (includeUser) {
    include.push({
      model: userState.model,
      as: 'user',
      attributes: ['did', 'pk', 'sourceProvider', 'fullName', 'email', 'avatar', 'remark', 'sourceAppPid', 'approved'],
    });
  }

  const userSession = await state.model.findOne({
    where,
    attributes: [
      'id',
      'appPid',
      'userDid',
      'visitorId',
      'passportId',
      'createdAt',
      'updatedAt',
      'extra',
      'ua',
      'lastLoginIp',
      'status',
    ],
    include,
  });
  return userSession?.toJSON?.();
}

/**
 * Get user sessions
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.query - Query options
 * @param {Object} params.paging - Paging options
 * @param {Object} params.sort - Sort options
 * @returns {Promise<Object>}
 */
async function getUserSessions(api, { teamDid, query = {}, paging, sort }) {
  const nodeInfo = await api.node.read({ useCache: true });
  if (teamDid === nodeInfo.did) {
    return {
      list: [],
      paging: {
        page: 1,
        pageCount: 0,
        pageSize: 10,
        total: 0,
      },
    };
  }

  const { userDid, visitorId, appPid, includeUser = false, status = USER_SESSION_STATUS.ONLINE } = query;
  const state = await api.getUserSessionState(teamDid);
  const userState = await api.getUserState(teamDid);
  const where = {};
  if (userDid) where.userDid = userDid;
  if (visitorId) where.visitorId = visitorId;
  if (appPid) where.appPid = appPid;

  const blocklet = await getBlocklet({ did: teamDid, states: api.states, dataDirs: api.dataDirs, useCache: true });
  const whereStatus = getUserSessionWhere({ status, blocklet });
  Object.assign(where, whereStatus);
  const include = [];
  if (includeUser) {
    include.push({
      model: userState.model,
      as: 'user',
      attributes: ['did', 'pk', 'sourceProvider', 'fullName', 'email', 'avatar', 'remark', 'sourceAppPid', 'approved'],
    });
  }

  const result = await state.paginate(
    {
      where,
      attributes: [
        'id',
        'appPid',
        'userDid',
        'visitorId',
        'passportId',
        'createdAt',
        'updatedAt',
        'extra',
        'ua',
        'lastLoginIp',
        'status',
        'createdByAppPid',
      ],
      include,
    },
    { updatedAt: -1, ...sort },
    { pageSize: 10, ...paging }
  );

  // NOTICE: 保留结构，方便理解
  return {
    list: result.list,
    paging: result.paging,
  };
}

/**
 * Get user sessions count
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.query - Query options
 * @returns {Promise<Object>}
 */
async function getUserSessionsCount(api, { teamDid, query = {} }) {
  const nodeInfo = await api.node.read();
  if (teamDid === nodeInfo.did) {
    return {
      count: 0,
    };
  }
  const { userDid, visitorId, appPid, status = USER_SESSION_STATUS.ONLINE } = query;
  const state = await api.getUserSessionState(teamDid);
  const where = {};
  if (userDid) where.userDid = userDid;
  if (visitorId) where.visitorId = visitorId;
  if (appPid) where.appPid = appPid;

  const blocklet = await getBlocklet({ did: teamDid, states: api.states, dataDirs: api.dataDirs, useCache: true });
  const whereStatus = getUserSessionWhere({ status, blocklet });
  Object.assign(where, whereStatus);

  // HACK: 使用 state.count 并不能按预期工作，先改为使用 state.model.count 来实现
  const result = await state.model.count({ where });
  return {
    count: result,
  };
}

/**
 * Get passport by ID
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.passportId - Passport ID
 * @returns {Promise<Object>}
 */
async function getPassportById(api, { teamDid, passportId }) {
  const userState = await api.getUserState(teamDid);
  const passport = await userState.getPassportById(passportId);
  return passport;
}

/**
 * Get passport from federated
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {Object} params.site - Site
 * @param {string} params.passportId - Passport ID
 * @param {string} params.teamDid - Team DID
 * @returns {Promise<Object>}
 */
async function getPassportFromFederated(api, { site, passportId, teamDid }) {
  try {
    const blocklet = await getBlocklet({
      did: teamDid,
      states: api.states,
      dataDirs: api.dataDirs,
      useCache: true,
    });
    const nodeInfo = await api.node.read();
    const { permanentWallet } = getBlockletInfo(blocklet, nodeInfo.sk);

    const result = await callFederated({
      action: 'getPassport',
      data: {
        passportId,
      },
      permanentWallet,
      site,
      requestOptions: {
        // 缩短查询通行证的请求时间，这个请求不会很复杂
        timeout: 3 * 1000,
      },
    });

    return result;
  } catch (error) {
    // 吞没错误，查询失败也不会影响整个快捷登录流程
    logger.error('Failed to getPassportFromFederated', { site, passportId, teamDid, error });
    return null;
  }
}

/**
 * Upsert user session
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.appPid - App PID
 * @param {string} params.userDid - User DID
 * @param {string} params.visitorId - Visitor ID
 * @param {string} params.ua - User agent
 * @param {string} params.lastLoginIp - Last login IP
 * @param {string} params.passportId - Passport ID
 * @param {string} params.status - Status
 * @param {Object} params.extra - Extra data
 * @param {string} params.locale - Locale
 * @param {string} params.origin - Origin
 * @param {Object} options
 * @param {boolean} options.skipNotification - Skip notification
 * @returns {Promise<Object>}
 */
async function upsertUserSession(
  api,
  {
    teamDid,
    appPid,
    userDid,
    visitorId,
    ua,
    lastLoginIp,
    passportId,
    status,
    extra,
    locale,
    origin,
    createdByAppPid: _createdByAppPid,
  },
  { skipNotification = false } = {}
) {
  if (!userDid) {
    throw new Error('userDid is required');
  }
  if (visitorId) {
    if (visitorId.length > 80) {
      throw new Error('visitorId should be less than 80 characters');
    }
  }
  // default to itself appPid
  const createdByAppPid = _createdByAppPid || teamDid;

  const state = await api.getUserSessionState(teamDid);
  let data;
  if (!visitorId) {
    data = await state.insert({
      userDid,
      ua,
      lastLoginIp,
      appPid,
      passportId,
      extra,
      createdByAppPid,
    });
    logger.info('insert userSession successfully', {
      userDid,
      ua,
      lastLoginIp,
      appPid,
      passportId,
      extra,
      createdByAppPid,
    });
    // 只有登录当前应用，才发送通知
    if (createdByAppPid === teamDid) {
      api.emit(BlockletEvents.addUserSession, {
        userSession: data,
        teamDid,
        userDid,
        locale,
        skipNotification,
        origin,
      });
    }
  } else {
    const exist = await state.findOne({ userDid, visitorId, appPid });
    if (exist) {
      const mergeExtra = defaults({}, extra || {}, exist.extra || {});
      [, [data]] = await state.update(exist.id, {
        passportId,
        lastLoginIp,
        ua,
        status,
        extra: mergeExtra,
        createdByAppPid,
      });
      logger.info('update userSession successfully', {
        id: exist.id,
        ua,
        lastLoginIp,
        passportId,
        status,
        extra: mergeExtra,
        createdByAppPid,
      });
      // 只有登录当前应用，才发送通知
      if (createdByAppPid === teamDid) {
        if (Date.now() - new Date(exist.createdAt).getTime() < 1000 * 10) {
          // HACK: 此处是为了矫正首次创建 userSession 没有 ua 的情况，会通过 /api/did/session 接口来更新 ua 信息，这个时候才能当成新增 userSession 来发送通知
          api.emit(BlockletEvents.addUserSession, {
            userSession: data,
            teamDid,
            userDid,
            locale,
            skipNotification,
            origin,
          });
        } else {
          api.emit(BlockletEvents.updateUserSession, {
            userSession: data,
            teamDid,
            userDid,
            skipNotification,
            origin,
          });
        }
      }
    } else {
      data = await state.insert({
        visitorId,
        userDid,
        ua,
        lastLoginIp,
        appPid,
        passportId,
        extra,
        createdByAppPid,
      });
      logger.info('insert userSession successfully', {
        visitorId,
        userDid,
        ua,
        lastLoginIp,
        appPid,
        passportId,
        extra,
        createdByAppPid,
      });
      // 只有登录当前应用，才发送通知
      if (createdByAppPid === teamDid) {
        api.emit(BlockletEvents.addUserSession, {
          userSession: data,
          teamDid,
          userDid,
          locale,
          skipNotification,
          origin,
        });
      }
    }
  }

  return data;
}

/**
 * Sync user session
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.targetAppPid - Target app PID
 * @param {string} params.userDid - User DID
 * @param {string} params.visitorId - Visitor ID
 * @param {string} params.ua - User agent
 * @param {string} params.lastLoginIp - Last login IP
 * @param {string} params.passportId - Passport ID
 * @param {Object} params.extra - Extra data
 * @returns {Promise<void>}
 */
async function syncUserSession(api, { teamDid, targetAppPid, userDid, visitorId, ua, lastLoginIp, passportId, extra }) {
  if (!targetAppPid) return;

  const blocklet = await getBlocklet({ did: teamDid, states: api.states, dataDirs: api.dataDirs, useCache: true });
  const nodeInfo = await api.node.read();
  const { permanentWallet } = getBlockletInfo(blocklet, nodeInfo.sk);

  const targetSite = findFederatedSite(blocklet, targetAppPid);
  const masterSite = getFederatedMaster(blocklet);

  let syncSite = null;
  let appPid;
  if (masterSite && targetSite) {
    if (targetSite.appPid === masterSite.appPid) {
      if (teamDid !== masterSite.appPid) {
        syncSite = masterSite;
        appPid = teamDid;
      }
    } else if (teamDid === masterSite.appPid) {
      syncSite = targetSite;
      appPid = targetAppPid;
    }

    if (syncSite) {
      try {
        const userSession = {
          action: 'login',
          userDid,
          visitorId,
          ua,
          lastLoginIp,
          appPid,
          passportId,
          extra,
        };
        await callFederated({
          action: 'sync',
          permanentWallet,
          site: targetSite,
          data: {
            userSessions: [userSession],
          },
        });
        logger.debug('Sync userSession to federated site successfully', {
          userDid,
          visitorId,
          ua,
          lastLoginIp,
          appPid,
          passportId,
          targetSite,
          extra,
        });
      } catch (err) {
        logger.error(
          'Sync userSession to federated site failed',
          {
            userDid,
            visitorId,
            ua,
            lastLoginIp,
            appPid,
            passportId,
            targetSite,
            extra,
          },
          err
        );
      }
    }
  }
}

/**
 * Logout user
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.userDid - User DID
 * @param {string} params.visitorId - Visitor ID
 * @param {string} params.appPid - App PID
 * @param {string} params.status - Status
 * @param {boolean} params.remove - Remove session
 * @returns {Promise<number>}
 */
async function logoutUser(api, { teamDid, userDid, visitorId = '', appPid = '', status = '', remove = false }) {
  if (!userDid) {
    throw new Error('userDid is required');
  }
  if (!teamDid) {
    throw new Error('teamDid is required');
  }

  const nodeInfo = await api.node.read();
  if (nodeInfo.did === teamDid) {
    return 0;
  }
  const userSessionState = await api.getUserSessionState(teamDid);
  const where = { userDid };
  if (visitorId) where.visitorId = visitorId;
  if (appPid) where.appPid = appPid;

  const blocklet = await getBlocklet({ did: teamDid, states: api.states, dataDirs: api.dataDirs, useCache: true });
  const whereStatus = getUserSessionWhere({ status, blocklet });
  Object.assign(where, whereStatus);
  let result;
  if (remove) {
    result = await userSessionState.remove(where);
  } else {
    result = await userSessionState.update(where, { $set: { status: USER_SESSION_STATUS.OFFLINE } });
  }
  const { permanentWallet } = getBlockletInfo(blocklet, nodeInfo.sk);
  const masterSite = getFederatedMaster(blocklet);
  if (masterSite && masterSite.isMaster !== false && masterSite.appPid !== teamDid) {
    callFederated({
      action: 'sync',
      permanentWallet,
      // FIXME: 是否还需要通知其他 Member 站点，执行退出登录的操作
      site: masterSite,
      data: {
        userSessions: [
          {
            action: 'logout',
            userDid,
            visitorId,
            // HACK: 如果未传入 appPid，代表要注销当前用户在 master 中所有登录状态，所以传入 undefined；否则就只注销 master 中记录的当前 member 的登录状态
            appPid: appPid ? teamDid : undefined,
            remove,
          },
        ],
      },
    });
  }
  return result;
}

module.exports = {
  getUserSessionWhere,
  getUserSession,
  getUserSessions,
  getUserSessionsCount,
  getPassportById,
  getPassportFromFederated,
  upsertUserSession,
  syncUserSession,
  logoutUser,
};
