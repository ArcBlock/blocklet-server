const { createLostPassportIssueRoute, TEAM_TYPES } = require('@abtnode/auth/lib/lost-passport');
const { createToken } = require('../../libs/login');

module.exports = function createRoutes(node) {
  return createLostPassportIssueRoute({
    node,
    type: TEAM_TYPES.NODE,
    createToken: async (did, args) => {
      return createToken(did, { secret: await node.getSessionSecret(), ...args });
    },
  });
};
