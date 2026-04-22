const pick = require('lodash/pick');
const pMap = require('p-map');
const { MAX_USER_PAGE_SIZE, PASSPORT_STATUS } = require('@abtnode/constant');

/**
 * Get users
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.query - Query
 * @param {Object} params.paging - Paging
 * @param {Object} params.sort - Sort
 * @param {Array} params.dids - DIDs
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function getUsers(api, { teamDid, query, paging: inputPaging, sort, dids }, context = {}) {
  const state = await api.getUserState(teamDid);
  const nodeInfo = await api.node.read();

  // HACK: 如果查询的是 server 的数据库，则不应该查询 userSession 表
  if (teamDid === nodeInfo.did) {
    if (query) {
      delete query.includeUserSessions;
    }
  }

  if (inputPaging?.pageSize > MAX_USER_PAGE_SIZE) {
    throw new Error(`Length of users should not exceed ${MAX_USER_PAGE_SIZE} per page`);
  }

  if (dids && dids.length > MAX_USER_PAGE_SIZE) {
    throw new Error(`Length of users should not exceed ${MAX_USER_PAGE_SIZE}`);
  }

  let list;
  let paging;

  if (dids) {
    list = await state.getUsersByDids({ query, dids }, context);
    paging = {
      total: list.length,
      pageSize: dids.length,
      pageCount: 1,
      page: 1,
    };
  } else {
    const doc = await state.getUsers({ query, sort, paging: { pageSize: 20, ...inputPaging } }, context);
    list = doc.list;
    paging = doc.paging;
  }

  let userSessionsCountList = [];
  if (teamDid !== nodeInfo.did && query?.includeUserSessions) {
    userSessionsCountList = await pMap(
      list,
      async (x) => {
        const { count: userSessionsCount } = await api.getUserSessionsCount({
          teamDid,
          query: {
            userDid: x.did,
            appPid: teamDid,
          },
        });
        return userSessionsCount;
      },
      { concurrency: 10 }
    );
  }
  const users = list.map(
    (d, index) => {
      const pickData = pick(d, [
        'did',
        'pk',
        'role',
        'email',
        'phone',
        'fullName',
        'approved',
        'createdAt',
        'updatedAt',
        'passports',
        'firstLoginAt',
        'lastLoginAt',
        'lastLoginIp',
        'remark',
        'avatar',
        'locale',
        'tags',
        'url',
        'inviter',
        'generation',
        'emailVerified',
        'phoneVerified',
        // oauth relate fields
        'sourceProvider',
        'sourceAppPid',
        'connectedAccounts',

        'metadata',
        'isFollowing',
        'name',
        'createdByAppPid',
      ]);

      return {
        ...pickData,
        userSessions: [],
        userSessionsCount: userSessionsCountList[index] || 0,
      };
    }

    // eslint-disable-next-line function-paren-newline
  );
  return {
    // FIXME: 这里做字段过滤的目的是？gql 本身已经对字段做了过滤了
    users,
    paging,
  };
}

/**
 * Get users count
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @returns {Promise<number>}
 */
async function getUsersCount(api, { teamDid }) {
  const state = await api.getUserState(teamDid);
  return state.count();
}

/**
 * Get users count per role
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @returns {Promise<Array>}
 */
async function getUsersCountPerRole(api, { teamDid }) {
  const roles = await api.getRoles({ teamDid });
  const state = await api.getUserState(teamDid);
  const names = ['$all', ...roles.filter((x) => !x.orgId).map((x) => x.name), '$none', '$blocked'];
  return Promise.all(
    names.map(async (name) => {
      const count = await state.countByPassport({ name, status: PASSPORT_STATUS.VALID });
      return { key: name, value: count };
    })
  );
}

/**
 * Get user
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.user - User
 * @param {Object} params.options - Options
 * @returns {Promise<Object>}
 */
async function getUser(api, { teamDid, user, options = {} }) {
  const state = await api.getUserState(teamDid);
  return state.getUser(user.did, options);
}

/**
 * Get connected account
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.id - Account ID
 * @returns {Promise<Object>}
 */
async function getConnectedAccount(api, { teamDid, id }) {
  const state = await api.getUserState(teamDid);
  return state.getConnectedAccount(id);
}

/**
 * Check if email is used
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.email - Email
 * @param {boolean} params.verified - Verified
 * @param {string} params.sourceProvider - Source provider
 * @returns {Promise<boolean>}
 */
async function isEmailUsed(api, { teamDid, email, verified = false, sourceProvider = '' }) {
  const state = await api.getUserState(teamDid);
  return state.isEmailUsed(email, verified, sourceProvider);
}

/**
 * Check if phone is used
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.phone - Phone
 * @param {boolean} params.verified - Verified
 * @returns {Promise<boolean>}
 */
async function isPhoneUsed(api, { teamDid, phone, verified = false }) {
  const state = await api.getUserState(teamDid);
  return state.isPhoneUsed(phone, verified);
}

/**
 * Get user by DID
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.userDid - User DID
 * @param {Array} params.attributes - Attributes
 * @returns {Promise<Object>}
 */
async function getUserByDid(api, { teamDid, userDid, attributes = [] }) {
  const state = await api.getUserState(teamDid);
  return state.getUserByDid(userDid, attributes);
}

/**
 * Check if user is valid
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.userDid - User DID
 * @returns {Promise<boolean>}
 */
async function isUserValid(api, { teamDid, userDid }) {
  const state = await api.getUserState(teamDid);
  return state.isUserValid(userDid);
}

/**
 * Check if passport is valid
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.passportId - Passport ID
 * @returns {Promise<boolean>}
 */
async function isPassportValid(api, { teamDid, passportId }) {
  const state = await api.getUserState(teamDid);
  return state.isPassportValid(passportId);
}

/**
 * Check if is connected account
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.did - DID
 * @returns {Promise<boolean>}
 */
async function isConnectedAccount(api, { teamDid, did }) {
  const state = await api.getUserState(teamDid);
  return state.isConnectedAccount(did);
}

/**
 * Get owner
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @returns {Promise<Object>}
 */
async function getOwner(api, { teamDid }) {
  let owner = await api.teamManager.getOwner(teamDid);
  const state = await api.getUserState(teamDid);
  if (!owner) {
    const ownerDids = await state.getOwnerDids();
    if (ownerDids.length > 0) {
      owner = { did: ownerDids[0] };
    }
  }

  if (!owner) {
    return null;
  }

  // NOTICE: 目前 owner 只能为 did-wallet，无需查询 connectedAccount
  const full = await state.getUser(owner.did);
  return full || owner;
}

module.exports = {
  getUsers,
  getUsersCount,
  getUsersCountPerRole,
  getUser,
  getConnectedAccount,
  isEmailUsed,
  isPhoneUsed,
  getUserByDid,
  isUserValid,
  isPassportValid,
  isConnectedAccount,
  getOwner,
};
