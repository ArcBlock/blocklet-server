/* eslint-disable @typescript-eslint/indent */
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import isEmpty from 'lodash/isEmpty';
import Joi, { type ValidationError } from 'joi';
import type { ParamsDictionary } from 'express-serve-static-core';
import jwtDecode from 'jwt-decode';
import Debug from 'debug';
import { verify, getCsrfSecret, sign } from '../util/csrf';
import { isDidWalletConnect } from '../util/wallet';
import Config from '../config';

const debug = Debug('@blocklet/sdk:csrf');

export interface CSRFOptionsResponse extends Response<
  any,
  { generateToken: typeof defaultGenerateToken; verifyToken: typeof defaultVerifyToken } & Record<string, any>
> {}

export interface CSRFOptions {
  generateToken?: (req: Request, res: CSRFOptionsResponse) => void | Promise<void>;
  verifyToken?: (req: Request, res: CSRFOptionsResponse) => Promise<void> | void;
}

function printCookieParserNotInstalledWarning() {
  Config.logger.warn('cookie-parser middleware is required for the csrf middleware to work properly.');
}

/**
 *
 * @param req
 * @param res
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#employing-hmac-csrf-tokens
 * @note: Key invariants: 1) CSRF tokens cannot be read by attackers from cookies; 2) CSRF token validation requires the current user's login token; 3) CSRF tokens should not expire
 * @returns
 */
function defaultGenerateToken(req: Request, res: CSRFOptionsResponse) {
  if (!req.cookies) {
    printCookieParserNotInstalledWarning();
  }

  if (req.cookies.login_token) {
    const newCsrfToken = sign(getCsrfSecret(), req.cookies.login_token);
    const oldCsrfToken = req.cookies['x-csrf-token'];

    if (newCsrfToken !== oldCsrfToken) {
      debug('defaultGenerateToken.createCsrfToken', {
        newCsrfToken,
        oldCsrfToken,
        loginTokenPart: req.cookies.login_token.slice(-32),
        loginTokenDecoded: jwtDecode(req.cookies.login_token),
      });

      res.cookie('x-csrf-token', newCsrfToken, {
        sameSite: 'strict',
        secure: true,
      });
    }
  }
}

function defaultVerifyToken(req: Request) {
  if (!req.cookies) {
    printCookieParserNotInstalledWarning();
  }

  // @note: Skip CSRF token verification if login_token is absent
  if (!req.cookies?.login_token) {
    return;
  }

  if (!isEmpty(req.cookies['x-csrf-token']) && req.cookies['x-csrf-token'] === req.headers['x-csrf-token']) {
    const csrfTokenFromRequest = req.cookies['x-csrf-token'];
    if (verify(getCsrfSecret(), csrfTokenFromRequest, req.cookies.login_token)) {
      return;
    }

    Config.logger.warn('Invalid request: csrf token mismatch', {
      csrfTokenFromReq: req.cookies['x-csrf-token'],
      csrfTokenFromHeader: req.headers['x-csrf-token'],
      loginTokenPart: req.cookies.login_token.slice(-32),
      loginTokenDecoded: jwtDecode(req.cookies.login_token),
    });
  } else {
    Config.logger.warn('Invalid request: csrf token not found', {
      csrfTokenFromReq: req.cookies['x-csrf-token'],
      csrfTokenFromHeader: req.headers['x-csrf-token'],
      loginTokenPart: req.cookies.login_token.slice(-32),
      loginTokenDecoded: jwtDecode(req.cookies.login_token),
    });
  }

  throw new Error('Invalid request: csrf token mismatch, please refresh the page try again');
}

function shouldGenerateToken(req: Request) {
  return ['GET'].includes(req.method);
}
/**
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
 */
function shouldVerifyToken(req: Request) {
  if (req.path.includes('/mcp')) {
    return false;
  }

  return (
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) &&
    !isEmpty(req.cookies['x-csrf-token']) &&
    !isDidWalletConnect(req.headers)
  );
}

const csrfOptionsSchema = Joi.object({
  generateToken: Joi.func().required(),
  verifyToken: Joi.func().required(),
});

export function csrf(
  options: CSRFOptions = { generateToken: defaultGenerateToken, verifyToken: defaultVerifyToken }
): RequestHandler {
  options.generateToken = typeof options.generateToken === 'function' ? options.generateToken : defaultGenerateToken;
  options.verifyToken = typeof options.verifyToken === 'function' ? options.verifyToken : defaultVerifyToken;

  const { value: data, error }: { value: Required<CSRFOptions>; error: ValidationError } =
    csrfOptionsSchema.validate(options);
  if (error) {
    throw new Error(error.message);
  }

  return async (
    req: Request<ParamsDictionary, any, any, qs.ParsedQs, Record<string, any>>,
    res: CSRFOptionsResponse,
    next: NextFunction
  ) => {
    res.locals.generateToken = defaultGenerateToken;
    res.locals.verifyToken = defaultVerifyToken;

    try {
      if (shouldGenerateToken(req)) {
        await data.generateToken(req, res);
      } else if (shouldVerifyToken(req)) {
        await data.verifyToken(req, res);
      }

      next();
    } catch (err) {
      res.status(403).send(err.message);
    }
  };
}
