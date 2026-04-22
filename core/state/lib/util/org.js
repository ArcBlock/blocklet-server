const { ROLES, SERVER_ROLES } = require('@abtnode/constant');
const { getAppUrl } = require('@blocklet/meta/lib/util');
const { CustomError } = require('@blocklet/error');
const { joinURL, withQuery } = require('ufo');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const get = require('lodash/get');

const { isAdminPath, getEndpoint } = require('./verify-access-key-user');

const MAX_PAGE_SIZE = 100;

const formatPaging = (paging) => {
  const { pageSize = 20, page = 1 } = paging || {};
  const newPageSize = Math.max(1, Math.min(MAX_PAGE_SIZE, parseInt(pageSize, 10)));
  const newPage = Math.max(1, parseInt(page, 10));
  return { pageSize: newPageSize, page: newPage };
};

const isAdminUser = (user) => {
  const { role = '' } = user || {};
  if (!role) {
    return false;
  }
  return [ROLES.ADMIN, ROLES.OWNER, SERVER_ROLES.BLOCKLET_ADMIN, SERVER_ROLES.BLOCKLET_OWNER].includes(role);
};

const isOrgOwner = (user, org) => {
  const { did } = user || {};
  if (!org) {
    throw new CustomError(403, 'Org not found');
  }
  return org.ownerDid === did;
};

const isAdmingPath = (context = {}) => {
  try {
    const pathname = getEndpoint(context);
    return isAdminPath(pathname);
  } catch (error) {
    return false;
  }
};

const getOrgInviteLink = (inviteInfo, blocklet) => {
  const { inviteId } = inviteInfo || {};
  const appUrl = getAppUrl(blocklet);
  if (!inviteId || !appUrl) {
    throw new CustomError(500, 'Invitation link creation failed, please try again later');
  }
  return withQuery(joinURL(appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, 'invite'), { inviteId });
};

const createOrgValidators = (blocklet = {}) => {
  function getOrgSettings() {
    const org = get(blocklet, 'settings.org', { enabled: false, maxMemberPerOrg: 100, maxOrgPerUser: 10 });
    return org || { enabled: false, maxMemberPerOrg: 100, maxOrgPerUser: 10 };
  }

  const org = getOrgSettings();

  function verifyOrgEnabled() {
    if (!org?.enabled) {
      throw new CustomError(403, 'Org is not enabled');
    }
    return true;
  }

  function veriftMaxMemberPerOrg(number) {
    verifyOrgEnabled();
    if (number >= org.maxMemberPerOrg) {
      throw new CustomError(403, `The current org can invite up to ${org.maxMemberPerOrg} members`);
    }
    return true;
  }

  function veriftMaxOrgPerUser(number) {
    verifyOrgEnabled();
    if (number >= org.maxOrgPerUser) {
      throw new CustomError(403, `You can create up to ${org.maxOrgPerUser} orgs`);
    }
    return true;
  }

  return {
    verifyOrgEnabled,
    veriftMaxMemberPerOrg,
    veriftMaxOrgPerUser,
    getOrgSettings,
  };
};

module.exports = {
  formatPaging,
  isAdminUser,
  isOrgOwner,
  isAdmingPath,
  getOrgInviteLink,
  createOrgValidators,
};
