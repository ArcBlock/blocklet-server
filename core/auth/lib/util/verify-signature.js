const { toTypeInfo } = require('@arcblock/did');
const Wallet = require('@ocap/wallet');

const messages = {
  notExist: {
    en: 'Signature should not be empty',
    zh: '签名不应为空',
  },
  verifyFailed: {
    en: 'Failed to verify signature',
    zh: '验证签名失败',
  },
};

module.exports = (claim, did, pk, locale = 'en') => {
  if (!claim || !claim.origin || !claim.sig) {
    throw new Error(messages.notExist[locale]);
  }

  const type = toTypeInfo(did);
  const user = Wallet.fromPublicKey(pk, type);

  if (user.verify(claim.origin, claim.sig) === false) {
    throw new Error(messages.verifyFailed[locale]);
  }
};
