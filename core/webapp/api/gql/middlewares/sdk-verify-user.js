module.exports = ({ did, user }, context) => {
  if (!context?.user?.userInfo) {
    throw new Error('Unauthorized: Missing user context');
  }
  const { userInfo } = context.user;

  const editUser = did || user.did;
  if (!editUser) {
    throw new Error('Invalid request: Missing user DID');
  }
  if (userInfo.did !== editUser) {
    throw new Error('Unauthorized: You cannot edit other users profiles');
  }
};
