const { createRotateKeyPairHandler, getRotateKeyPairClaims } = require('@abtnode/auth/lib/server');

module.exports = function createRoutes(node) {
  return {
    action: 'rotate-key-pair',
    authPrincipal: false,
    claims: getRotateKeyPairClaims(node),
    onAuth: createRotateKeyPairHandler(node),
  };
};
