const { messages, canSessionBeElevated } = require('@abtnode/auth/lib/auth');
const { authenticateByVc, getAuthVcClaim } = require('@abtnode/auth/lib/server');
const formatContext = require('@abtnode/util/lib/format-context');
const getRequestIP = require('@abtnode/util/lib/get-request-ip');
const { LOGIN_PROVIDER } = require('@blocklet/constant');
const { PASSPORT_LOG_ACTION } = require('@abtnode/constant');

const logger = require('@abtnode/logger')(require('../../../package.json').name);

const { createToken } = require('../../libs/login');

module.exports = function createRoutes(node) {
  return {
    action: 'login',
    onConnect: async ({ userDid, extraParams }) => {
      const { locale } = extraParams;

      if ((await node.isInitialized()) === false) {
        throw new Error(messages.notInitialized[locale]);
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

      return { verifiableCredential: getAuthVcClaim({ node, source: 'server' }) };
    },

    onAuth: async ({ claims, challenge, userDid, userPk, updateSession, extraParams, req }) => {
      const { locale } = extraParams;
      const { role, teamDid, passport, info } = await authenticateByVc({
        node,
        locale,
        userDid,
        claims,
        challenge,
        action: 'login',
      });

      try {
        // Update user
        const doc = await node.loginUser({
          teamDid,
          user: {
            did: userDid,
            pk: userPk,
            locale,
            lastLoginIp: getRequestIP(req),
            passport,
            connectedAccount: {
              provider: LOGIN_PROVIDER.WALLET,
              did: userDid,
            },
          },
        });
        await node.createAuditLog(
          {
            action: 'login',
            args: { teamDid, userDid, passport, provider: LOGIN_PROVIDER.WALLET },
            context: formatContext(Object.assign(req, { user: doc })),
            result: doc,
          },
          node
        );

        if (passport) {
          await node.createPassportLog(
            teamDid,
            {
              passportId: passport.id,
              action: PASSPORT_LOG_ACTION.LOGIN,
              operatorDid: userDid,
              metadata: {
                action: 'connect-login',
                context: formatContext(Object.assign(req, { user: doc })),
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
          fullName: doc?.fullName,
          elevated: canSessionBeElevated(role, info),
        });
        await updateSession({ sessionToken, refreshToken }, true);
        logger.info('login.success', { userDid });
      } catch (err) {
        logger.error('login.error', { error: err, userDid });
        throw new Error(err.message);
      }
    },
  };
};
