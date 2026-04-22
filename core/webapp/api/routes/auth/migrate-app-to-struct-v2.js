const { toHex } = require('@ocap/util');
const {
  getKeyPairClaim,
  getAuthVcClaim,
  authenticateByVc,
  getAuthPrincipalForMigrateAppToV2,
} = require('@abtnode/auth/lib/server');
const { messages } = require('@abtnode/auth/lib/auth');

const logger = require('@abtnode/logger')('@abtnode/webapp:connect:migrate');

module.exports = function createRoutes(node) {
  return {
    action: 'migrate-app-to-struct-v2',

    authPrincipal: false,

    claims: [
      {
        authPrincipal: getAuthPrincipalForMigrateAppToV2(node),
      },
      {
        verifiableCredential: getAuthVcClaim({ node, source: 'server' }),
        keyPair: getKeyPairClaim(node, { declare: false }),
      },
    ],

    onAuth: async ({ claims, userDid, challenge, extraParams }) => {
      const { locale, did } = extraParams;

      if (!did) {
        logger.error('app did must be provided');
        throw new Error(messages.missingBlockletDid[locale]);
      }

      const { role } = await authenticateByVc({
        node,
        locale,
        userDid,
        claims,
        challenge,
        action: 'migrate-app-to-struct-v2',
      });

      if (!['admin', 'owner'].includes(role)) {
        throw new Error(
          {
            en: 'Only node administrators can migrate applications',
            zh: '只有管理员可以迁移应用',
          }[locale]
        );
      }

      logger.info('createRotateKeyPairHandler', extraParams);
      const keyPair = claims.find(x => x.type === 'keyPair');
      if (!keyPair) {
        logger.error('app keyPair must be provided');
        throw new Error(messages.missingKeyPair[locale]);
      }

      const blocklet = await node.getBlocklet({ did, attachConfig: false });
      if (!blocklet) {
        throw new Error(messages.invalidBlocklet[locale]);
      }

      const input = {
        did: blocklet.meta.did,
        appSk: toHex(keyPair.secret),
      };

      await node.migrateApplicationToStructV2(input);
    },
  };
};
