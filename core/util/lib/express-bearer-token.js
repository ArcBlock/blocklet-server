/**
 * Fork from https://github.com/tkellen/js-express-bearer-token
 */
const { getTokenFromReq } = require('./get-token-from-req');

module.exports = (opts) => {
  if (!opts) {
    // eslint-disable-next-line no-param-reassign
    opts = {
      cookie: false,
    };
  }

  const reqKey = opts.reqKey || 'token';
  const { cookie } = opts;

  if (cookie && !cookie.key) {
    cookie.key = 'access_token';
  }

  if (cookie && cookie.signed && !cookie.secret) {
    throw new Error(
      '[express-bearer-token]: You must provide a secret token to cookie attribute, or disable signed property'
    );
  }

  return (req, res, next) => {
    const { token, _duplicate } = getTokenFromReq(req, opts);
    if (_duplicate) {
      // RFC6750 states the access_token MUST NOT be provided
      // in more than one place in a single request.
      res.status(400).send('Access token found in multiple locations');
      return;
    }

    req[reqKey] = token;
    next();
  };
};
