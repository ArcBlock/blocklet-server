const { toTypeInfo, isFromPublicKey } = require('@arcblock/did');
const Wallet = require('@ocap/wallet');

const messages = {
  notExist: {
    en: 'Signature should not be empty',
    zh: '签名不应为空',
  },
  pkNotMatch: {
    en: 'Signer public key does not match the expected DID',
    zh: '签名者公钥与预期的 DID 不匹配',
  },
  verifyFailed: {
    en: 'Failed to verify signature',
    zh: '验证签名失败',
  },
};

/**
 * Verify a signature claim is signed by the key pair of `did`
 * NOTICE: wallet.verify is async since @ocap/wallet 1.30, this function must be awaited
 */
module.exports = async (claim, did, pk, locale = 'en') => {
  if (!claim || !claim.origin || !claim.sig) {
    throw new Error(messages.notExist[locale]);
  }

  if (!pk || !isFromPublicKey(did, pk)) {
    throw new Error(messages.pkNotMatch[locale]);
  }

  const user = Wallet.fromPublicKey(pk, toTypeInfo(did));

  let valid = false;
  try {
    valid = (await user.verify(claim.origin, claim.sig)) === true;
  } catch {
    valid = false;
  }

  if (!valid) {
    throw new Error(messages.verifyFailed[locale]);
  }
};
