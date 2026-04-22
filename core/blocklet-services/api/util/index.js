const { joinURL } = require('ufo');
const { minimatch } = require('minimatch');
const { ROLES } = require('@abtnode/constant');
const { BLOCKLET_MODES } = require('@blocklet/constant');
const { findWebInterfacePort, findComponentByIdV2 } = require('@blocklet/meta/lib/util');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { getDidConnectVersion } = require('@abtnode/auth/lib/util/connect');
const { getBlockletEngine } = require('@blocklet/meta/lib/engine');
const { toBlockletDid } = require('@blocklet/meta/lib/did');

const getGroupPrefix = (req) => {
  if (req.headers['x-group-path-prefix']) {
    return `/${req.headers['x-group-path-prefix']}/`.replace(/\/+/g, '/');
  }

  return '/';
};

const getComponentPrefix = (req) => {
  if (req.headers['x-path-prefix']) {
    return `/${req.headers['x-path-prefix']}/`.replace(/\/+/g, '/');
  }

  return '/';
};

const shouldGotoStartPage = (req, blocklet) => {
  if (blocklet && blocklet.mode === BLOCKLET_MODES.DEVELOPMENT) {
    return false;
  }

  if (req.user && [ROLES.OWNER, ROLES.ADMIN].includes(req.user.role)) {
    return true;
  }

  const url = new URL(`http://localhost${req.url}`);
  return !!url.searchParams.get('__start__');
};

const ensureProxyUrl = async (req) => {
  const blocklet = await req.getBlocklet();
  const componentId = req.getBlockletComponentId();
  const component = findComponentByIdV2(blocklet, componentId) || blocklet;

  let port = findWebInterfacePort(component);

  const headers = {};
  const engine = getBlockletEngine(component?.meta || {});
  if (engine.interpreter === 'blocklet') {
    const engineId = toBlockletDid(engine.source.name);
    const engineComponent = findComponentByIdV2(blocklet, [engineId]);
    if (!engineComponent) {
      return { target: null, error: `No valid blocklet engine found: ${engineId}` };
    }

    port = findWebInterfacePort(engineComponent);
  }

  if (!port) {
    return { target: null, error: `No valid port found for component: ${componentId}` };
  }

  const target = `http://127.0.0.1:${port}`;

  // TODO: path prefix check can be removed after meta.interfaces.path|prefix need not supported
  const pathPrefix = req.headers['x-routing-rule-path-prefix'];
  if (pathPrefix && pathPrefix !== '/') {
    req.url = `${pathPrefix}${req.url}`;
  }

  return { target, headers };
};

