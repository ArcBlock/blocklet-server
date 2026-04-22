const omit = require('lodash/omit');
const get = require('lodash/get');
const getRequestIP = require('./get-request-ip');

// Format context: https://github.com/graphql/express-graphql
/**
 *
 * @param {import('express').Request} ctx
 * @returns
 */
module.exports = (ctx = {}) => {
  const contextUser = omit(
    Object.assign(ctx?.user || {}, {
      locale: ctx?.query?.locale ?? ctx?.user?.locale ?? 'en',
    }),
    'avatar'
  );

  const safeGet = (key, _default = '') =>
    (typeof ctx.get === 'function' ? ctx.get(key) : get(ctx, `headers[${key}]`)) || _default;

  const port = process.env.NODE_ENV === 'production' ? safeGet('x-real-port') : '';
  const result = {
    ip: getRequestIP(ctx) || safeGet('x-real-ip', '127.0.0.1'),
    ua: safeGet('user-agent'),
    protocol: safeGet('x-real-protocol').replace(/:$/, '') || 'http',
    user: contextUser,
    url: ctx.originalUrl,
    query: ctx.query,
    hostname: safeGet('x-real-hostname'),
    port: Number(port) === 80 ? '' : Number(port),
    nodeMode: ctx.nodeMode,
    referrer: safeGet('referrer'),
    timezone: safeGet('x-timezone'),
  };

  // WARNING: avoid passing the entire headers object here as it may interfere with downstream processing

  return result;
};
