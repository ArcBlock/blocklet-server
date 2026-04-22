const { toBase58 } = require('@ocap/util');
const stableStringify = require('json-stable-stringify');

const sign = async (blockletMeta, wallet) => {
  const walletJSON = wallet.toJSON();

  const signatureData = {
    type: walletJSON.type.pk,
    name: blockletMeta.name,
    signer: walletJSON.address,
    pk: toBase58(walletJSON.pk),
    created: new Date().toISOString(),
  };

  const signature = await wallet.sign(stableStringify({ ...blockletMeta, signatures: [signatureData] }));
  signatureData.sig = toBase58(signature);

  return signatureData;
};

module.exports = { sign };
