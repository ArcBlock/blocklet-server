const { messages } = require('@abtnode/auth/lib/auth');
const { getKycClaims, verifyKycClaims, getProfileItems, isProfileClaimRequired } = require('../../../libs/kyc');
const { syncFederatedUser } = require('../../../util/federated');

// Used to update user kyc status using existing certificates
// eslint-disable-next-line no-unused-vars
module.exports = function createRoutes(node, authenticator, createSessionToken) {
  return {
    action: 'update-kyc',

    onConnect: async ({ userDid, extraParams, request, baseUrl }) => {
      const { locale, sourceAppPid } = extraParams;
      const blocklet = await request.getBlocklet();
      const user = await node.getUser({
        teamDid: blocklet.appPid,
        user: { did: userDid },
        options: { enableConnectedAccount: true },
      });
      if (!user) {
        throw new Error(messages.userNotFound[locale]);
      }
      if (!user.approved) {
        throw new Error(messages.notAllowedAppUser[locale]);
      }

      const claims = {};
      if (isProfileClaimRequired(blocklet, user)) {
        const profileItems = getProfileItems(blocklet.settings?.session, request.context.didwallet);
        claims.profile = {
          type: 'profile',
          description: messages.description[locale],
          items: profileItems,
        };
      }

      const kycClaims = await getKycClaims({ blocklet, user, locale, baseUrl, sourceAppPid });
      Object.assign(claims, kycClaims);
      if (Object.keys(claims).length === 0) {
        throw new Error(messages.noKycRequired[locale]);
      }

      return claims;
    },

    onAuth: async ({ userDid, claims, challenge, extraParams, request }) => {
      const { locale, sourceAppPid } = extraParams;
      const blocklet = await request.getBlocklet();
      const user = await node.getUser({
        teamDid: blocklet.appPid,
        user: { did: userDid },
        options: { enableConnectedAccount: true },
      });
      if (!user) {
        throw new Error(messages.userNotFound[locale]);
      }
      if (!user.approved) {
        throw new Error(messages.notAllowedAppUser[locale]);
      }

      const kycUpdates = await verifyKycClaims({
        node,
        blocklet,
        teamDid: blocklet.appPid,
        claims,
        challenge,
        locale,
        sourceAppPid,
        user,
      });

      const updatedUser = await node.updateUser({
        teamDid: blocklet.appPid,
        user: {
          did: user.did,
          ...kycUpdates,
        },
      });

      // 同步到站点群
      syncFederatedUser(blocklet, node, updatedUser, sourceAppPid);

      return updatedUser;
    },
  };
};
