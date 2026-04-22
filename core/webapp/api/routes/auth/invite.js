const {
  createInvitationRequest,
  handleInvitationResponse,
  messages,
  checkWalletVersion,
  beforeInvitationRequest,
  canSessionBeElevated,
} = require('@abtnode/auth/lib/auth');
const get = require('lodash/get');

const logger = require('@abtnode/logger')(require('../../../package.json').name);

const { createToken } = require('../../libs/login');

module.exports = function createRoutes(node) {
  return {
    action: 'invite',

    onStart: async ({ extraParams }) => {
      const { locale = 'en', inviteId } = extraParams;
      const nodeInfo = await node.getNodeInfo();
      const teamDid = nodeInfo.did;

      await beforeInvitationRequest({ node, teamDid, locale, inviteId });
    },

    claims: {
      profile: async ({ userDid, extraParams }) => {
        const nodeInfo = await node.getNodeInfo();
        const { locale, inviteId } = extraParams;

        const tmpInvitation = await node.getInvitation({ teamDid: nodeInfo.did, inviteId });

        if (tmpInvitation.role === 'owner' && userDid === nodeInfo.nodeOwner.did) {
          throw new Error(messages.notAllowedTransferToSelf[locale]);
        }

        if ((await node.isInitialized()) === false) {
          throw new Error(messages.notInitialized[locale]);
        }

        return {
          fields: ['fullName', 'email', 'avatar'],
          description: messages.description[locale],
        };
      },

      signature: async ({ extraParams, context: { baseUrl, didwallet } }) => {
        const { locale, inviteId } = extraParams;
        checkWalletVersion({ didwallet, locale });
        const nodeInfo = await node.getNodeInfo();
        const teamDid = nodeInfo.did;

        return createInvitationRequest({ node, nodeInfo, teamDid, inviteId, locale, baseUrl });
      },
    },

    onAuth: async ({ claims, userDid, userPk, updateSession, extraParams, req, baseUrl }) => {
      const { locale, inviteId, previousWorkflowData } = extraParams;
      const nodeInfo = await node.getNodeInfo();
      const teamDid = nodeInfo.did;
      const statusEndpointBaseUrl = baseUrl;
      const endpoint = baseUrl;

      const { passport, response, role } = await handleInvitationResponse({
        req,
        node,
        nodeInfo,
        teamDid,
        userDid,
        userPk,
        inviteId,
        locale,
        claims,
        statusEndpointBaseUrl,
        endpoint,
        newNftOwner: get(previousWorkflowData, 'userDid'),
      });

      const profile = claims.find(x => x.type === 'profile');
      // Generate new session token that client can save to localStorage
      const { sessionToken, refreshToken } = await createToken(userDid, {
        secret: await node.getSessionSecret(),
        passport,
        role,
        fullName: profile?.fullName,
        elevated: canSessionBeElevated(role, nodeInfo),
      });
      await updateSession({ sessionToken, refreshToken }, true);
      await updateSession({ passportId: response.data.id });
      logger.info('invite.success', { userDid });

      return response;
    },
  };
};
