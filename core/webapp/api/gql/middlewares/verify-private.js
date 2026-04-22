const { CustomError } = require('@blocklet/error');
const { isInDashboard, isAdminUser, isUserPrivacyEnabled } = require('@abtnode/core/lib/util/verify-user-private');

module.exports = async ({ teamDid, userDid }, context = {}, node = {}, action = '') => {
  const { did = '', userInfo = {} } = context?.user || {};

  // userInfo.did 是 sdk 环境下的 did，did 是 web 环境下的 did
  const reqUserDid = userInfo.did || did;
  if (!reqUserDid) {
    throw new CustomError(400, 'Unauthorized: Missing user context');
  }

  const nodeInfo = await node.getNodeInfo();
  const prefix = process.env.NODE_ENV !== 'development' ? nodeInfo.routing.adminPath : '';

  if (reqUserDid !== userDid && !(isInDashboard(teamDid, prefix, context) && isAdminUser(context))) {
    if (action === 'getUserInvites') {
      // Block access to other users' invite lists
      throw new CustomError(403, 'You cannot view the invites of other users');
    } else {
      const targetUser = await node.getUser({
        teamDid,
        user: { did: userDid },
        options: { enableConnectedAccount: true },
      });
      if (!targetUser) {
        throw new CustomError(400, `User does not exist: ${userDid}`);
      }
      const isPrivate = isUserPrivacyEnabled(targetUser);
      if (isPrivate) {
        throw new CustomError(403, 'User profile is private and cannot be viewed');
      }
    }
  }
};
