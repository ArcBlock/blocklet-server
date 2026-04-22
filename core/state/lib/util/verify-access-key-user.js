const { CustomError } = require('@blocklet/error');
const {
  ROLES,
  SERVER_ROLES,
  WELLKNOWN_BLOCKLET_ADMIN_PATH,
  WELLKNOWN_BLOCKLET_USER_PATH,
} = require('@abtnode/constant');

const { parseURL, joinURL } = require('ufo');

const isAdminPath = (pathname) => pathname.startsWith(WELLKNOWN_BLOCKLET_ADMIN_PATH);
const isUserCenterPath = (pathname) => pathname.startsWith(WELLKNOWN_BLOCKLET_USER_PATH);
const isServerDashboardPath = (pathname, prefix, teamDid) =>
  !teamDid ? false : pathname.startsWith(joinURL(prefix, 'blocklets', teamDid));

const getEndpoint = (context) => {
  const { pathname } = parseURL(context.referrer);
  return pathname;
};

const validateOperator = (context, operatorDid) => {
  const { user, hostname, referrer } = context || {};

  if (!user) {
    throw new CustomError(400, 'Missing user context');
  }

  const { did, role = '' } = user;

  // 非 SDK 环境才进行验证
  if (role !== SERVER_ROLES.BLOCKLET_SDK) {
    if (!hostname || !referrer) {
      throw new CustomError(400, 'Missing hostname or referrer context');
    }

    // eslint-disable-next-line no-useless-catch
    try {
      const pathname = getEndpoint(context);

      const isAdminUser = [ROLES.ADMIN, ROLES.OWNER, SERVER_ROLES.BLOCKLET_ADMIN, SERVER_ROLES.BLOCKLET_OWNER].includes(
        role
      );

      // 如果请求是 user center，只能访问自己的信息
      if (isUserCenterPath(pathname) && operatorDid && operatorDid !== did) {
        throw new CustomError(403, 'Unauthorized: You cannot view access keys created by other users');
      }

      // 如果是其他路径，必须是 admin
      if (!isUserCenterPath(pathname) && !isAdminUser) {
        throw new CustomError(403, 'Unauthorized: You cannot access admin page');
      }
    } catch (err) {
      throw err;
    }
  }
};

module.exports = { validateOperator, getEndpoint, isUserCenterPath, isAdminPath, isServerDashboardPath };
