const { messages } = require('@abtnode/auth/lib/auth');

const { onAddNodeOwnerAuth, getProfileClaim, getAssetProfile } = require('./util');

module.exports = function createRoutes(node) {
  return {
    action: 'verify-owner',
    onConnect: () => {
      return {
        asset: getAssetProfile(node),
        profile: async ({ extraParams: { locale } }) => {
          if (await node.isInitialized()) {
            throw new Error(messages.alreadyInitiated[locale]);
          }

          return getProfileClaim(locale);
        },
      };
    },

    onAuth: async ({ claims, userDid, userPk, challenge, updateSession, extraParams: { locale }, req, baseUrl }) => {
      if (await node.isInitialized()) {
        throw new Error(messages.alreadyInitiated[locale]);
      }

      return onAddNodeOwnerAuth({
        node,
        req,
        claims,
        userDid,
        userPk,
        challenge,
        updateSession,
        locale,
        baseUrl,
        action: 'verify-owner',
      });
    },
  };
};
