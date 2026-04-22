const { createHash } = require('crypto');

const sign = (key, counter) => {
  // eslint-disable-next-line no-param-reassign
  counter = counter || Math.floor(Date.now() / 1000 / 30);

  const hash = createHash('sha256');
  const token = hash.update(`${key}${counter}`).digest('base64');
  return token;
};

const verify = (key, sig, counter) => {
  // eslint-disable-next-line no-param-reassign
  counter = counter || Math.floor(Date.now() / 1000 / 30);

  for (const i of [counter, counter - 1, counter + 1]) {
    const token = sign(key, i);
    if (token === sig) {
      return true;
    }
  }

  return false;
};

exports.sign = sign;
exports.verify = verify;
