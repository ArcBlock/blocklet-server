import type { NextFunction, Request, Response } from 'express';
import { getTokenFromReq } from '@abtnode/util/lib/get-token-from-req';

import serviceApi from '../util/service-api';
import { SessionUser, isLoginToken, isAccessKey } from '../util/login';
import { verifyComponentCall, verifyLoginToken, verifySignedToken, verifyAccessKey } from '../util/verify-session';
import Config from '../config';

type SessionOptions = {
  strictMode?: boolean;
  loginToken?: boolean;
  componentCall?: boolean;
  signedToken?: boolean;
  accessKey?: boolean;
  signedTokenKey?: string;
};

const sessionMiddleware = (options: SessionOptions = {}) => {
  const {
    loginToken = true,
    componentCall = false,
    signedToken = '',
    strictMode = false,
    accessKey = false,
    signedTokenKey = '__jwt',
  } = options;

  return async (req: Request & { user?: SessionUser }, res: Response, next: NextFunction) => {
    let result = null;
    try {
      // authenticate by login token
      if (loginToken || accessKey) {
        const { _duplicate, token: loginTokenValue } = await getTokenFromReq(req, {
          cookie: {
            key: 'login_token',
          },
        });
        if (_duplicate) {
          res.status(400).send('Access token found in multiple locations');
          return;
        }
        if (loginTokenValue && typeof loginTokenValue === 'string') {
          if (process.env.NODE_ENV !== 'test') {
            const blockletSettings = Config.getBlockletSettings();
            // Skip check if the token blacklist feature is not enabled
            if (blockletSettings.enableBlacklist) {
              const { data: checkResult } = await serviceApi.post('/api/user/checkToken', {
                token: loginTokenValue,
              });
              if (!checkResult.valid) {
                if (strictMode) {
                  res.status(401).send('Access token is blocked');
                  return;
                }
                // Without strictMode, proceed as unauthenticated
                next();
                return;
              }
            }
          }
          if (isLoginToken(loginTokenValue)) {
            result = await verifyLoginToken({ token: loginTokenValue, strictMode });
          } else if (isAccessKey(loginTokenValue) && accessKey) {
            result = await verifyAccessKey({ token: loginTokenValue, strictMode });
          }
        }
      }

      // authenticate by component call
      if (!result && componentCall) {
        result = await verifyComponentCall({ req, strictMode });
      }

      // authenticate by signed tmp token: which expires in 5 minutes
      if (!result && signedToken) {
        const token = req.query[signedTokenKey] || '';
        result = await verifySignedToken({ token, strictMode });
      }
    } catch (err) {
      res.status(401).json({ error: err.message });
      return;
    }
    if (result) {
      req.user = result;
    }
    next();
  };
};

export { sessionMiddleware, sessionMiddleware as session };
