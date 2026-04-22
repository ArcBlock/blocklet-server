const path = require('path');
const { createHash } = require('crypto');
const isUrl = require('is-url');
const { joinURL } = require('ufo');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { BLOCKLET_CONFIGURABLE_KEY } = require('@blocklet/constant');
const { getApplicationWallet } = require('@blocklet/meta/lib/wallet');

const getLogoHash = (logo) => encodeURIComponent((logo || '').split('/').slice(-1)[0].slice(0, 7));

/**
 *
 *
 * @param {{
 *  serverSecretKey: string;
 *  blockletAppDid: string;
 * }} {
 *   serverSecretKey,
 *   blockletAppDid
 * }
 *
 */
function getAccessWallet({ serverSecretKey, blockletAppDid }) {
  if (!serverSecretKey) {
    throw new Error('serverSecretKey should not be empty');
  }
  if (!blockletAppDid) {
    throw new Error('blockletAppDid should not be empty');
  }

  return getApplicationWallet(blockletAppDid, serverSecretKey, undefined, 2);
}

const getComponentApiKey = ({ serverSk, app, component } = {}) => {
  if (!serverSk) {
    throw new Error('serverSk should not be empty');
  }
  if (!app?.meta?.did) {
    throw new Error('app.meta.did should not be empty');
  }
  if (!component?.meta?.did) {
    throw new Error('component.meta.did should not be empty');
  }

  // Normalize installedAt to ISO string for consistent hashing
  // This handles both Date objects and ISO strings
  let installedAtStr = '';
  if (component?.installedAt) {
    installedAtStr =
      component.installedAt instanceof Date ? component.installedAt.toISOString() : String(component.installedAt);
  }

  const hash = createHash('sha256');
  const token = hash.update(`${serverSk}${app?.meta?.did}${component?.meta?.did}${installedAtStr}`).digest('base64');
  return token;
};

const formatLogoURL = (logoURL, defaultLogoURL, height = 80) => {
  if (!logoURL) {
    return logoURL;
  }

  if (isUrl(logoURL)) {
    const tmp = new URL(logoURL);
    if (!tmp.searchParams.get('imageFilter')) {
      tmp.searchParams.set('imageFilter', 'convert');
      tmp.searchParams.set('f', 'png');
      tmp.searchParams.set('h', height.toString());

      return tmp.href;
    }

    return logoURL;
  }

  const tmp = new URL(defaultLogoURL);
  if (!logoURL.endsWith('.svg')) {
    tmp.searchParams.set('imageFilter', 'convert');
    tmp.searchParams.set('f', 'png');
    tmp.searchParams.set('h', height.toString());
  }

  tmp.searchParams.set('hash', getLogoHash(logoURL));
  return `${tmp.pathname}${tmp.search}`;
};

const getBlockletLogos = (blocklet) => {
  let appLogo = blocklet.environments?.find((x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_SQUARE)?.value;
  let appLogoDark = blocklet.environments?.find(
    (x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_SQUARE_DARK
  )?.value;
  let appLogoRect = blocklet.environments?.find(
    (x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_RECT
  )?.value;
  let appLogoRectDark = blocklet.environments?.find(
    (x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_RECT_DARK
  )?.value;
  let appSplashPortrait = blocklet.environments?.find(
    (x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPLASH_PORTRAIT
  )?.value;
  let appSplashLandscape = blocklet.environments?.find(
    (x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPLASH_LANDSCAPE
  )?.value;

  appLogo = formatLogoURL(appLogo, `http://127.0.0.1${WELLKNOWN_SERVICE_PATH_PREFIX}/blocklet/logo`);
  appLogoDark = formatLogoURL(appLogoDark, `http://127.0.0.1${WELLKNOWN_SERVICE_PATH_PREFIX}/blocklet/logo-dark`);
  appLogoRect = formatLogoURL(appLogoRect, `http://127.0.0.1${WELLKNOWN_SERVICE_PATH_PREFIX}/blocklet/logo-rect`);
  appLogoRectDark = formatLogoURL(
    appLogoRectDark,
    `http://127.0.0.1${WELLKNOWN_SERVICE_PATH_PREFIX}/blocklet/logo-rect-dark`
  );
  appSplashPortrait = formatLogoURL(
    appSplashPortrait,
    `http://127.0.0.1${WELLKNOWN_SERVICE_PATH_PREFIX}/blocklet/splash/portrait`,
    1600
  );
  appSplashLandscape = formatLogoURL(
    appSplashLandscape,
    `http://127.0.0.1${WELLKNOWN_SERVICE_PATH_PREFIX}/blocklet/splash/landscape`,
    900
  );

  return {
    appLogo: appLogo || joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/blocklet/logo?imageFilter=convert&f=png&h=80'),
    appLogoRect: appLogoRect || '',
    appLogoDark: appLogoDark || '',
    appLogoRectDark: appLogoRectDark || '',
    appSplashPortrait,
    appSplashLandscape,
  };
};

module.exports = {
  getAccessWallet,
  getComponentApiKey,
  getAppImageCacheDir: (cacheDir) => path.join(cacheDir, '.services', 'image-filter'),
  getAppOgCacheDir: (cacheDir) => path.join(cacheDir, '.services', 'open-graph'),
  getBlockletLogos,
  getLogoHash,
};
