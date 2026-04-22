const { createLostPassportListRoute } = require('@abtnode/auth/lib/lost-passport');

// eslint-disable-next-line no-unused-vars
module.exports = function createRoutes(node) {
  return createLostPassportListRoute({ node, type: 'blocklet' });
};