const getRedirectUrl = ({ req, pagePath, params = {} }) => {
  const groupPrefix = getGroupPrefix(req);
  const componentPrefix = getComponentPrefix(req);
  const redirectPrefix = groupPrefix === componentPrefix ? groupPrefix : componentPrefix;
  const componentId = req.getBlockletComponentId();

  const redirectUrlObj = new URL(`http://localhost${req.url}`);
  // 重定向时考虑 serverUrl 查询参数的处理
  const serverUrl = redirectUrlObj.searchParams.get('serverUrl');
  const theme = redirectUrlObj.searchParams.get('theme');
  const fromLauncher = redirectUrlObj.searchParams.get('fromLauncher');
  const launchType = redirectUrlObj.searchParams.get('launchType');
  const launcherUrl = redirectUrlObj.searchParams.get('launcherUrl');
  const chainHost = redirectUrlObj.searchParams.get('chainHost');
  const visitorId = redirectUrlObj.searchParams.get('visitorId');
  const inviter = redirectUrlObj.searchParams.get('inviter');

  const nftId = redirectUrlObj.searchParams.get('nftId');
  redirectUrlObj.searchParams.delete('__start__');
  redirectUrlObj.searchParams.delete('serverUrl');
  redirectUrlObj.searchParams.delete('theme');
  redirectUrlObj.searchParams.delete('fromLauncher');
  redirectUrlObj.searchParams.delete('setupToken');
  redirectUrlObj.searchParams.delete('launchType');
  redirectUrlObj.searchParams.delete('nftId');
  redirectUrlObj.searchParams.delete('chainHost');
  redirectUrlObj.searchParams.delete('visitorId');
  redirectUrlObj.searchParams.delete('launcherUrl');

  const redirectUrl = `${redirectPrefix.replace(/\/+$/, '')}${redirectUrlObj.pathname}${redirectUrlObj.search}`;

  const url = new URL(`http://localhost${joinURL(groupPrefix, WELLKNOWN_SERVICE_PATH_PREFIX, pagePath || '/')}`);
  url.searchParams.set('redirect', redirectUrl);
  url.searchParams.set('showQuickConnect', 'false');

  if (componentId) {
    url.searchParams.set('componentId', componentId);
  }

  const locale = new URL(`http://localhost${req.url}`).searchParams.get('locale');
  if (locale) {
    url.searchParams.set('locale', locale);
  }

  if (serverUrl) {
    url.searchParams.set('serverUrl', serverUrl);
  }

  if (theme) {
    url.searchParams.set('theme', theme);
  }

  if (fromLauncher) {
    url.searchParams.set('fromLauncher', fromLauncher);
  }

  if (launchType) {
    url.searchParams.set('launchType', launchType);
  }

  if (launcherUrl) {
    url.searchParams.set('launcherUrl', launcherUrl);
  }

  if (nftId) {
    url.searchParams.set('nftId', nftId);
  }

  if (chainHost) {
    url.searchParams.set('chainHost', chainHost);
  }

  if (visitorId) {
    url.searchParams.set('visitorId', visitorId);
  }

  if (inviter) {
    url.searchParams.set('inviter', inviter);
  }

  Object.keys(params).forEach((key) => {
    if (params[key] === undefined) {
      return;
    }
    url.searchParams.set(key, params[key]);
  });

  return `${url.pathname}${url.search}`;
};

/**
 * @callback CreateToken
 * @param {string} did
 * @param {object} params
 * @param {{cacheTtl?: number|string; ttl?: number|string; didConnectVersion?: any}} options
 * @returns {{sessionToken: string; refreshToken: string;}}
 */

/**
 * create token factory function
 * @param {Function} createSessionToken
 * @returns {CreateToken}
 */
const createTokenFn =
  (createSessionToken) =>
  (did, params = {}, options = {}) => {
    let sessionTokenExpiresIn = '1d';
    // 当 did-connect 是旧版本时，保持原有的 session_token 有效期为 1d
    if (options.didConnectVersion) {
      sessionTokenExpiresIn = options.cacheTtl ?? '1h';
    }
    const sessionToken = createSessionToken(did, {
      ...params,
      expiresIn: sessionTokenExpiresIn,
    });
    const refreshToken = createSessionToken(did, {
      ...params,
      tokenType: 'refresh',
      expiresIn: options.ttl ?? '7d',
    });

    return { sessionToken, refreshToken };
  };

const shouldIgnoreUrl = (url, urls) => {
  let { length } = url;
  for (let i = 0; i < url.length; i++) {
    if (url[i] === '?' || url[i] === '#') {
      length = i;
      break;
    }
  }
  const _url = url.slice(0, length);
  for (let i = 0; i < urls.length; i++) {
    // FIXME: 这里不应该使用 minimatch 来匹配 url，应该改为使用 path-to-regexp
    if (minimatch(_url, urls[i])) {
      return true;
    }
  }
  return false;
};

const redirectWithoutCache = (res, url) => {
  return res
    .set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    .set('Pragma', 'no-cache')
    .set('Expires', '0')
    .redirect(url);
};

module.exports = {
  shouldGotoStartPage,
  ensureProxyUrl,
  getRedirectUrl,
  createTokenFn,
  getDidConnectVersion,
  shouldIgnoreUrl,
  redirectWithoutCache,
};
