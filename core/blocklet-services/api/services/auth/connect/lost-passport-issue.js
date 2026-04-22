const { createLostPassportIssueRoute, TEAM_TYPES } = require('@abtnode/auth/lib/lost-passport');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { createTokenFn } = require('../../../util');

module.exports = function createRoutes(node, _authenticator, createSessionToken) {
  return createLostPassportIssueRoute({
    node,
    type: TEAM_TYPES.BLOCKLET,
    authServicePrefix: WELLKNOWN_SERVICE_PATH_PREFIX,
    createToken: createTokenFn(createSessionToken),
  });
};
