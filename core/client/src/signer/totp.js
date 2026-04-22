/**
 * https://github.com/simontabor/2fa
 */

/* eslint-disable no-bitwise */
const crypto = require('crypto');

const sign = (key, counter) => {
  const length = 6;
  // eslint-disable-next-line no-param-reassign
  counter = counter || Math.floor(Date.now() / 1000 / 30);

  const hmac = crypto.createHmac('sha1', key);

  // get the counter as bytes
  const counterBytes = new Array(8);
  for (let i = counterBytes.length - 1; i >= 0; i--) {
    counterBytes[i] = counter & 0xff;
    // eslint-disable-next-line no-param-reassign
    counter >>= 8;
  }

  const token = hmac.update(Buffer.from(counterBytes)).digest('hex');

  // get the token as bytes
  const tokenBytes = [];
  for (let i = 0; i < token.length; i += 2) {
    tokenBytes.push(parseInt(token.substr(i, 2), 16));
  }

  // truncate to 4 bytes
  // eslint-disable-next-line no-bitwise
  let offset = tokenBytes[19] & 0xf;
  let ourCode =
    ((tokenBytes[offset++] & 0x7f) << 24) |
    ((tokenBytes[offset++] & 0xff) << 16) |
    ((tokenBytes[offset++] & 0xff) << 8) |
    (tokenBytes[offset++] & 0xff);

  // we want strings!
  ourCode += '';

  // truncate to correct length
  ourCode = ourCode.substr(ourCode.length - length);

  // 0 pad
  while (ourCode.length < length) ourCode = `0${ourCode}`;

  return ourCode;
};

const verifyHOTP = (key, code, counter) => {
  for (const i of [counter, counter - 1, counter + 1]) {
    if (sign(key, i) === code) {
      return true;
    }
  }

  return false;
};

const verify = (key, code, counter) => {
  // eslint-disable-next-line no-param-reassign
  counter = counter || Math.floor(Date.now() / 1000 / 30);

  return verifyHOTP(key, code, counter);
};

exports.sign = sign;
exports.verify = verify;
