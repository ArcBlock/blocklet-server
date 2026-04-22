const pick = require('lodash/pick');
const { getAppDidOwnerClaims } = require('@abtnode/auth/lib/server');
const verifySignature = require('@abtnode/auth/lib/util/verify-signature');

const logger = require('../../../libs/logger')('auth');

module.exports = function createRoutes() {
  return {
    action: 'pre-setup',
    authPrincipal: false,
    claims: getAppDidOwnerClaims(),
    onAuth: ({ claims, userDid, userPk, extraParams: { locale, visitorId } }) => {
      const claim = claims.find((x) => x.type === 'signature');
      verifySignature(claim, userDid, userPk, locale);
      logger.info('pre-setup.connect.success', { userDid });
      return {
        nextWorkflowData: {
          claim: pick(claim, ['origin', 'sig']),
          pk: userPk,
          visitorId,
        },
      };
    },
  };
};
