const { ROLES, SERVER_ROLES } = require('@abtnode/constant');

const adminRoles = [ROLES.OWNER, ROLES.ADMIN, SERVER_ROLES.BLOCKLET_OWNER, SERVER_ROLES.BLOCKLET_ADMIN];
const memberRoles = [
  ROLES.OWNER,
  ROLES.ADMIN,
  ROLES.MEMBER,
  SERVER_ROLES.BLOCKLET_OWNER,
  SERVER_ROLES.BLOCKLET_ADMIN,
  SERVER_ROLES.BLOCKLET_MEMBER,
];

const getCheckMiddleware = (roles) => (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ code: 'forbidden', error: 'not authorized' });
    return;
  }

  if (roles.length && !roles.includes(req.user.role)) {
    res.status(403).json({ code: 'forbidden', error: 'no permission' });
    return;
  }

  next();
};

module.exports = {
  checkAdminPermission: getCheckMiddleware(adminRoles),
  checkMemberPermission: getCheckMiddleware(memberRoles),
  checkGuestPermission: getCheckMiddleware([]),
};
