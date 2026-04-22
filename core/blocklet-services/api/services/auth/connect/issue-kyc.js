const { joinURL } = require('ufo');
const {
  checkWalletVersion,
  beforeIssueKycRequest,
  handleIssueKycResponse,
  messages,
} = require('@abtnode/auth/lib/auth');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { getSourceAppPid } = require('@blocklet/sdk/lib/util/login');

const { syncFederatedUser } = require('../../../util/federated');

module.exports = function createRoutes(node) {
  return {
    action: 'issue-kyc',

    onStart: async ({ extraParams, req }) => {
      const { code, locale = 'en' } = extraParams;
      const teamDid = req.get('x-blocklet-did');
      await beforeIssueKycRequest({ node, teamDid, code, locale });
    },

    claims: {
      profile: ({ extraParams, context: { didwallet } }) => {
        const { locale } = extraParams;
        checkWalletVersion({ didwallet, locale });
        return {
          type: 'profile',
          description: messages.description[locale],
          items: ['fullName', 'avatar'],
        };
      },
    },

    onAuth: async ({ userDid, userPk, claims, extraParams, request, baseUrl }) => {
      const { locale, code, updateKyc, inviter } = extraParams;
      const nodeInfo = await node.getNodeInfo();
      const blocklet = await request.getBlocklet();
      const statusEndpointBaseUrl = joinURL(baseUrl, WELLKNOWN_SERVICE_PATH_PREFIX);
      const endpoint = baseUrl;
      const sourceAppPid = getSourceAppPid(request);

      const result = await handleIssueKycResponse({
        request,
        node,
        nodeInfo,
        teamDid: blocklet.appPid,
        userDid,
        userPk,
        code,
        locale,
        claims,
        statusEndpointBaseUrl,
        endpoint,
        inviter,
        updateKyc: updateKyc === '1',
        sourceAppPid,
      });

      syncFederatedUser(blocklet, node, result.user, sourceAppPid);

      return result.credential;
    },
  };
};
