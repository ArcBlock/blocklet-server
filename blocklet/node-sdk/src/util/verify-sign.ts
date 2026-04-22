/*
 * Utility library for signing and verifying requests from the SDK to blocklet-service
 */

import merge from 'lodash/merge';
import stableStringify from 'json-stable-stringify';
import { DIDTypeShortcut } from '@arcblock/did';
import { parseURL } from 'ufo';
import { SIG_VERSION } from '@blocklet/constant';
import qs from 'qs';
import type { Request } from 'express';

import { getWallet } from '../wallet';

const { getPkWallet } = getWallet;

type SignOptions = {
  type?: DIDTypeShortcut;
  appSk?: string;
};

const verify = async (
  data: object,
  sig: string,
  {
    type,
    appSk = process.env.BLOCKLET_APP_ASK || process.env.BLOCKLET_APP_SK,
    appPk,
  }: {
    type?: DIDTypeShortcut;
    appSk?: string;
    appPk?: string;
  } = {}
) => {
  try {
    if (!sig) {
      throw new Error('empty sig');
    }
    let wallet;
    if (appPk) {
      wallet = getPkWallet(type, appPk);
    } else {
      wallet = getWallet(type, appSk);
    }
    const verified = await wallet.verify(stableStringify(data || {}), sig);
    return verified;
  } catch {
    throw new Error('verify sig failed');
  }
};

const sign = async (
  data: object,
  { type, appSk = process.env.BLOCKLET_APP_ASK || process.env.BLOCKLET_APP_SK }: SignOptions = {}
  // eslint-disable-next-line require-await
) => {
  const wallet = getWallet(type, appSk);
  return wallet.sign(stableStringify(data || {}));
};

type SignType = 'component' | 'blocklet';

const getLatestFn = ({
  iat,
  exp,
  body,
  query,
  method,
  url,
}: {
  iat: number;
  exp: number;
  body?: any;
  query?: any;
  method: string;
  url: string;
}) => {
  const now = Math.floor(Date.now() / 1000);
  if (Number.isNaN(iat) || Number.isNaN(exp)) {
    throw new Error('invalid sig');
  }
  if (exp < now) {
    throw new Error('expired sig');
  }

  const parsedUrl = parseURL(url);
  const data = {
    iat,
    exp,
    body: body ?? {},
    query: merge(qs.parse(parsedUrl.search.slice(1)), query ?? {}),
    method: method.toLowerCase(),
    url: parsedUrl.pathname,
  };

  return data;
};

const getVerifyData = (req: Request, type: SignType = 'component') => {
  const sig = req.get(`x-${type}-sig`);
  const sigPk = req.get(`x-${type}-sig-pk`);
  const sigVersion = req.get(`x-${type}-sig-version`);
  const iat = Number(req.get(`x-${type}-sig-iat`));
  const exp = Number(req.get(`x-${type}-sig-exp`));

  // NOTICE: Data from req has already been processed by axios and JSON.parse; no additional parsing needed
  const { body, method, originalUrl: url, query } = req;
  const data = getLatestFn({ iat, exp, body, query, method, url });
  return { sig, data, sigVersion, sigPk };
};

type SignSeed = {
  body?: any;
  query?: any;
  method?: string;
  url?: string;
  iat: number;
  exp: number;
};

const getSignData = async (
  {
    data,
    params,
    method,
    url,
  }: {
    data: object;
    params: object;
    method: string;
    url: string;
  },
  signOptions?: SignOptions
) => {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 5;
  const raw: SignSeed = {
    iat,
    exp,
  };

  const parsedUrl = parseURL(url);

  // Parse the data to match the format used in verify (JSON.parse then qs.parse)
  raw.body = JSON.parse(JSON.stringify(data ?? {}));
  // NOTICE: To stay consistent with verify, run qs.stringify then qs.parse
  raw.query = qs.parse(qs.stringify(merge(qs.parse(parsedUrl.search.slice(1)), params ?? {})));
  raw.method = method.toLowerCase();
  raw.url = parsedUrl.pathname;

  const sig = await sign(raw, signOptions);
  const version = SIG_VERSION.DEFAULT;

  return {
    sig,
    iat,
    exp,
    version,
    raw,
  };
};

export { verify, sign, getVerifyData, getSignData };
