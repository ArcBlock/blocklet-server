const { createRestoreByNftHandler, getAuthNFTClaim } = require('@abtnode/auth/lib/server');

module.exports = function createRoutes(node) {
  return {
    action: 'verify-restore-by-nft',
    claims: {
      serverNFT: ['asset', getAuthNFTClaim({ node })],
    },
    onAuth: createRestoreByNftHandler(node, 'nft'),
  };
};
