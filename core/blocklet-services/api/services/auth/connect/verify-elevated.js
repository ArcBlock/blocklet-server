const { messages, canSessionBeElevated } = require('@abtnode/auth/lib/auth');
const { authenticateByVc, getVerifyAccessClaims } = require('@abtnode/auth/lib/server');
const { ROLES } = require('@abtnode/constant');
const { LOGIN_PROVIDER } = require('@blocklet/constant');
const { getSourceAppPid } = require('@blocklet/sdk/lib/util/login');

const { PASSPORT_LOG_ACTION } = require('@abtnode/constant');
const { PASSPORT_VC_TYPES } = require('@abtnode/auth/lib/util/transfer-passport');

const { createTokenFn, getDidConnectVersion } = require('../../../util');
const { getTrustedIssuers } = require('../../../util/blocklet-utils');

const allowedRoles = [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER];

// eslint-disable-next-line no-unused-vars
module.exports = function createRoutes(node, authenticator, createSessionToken) {
  return {
    action: 'verify-elevated',
    onConnect: async ({ request, userDid, extraParams: { locale, connectedDid } }) => {
      if (userDid && connectedDid && userDid !== connectedDid) {
        throw new Error(messages.userMismatch[locale]);
      }

      const blocklet = await request.getBlocklet();
      const isSessionHardeningEnabled = blocklet?.settings?.enableSessionHardening;
      if (!isSessionHardeningEnabled) {
        throw new Error(messages.notEnabled[locale]);
      }

      const user = await node.getUser({
        teamDid: blocklet.appPid,
        user: { did: userDid },
        options: { enableConnectedAccount: true },
      });
      if (!user) {
        throw new Error(messages.userNotExist({ did: userDid })[locale]);
      }
      if (!user.approved) {
        throw new Error(messages.notAllowedAppUser[locale]);
      }

      const sourceAppPid = getSourceAppPid(request);
      return {
        verifiableCredential: getVerifyAccessClaims({
          node,
          passports: user.passports,
          roles: allowedRoles,
          types: PASSPORT_VC_TYPES,
          source: 'blocklet',
          trustedIssuers: await getTrustedIssuers(blocklet, { sourceAppPid }),
        }),
      };
    },

    onAuth: async ({ request, claims, challenge, userDid, updateSession, extraParams }) => {
      const { locale } = extraParams;
      const sourceAppPid = getSourceAppPid(request);
      const [blocklet, blockletInfo] = await Promise.all([request.getBlocklet(), request.getBlockletInfo()]);

      const isSessionHardeningEnabled = blocklet?.settings?.enableSessionHardening;
      if (!isSessionHardeningEnabled) {
        throw new Error(messages.notEnabled[locale]);
      }

      const { role, user, passport } = await authenticateByVc({
        node,
        locale,
        teamDid: blocklet.appPid,
        userDid,
        claims,
        challenge,
        types: PASSPORT_VC_TYPES,
        trustedIssuers: await getTrustedIssuers(blocklet, { sourceAppPid }),
        action: 'verify-elevated',
        blocklet,
      });

      if (!allowedRoles.includes(role)) {
        throw new Error(messages.passportNotAllowedToUse({ passports: allowedRoles.join('/') })[locale]);
      }

      if (passport) {
        await node.createPassportLog(
          blocklet.appPid,
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

      const createToken = createTokenFn(createSessionToken);
      const sessionConfig = blocklet.settings?.session || {};
      const { sessionToken, refreshToken } = createToken(
        userDid,
        {
          secret: blockletInfo.secret,
          passport,
          role,
          fullName: user.fullName,
          provider: LOGIN_PROVIDER.WALLET,
          walletOS: request.context.didwallet.os,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          elevated: canSessionBeElevated(role, blocklet?.settings), // blocklet level session hardening
        },
        { ...sessionConfig, didConnectVersion: getDidConnectVersion(request) }
      );

      await updateSession({ sessionToken, refreshToken }, true);
    },
  };
};
