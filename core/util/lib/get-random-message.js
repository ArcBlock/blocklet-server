const Mcrypto = require('@ocap/mcrypto');

module.exports = function getRandomMessage(len = 16) {
  const hex = Mcrypto.getRandomBytes(len);
  return hex.replace(/^0x/, '').toUpperCase();
};
