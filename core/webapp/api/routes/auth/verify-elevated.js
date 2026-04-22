const { messages, canSessionBeElevated } = require('@abtnode/auth/lib/auth');
const { authenticateByVc, getVerifyAccessClaims } = require('@abtnode/auth/lib/server');
const { ROLES } = require('@abtnode/constant');

const { PASSPORT_LOG_ACTION } = require('@abtnode/constant');
const { createToken } = require('../../libs/login');

const allowedRoles = [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER];

module.exports = function createRoutes(node) {
  return {
    action: 'verify-elevated',
    onConnect: async ({ userDid, extraParams: { locale, connectedDid } }) => {
      if (userDid && connectedDid && userDid !== connectedDid) {
        throw new Error(messages.userMismatch[locale]);
      }

      const info = await node.getNodeInfo();
      if (!info.enableSessionHardening) {
        throw new Error(messages.notEnabled[locale]);
      }

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

      return {
        verifiableCredential: getVerifyAccessClaims({
          node,
          passports: user.passports,
          roles: allowedRoles,
          source: 'server',
        }),
      };
    },

    onAuth: async ({ request, claims, challenge, userDid, updateSession, extraParams }) => {
      const { locale } = extraParams;
      const { role, user, passport, teamDid } = await authenticateByVc({
        node,
        locale,
        userDid,
        claims,
        challenge,
        action: 'verify-elevated',
      });

      if (!allowedRoles.includes(role)) {
        throw new Error(messages.passportNotAllowedToUse({ passports: allowedRoles.join('/') })[locale]);
      }

      const info = await node.getNodeInfo();
      if (!info.enableSessionHardening) {
        throw new Error(messages.notEnabled[locale]);
      }

      if (passport) {
        await node.createPassportLog(
          teamDid,
          {
            passportId: passport.id,
            action: PASSPORT_LOG_ACTION.USED,
            operatorDid: userDid,
            metadata: {
              action: 'verify-elevated',
              ownerDid: userDid,
              userDid: user.did,
            },
          },
          request
        );
      }

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
