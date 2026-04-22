// eslint-disable-next-line import/no-extraneous-dependencies
import { NextFunction, Request, Response } from 'express';
import { BLOCKLET_PROXY_PATH_PREFIX } from '@abtnode/constant';
import { RESOURCE_PATTERN } from '@blocklet/constant';
import { env } from '../config';
import { AssetHostTransformer } from '../util/asset-host-transformer';

function shouldProcessRequest(req: Request) {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.ABT_NODE_SERVICE_ENV === 'production';
  if (!isProduction) {
    return false;
  }
  if (!(req.method === 'GET' || req.method === 'HEAD')) {
    return false;
  }

  if (req.path.includes('/.well-known/service/')) {
    return false;
  }

  if (RESOURCE_PATTERN.test(req.path)) {
    return false;
  }

  const accepted = req.accepts(['html', 'text/html', 'application/xhtml+xml', '*/*']);
  return Boolean(accepted);
}

export interface CdnOptions {
  did?: string;
  getAssetCdnHost?: () => string;
}

export const cdn = ({ did = env.componentDid, getAssetCdnHost }: CdnOptions = {}) => {
  if (!did) {
    throw new Error('did is required');
  }
  const transformer = new AssetHostTransformer(`${BLOCKLET_PROXY_PATH_PREFIX}/${did}/`);

  return (req: Request, res: Response, next: NextFunction) => {
    const assetHost = getAssetCdnHost ? getAssetCdnHost() : env.assetCdnHost;

    if (!shouldProcessRequest(req) || !assetHost) {
      next();
      return;
    }

    const originalSend = res.send;

    res.send = function send(this: Response, body: any) {
      if (typeof body === 'string') {
        return originalSend.call(this, transformer.transform(body, assetHost));
      }

      if (Buffer.isBuffer(body)) {
        return originalSend.call(this, transformer.transformBuffer(body, assetHost));
      }

      return originalSend.call(this, body);
    } as typeof res.send;

    next();
  };
};
