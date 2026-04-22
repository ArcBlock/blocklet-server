const { createBindWalletRoute } = require('@abtnode/auth/lib/bind-wallet');

// eslint-disable-next-line no-unused-vars
module.exports = function createRoutes(node, authenticator, createSessionToken) {
  return createBindWalletRoute({ node, isService: false });
};
