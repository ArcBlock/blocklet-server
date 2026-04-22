const { isBlockletRole, ROLES } = require('@abtnode/constant');

module.exports = ({ receiver }, context) => {
  const { role, did } = context.user;

  if (!isBlockletRole(role) && ![ROLES.ADMIN, ROLES.OWNER].includes(role) && did !== receiver) {
    throw new Error("You cannot access other user's notification");
  }
};
