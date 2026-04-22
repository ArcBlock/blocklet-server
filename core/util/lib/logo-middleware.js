const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const get = require('lodash/get');
const pick = require('lodash/pick');

const logError = (message, context) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(message, context);
  }
};

/**
 * @param {import('express').Request & {blocklet: any, sendOptions: any}} req
 * @param {import('express').Response & {sendFallbackLogo: Function} } res
 * @param {import('express').NextFunction} next
 * @returns
 */
const ensureBlockletExist = (req, res, next) => {
  const { blocklet } = req;

  if (!blocklet || !get(blocklet, 'env.appDir')) {
    res.sendFallbackLogo();
    return;
  }

  next();
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response & {sendFallbackLogo: Function} } res
 * @param {string} url
 * @returns {http.ClientRequest}
 */
const sendCustomRemoteFile = (req, res, url) => {
  const tmp = new URL(url);
  // pass along image filter params
  Object.keys(req.query || {}).forEach((key) => {
    if (tmp.searchParams.get(key)) {
      return;
    }
    tmp.searchParams.set(key, req.query[key]);
  });

  const opts = Object.assign(new URL(tmp.href), {
    method: req.method,
    headers: pick(req.headers, ['user-agent', 'accept', 'accept-encoding', 'accept-language', 'referer', 'cookie']),
  });

  const request = opts.protocol === 'https:' ? https.request : http.request;

  const reqStream = request(opts, (x) => {
    ['content-type', 'content-length', 'cache-control', 'date', 'etag', 'last-modified'].forEach((key) => {
      if (x.headers[key]) {
        res.header(key, x.headers[key]);
      }
    });
    x.pipe(res);
  });

  const timeout = setTimeout(
    () => {
      logError('failed to get customized logo', { url: req.url, error: 'timeout' });
      if (!reqStream.destroyed) {
        reqStream?.destroy();
      }
      res.sendFallbackLogo();
    },
    process.env.NODE_ENV === 'test' ? 500 : 5000
  );

  reqStream.on('error', (err) => {
    logError('failed to get customized logo', { url: req.url, error: err });
    res.sendFallbackLogo();
  });

  reqStream.end(() => {
    clearTimeout(timeout);
  });

  return reqStream;
};

/**
 * @param {import('express').Request & {blocklet: any, sendOptions: any}} req
 * @param {import('express').Response & {sendFallbackLogo: Function, sendLogoFile: Function}} res
 * @param {import('express').NextFunction} next
 * @param {string} logoKey Environment variable key for the logo
 * @returns {http.ClientRequest | null}
 */
const ensureCustomLogo = (req, res, next, logoKey) => {
  const { blocklet, sendOptions } = req;

  /** @type {string} */
  const logo = get(blocklet, `environmentObj.${logoKey}`);
  if (logo) {
    if (logo.startsWith('http')) {
      return sendCustomRemoteFile(req, res, logo);
    }

    const logoFile = path.join(get(blocklet, 'env.dataDir'), logo);
    if (fs.existsSync(logoFile)) {
      res.sendLogoFile(logoFile, sendOptions);
      return null;
    }
  }

  next();
  return null;
};

/**
 * @param {import('express').Request & {blocklet: any, sendOptions: any}} req
 * @param {import('express').Response & {sendFallbackLogo: Function, sendLogoFile: Function} } res
 * @param {import('express').NextFunction} next
 * @returns {http.ClientRequest | null}
 */
const ensureCustomSquareLogo = (req, res, next) => {
  return ensureCustomLogo(req, res, next, 'BLOCKLET_APP_LOGO_SQUARE');
};
const ensureCustomSquareDarkLogo = (req, res, next) => {
  return ensureCustomLogo(req, res, next, 'BLOCKLET_APP_LOGO_SQUARE_DARK');
};

/**
 * @param {import('express').Request & {blocklet: any, sendOptions: any}} req
 * @param {import('express').Response & {sendFallbackLogo: Function, sendLogoFile: Function} } res
 * @param {import('express').NextFunction} next
 * @returns {http.ClientRequest | null}
 */
const ensureCustomRectLogo = (req, res, next) => {
  return ensureCustomLogo(req, res, next, 'BLOCKLET_APP_LOGO_RECT');
};
const ensureCustomRectDarkLogo = (req, res, next) => {
  return ensureCustomLogo(req, res, next, 'BLOCKLET_APP_LOGO_RECT_DARK');
};

const ensureCustomSplashPortrait = (req, res, next) => {
  return ensureCustomLogo(req, res, next, 'BLOCKLET_APP_SPLASH_PORTRAIT');
};
const ensureCustomSplashLandscape = (req, res, next) => {
  return ensureCustomLogo(req, res, next, 'BLOCKLET_APP_SPLASH_LANDSCAPE');
};
const ensureCustomOgImage = (req, res, next) => {
  return ensureCustomLogo(req, res, next, 'BLOCKLET_APP_OG_IMAGE');
};

