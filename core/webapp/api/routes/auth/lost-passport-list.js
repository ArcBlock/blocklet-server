const { createLostPassportListRoute } = require('@abtnode/auth/lib/lost-passport');

module.exports = function createRoutes(node) {
  return createLostPassportListRoute({ node, type: 'node' });
};
