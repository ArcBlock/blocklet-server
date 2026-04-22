const { messages } = require('@abtnode/auth/lib/auth');
const { authenticateByVc, getVerifyAccessClaims, validateVerifyDestroyRequest } = require('@abtnode/auth/lib/server');
const { ROLES, PASSPORT_STATUS } = require('@abtnode/constant');
const { getSourceAppPid } = require('@blocklet/sdk/lib/util/login');
const { fromBase64 } = require('@ocap/util');
const { toTypeInfo } = require('@arcblock/did');
const { fromPublicKey } = require('@ocap/wallet');
const { LOGIN_PROVIDER } = require('@blocklet/constant');
const { PASSPORT_VC_TYPES } = require('@abtnode/auth/lib/util/transfer-passport');

const { PASSPORT_LOG_ACTION } = require('@abtnode/constant');
const logger = require('../../../libs/logger')();
const { createTokenFn, getDidConnectVersion } = require('../../../util');
const { getTrustedIssuers } = require('../../../util/blocklet-utils');

// GUEST 角色包含两种情况:
// 1. 用户没有任何身份凭证(passport)
// 2. 用户有身份凭证,但角色为 guest
const ALLOWED_ROLES = [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.GUEST];

/**
 * @param {*} shouldCheckRole boolean or string
 * @returns boolean
 */
const parseShouldCheckRole = (shouldCheckRole) => {
  if (typeof shouldCheckRole === 'boolean') {
    return shouldCheckRole;
  }
  return shouldCheckRole === 'true';
};

// eslint-disable-next-line no-unused-vars
module.exports = function createRoutes(node, authenticator, createSessionToken) {
  return {
    action: 'verify-destroy',
    onConnect: async ({ request, userDid, extraParams: { locale, payload, roles, shouldCheckRole = true } }) => {
      const blocklet = await request.getBlocklet();
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

      logger.info('verify-destroy onConnect', { userDid, shouldCheckRole });

      if (parseShouldCheckRole(shouldCheckRole)) {
        const expected = validateVerifyDestroyRequest({ payload, roles, locale, allowedRoles: ALLOWED_ROLES });
        const sourceAppPid = getSourceAppPid(request);
        return {
          verifiableCredential: getVerifyAccessClaims({
            node,
            passports: user.passports,
            roles: expected,
            types: PASSPORT_VC_TYPES,
            source: 'blocklet',
            trustedIssuers: await getTrustedIssuers(blocklet, { sourceAppPid }),
          }),
        };
      }
      // 如果不需要检测 Role, 只做简单签名
      return {
        signature: {
          description: 'Please confirm this action',
          type: 'mime:text/plain',
          data: 'Please confirm your identity to continue',
        },
      };
    },

    onAuth: async ({ request, claims, userPk, challenge, userDid, updateSession, extraParams }) => {
      const { locale, payload, shouldCheckRole } = extraParams;
      const type = toTypeInfo(userDid);
      const userWallet = fromPublicKey(userPk, type);
      const sourceAppPid = getSourceAppPid(request);
      const [blocklet, blockletInfo] = await Promise.all([request.getBlocklet(), request.getBlockletInfo()]);

      const userInfo = await node.getUser({
        teamDid: blocklet.appPid,
        user: { did: userDid },
        options: { enableConnectedAccount: true },
      });

      if (!userInfo) {
        throw new Error(messages.userNotExist({ did: userDid })[locale]);
      }
      if (!userInfo.approved) {
        throw new Error(messages.notAllowedAppUser[locale]);
      }

      if (!parseShouldCheckRole(shouldCheckRole)) {
        const claim = claims.find((x) => x.type === 'signature');
        if (claim.origin && userWallet.verify(claim.origin, claim.sig, claim.method !== 'none') !== false) {
          return;
        }
        throw new Error(messages.signatureNotValid[locale]);
      }

      const parsed = JSON.parse(fromBase64(payload).toString());

      const userRoles = userInfo.passports
        .filter((x) => x.status === PASSPORT_STATUS.VALID && x.scope === 'passport')
        .map((x) => x.role);

      const { role, user, passport } = await authenticateByVc({
        node,
        locale,
        teamDid: blocklet.appPid,
        userDid,
        claims,
        challenge,
        types: PASSPORT_VC_TYPES,
        trustedIssuers: await getTrustedIssuers(blocklet, { sourceAppPid }),
        action: 'verify-destroy',
        blocklet,
      });

      if (!userRoles.includes(role)) {
        logger.info('Role not allowed to use this action', { userDid, role, userRoles });
        throw new Error(messages.passportNotAllowedToUse({ passports: userRoles.join('/') })[locale]);
      }

      if (passport) {
        await node.createPassportLog(
          blocklet.appPid,
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

      const session = await node.startSession({ data: { ...parsed, type: 'destroy', operator: userDid } });

      logger.info('DestroySession.start', { sessionId: session.id, parsed, userDid, role });

      const updates = { destroySessionId: session.id };
      const isSessionHardeningEnabled = blocklet?.settings?.enableSessionHardening;
      if (isSessionHardeningEnabled) {
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
            elevated: true,
          },
          { ...sessionConfig, didConnectVersion: getDidConnectVersion(request) }
        );
        updates.sessionToken = sessionToken;
        updates.refreshToken = refreshToken;
      }

      await updateSession(updates, true);
    },
  };
};
