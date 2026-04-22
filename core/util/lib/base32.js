const { toBuffer, toAddress, toBase58, toHex } = require('@ocap/util');
const { base32 } = require('multiformats/bases/base32');

const encode = (did) => {
  if (!did) {
    return did;
  }

  const buffer = toBuffer(toAddress(did));

  return base32.encode(buffer);
};

const decode = (str) => {
  if (!str) {
    return str;
  }

  const buffer = base32.decode(str);
  const base58 = toBase58(buffer);
  if (base58.length > 30) {
    return base58;
  }

  return toHex(buffer);
};

module.exports = { encode, decode };
