const get = require('lodash/get');

const { isProduction } = require('../libs/env');

const formatContext = (ctx = {}) => {
  if (ctx && ctx.user) {
    delete ctx.user.avatar;
  }

  const port = isProduction ? get(ctx, 'headers[x-real-port]', '') : '';
  const hostname = get(ctx, 'headers[x-real-hostname]', ctx.hostname);
  const protocol = get(ctx, 'headers[x-real-protocol]', 'http').replace(/:$/, '');

  return {
    protocol,
    user: ctx.user || null,
    url: ctx.originalUrl,
    query: ctx.query,
    hostname,
    port: Number(port) === 80 ? '' : Number(port),
  };
};

module.exports = formatContext;
