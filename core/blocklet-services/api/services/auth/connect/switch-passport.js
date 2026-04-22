const { getSourceAppPid, getLoginProvider } = require('@blocklet/sdk/lib/util/login');
const { switchPassport } = require('../../../libs/connect/session');

const { onConnect, onApprove } = switchPassport;

module.exports = function createRoutes(node, authenticator, createSessionToken) {
  return {
    action: 'switch-passport',
    onConnect: ({ userDid, baseUrl, extraParams: { locale, connectedDid, orgId }, req, request }) => {
      const sourceAppPid = getSourceAppPid(request);
      const provider = getLoginProvider(request);
      return onConnect({
        node,
        request: req,
        locale,
        userDid,
        previousUserDid: connectedDid,
        baseUrl,
        sourceAppPid,
        provider,
        orgId,
      });
    },

    onAuth: async ({ claims, challenge, userDid, updateSession, extraParams, req, request }) => {
      const sourceAppPid = getSourceAppPid(request);
      const provider = getLoginProvider(request);
      const { sessionToken, refreshToken, csrfToken } = await onApprove({
        node,
        request: req,
        challenge,
        locale: extraParams.locale,
        verifiableCredential: claims.find((x) => x.type === 'verifiableCredential'),
        userDid,
        createSessionToken,
        sourceAppPid,
        provider,
        visitorId: extraParams.visitorId,
      });

      await updateSession({ sessionToken, refreshToken, csrfToken }, true);
    },
  };
};
