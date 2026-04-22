const { ROLES, SERVER_ROLES } = require('@abtnode/constant');

module.exports = (params, context) => {
  const { role } = context.user;
  if (!role) {
    throw new Error('Unauthorized');
  }

  // 必须是 admin 或 owner 才能访问
  if (![ROLES.ADMIN, ROLES.OWNER, SERVER_ROLES.BLOCKLET_ADMIN, SERVER_ROLES.BLOCKLET_OWNER].includes(role)) {
    throw new Error('Forbidden. You do not have permission to access this resource.');
  }
};
