const { login } = require('../../../libs/connect/session');
const logger = require('../../../libs/logger')();

const { onConnect, onApprove } = login;

module.exports = function createRoutes(node, authenticator, createSessionToken) {
  return {
    action: 'login',
    onConnect: ({ req, userDid, extraParams: { locale, passportId = '', componentId, inviter }, baseUrl }) => {
      return onConnect({
        node,
        request: req,
        userDid,
        locale,
        passportId,
        componentId,
        action: 'login',
        baseUrl,
        inviter,
      });
    },

    onAuth: async ({
      claims,
      challenge,
      userDid,
      userPk,
      updateSession,
      // NOTICE: 和 did-connect 相关的 visitorId 需要从 extraParams 中获取，不能从 headers 中获取
      extraParams: { locale, componentId, visitorId, inviter },
      req,
      baseUrl,
    }) => {
      try {
        const result = await onApprove({
          node,
          request: req,
          locale,
          challenge,
          userDid,
          userPk,
          baseUrl,
          claims,
          createSessionToken,
          componentId,
          action: 'login',
          visitorId,
          inviter,
        });

        await updateSession(
          {
            sessionToken: result.sessionToken,
            refreshToken: result.refreshToken,
            csrfToken: result.csrfToken,
            visitorId: result.visitorId,
          },
          true
        );

        return result;
      } catch (err) {
        console.error(err);
        logger.error('login.error', { error: err, userDid });
        throw new Error(err.message);
      }
    },
  };
};
