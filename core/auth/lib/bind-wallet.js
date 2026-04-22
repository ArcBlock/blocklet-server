const { onConnect, onApprove, authPrincipal } = require('./util/bind-wallet');
const logger = require('./logger');

const createBindWalletRoute = ({ node, isService = true }) => ({
  action: 'bind-wallet',
  authPrincipal: false,
  claims: {
    authPrincipal: ({ extraParams: { locale, previousUserDid, email } }) => {
      return authPrincipal({ locale, previousUserDid, email });
    },
  },
  onConnect: ({ req, userDid, extraParams: { locale, passportId = '', componentId, previousUserDid } }) => {
    return onConnect({
      node,
      request: req,
      userDid,
      locale,
      passportId,
      componentId,
      previousUserDid,
      isService,
    });
  },

  onAuth: async ({
    claims,
    userDid,
    userPk,
    extraParams: { locale, previousUserDid, skipMigrateAccount },
    req,
    baseUrl,
  }) => {
    try {
      const result = await onApprove({
        node,
        request: req,
        locale,
        userDid,
        userPk,
        baseUrl,
        claims,
        previousUserDid,
        skipMigrateAccount:
          typeof skipMigrateAccount === 'boolean' ? skipMigrateAccount : skipMigrateAccount === 'true',
        isService,
      });

      if (result.nextWorkflowData && skipMigrateAccount) {
        result.nextWorkflowData = {
          ...result.nextWorkflowData,
          skipCheckOwner: true,
        };
      }

      return result;
    } catch (err) {
      logger.error('login.error', { error: err, userDid });
      throw new Error(err.message);
    }
  },
});

module.exports = {
  createBindWalletRoute,
};
