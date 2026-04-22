// A simple image service based on sharp
// @link https://sharp.pixelplumbing.com/
const path = require('path');
const { http } = require('follow-redirects');
const { getAppImageCacheDir } = require('@abtnode/util/lib/blocklet');
const { CustomError } = require('@blocklet/error');

const logger = require('../../libs/logger')();

const { isImageAccepted, isImageRequest, processAndRespond } = require('../../libs/image');

const createImageService = ({ node }) => {
  const getUpstreamImage = (req) => {
    return new Promise((resolve, reject) => {
      const upstream = new URL(req.originalUrl, req.target);
      const request = http
        .request(
          {
            hostname: upstream.hostname,
            port: upstream.port || 80,
            path: upstream.pathname + upstream.search,
            method: req.method,
            headers: req.headers,
            timeout: 10000,
          },
          (res) => {
            logger.info('image service upstream response:', {
              filter: req.imageFilter,
              headers: res.headers,
              status: res.statusCode,
            });

            if (res.statusCode && res.statusCode >= 400) {
              reject(new CustomError(400, `unexpected upstream response status: ${res.statusCode}`));
              return;
            }

            const [type, extension] = (res.headers['content-type'] || '').split('/');
            if (type !== 'image') {
              reject(new CustomError(400, `unexpected response type from upstream: ${type}, expected image`));
              return;
            }

            resolve([res, extension]);
          }
        )
        .on('error', reject)
        .on('timeout', () => {
          request?.destroy();
          reject(new CustomError(400, `upstream image request timeout: ${req.originalUrl}`));
        })
        .end();
    });
  };

  const processImage = (req, res) => {
    const appDir = getAppImageCacheDir(path.join(node.dataDirs.cache, req.getBlockletDid()));
    const upstreamUrl = new URL(req.originalUrl, req.target);
    processAndRespond(req, res, {
      srcPath: upstreamUrl.href,
      cacheDir: appDir,
      getSrc: getUpstreamImage,
    });
  };

  return {
    isImageAccepted,
    isImageRequest,
    processImage,
  };
};

module.exports = createImageService;
