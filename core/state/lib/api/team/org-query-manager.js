const logger = require('@abtnode/logger')('@abtnode/core:api:team:org-query');
const { getUserAvatarUrl } = require('@abtnode/util/lib/user');

const { getBlocklet } = require('../../util/blocklet');

/**
 * Get orgs
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function getOrgs(api, { teamDid, ...payload }, context) {
  try {
    const state = await api.getOrgState(teamDid);
    const { passports, orgs, ...rest } = await state.list(payload, context);
    const { includePassports = true } = payload.options || {};
    if (includePassports) {
      // 获取每个组织的 passports
      const orgPassports = await Promise.all(orgs.map((o) => api.getRoles({ teamDid, orgId: o.id })));

      orgs.forEach((o, index) => {
        const roles = orgPassports[index]; // 获取每个组织的角色
        // 过滤 passports
        o.passports = passports.filter((p) => roles.some((r) => r.name === p.name));
      });
    } else {
      orgs.forEach((o) => {
        o.passports = [];
      });
    }

    return {
      ...rest,
      orgs,
    };
  } catch (err) {
    logger.error('Failed to get orgs', { err, teamDid });
    throw err;
  }
}

/**
 * Get org
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.id - Org ID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function getOrg(api, { teamDid, id }, context) {
  try {
    const state = await api.getOrgState(teamDid);
    return state.get({ id }, context);
  } catch (err) {
    logger.error('Failed to get org', { err, teamDid, id });
    throw err;
  }
}

/**
 * Get org members
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.orgId - Org ID
 * @param {Object} params.paging - Paging
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function getOrgMembers(api, { teamDid, orgId, paging }, context) {
  try {
    const state = await api.getOrgState(teamDid);
    const result = await state.getOrgMembers({ orgId, paging, options: { includePassport: true } }, context);
    const info = await api.node.read();
    const isServer = api.teamManager.isNodeTeam(teamDid);
    const blocklet = await getBlocklet({ did: teamDid, states: api.states, dataDirs: api.dataDirs });
    const baseUrl = blocklet.environmentObj.BLOCKLET_APP_URL;
    const roles = await api.getRoles({ teamDid, orgId });
    result.users.forEach((item) => {
      if (item?.user?.avatar) {
        item.user.avatar = getUserAvatarUrl(baseUrl, item.user.avatar, info, isServer);
      }
      if (item?.user?.passports?.length > 0) {
        item.user.passports = item.user.passports.filter((passport) =>
          roles.some((roleItem) => roleItem.name === passport.name)
        );
      }
    });

    return result;
  } catch (err) {
    logger.error('Get org members failed', { err, teamDid, orgId });
    throw err;
  }
}

/**
 * Get org invitable users
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.id - Org ID
 * @param {string} params.query - Query
 * @param {Object} params.paging - Paging
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function getOrgInvitableUsers(api, { teamDid, id, query, paging }, context) {
  try {
    const state = await api.getOrgState(teamDid);
    return state.getOrgInvitableUsers({ id, query, paging }, context);
  } catch (err) {
    logger.error('Get org invitable users failed', { err, teamDid, id });
    throw err;
  }
}

module.exports = {
  getOrgs,
  getOrg,
  getOrgMembers,
  getOrgInvitableUsers,
};
