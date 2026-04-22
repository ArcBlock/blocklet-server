// eslint-disable-next-line import/no-extraneous-dependencies
import { NextFunction, Request, Response } from 'express';
import { deprecate } from 'util';
import { decodeKycStatus, SessionUser } from '../util/login';

const userMiddleware = deprecate(
  () => (req: Request & { user?: SessionUser }, res: Response, next: NextFunction) => {
    if (!req.user && req.headers['x-user-did']) {
      req.user = {
        did: <string>req.headers['x-user-did'],
        role: <string>req.headers['x-user-role'],
        provider: <string>req.headers['x-user-provider'],
        fullName: decodeURIComponent(<string>req.headers['x-user-fullname']),
        walletOS: <string>req.headers['x-user-wallet-os'],
        ...decodeKycStatus(Number(req.headers['x-user-kyc']) || 0),
      };
    }

    next();
  },
  'user middleware is deprecated, please use session middleware for better security'
);

export { userMiddleware, userMiddleware as user };
