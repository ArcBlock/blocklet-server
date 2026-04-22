const { switchProfile } = require('../../../libs/connect/session');

const { onConnect, onApprove } = switchProfile;

module.exports = function createRoutes(node) {
  return {
    action: 'switch-profile',
    onConnect: ({ req, userDid, extraParams: { locale, connectedDid } }) => {
      return onConnect({
        node,
        request: req,
        locale,
        userDid,
        previousUserDid: connectedDid,
      });
    },

    onAuth: ({ req, claims, userDid, extraParams: { locale } }) => {
      const profile = claims.find((x) => x.type === 'profile');
      return onApprove({
        node,
        request: req,
        locale,
        profile,
        userDid,
        claims,
      });
    },
  };
};
