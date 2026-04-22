const { fromSecretKey, WalletType } = require('@ocap/wallet');
const { types } = require('@ocap/mcrypto');

/**
 * Get wallet of abtnode from sk
 * @param {String} sk
 * @returns {import('@ocap/wallet').WalletObject}
 */
module.exports = function getWallet(sk) {
  const type = WalletType({
    role: types.RoleType.ROLE_APPLICATION,
    pk: types.KeyType.ED25519,
    hash: types.HashType.SHA3,
  });

  return fromSecretKey(sk, type);
};
