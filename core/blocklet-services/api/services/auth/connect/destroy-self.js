const { messages } = require('@abtnode/auth/lib/auth');
const { LOGIN_PROVIDER } = require('@blocklet/constant');
const { ROLES } = require('@abtnode/constant');
const { fromBase64 } = require('@ocap/util');
const { createTokenFn, getDidConnectVersion } = require('../../../util');
const logger = require('../../../libs/logger')('destroy-self');

const isOwner = (user) => {
  const roles = user.passports.map((passport) => passport.role);
  return roles.includes(ROLES.OWNER);
};

module.exports = function createRoutes(node, authenticator, createSessionToken) {
  return {
    action: 'destroy-self',
    authPrincipal: false,
    claims: {
      authPrincipal: ({ extraParams: { locale } }) => {
        return {
          description: messages.destroySelf({})[locale],
          supervised: true,
        };
      },
    },
    onConnect: async ({ request, userDid, extraParams: { locale, removeUserDid } }) => {
      const blocklet = await request.getBlocklet();
      const user = await node.getUser({
        teamDid: blocklet.appPid,
        user: { did: userDid },
        options: { enableConnectedAccount: true },
      });
      if (!user) {
        throw new Error(messages.userNotExist({ did: userDid })[locale]);
      }

      if (removeUserDid !== userDid) {
        throw new Error(messages.notAllowedToDelete({ did: userDid })[locale]);
      }

      if (isOwner(user)) {
        throw new Error(messages.notAllowedToDeleteOwner({ did: userDid })[locale]);
      }

      return [];
    },

    onAuth: async ({ request, userDid, updateSession, extraParams }) => {
      const { locale, removeUserDid } = extraParams;

      const [blocklet, blockletInfo] = await Promise.all([request.getBlocklet(), request.getBlockletInfo()]);
      const teamDid = blocklet.appPid;
      const user = await node.getUser({ teamDid, user: { did: userDid } });
      if (!user) {
        throw new Error(messages.userNotExist({ did: userDid })[locale]);
      }

      if (removeUserDid !== userDid) {
        throw new Error(messages.notAllowedToDelete({ did: userDid })[locale]);
      }

      if (isOwner(user)) {
        throw new Error(messages.notAllowedToDeleteOwner({ did: userDid })[locale]);
      }

      try {
        const parsed = JSON.parse(fromBase64(extraParams.payload).toString());
        const session = await node.startSession({ data: { ...parsed, type: 'destroy', operator: userDid } });
        logger.info('User.destroySelf', { teamDid, userDid, sessionId: session.id });
        const updates = { destroySessionId: session.id };
        const isSessionHardeningEnabled = blocklet?.settings?.enableSessionHardening;
        if (isSessionHardeningEnabled) {
          const createToken = createTokenFn(createSessionToken);
          const sessionConfig = blocklet.settings?.session || {};
          const { sessionToken, refreshToken } = createToken(
            userDid,
            {
              secret: blockletInfo.secret,
              fullName: user.fullName,
              provider: LOGIN_PROVIDER.WALLET,
              walletOS: request.context.didwallet.os,
              emailVerified: user.emailVerified,
              phoneVerified: user.phoneVerified,
              elevated: true,
            },
            { ...sessionConfig, didConnectVersion: getDidConnectVersion(request) }
          );
          updates.sessionToken = sessionToken;
          updates.refreshToken = refreshToken;
        }
        await updateSession(updates, true);
      } catch (err) {
        logger.error('Failed to destroy user', { teamDid, userDid, error: err.message });
        throw new Error(messages.failedToDestroyUser[locale]);
      }
    },
  };
};
