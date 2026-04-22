const { messages } = require('@abtnode/auth/lib/auth');

const logger = require('../../../libs/logger')(require('../../../../package.json').name);
const { login } = require('../../../libs/connect/session');

const { onConnect, onApprove } = login;

module.exports = function createRoutes(node, authenticator, createSessionToken) {
  return {
    action: 'exchange-passport',

    onStart: async ({ extraParams, request }) => {
      const { locale = 'en' } = extraParams;
      const blocklet = await request.getBlocklet();
      if (blocklet.trustedFactories.length === 0) {
        throw new Error(messages.noTrustedFactories[locale]);
      }
    },

    onConnect: ({ req, userDid, extraParams: { locale, passportId = '', componentId } }) => {
      return onConnect({ node, request: req, userDid, locale, passportId, componentId, action: 'exchangePassport' });
    },

    onAuth: async ({
      claims,
      challenge,
      userDid,
      userPk,
      updateSession,
      extraParams: { locale, componentId },
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
          action: 'exchangePassport',
        });

        await updateSession({ sessionToken: result.sessionToken, refreshToken: result.refreshToken }, true);

        return result;
      } catch (err) {
        logger.error('login.error', { error: err, userDid });
        throw new Error(err.message);
      }
    },
  };
};
