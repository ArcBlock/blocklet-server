const { messages, canSessionBeElevated } = require('@abtnode/auth/lib/auth');
const { getAuthVcClaim, authenticateByVc } = require('@abtnode/auth/lib/server');
const formatContext = require('@abtnode/util/lib/format-context');
const { LOGIN_PROVIDER } = require('@blocklet/constant');

const { PASSPORT_LOG_ACTION } = require('@abtnode/constant');

const { createToken } = require('../../libs/login');

module.exports = function createRoutes(node) {
  return {
    action: 'switch-passport',
    onConnect: async ({ userDid, extraParams: { locale, connectedDid } }) => {
      if (userDid && connectedDid && userDid !== connectedDid) {
        throw new Error(messages.userMismatch[locale]);
      }

      const info = await node.getNodeInfo();
      const user = await node.getUser({
        teamDid: info.did,
        user: { did: userDid },
        options: { enableConnectedAccount: true },
      });
      if (!user) {
        throw new Error(messages.userNotFound[locale]);
      }
      if (!user.approved) {
        throw new Error(messages.notAllowedAppUser[locale]);
      }

      return { verifiableCredential: getAuthVcClaim({ node, source: 'server' }) };
    },

    onAuth: async ({ claims, challenge, userDid, updateSession, extraParams, req }) => {
      const { locale } = extraParams;
      const { role, passport } = await authenticateByVc({
        node,
        locale,
        userDid,
        claims,
        challenge,
        action: 'switch-passport',
      });

      const info = await node.getNodeInfo();
      const user = await node.getUser({
        teamDid: info.did,
        user: { did: userDid },
        options: { enableConnectedAccount: true },
      });
      await node.createAuditLog(
        {
          action: 'switchPassport',
          args: { teamDid: info.did, userDid, passport, provider: LOGIN_PROVIDER.WALLET },
          context: formatContext(Object.assign(req, { user })),
          result: {},
        },
        node
      );

      if (passport) {
        await node.createPassportLog(
          info.did,
          {
            passportId: passport.id,
            action: PASSPORT_LOG_ACTION.USED,
            operatorDid: userDid,
            metadata: {
              action: 'switch-passport',
              context: formatContext(Object.assign(req, { user })),
            },
          },
          req
        );
      }

      // Generate new session token that client can save to localStorage
      const { sessionToken, refreshToken } = await createToken(userDid, {
        secret: await node.getSessionSecret(),
        passport,
        role,
        fullName: user?.fullName,
        elevated: canSessionBeElevated(role, info),
      });
      await updateSession({ sessionToken, refreshToken }, true);
    },
  };
};
