import type { NextFunction, Request, Response } from 'express';
import { joinURL } from 'ufo';

import Config from '../config';
import { getVerifyData, verify } from '../util/verify-sign';

const verifySig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, sig } = getVerifyData(req, 'component');
    if (!sig) {
      return res.status(400).json({ error: 'Bad Request' });
    }
    const pathPrefix = req?.get('x-path-prefix');
    let verified = await verify(data, sig);
    if (!verified && pathPrefix && data?.url && !data.url?.startsWith(pathPrefix)) {
      verified = await verify({ ...data, url: joinURL(pathPrefix, data.url) }, sig);
    }
    if (!verified) {
      Config.logger.error('verify component sig failed', { data, sig });
      return res.status(401).json({ error: 'verify sig failed' });
    }
  } catch (error) {
    Config.logger.error('verify component sig failed', { error });
    return res.status(401).json({ error: 'verify sig failed' });
  }
  return next();
};
export { verifySig };
export default {
  verifySig,
};
