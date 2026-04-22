const jwt = require('jsonwebtoken');
const { toHex } = require('@ocap/util');
const Client = require('@blocklet/server-js');
const { AUTH_CERT_TYPE } = require('@abtnode/constant');

const { migrateToStructV2 } = require('../../../libs/connect/session');
const logger = require('../../../libs/logger')('blocklet-service:connect:migrate');

const { getClaims, onAuth, authPrincipal } = migrateToStructV2;

module.exports = function createRoutes(node, options) {
  return {
    action: 'migrate-app-to-struct-v2',

    authPrincipal,

    claims: getClaims({ node }),

    onAuth: async ({ claims, challenge, userDid, extraParams: { locale }, req }) => {
      try {
        const { blocklet, keyPair, user } = await onAuth({
          claims,
          challenge,
          userDid,
          extraParams: { locale },
          req,
          node,
        });

        const input = {
          did: blocklet.meta.did,
          appSk: toHex(keyPair.secret),
        };

        const token = jwt.sign(
          {
            type: AUTH_CERT_TYPE.BLOCKLET_USER,
            did: userDid,
            role: user.role,
            blockletDid: blocklet.meta.did,
          },
          options.sessionSecret,
          { expiresIn: '10s' }
        );

        const client = new Client(`http://127.0.0.1:${process.env.ABT_NODE_PORT}/api/gql`);
        client.setAuthToken(token);

        await client.migrateApplicationToStructV2({ input });
      } catch (error) {
        logger.error('migrate application failed', { error, userDid });
        throw error;
      }
    },
  };
};
