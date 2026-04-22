const toLower = require('lodash/toLower');
const parseCookie = require('cookie').parse;
const decodeCookie = require('cookie-parser').signedCookie;

const getCookie = (serializedCookies, key) => parseCookie(serializedCookies)[key] || false;

function getTokenFromReq(req, opts) {
  const queryKey = opts?.queryKey ?? 'access_token';
  const bodyKey = opts?.bodyKey ?? 'access_token';
  const headerName = opts?.headerName ?? 'authorization';
  const headerKey = opts?.headerKey ?? 'Bearer';
  const cookie = opts?.cookie ?? {
    key: 'access_token',
  };

  let _duplicate = false;
  let queryToken;
  let bodyToken;
  let cookieToken;
  let headerToken;

  if (queryKey && req.query?.[queryKey]) {
    queryToken = req.query[queryKey];
  }

  if (bodyKey && req.body?.[bodyKey]) {
    bodyToken = req.body[bodyKey];
  }

  if (req.headers?.cookie) {
    const plainCookie = getCookie(req.headers.cookie || '', cookie.key); // seeks the key
    if (plainCookie) {
      cookieToken = cookie.signed ? decodeCookie(plainCookie, cookie.secret) : plainCookie;
    }
  } else if (req.cookies) {
    cookieToken = req.cookies[cookie.key];
  }
  if (headerName && req.headers?.[headerName]) {
    const parts = req.headers[headerName].split(' ');
    if (parts.length === 2 && toLower(parts[0]) === toLower(headerKey)) {
      [, headerToken] = parts;
    }
  }

  const tokenList = [queryToken, bodyToken, cookieToken].filter(Boolean);

  if (tokenList.length > 1) {
    _duplicate = true;
  } else if (tokenList.length === 1) {
    // HACK: in federated-login account-switch flow, both cookie and header bearerToken may be present with different values; treat as non-duplicate and prefer headerToken
    if (headerToken === (cookieToken || bodyToken || queryToken)) {
      _duplicate = true;
    }
  }

  const token = headerToken || cookieToken || bodyToken || queryToken;

  return {
    _duplicate,
    queryToken,
    bodyToken,
    cookieToken,
    headerToken,
    token,
  };
}

module.exports = {
  getTokenFromReq,
};
