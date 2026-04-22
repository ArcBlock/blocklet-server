const { onAddNodeOwnerAuth, getProfileClaim, getAssetProfile } = require('./util');

module.exports = function createRoutes(node) {
  return {
    action: 'accept-server',
    onConnect: () => {
      return {
        asset: getAssetProfile(node),
        profile: ({ extraParams: { locale } }) => getProfileClaim(locale),
      };
    },

    onAuth: ({ claims, userDid, userPk, challenge, updateSession, extraParams: { locale }, req, baseUrl }) => {
      return onAddNodeOwnerAuth({
        action: 'accept-server',
        node,
        req,
        claims,
        userDid,
        userPk,
        challenge,
        locale,
        baseUrl,
        updateSession,
      });
    },
  };
};
