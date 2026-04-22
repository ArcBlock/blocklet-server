const { RESOURCE_PATTERN } = require('@blocklet/constant');
const { AssetHostTransformer } = require('@blocklet/sdk/lib/util/asset-host-transformer');

function shouldProcessRequest(req) {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.ABT_NODE_SERVICE_ENV === 'production';
  if (!isProduction) {
    return false;
  }
  if (!(req.method === 'GET' || req.method === 'HEAD')) {
    return false;
  }

  if (RESOURCE_PATTERN.test(req.path)) {
    return false;
  }

  const accepted = req.accepts(['html', 'text/html', 'application/xhtml+xml', '*/*']);
  return Boolean(accepted);
}

const cdn = () => {
  const transformer = new AssetHostTransformer('/.well-known/service/static/');

  return async (req, res, next) => {
    if (!shouldProcessRequest(req)) {
      next();
      return;
    }

    const blocklet = await req.getBlocklet();
    if (!blocklet?.configObj?.ASSET_CDN_HOST) {
      next();
      return;
    }

    const assetHost = blocklet?.configObj?.ASSET_CDN_HOST;
    const originalSend = res.send;

    res.send = function send(body) {
      if (typeof body === 'string') {
        return originalSend.call(this, transformer.transform(body, assetHost));
      }

      if (Buffer.isBuffer(body)) {
        return originalSend.call(this, transformer.transformBuffer(body, assetHost));
      }

      return originalSend.call(this, body);
    };

    next();
  };
};

module.exports = {
  cdn,
};
