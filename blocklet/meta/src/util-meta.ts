import { fileURLToPath } from 'url';
import fs from 'fs';
import any from 'promise.any';
import { joinURL } from 'ufo';
// @ts-ignore
import { BLOCKLET_STORE_API_BLOCKLET_PREFIX } from '@abtnode/constant';

import axios from './axios';
import { toBlockletDid } from './did';
import { validateMeta, fixAndValidateService } from './validate';
import { TBlockletMeta, TComponent } from './types';
// @ts-ignore
import { version as serverVersion } from '../package.json';
import withCache from './with-cache';

// HACK: copy from core/state/lib/util/request.js
const api = axios.create({
  timeout: 10 * 1000,
  headers: {
    'User-Agent': `ABTNode/${serverVersion}`,
    'x-blocklet-server-version': serverVersion,
  },
});

const validateUrl = withCache(
  async (url: string, expectedHttpResTypes: string[] = ['application/json', 'text/plain']): Promise<boolean> => {
    const parsed = new URL(url);

    const { protocol } = parsed;

    // file
    if (protocol.startsWith('file')) {
      const decoded = decodeURIComponent(fileURLToPath(url));

      if (!fs.existsSync(decoded)) {
        throw new Error(`File does not exist: ${decoded}`);
      }
      return true;
    }
    // http(s)
    if (protocol.startsWith('http')) {
      let res;
      try {
        res = await api({ url, method: 'HEAD', timeout: 1000 * 10 });
      } catch (err) {
        throw new Error(`Cannot get content-type from ${url}: ${err.message}`);
      }
      if (
        res.headers['content-type'] &&
        expectedHttpResTypes.some((x) => res.headers['content-type'].includes(x)) === false
      ) {
        throw new Error(`Unexpected content-type from ${url}: ${res.headers['content-type']}`);
      }
      return true;
    }
    throw new Error(`Invalid url protocol: ${protocol.replace(/:$/, '')}`);
  },
  { maxSize: 1000, maxAge: 1000 * 120 }
);

const validateBlockletMeta = (meta: TBlockletMeta, opts: any = {}): any => {
  fixAndValidateService(meta);
  return validateMeta(meta, opts);
};

const getBlockletMetaByUrl = withCache(
  async (url: string): Promise<TBlockletMeta> => {
    const { protocol } = new URL(url);

    if (protocol.startsWith('file')) {
      const decoded = decodeURIComponent(fileURLToPath(url));

      if (!fs.existsSync(decoded)) {
        throw new Error(`File does not exist: ${decoded}`);
      }
      const d = await fs.promises.readFile(decoded);

      // @ts-expect-error TS(2345) FIXME: Argument of type 'Buffer' is not assignable to par... Remove this comment to see the full error message
      const meta = JSON.parse(d);

      return meta;
    }
    if (protocol.startsWith('http')) {
      const { data: meta } = await api({ url, method: 'GET', timeout: 1000 * 20 });

      if (Object.prototype.toString.call(meta) !== '[object Object]') {
        throw new Error('Url is not valid');
      }
      return meta;
    }
    throw new Error(`Invalid url protocol: ${protocol.replace(/:$/, '')}`);
  },
  { maxSize: 1000, maxAge: 1000 * 30 }
);

const getBlockletMetaFromUrl = async (
  url: string,
  {
    validateFn = validateBlockletMeta,
    returnUrl = false,
    ensureTarball = true,
    logger,
  }: {
    validateFn?: Function;
    returnUrl?: boolean;
    ensureTarball?: boolean;
    logger?: any;
  } = {}
): Promise<any> => {
  const meta = await getBlockletMetaByUrl(url);

  delete meta.htmlAst;
  const newMeta = validateFn(meta, { ensureDist: true });

  if (ensureTarball) {
    try {
      const { href } = new URL(newMeta.dist.tarball, url);

      const tarball = decodeURIComponent(href);

      try {
        await validateUrl(tarball, ['application/octet-stream', 'application/x-gzip']);
      } catch (error) {
        if (!error.message.startsWith('Cannot get content-type')) {
          throw error;
        }
      }

      newMeta.dist.tarball = tarball;
    } catch (err) {
      console.error(err);

      const msg = `Invalid blocklet meta: dist.tarball is not a valid url ${err.message}`;

      if (logger) {
        logger.error(msg);
      }
      throw new Error(msg);
    }
  }
  if (returnUrl) {
    return { meta: newMeta, url };
  }
  return newMeta;
};

const getBlockletMetaFromUrls = async (
  urls: string[],
  {
    validateFn,
    returnUrl = false,
    ensureTarball = true,
    logger,
  }: {
    validateFn?: Function;
    returnUrl?: boolean;
    ensureTarball?: boolean;
    logger?: any;
  } = {}
): Promise<any> => {
  try {
    const res = await any(
      urls.map((url) => getBlockletMetaFromUrl(url, { validateFn, returnUrl, ensureTarball, logger }))
    );

    return res;
  } catch (err) {
    console.error(err);

    let { message } = err;
    if (Array.isArray(err.errors)) {
      message = err.errors.map((x) => x.message).join(', ');
    }
    if (logger) {
      logger.error('failed get blocklet meta', { urls, message });
    }
    throw new Error(message);
  }
};

/**
 * @param {*} config defined in componentSchema in blocklet meta schema
 */
const getSourceUrlsFromConfig = (config: TComponent & any): string[] => {
  if (config.source) {
    if (config.source.url) {
      return [config.source.url].flat();
    }
    const { store, version, name } = config.source;

    // FIXME: the format or version is semverRange

    return [store]
      .flat()
      .map((x) =>
        joinURL(
          x,
          BLOCKLET_STORE_API_BLOCKLET_PREFIX,
          toBlockletDid(name),
          !version || version === 'latest' ? '' : version,
          'blocklet.json'
        )
      );
  }
  if (config.resolved) {
    return [config.resolved];
  }
  throw new Error('Invalid child config');
};

export { validateUrl };
export { getBlockletMetaByUrl };
export { getBlockletMetaFromUrl };
export { getBlockletMetaFromUrls };
export { getSourceUrlsFromConfig };

export default {
  validateUrl,
  getBlockletMetaByUrl,
  getBlockletMetaFromUrl,
  getBlockletMetaFromUrls,
  getSourceUrlsFromConfig,
};
