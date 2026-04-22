const { messages } = require('@abtnode/auth/lib/auth');
const { authenticateByVc, getVerifyAccessClaims, validateVerifyDestroyRequest } = require('@abtnode/auth/lib/server');
const { ROLES } = require('@abtnode/constant');
const { fromBase64 } = require('@ocap/util');

const logger = require('@abtnode/logger')(require('../../../package.json').name);

const { PASSPORT_LOG_ACTION } = require('@abtnode/constant');
const { createToken } = require('../../libs/login');

const ALLOWED_ROLES = [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER];

module.exports = function createRoutes(node) {
  return {
    action: 'verify-destroy',
    onConnect: async ({ userDid, extraParams: { roles, payload, locale } }) => {
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

      const expected = validateVerifyDestroyRequest({ payload, roles, locale, allowedRoles: ALLOWED_ROLES });

      return {
        verifiableCredential: getVerifyAccessClaims({
          node,
          passports: user.passports,
          roles: expected,
          source: 'server',
        }),
      };
    },

    onAuth: async ({ request, claims, challenge, userDid, updateSession, extraParams }) => {
      const { locale, payload } = extraParams;
      const { role, user, passport, teamDid } = await authenticateByVc({
        node,
        locale,
        userDid,
        claims,
        challenge,
        action: 'verify-destroy',
      });

      if (!ALLOWED_ROLES.includes(role)) {
        throw new Error(messages.userNotFound[locale]);
      }

      const parsed = JSON.parse(fromBase64(payload).toString());
      const session = await node.startSession({ data: { ...parsed, type: 'destroy', operator: userDid } });

      logger.info('DestroySession.start', { sessionId: session.id, parsed, userDid, role });

      const updates = { destroySessionId: session.id };
      const info = await node.getNodeInfo();
      if (info.enableSessionHardening) {
        const { sessionToken, refreshToken } = await createToken(userDid, {
          secret: await node.getSessionSecret(),
          passport,
          role,
          fullName: user.fullName,
          elevated: true,
        });
        updates.sessionToken = sessionToken;
        updates.refreshToken = refreshToken;
      }

      if (passport) {
        await node.createPassportLog(
          teamDid,
          {
            passportId: passport.id,
            action: PASSPORT_LOG_ACTION.USED,
            operatorDid: userDid,
            metadata: {
              action: 'verify-destroy',
              ownerDid: userDid,
              userDid: user.did,
            },
          },
          request
        );
      }

      await updateSession(updates, true);
    },
  };
};
