const {
  createIssuePassportRequest,
  handleIssuePassportResponse,
  checkWalletVersion,
  beforeIssuePassportRequest,
  canSessionBeElevated,
} = require('@abtnode/auth/lib/auth');
const { createToken } = require('../../libs/login');

module.exports = function createRoutes(node) {
  return {
    action: 'issue-passport',

    onStart: async ({ extraParams }) => {
      const { locale = 'en', id } = extraParams;

      const nodeInfo = await node.getNodeInfo();
      const teamDid = nodeInfo.did;

      await beforeIssuePassportRequest({ node, teamDid, locale, id });
    },

    claims: {
      signature: async ({ extraParams, context: { baseUrl, didwallet } }) => {
        const { id, locale, visitorId } = extraParams;
        checkWalletVersion({ didwallet, locale });
        const nodeInfo = await node.getNodeInfo();
        const teamDid = nodeInfo.did;

        return createIssuePassportRequest({ node, nodeInfo, teamDid, id, locale, baseUrl, visitorId });
      },
    },

    onAuth: async ({ userDid, userPk, claims, extraParams, updateSession, req, baseUrl }) => {
      const { locale, id, inviteId } = extraParams;
      const nodeInfo = await node.getNodeInfo();
      const teamDid = nodeInfo.did;
      const statusEndpointBaseUrl = baseUrl;
      const endpoint = baseUrl;

      const { response, passport, role } = await handleIssuePassportResponse({
        req,
        node,
        nodeInfo,
        teamDid,
        userDid,
        userPk,
        id,
        locale,
        claims,
        statusEndpointBaseUrl,
        updateSession,
        endpoint,
        inviteId,
      });

      const profile = claims.find(x => x.type === 'profile');
      const { sessionToken, refreshToken } = await createToken(userDid, {
        secret: await node.getSessionSecret(),
        passport,
        role,
        fullName: profile?.fullName,
        elevated: canSessionBeElevated(role, nodeInfo),
      });
      await updateSession({ sessionToken, refreshToken }, true);
      await updateSession({ passportId: passport.id });

      return response;
    },
  };
};
