const { ROLES, SERVER_ROLES, WELLKNOWN_BLOCKLET_USER_PATH } = require('@abtnode/constant');
const get = require('lodash/get');
const { joinURL } = require('ufo');
const logger = require('@abtnode/logger')('@abtnode/core:util:verify-user-private');

const { getEndpoint, isServerDashboardPath, isAdminPath } = require('./verify-access-key-user');

const USER_FOLLOWERS_PATH = joinURL(WELLKNOWN_BLOCKLET_USER_PATH, 'user-followers');

const isAdminUser = (context) => {
  const { user = {} } = context || {};
  const role = user.userInfo?.role || user.role;
  return [ROLES.ADMIN, ROLES.OWNER, SERVER_ROLES.BLOCKLET_ADMIN, SERVER_ROLES.BLOCKLET_OWNER].includes(role);
};

const isUserPrivacyEnabled = (userInfo) => {
  // 在 server 的dashboard 和 service 的 dashboard 中，不需要判断
  const privacyInfo = get(userInfo, 'extra.privacy', {});
  return get(privacyInfo, USER_FOLLOWERS_PATH, false);
};

const isInDashboard = (teamDid, prefix, context = {}) => {
  const { user = {}, hostname, referrer } = context || {};
  if (user.role === SERVER_ROLES.BLOCKLET_SDK || !teamDid) {
    return false;
  }

  if (!hostname || !referrer) {
    logger.warn('Missing hostname or referrer context');
    return false;
  }

  try {
    const pathname = getEndpoint(context);
    return isAdminPath(pathname) || isServerDashboardPath(pathname, prefix, teamDid);
  } catch (error) {
    logger.warn('Failed to check if in dashboard', { error });
    return false;
  }
};

module.exports = { isInDashboard, isUserPrivacyEnabled, isAdminUser };
