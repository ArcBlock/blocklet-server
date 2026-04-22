const { getSourceAppPid } = require('@blocklet/sdk/lib/util/login');
const { messages } = require('@abtnode/auth/lib/auth');
const { authenticateByVc } = require('@abtnode/auth/lib/server');
const { PASSPORT_LOG_ACTION, SERVER_ROLES, ROLES } = require('@abtnode/constant');
const formatContext = require('@abtnode/util/lib/format-context');
const { PASSPORT_VC_TYPES } = require('@abtnode/auth/lib/util/transfer-passport');

const logger = require('../../../libs/logger')('blocklet-service:connect-cli');
const { utils } = require('../../../libs/connect/session');
const { getTrustedIssuers } = require('../../../util/blocklet-utils');

const allowedRoles = [ROLES.OWNER, ROLES.ADMIN];

module.exports = function createRoutes(node) {
  return {
    action: 'gen-access-key',

    onConnect: async ({ request, userDid, extraParams: { locale } }) => {
      logger.info('onConnect', { userDid, extraParams: { locale } });
      const checkUserRole = await utils.checkUserRole({ node, userDid, locale, request, roles: allowedRoles });
      return checkUserRole;
    },

    onAuth: async ({ request, userDid, challenge, claims, updateSession, extraParams }) => {
      const { locale } = extraParams;
      const sourceAppPid = getSourceAppPid(request);
      const blocklet = await request.getBlocklet();

      const { role, user, passport } = await authenticateByVc({
        node,
        locale,
        teamDid: blocklet.appPid,
        userDid,
        claims,
        challenge,
        types: PASSPORT_VC_TYPES,
        trustedIssuers: await getTrustedIssuers(blocklet, { sourceAppPid }),
        action: 'gen-access-key',
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
              action: 'gen-access-key',
              ownerDid: userDid,
              userDid: user.did,
            },
          },
          request
        );
      }

      const teamDid = blocklet.meta.did;

      const { accessKeyId, accessKeySecret, expireAt } = await node.createAccessKey(
        { teamDid, remark: extraParams.source, createdVia: 'connect', passport: SERVER_ROLES.CI },
        { user: { ...user, role } }
      );

      await node.createAuditLog(
        {
          action: 'switchPassport',
          args: { teamDid, userDid, passport, sourceAppPid },
          context: formatContext(Object.assign(request, { user })),
          result: { accessKeyId, expireAt },
        },
        node
      );

      logger.info('accessKeyId', accessKeyId);

      await updateSession(
        {
          config: {
            developerEmail: user.email,
            developerName: user.fullName,
            developerDid: userDid,
            accessKeyId,
            accessKeySecret,
            expireAt,
          },
        },
        true
      );
    },
  };
};