/**
 *
 * @param {import('express').Request & {blocklet: any, sendOptions: any}} req
 * @param {import('express').Response & {sendFallbackLogo: Function, sendLogoFile: Function} } res
 * @param {import('express').NextFunction} next
 * @returns {http.ClientRequest | null}
 */
const ensureBundleLogo = (req, res, next) => {
  /**
   * @type {{
   *  blocklet: import('@blocklet/server-js').BlockletState, // currently not fully accurate, but some properties are generic and this is acceptable
   *  sendOptions: any
   * }}
   * */
  const { blocklet, sendOptions } = req;

  if (blocklet.meta.logo) {
    const logoFile = path.join(get(blocklet, 'env.appDir'), blocklet.meta.logo);

    if (fs.existsSync(logoFile)) {
      res.sendLogoFile(logoFile, sendOptions);
      return null;
    }
  }

  next();
  return null;
};

/**
 *
 * @param {import('express').Request} _req
 * @param {import('express').Response & {sendFallbackLogo: Function} } res
 * @returns
 */
const fallbackLogo = (_req, res) => {
  res.sendFallbackLogo();
};

// eslint-disable-next-line no-unused-vars
const cacheError = (err, req, res, next) => {
  logError('failed to send blocklet logo', { url: req.url, error: err });
  res.sendFallbackLogo();
};

/**
 * @param {import('express').Request & {blocklet: any, sendOptions: any}} req
 * @param {import('express').Response & {sendFallbackLogo: Function, sendLogoFile: Function} } res
 * @param {import('express').NextFunction} next
 * @returns
 */
const ensureDefaultLogo = (req, res, next) => {
  /**
   * @type {{
   *  blocklet: import('@blocklet/server-js').BlockletState, // currently not fully accurate, but some properties are generic and this is acceptable
   *  sendOptions: any
   * }}
   * */
  const { blocklet, sendOptions } = req;

  if (blocklet && get(blocklet, 'env.dataDir')) {
    const logoSvgFile = path.join(get(blocklet, 'env.dataDir'), 'logo.svg');
    if (fs.existsSync(logoSvgFile)) {
      res.sendLogoFile(logoSvgFile, sendOptions);
      return;
    }

    const logoPngFile = path.join(get(blocklet, 'env.dataDir'), 'logo.png');
    if (fs.existsSync(logoPngFile)) {
      res.sendLogoFile(logoPngFile, sendOptions);
      return;
    }
  }

  next();
};

/**
 * @param {import('express').Request & {blocklet: any, sendOptions: any}} req
 * @param {import('express').Response & {sendFallbackLogo: Function, sendLogoFile: Function} } res
 * @param {import('express').NextFunction} next
 * @returns {http.ClientRequest | null}
 */
const ensureCustomFavicon = (req, res, next) => {
  /**
   * @type {{
   *  blocklet: import('@blocklet/server-js').BlockletState, // currently not fully accurate, but some properties are generic and this is acceptable
   *  sendOptions: any
   * }}
   * */
  const { blocklet, sendOptions } = req;

  /** @type {string} */
  const logo = get(blocklet, 'environmentObj.BLOCKLET_APP_LOGO_FAVICON');
  if (logo) {
    if (logo.startsWith('http')) {
      return sendCustomRemoteFile(req, res, logo);
    }

    const logoFile = path.join(get(blocklet, 'env.dataDir'), logo);
    if (fs.existsSync(logoFile)) {
      res.sendLogoFile(logoFile, sendOptions);
      return null;
    }
  }

  next();
  return null;
};

const attachSendLogoContext =
  ({ onSendFallbackLogo, onGetBlocklet }) =>
  async (req, res, next) => {
    const sendOptions = { maxAge: '1d' };

    req.sendOptions = sendOptions;

    try {
      req.blocklet = await onGetBlocklet({ req, res });
    } catch (error) {
      logError('failed to get blocklet', { url: req.url, error });
      req.blocklet = null;
    }

    res.sendFallbackLogo = () => {
      onSendFallbackLogo({ res, sendOptions });
    };

    next();
  };

module.exports = {
  attachSendLogoContext,
  ensureBlockletExist,
  ensureCustomSquareLogo,
  ensureCustomSquareDarkLogo,
  ensureBundleLogo,
  ensureCustomFavicon,
  ensureCustomRectLogo,
  ensureCustomRectDarkLogo,
  ensureCustomSplashPortrait,
  ensureCustomSplashLandscape,
  ensureCustomOgImage,
  ensureDefaultLogo,
  fallbackLogo,
  cacheError,
};
